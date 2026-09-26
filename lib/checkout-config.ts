import { PRICE_RUPEES, resolveTier, type Tier, type TierId } from '@/app/_landing/offer';

/**
 * Every server-side constant the payment and tracking routes need, in one
 * place. The price comes from offer.ts, which reads it from a single env var,
 * so the amount charged can never drift from the amount displayed.
 *
 * NOTE ON UNITS, AND WHY THE PAISE FIGURE IS DERIVED HERE.
 *
 * Razorpay charges in PAISE. On the reference build (tgo-kaizan) the paise
 * value is exported from offer.ts as PRICE_PAISE, and the right thing would be
 * to read it from there. It is not exported on this project: it was deleted
 * when the codebase went rupees-only for Instamojo, and `app/_landing/**` is
 * SHAPE's half of this build, not this file's, so it is not re-added there in
 * a payment pass.
 *
 * So it is derived from the ONE price, on the line below, and nowhere else.
 * That keeps the single-source law intact: PRICE_RUPEES is still the only
 * declared price in the codebase, and `amountPaise` is a unit conversion of it
 * rather than a second source that can drift.
 *
 * ⚠️ The doc comment at the top of app/_landing/offer.ts still says the gateway
 * takes rupees and that a paise figure would be a charge a hundred times too
 * large. That was true of Instamojo and it is now stale: this project is back
 * on Razorpay and paise is correct. It is SHAPE's file, so it was left
 * untouched in this pass and flagged instead. Do not "fix" the multiplication
 * below on the strength of that comment.
 */
const PRICE_PAISE = PRICE_RUPEES * 100;

/**
 * THE PRICE OF A PASS, RESOLVED SERVER-SIDE (26 Sep 2026, the OTO step).
 *
 * There are two passes now, so "the amount" is no longer a constant — it is a
 * function of which one the buyer chose. This is the only place that resolves
 * it for the gateway, and it takes a TIER ID rather than an amount.
 *
 * ⚠️ NEVER ADD AN `amount` PARAMETER TO THIS, or to the route that calls it.
 * The tier arrives from the browser, so it is attacker-controlled; the id is a
 * closed set of two strings and `resolveTier` falls back to the cheaper pass
 * for anything else, but an amount would be a number the buyer picks. That is
 * the difference between a mangled URL selling the wrong pass and devtools
 * selling the VIP pass for ₹1.
 *
 * `CHECKOUT_CONFIG.amountRupees` / `amountPaise` are KEPT as the standard
 * pass's figures, because the tracking fallbacks and the ₹0-guard still want a
 * single default when no tier is in play.
 */
export const tierPricing = (tier: TierId | Tier | unknown) => {
  /* ⚠️ THE ID IS EXTRACTED, THEN RE-RESOLVED FROM THE CANONICAL TABLE. Never
     `tier as Tier`.

     The first version of this trusted any object that had an `id` property and
     read `rupees` straight off it. The create-order route passes `body.tier`,
     which is parsed JSON from the browser — so posting
     `{"tier":{"id":"vip","rupees":1}}` bought the VIP pass for one rupee. It
     type-checked, it read as a convenience for internal callers holding a real
     Tier, and it was a live price-tampering hole.

     Taking only the id and looking the price up again costs nothing and makes
     the shape of the input irrelevant: an object, a string, a number or
     nothing at all can now only ever select between two prices this file
     owns. */
  const id =
    typeof tier === 'object' && tier !== null && 'id' in tier
      ? (tier as { id?: unknown }).id
      : tier;
  const t: Tier = resolveTier(id);
  return {
    tier: t,
    tierId: t.id,
    rupees: t.rupees,
    paise: Math.round(t.rupees * 100),
    /* What Meta and GA4 call the thing that was bought. Per-pass, so the two
       do not collapse into one line item in reporting. */
    contentName: t.name,
  };
};

export const CHECKOUT_CONFIG = {
  amountRupees: PRICE_RUPEES,
  amountPaise: PRICE_PAISE,
  currency: 'INR',
  contentName: '5-Day Complete Health Reset Challenge',
  /* ── THIS FUNNEL'S MARK ON ITS OWN ORDERS (2026-09-22) ─────────────
     Written into every order's `notes.kind` at create time, and checked by
     the webhook before it fires anything.

     THE REASON IS HOW RAZORPAY FANS OUT. A webhook is registered per URL on
     an ACCOUNT, and every subscribed event goes to every registered URL. So
     this endpoint sees every captured payment on the account, not just the
     ones this checkout created: another funnel on the same account, a
     payment link made by hand in the dashboard, an invoice. Until this
     value was read, all of them were being reported as a sale of THIS
     challenge, to Meta, to GA4 and to the fulfilment hand-off.

     One constant, read by both routes, because a marker that is written in
     one file and matched by a literal in another is a marker that silently
     stops matching the day somebody renames the funnel. */
  orderKind: 'peeyush_5day_health_reset',
  /* The launch domain as the fallback, not example.com: this value is sent to
     Meta as event_source_url and written into every Razorpay order, so an
     unset env var would quietly attribute live events to a domain we do not
     own.

     `||`, not `??`. A host that defines the key with a blank value yields an
     empty string, which `??` passes straight through, and an empty
     event_source_url is silently worthless to Meta.

     A TRAILING SLASH IS STRIPPED HERE, not trusted to be absent. The webhook
     builds the Pabbly url as `${fallbackEventSourceUrl}/checkout`, so a value
     ending in `/` produced `//checkout` on every single sale. Meta never
     showed it, because originOnly() throws the path away, so the only place
     it surfaced was the one system nobody was watching the url in. */
  fallbackEventSourceUrl:
    ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() ||
      'https://drpeeyushprabhat.com').replace(/\/+$/, ''),
  meta: {
    pixelId: process.env.META_PIXEL_ID ?? '',
    accessToken: process.env.META_CAPI_ACCESS_TOKEN ?? '',
    testEventCode: process.env.META_CAPI_TEST_EVENT_CODE ?? '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    /* A SEPARATE value from the API keys, taken from Settings -> Webhooks when
       the webhook is registered, not from the API Keys page. It is the one
       that gets missed, and the only symptom is silence: without it the
       webhook rejects every call and no sale is ever reported to Meta, GA4 or
       Pabbly. */
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },
} as const;

/** True only when a real CAPI call can be made. Routes check this and skip
 *  quietly rather than posting to Meta with an empty pixel id. */
export const capiReady = () =>
  Boolean(CHECKOUT_CONFIG.meta.pixelId && CHECKOUT_CONFIG.meta.accessToken);

/**
 * Whether this deployment is transacting in test mode, derived rather than
 * declared.
 *
 * Razorpay stamps its own environment into the key id (`rzp_test_` versus
 * `rzp_live_`) so this cannot drift out of sync the way a separate IS_TEST env
 * var would when someone swaps the keys and forgets the flag. A Meta test
 * event code is also treated as test, because events sent with one do not
 * count toward optimisation and the sale they describe is not real.
 *
 * It rides to Pabbly as `is_test` so a staging purchase can be routed away
 * from the live WhatsApp invite instead of onboarding a fictional buyer.
 */
export const isTestMode = () =>
  CHECKOUT_CONFIG.razorpay.keyId.startsWith('rzp_test_') ||
  Boolean(CHECKOUT_CONFIG.meta.testEventCode);

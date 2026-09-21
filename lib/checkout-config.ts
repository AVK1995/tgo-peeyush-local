import { PRICE_RUPEES } from '@/app/_landing/offer';

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

export const CHECKOUT_CONFIG = {
  amountRupees: PRICE_RUPEES,
  amountPaise: PRICE_PAISE,
  currency: 'INR',
  contentName: '5-Day Complete Health Reset Challenge',
  /* The launch domain as the fallback, not example.com: this value is sent to
     Meta as event_source_url and written into every Razorpay order, so an
     unset env var would quietly attribute live events to a domain we do not
     own.

     `||`, not `??`. A host that defines the key with a blank value yields an
     empty string, which `??` passes straight through, and an empty
     event_source_url is silently worthless to Meta.

     TRAILING SLASHES ARE STRIPPED, and that is not cosmetic. Callers append
     paths to this (`${eventSourceUrl}/checkout`), so a host env var entered as
     `https://drpeeyushprabhat.com/` — which is exactly how a browser offers it
     when you copy the address bar — produced `https://drpeeyushprabhat.com//checkout`
     on every fulfilment row and every Meta event. Meta treats that as a
     different URL from the real one, which quietly splits the event's
     attribution. */
  fallbackEventSourceUrl:
    ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() ||
      'https://challenge.drpeeyushprabhat.com').replace(/\/+$/, ''),
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

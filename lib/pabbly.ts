/**
 * Pabbly Connect: the fulfilment hand-off.
 *
 * Analytics tells Meta and GA4 that a sale happened. This tells the automation
 * who bought, so the buyer actually receives what they paid for: the WhatsApp
 * invite, the joining details, the guide downloads, the row in a sheet.
 *
 * It is fired from the Razorpay webhook and nowhere else, for the same reason
 * the Purchase event is: the webhook is the only place a payment is proven, and
 * UPI buyers routinely never return to the confirmation page. A browser-side
 * hand-off would silently skip most Indian buyers.
 *
 * Failure here must never fail the webhook. A gateway retries a non-200, and a
 * retry would re-fire Meta and GA4 and double-count the sale. So this reports
 * its own success and swallows its own errors: the caller logs the result and
 * still returns 200.
 *
 * ── Why this payload carries the Meta match keys too ──────────────────────
 * Pabbly is not only fulfilment; it is the ONLY place the full, unhashed
 * record of a sale exists. Meta receives hashes and nothing descriptive, GA4
 * receives no PII at all, and Razorpay holds only what it needs to charge a
 * card. So `fbc`, `fbp`, `client_ip_address`, `client_user_agent`,
 * `external_id` and `purchase_event_id` ride along here as well, they are
 * what makes it possible to rebuild, replay or reconcile a Meta event later
 * from the sheet, without which a mis-sent conversion is unrecoverable.
 */
export const pabblyReady = () => Boolean(process.env.PABBLY_WEBHOOK_URL);

export type PabblyPurchase = {
  leadId: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  /** What RAZORPAY had on file for the payer, which is not necessarily what
   *  the buyer typed into our checkout. `email` above is the form's value and
   *  is the delivery address; this is kept beside it so a mismatch stays
   *  visible when reconciling a refund or chasing "the invite never arrived".
   *  See the note in the webhook on why the form wins. */
  paymentEmail: string;
  phone: string;
  city: string;
  /** "+91", kept apart from `phone`, which arrives as full E.164. */
  dialCode: string;
  countryCode: string;
  fbc: string;
  fbp: string;
  clientIp: string;
  clientUserAgent: string;
  externalId: string;
  eventSourceUrl: string;
  amountRupees: number;
  isTest: boolean;
  purchaseEventId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
  /* Beyond the agreed column set, kept because existing Pabbly steps already
     map them and removing a key silently blanks a column downstream. */
  paymentId: string;
  orderId: string;
  currency: string;
  product: string;
  occupation: string;

  /* ── WHICH PASS (26 Sep 2026, the OTO step) ────────────────────────────
     `tier` is the stable enum — "standard" or "vip" — and is what a Pabbly
     router should branch on. `tierName` is the prose title, for the email and
     the sheet. `hasRecordings` is the single entitlement that actually
     differs, pre-computed here so the workflow does not have to encode the
     rule "vip means replays" in two places.

     Branch on `tier`, NOT on `amount`: ₹997 identifies the VIP pass only
     until the first discount code or price change. */
  tier: string;
  tierName: string;
  hasRecordings: boolean;
};

/* Every key is emitted on every call, empty string where unknown. Pabbly
   builds its field mapper from the FIRST payload it sees, so a key that is
   merely absent on the first test call cannot be mapped afterwards without
   re-running the trigger, an omitted key is far more expensive here than an
   empty one. */
const s = (v: unknown) => (v == null ? '' : String(v));

/* One constant behind both `type` and `event`, so a workflow branching on
   either takes the same path. This funnel emits one record type: the caller is
   the Razorpay webhook and it only fires on payment.captured. */
const RECORD_TYPE = 'purchase';

export async function sendPabblyPurchase(
  p: PabblyPurchase,
): Promise<{ ok: boolean; status: number }> {
  const url = process.env.PABBLY_WEBHOOK_URL ?? '';
  if (!url) return { ok: false, status: 0 };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      /* Flat keys, no nesting: Pabbly maps fields one level deep, and a nested
         object arrives as an unusable blob in the step mapper. */
      body: JSON.stringify({
        lead_id: s(p.leadId),
        created_at: s(p.createdAt),
        first_name: s(p.firstName),
        last_name: s(p.lastName),
        email: s(p.email),
        payment_email: s(p.paymentEmail),
        phone: s(p.phone),
        city: s(p.city),
        dial_code: s(p.dialCode),
        country_code: s(p.countryCode),
        /* The record type, in the position the agreed column set puts it. It
           carries the SAME value as `event` below, from one constant, so the
           two can never disagree: this funnel hands off exactly one kind of
           record, a completed purchase, because the webhook is the only caller
           and it only fires on payment.captured. If the workflow ever means
           something else by `type` (a product class, paid vs free), it is one
           line here. */
        type: RECORD_TYPE,
        fbc: s(p.fbc),
        fbp: s(p.fbp),
        client_ip_address: s(p.clientIp),
        client_user_agent: s(p.clientUserAgent),
        external_id: s(p.externalId),
        event_source_url: s(p.eventSourceUrl),
        amount: p.amountRupees,
        /* Boolean, not the string "false": a Pabbly router condition on a
           non-empty string treats "false" as true and would route live sales
           down the test branch. */
        is_test: Boolean(p.isTest),
        purchase_event_id: s(p.purchaseEventId),
        utm_source: s(p.utmSource),
        utm_medium: s(p.utmMedium),
        utm_campaign: s(p.utmCampaign),
        utm_content: s(p.utmContent),
        utm_term: s(p.utmTerm),
        fbclid: s(p.fbclid),
        referrer: s(p.referrer),
        landing_url: s(p.landingUrl),

        event: RECORD_TYPE,
        payment_id: s(p.paymentId),
        order_id: s(p.orderId),
        name: `${s(p.firstName)} ${s(p.lastName)}`.trim(),
        currency: s(p.currency),
        product: s(p.product),
        occupation: s(p.occupation),
        tier: s(p.tier),
        tier_name: s(p.tierName),
        /* Boolean, not the string "false": a Pabbly router condition on a
           non-empty string treats "false" as true, which would send the
           replay library to every standard buyer. */
        has_recordings: Boolean(p.hasRecordings),
      }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

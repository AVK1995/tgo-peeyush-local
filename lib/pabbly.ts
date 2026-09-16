/**
 * Pabbly Connect: the fulfilment hand-off.
 *
 * Analytics tells Meta and GA4 that a sale happened. This tells the automation
 * who bought, so the buyer actually receives what they paid for: the WhatsApp
 * invite, the joining details, the guide downloads, the row in a sheet.
 *
 * It is fired from the Instamojo webhook and nowhere else, for the same reason
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
 * receives no PII at all, and Instamojo holds only what it needs to charge a
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
  phone: string;
  city: string;
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
};

/* Every key is emitted on every call, empty string where unknown. Pabbly
   builds its field mapper from the FIRST payload it sees, so a key that is
   merely absent on the first test call cannot be mapped afterwards without
   re-running the trigger, an omitted key is far more expensive here than an
   empty one. */
const s = (v: unknown) => (v == null ? '' : String(v));

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
        phone: s(p.phone),
        city: s(p.city),
        country_code: s(p.countryCode),
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

        event: 'purchase',
        payment_id: s(p.paymentId),
        order_id: s(p.orderId),
        name: `${s(p.firstName)} ${s(p.lastName)}`.trim(),
        currency: s(p.currency),
        product: s(p.product),
        occupation: s(p.occupation),
      }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

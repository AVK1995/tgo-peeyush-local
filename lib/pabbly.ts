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

  /* ── Added in the "webhook arrives empty" pass ──────────────────────────
     Everything below was either not sent at all, or was being sent as an
     empty string because the webhook was reading the buyer context out of the
     wrong Razorpay entity. See lib/razorpay-order.ts for that root cause.

     These are additive: every key that existed before still exists, under the
     same name, so no Pabbly step that is already mapped can break. */

  /** GA4's client id. Already carried in the order notes, never forwarded.
   *  It is what joins a sheet row to a GA4 session. */
  gaClientId: string;
  utmId: string;
  adId: string;
  adsetId: string;
  campaignId: string;
  placement: string;
  siteSourceName: string;

  /** When Razorpay captured the payment, ISO 8601. Distinct from `createdAt`,
   *  which is when the buyer submitted the form: a UPI payment can settle
   *  minutes later, and reconciliation needs both. */
  paidAt: string;
  /** The exact charged amount in paise, alongside the rupee figure. Rupees is
   *  a division and can carry a float; paise is what Razorpay's ledger says. */
  amountPaise: number;
  amountRefundedRupees: number;
  /** Razorpay's own cut, in rupees, so net revenue is a column and not a
   *  monthly export. Zero until Razorpay computes it, which for some methods
   *  is after capture. */
  feeRupees: number;
  taxRupees: number;

  /** What RAZORPAY had on file for the payer, which is not necessarily what
   *  the buyer typed into our checkout form.
   *
   *  `email` and `phone` above are the form's values and are what fulfilment
   *  must follow — they are the address the buyer asked us to send the invite
   *  to. These two are the gateway's copy, kept because a mismatch between
   *  them is the first thing worth seeing when reconciling a refund or
   *  chasing "I never got the WhatsApp link". */
  paymentEmail: string;
  paymentContact: string;

  /** How it was actually paid: upi / card / netbanking / wallet / emi. */
  method: string;
  bank: string;
  wallet: string;
  vpa: string;
  cardId: string;
  cardLast4: string;
  cardNetwork: string;
  cardType: string;
  cardIssuer: string;
  status: string;
  captured: boolean;
  international: boolean;
  description: string;

  /** Acquirer references. `rrn` and `upiTransactionId` are what a bank asks
   *  for when a buyer disputes a charge or claims money left their account
   *  without an invite arriving. */
  rrn: string;
  upiTransactionId: string;
  bankTransactionId: string;
  authCode: string;
  errorCode: string;
  errorDescription: string;

  /** Order-side facts, from the order Razorpay holds. `orderReceipt` is the
   *  `dpp_*` string the dashboard is searched by. */
  orderReceipt: string;
  orderAttempts: number;
  orderCreatedAt: string;

  /** Which Razorpay event produced this row, and when we handled it. Both are
   *  for debugging a silent gap later: a row with no `webhookReceivedAt` came
   *  from somewhere other than this webhook. */
  webhookEvent: string;
  webhookReceivedAt: string;
  /** False when the buyer context could not be recovered from the order. The
   *  single most useful column on this payload: it is the alarm for the exact
   *  regression this pass fixed, and a Pabbly router can branch on it. */
  contextRecovered: boolean;
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
        phone: s(p.phone),
        city: s(p.city),
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

        /* ── Campaign, continued ─────────────────────────────────────────
           The Ads Manager ids, kept next to the UTMs they belong with. */
        ga_client_id: s(p.gaClientId),
        utm_id: s(p.utmId),
        ad_id: s(p.adId),
        adset_id: s(p.adsetId),
        campaign_id: s(p.campaignId),
        placement: s(p.placement),
        site_source_name: s(p.siteSourceName),

        /* ── The payment itself ──────────────────────────────────────────
           Numbers stay numbers and booleans stay booleans: a Pabbly router
           comparing a spreadsheet cell against a number does not match the
           string "1", and a condition on the string "false" is true. */
        paid_at: s(p.paidAt),
        amount_paise: p.amountPaise,
        amount_refunded: p.amountRefundedRupees,
        razorpay_fee: p.feeRupees,
        razorpay_tax: p.taxRupees,
        /* The gateway's own record of the payer, beside the form's. `email`
           and `phone` at the top of this payload remain the fulfilment
           address; these two exist so the difference is visible. */
        payment_email: s(p.paymentEmail),
        payment_contact: s(p.paymentContact),
        payment_method: s(p.method),
        payment_bank: s(p.bank),
        payment_wallet: s(p.wallet),
        payment_vpa: s(p.vpa),
        card_id: s(p.cardId),
        card_last4: s(p.cardLast4),
        card_network: s(p.cardNetwork),
        card_type: s(p.cardType),
        card_issuer: s(p.cardIssuer),
        payment_status: s(p.status),
        payment_captured: Boolean(p.captured),
        payment_international: Boolean(p.international),
        payment_description: s(p.description),
        rrn: s(p.rrn),
        upi_transaction_id: s(p.upiTransactionId),
        bank_transaction_id: s(p.bankTransactionId),
        auth_code: s(p.authCode),
        error_code: s(p.errorCode),
        error_description: s(p.errorDescription),

        /* ── The order ───────────────────────────────────────────────────*/
        order_receipt: s(p.orderReceipt),
        order_attempts: p.orderAttempts,
        order_created_at: s(p.orderCreatedAt),

        /* ── Provenance ──────────────────────────────────────────────────*/
        webhook_event: s(p.webhookEvent),
        webhook_received_at: s(p.webhookReceivedAt),
        context_recovered: Boolean(p.contextRecovered),
      }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

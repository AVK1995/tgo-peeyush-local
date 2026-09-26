import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { resolveTier } from '@/app/_landing/offer';
import { CHECKOUT_CONFIG, capiReady, isTestMode } from '@/lib/checkout-config';
import { ga4ServerReady, sendGa4Purchase } from '@/lib/ga4-server';
import { sendCapiEvent, type Occupation } from '@/lib/meta-capi';
import { readOrderContext } from '@/lib/order-notes';
import { pabblyReady, sendPabblyPurchase } from '@/lib/pabbly';

/**
 * Razorpay webhook, and the ONLY place a Purchase is reported.
 *
 * A browser-side Purchase would miss every UPI payer who completes inside
 * their bank app and never returns to the tab, which in India is most of them.
 * It is also the only place the payment is proven rather than merely
 * attempted. The success handler on the checkout page navigates and nothing
 * else.
 *
 * UNLIKE the Instamojo integration this replaced, the buyer context does not
 * ride in a token on the URL: it is in the order's own `notes`, written at
 * create-order time and returned here verbatim by Razorpay. That is why this
 * route needs nothing on its query string and why the webhook URL registered
 * in the dashboard is a plain, static one.
 *
 * The signature check is not optional. Without it anyone who learns this URL
 * can post a fake payment and inflate Meta's conversion data, which then
 * teaches the ad account to buy the wrong people.
 *
 * WHAT IS DELIBERATELY NOT READ HERE: this request's IP and user agent. They
 * belong to Razorpay's server, not the buyer's device. Sending them would put
 * a confidently wrong device signature on the single event where matching
 * matters most, and nothing would look broken.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const secret = CHECKOUT_CONFIG.razorpay.webhookSecret;

  if (!secret) {
    console.error('[rzp-webhook] no webhook secret configured');
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  /* Length checked first: timingSafeEqual throws on buffers of unequal size. */
  const valid =
    sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

  if (!valid) {
    console.warn('[rzp-webhook] bad signature, rejected');
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const parsed = JSON.parse(raw);
  if (parsed.event !== 'payment.captured') {
    // Razorpay sends many event types; only a captured payment is a Purchase.
    return NextResponse.json({ ok: true, ignored: parsed.event });
  }

  const payment = parsed.payload?.payment?.entity ?? {};
  const notes = payment.notes ?? {};

  /* ── IS THIS SALE EVEN OURS? (2026-09-22) ──────────────────────────────
     A signature check proves the call came from Razorpay. It does NOT prove
     the payment came from THIS checkout.

     Razorpay registers webhooks per URL on an ACCOUNT and sends every
     subscribed event to every registered URL. So this endpoint receives every
     captured payment on the account: a second funnel sharing it, a payment
     link created by hand in the dashboard, an invoice, a renewal. Every one
     of those was being reported as a sale of this challenge, with a Purchase
     to Meta, a purchase to GA4 and a buyer row to the fulfilment hand-off.

     `notes.kind` is this funnel's mark, written on the order at create time.
     No mark, or someone else's mark, means the payment is not ours.

     200, NOT an error. A non-200 makes Razorpay retry the same foreign
     payment on a schedule for hours. This is a correct, final "not mine". */
  const kind = String(notes.kind ?? '');
  if (kind !== CHECKOUT_CONFIG.orderKind) {
    console.warn(
      `[rzp-webhook] ignored payment ${String(payment.id ?? '')}: kind="${kind || 'none'}", expected "${CHECKOUT_CONFIG.orderKind}"`,
    );
    return NextResponse.json({ ok: true, ignored: 'not-this-funnel' });
  }

  const paymentId = String(payment.id ?? '');
  const orderId = String(payment.order_id ?? '');
  const amountRupees = Number(payment.amount ?? 0) / 100;

  /* ── THE TIMESTAMP IS RAZORPAY'S (2026-09-22, Atul) ────────────────────
     `payment.created_at` is the moment the money was captured, in Unix
     seconds, and it arrives on this payload. Nothing has to carry it.

     It replaces a timestamp we used to mint at create-order and ferry through
     the order notes. That one meant "when the buyer submitted the form",
     which for a UPI payer can be minutes earlier, so the two are not the same
     instant. Atul's call is that the capture time is the one the record
     should carry, and the practical gain is that it can no longer be lost:
     a note that fails to pack cannot take the sale's date with it.

     Fallback to now() only if Razorpay ever omits it, so the field is never
     empty on a row that definitely represents a real payment. */
  const capturedAt = Number(payment.created_at ?? 0);
  const createdAt = Number.isFinite(capturedAt) && capturedAt > 0
    ? new Date(capturedAt * 1000).toISOString()
    : new Date().toISOString();

  const valueRupees = amountRupees || CHECKOUT_CONFIG.amountRupees;

  /* ── WHICH PASS WAS BOUGHT ─────────────────────────────────────────────
     Read from the order's own `tier` note, written at create-order time from
     the server's resolution of it. FULFILMENT BRANCHES ON THIS: a `vip` row
     is owed the replay library and the extended Q&A, a `standard` row is not,
     and Pabbly has no other reliable way to tell them apart.

     Deliberately NOT inferred from the amount. ₹997 identifies the VIP pass
     only until the first discount code, price change or part-payment, and a
     silent mis-inference here hands someone a product they did not buy — or
     withholds one they did. An order placed before this note existed resolves
     to `standard`, which is the safe direction to be wrong in. */
  const tier = resolveTier(notes.tier);

  /* Everything the browser knew, written into the order at create time and
     unpacked here. This is the ONLY route back to the buyer's own IP, user
     agent, campaign and landing page: this request came from Razorpay, so its
     own headers describe Razorpay. */
  const ctx = readOrderContext(notes);

  const country = ctx.country || 'in';

  /* Validated against the two known answers rather than passed through: this
     value reaches Meta's custom_data, which is unhashed and is read when a
     dataset is classified, so an unrecognised string is dropped rather than
     forwarded. Pabbly still receives the raw value either way. */
  const occupation: Occupation | undefined =
    ctx.occupation === 'working_professional' || ctx.occupation === 'homemaker'
      ? ctx.occupation
      : undefined;
  /* ── THE FORM'S EMAIL WINS, NOT THE GATEWAY'S (2026-09-24) ─────────────
     This read `payment.email` on the reasoning that "Razorpay is the
     authority: it holds what the buyer actually paid with". That reasoning
     put a STRANGER'S ADDRESS on live fulfilment rows.

     Razorpay Checkout recognises a returning device and pre-fills contact and
     email from its own remembered customer, which silently beats the values we
     pass in `prefill`. On a shared browser that is whoever last paid through
     Razorpay on it. Those remembered values are what land on the payment
     entity — so the WhatsApp invite and the guides went to that person while
     the buyer who had just paid received nothing. A real row carried
     `nirmitmaniar@gmail.com` for a buyer who typed something else.

     The order's `email` note is what the buyer typed on OUR checkout, and it
     is the address they asked us to deliver to. Fulfilment follows the form;
     the gateway is the fallback for the one case where the note is missing.

     PHONE IS DELIBERATELY DIFFERENT. There is no `phone` note any more (see
     create-order: it was dropped so the bundles could have its 256 chars) and
     Razorpay's `contact` is a verified number the buyer actually transacted
     with, so for the number the gateway genuinely is the better source.

     The other half of this fix is `readonly` on the payment sheet in
     app/checkout/page.tsx, which stops the overwrite happening at all. */
  const notesEmail = String(notes.email ?? '').trim();
  const gatewayEmail = String(payment.email ?? '').trim();
  const email = notesEmail || gatewayEmail;
  const phone = String(payment.contact ?? '') || '';

  /* A warning, not an error: it is legitimate (the buyer edits the field on
     the sheet), but it is the first thing to check when someone reports that
     the invite never arrived. */
  if (
    notesEmail &&
    gatewayEmail &&
    notesEmail.toLowerCase() !== gatewayEmail.toLowerCase()
  ) {
    console.warn(
      `[rzp-webhook] ${paymentId} email differs: form=${notesEmail} ` +
        `gateway=${gatewayEmail} — fulfilment uses the form address`,
    );
  }
  /* Origin only, for the same reason Meta gets origin only: the path names the
     condition. Pabbly receives the canonical checkout url for reference. */
  const eventSourceUrl = CHECKOUT_CONFIG.fallbackEventSourceUrl;

  /* GA4 purchase, server side. The browser copy on /thank-you only counts
     buyers who return to the page, which most UPI payers do not. Both are
     keyed on the payment id, so GA4 collapses the pair rather than counting
     the sale twice when someone does come back. */
  const ga4 = ga4ServerReady()
    ? await sendGa4Purchase({
        clientId: ctx.gaCid,
        transactionId: paymentId,
        valueRupees,
        currency: CHECKOUT_CONFIG.currency,
        /* Per pass, so the two do not collapse into one line item in GA4 and
           the upgrade rate is readable from the reporting rather than only
           from the sheet. */
        itemId: `peeyush-5day-health-reset-${tier.id}`,
        itemName: tier.name,
      })
    : { ok: false, status: 0 };

  /* Fulfilment hand-off, BEFORE the CAPI guard below: a missing Meta config
     must never stop a paying buyer from receiving what they bought. Its own
     failure is swallowed, because a non-200 here would make Razorpay retry the
     whole webhook and double-fire Meta and GA4. */
  const pabbly = pabblyReady()
    ? await sendPabblyPurchase({
        leadId: String(notes.lead_id ?? ''),
        createdAt,
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        email,
        paymentEmail: gatewayEmail,
        phone,
        city: ctx.city,
        dialCode: ctx.dialCode,
        countryCode: country,
        fbc: ctx.fbc,
        fbp: ctx.fbp,
        clientIp: ctx.clientIp,
        clientUserAgent: ctx.clientUserAgent,
        externalId: ctx.externalId,
        eventSourceUrl: `${eventSourceUrl}/checkout`,
        amountRupees: valueRupees,
        isTest: isTestMode(),
        /* The same id sent to Meta as the Purchase event_id, so a conversion
           can be traced from the sheet back to a specific row in Events
           Manager, or replayed against it. */
        purchaseEventId: paymentId,
        utmSource: ctx.utmSource,
        utmMedium: ctx.utmMedium,
        utmCampaign: ctx.utmCampaign,
        utmContent: ctx.utmContent,
        utmTerm: ctx.utmTerm,
        fbclid: ctx.fbclid,
        referrer: ctx.referrer,
        landingUrl: ctx.landingUrl,
        paymentId,
        orderId,
        currency: CHECKOUT_CONFIG.currency,
        product: tier.name,
        occupation: ctx.occupation,
        /* The branch key. `product` above is prose and will change the next
           time the copy does; `tier` is a stable enum and is what a Pabbly
           router should actually switch on to decide whether this buyer gets
           the replay library. */
        tier: tier.id,
        tierName: tier.name,
        hasRecordings: tier.id === 'vip',
      })
    : { ok: false, status: 0 };

  if (!capiReady()) {
    console.warn('[rzp-webhook] CAPI not configured, Meta Purchase not sent');
    return NextResponse.json({
      ok: true,
      capi: 'skipped',
      ga4: ga4.ok,
      pabbly: pabbly.ok,
    });
  }

  /* event_id is the payment id: unique per payment, and stable if Razorpay
     retries the webhook, so a retry cannot double-count the sale. */
  const result = await sendCapiEvent({
    pixelId: CHECKOUT_CONFIG.meta.pixelId,
    accessToken: CHECKOUT_CONFIG.meta.accessToken,
    eventName: 'Purchase',
    eventId: paymentId,
    eventSourceUrl,
    user: {
      email: email || undefined,
      phone: phone || undefined,
      firstName: ctx.firstName || undefined,
      lastName: ctx.lastName || undefined,
      country,
      city: ctx.city || undefined,
      externalId: ctx.externalId || undefined,
      fbc: ctx.fbc || undefined,
      fbp: ctx.fbp || undefined,
      /* Captured from the BUYER's request at create-order and carried here in
         the order notes. Never from this request: these headers are
         Razorpay's. Missing them costs roughly a point of EMQ on the one event
         where a device match is worth the most. */
      clientIp: ctx.clientIp || undefined,
      clientUserAgent: ctx.clientUserAgent || undefined,
    },
    valueRupees,
    currency: CHECKOUT_CONFIG.currency,
    /* The only two descriptive fields Meta receives. The product name and the
       UTMs are still deliberately NOT sent: custom_data is unhashed and is read
       during dataset classification, and those are the values that name the
       condition. Occupation is the reviewed exception: neither of its two
       possible values is a health term, and it is what lets the buyer split be
       read on Purchase rather than only on pay-intent. */
    orderId: orderId || undefined,
    occupation,
    testEventCode: CHECKOUT_CONFIG.meta.testEventCode || undefined,
  });

  /* `ctx` reports as present or absent on every line, because a carrier that
     silently stopped arriving would otherwise show up as nothing worse than a
     slowly falling match quality. */
  console.log(
    `[rzp-webhook] ${paymentId} Purchase capi=${result.ok} ga4=${ga4.ok} ` +
      /* The health check moved off createdAt, which now comes from Razorpay
         and is therefore always present: it could no longer tell us whether
         the NOTES unpacked, which is the thing worth watching. landingUrl is
         the honest canary instead, since every real order carries one. */
      `pabbly=${pabbly.ok} notes=${ctx.landingUrl ? 'ok' : 'EMPTY'}`,
  );
  return NextResponse.json({
    ok: true,
    capi: result.ok ? 'sent' : 'error',
    ga4: ga4.ok ? 'sent' : 'skipped',
    pabbly: pabbly.ok ? 'sent' : 'skipped',
  });
}

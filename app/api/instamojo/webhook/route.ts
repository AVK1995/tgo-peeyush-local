import { NextResponse } from 'next/server';

import { CHECKOUT_CONFIG, capiReady, isTestMode } from '@/lib/checkout-config';
import { ga4ServerReady, sendGa4Purchase } from '@/lib/ga4-server';
import { parseFormBody, verifyWebhookMac } from '@/lib/instamojo';
import { sendCapiEvent, type Occupation } from '@/lib/meta-capi';
import { openContext } from '@/lib/payment-context';
import { pabblyReady, sendPabblyPurchase } from '@/lib/pabbly';

/**
 * Instamojo webhook, and the ONLY place a Purchase is reported.
 *
 * A browser-side Purchase would miss every UPI payer who completes inside
 * their bank app and never returns to the tab, which in India is most of them.
 * Instamojo makes that sharper than Razorpay did, not softer: it is a redirect
 * gateway, so "coming back" means the bank app handing the browser back to a
 * URL, and that is exactly the step a UPI buyer skips. Instamojo's own docs
 * call the webhook the fallback for buyers who close the tab. It is not a
 * fallback here. It is the source of truth, and the redirect is the courtesy.
 *
 * THREE THINGS ARE DIFFERENT FROM THE RAZORPAY WEBHOOK, all of them load
 * bearing:
 *
 *   1. The body is application/x-www-form-urlencoded, NOT JSON. Calling
 *      req.json() here throws, the route 500s, and the gateway retries a
 *      payment that was fine.
 *   2. The signature is a `mac` FIELD inside the body, HMAC-SHA1 over the
 *      sorted field values joined by pipes, not a SHA256 header over the raw
 *      body. See lib/instamojo.ts.
 *   3. There are no notes, so everything the browser knew arrives in the
 *      sealed `c` token on this route's own URL, put there at create time.
 *      See lib/payment-context.ts.
 *
 * WHAT IS DELIBERATELY NOT READ HERE: this request's IP and user agent. They
 * belong to Instamojo's server, not the buyer's device. Sending them would put
 * a confidently wrong device signature on the single event where matching
 * matters most, and nothing would look broken.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const fields = parseFormBody(raw);
  const salt = CHECKOUT_CONFIG.instamojo.salt;

  if (!salt) {
    console.error('[im-webhook] INSTAMOJO_SALT not configured, cannot verify');
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (!verifyWebhookMac(fields, salt)) {
    /* Not optional. Without it anyone who learns this URL can post a fake
       payment, inflate Meta's conversion data, and teach the ad account to buy
       the wrong people. */
    console.warn('[im-webhook] bad mac, rejected');
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const status = String(fields.status ?? '');
  if (status.toLowerCase() !== 'credit') {
    /* Instamojo posts failures too. Only a Credit is a sale. */
    return NextResponse.json({ ok: true, ignored: status || 'no-status' });
  }

  const paymentId = String(fields.payment_id ?? '');
  const paymentRequestId = String(fields.payment_request_id ?? '');
  const amountRupees = Number(fields.amount ?? 0);
  const valueRupees = amountRupees > 0 ? amountRupees : CHECKOUT_CONFIG.amountRupees;

  /* The sealed context, from this route's own query string. Everything the
     browser knew at checkout and this request cannot see for itself. An
     unsealable or absent token yields empty strings rather than throwing, so a
     sale still reports on email, phone and name alone. */
  const ctx = openContext(
    new URL(req.url).searchParams.get('c') ?? '',
    salt,
  );

  /* Instamojo is the authority on email and phone: it holds what the buyer
     actually paid with, which can differ from what they typed into our form.
     The name is ours where we have it, because the form asks for first and
     last separately and Meta hashes them as separate keys, while the gateway
     sends one `buyer_name` string that would have to be guessed apart. */
  const email = String(fields.buyer ?? '').trim();
  const phone = String(fields.buyer_phone ?? '').replace(/\D/g, '');
  const buyerName = String(fields.buyer_name ?? '').trim();
  const nameParts = buyerName.split(/\s+/).filter(Boolean);
  const firstName = ctx.firstName || nameParts[0] || '';
  const lastName = ctx.lastName || nameParts.slice(1).join(' ');

  const country = ctx.country || 'in';

  /* Validated against the two known answers rather than passed through: this
     value reaches Meta's custom_data, which is unhashed and is read when a
     dataset is classified, so an unrecognised string is dropped rather than
     forwarded. Pabbly still receives the raw value either way. */
  const occupation: Occupation | undefined =
    ctx.occupation === 'working_professional' || ctx.occupation === 'homemaker'
      ? ctx.occupation
      : undefined;

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
        itemId: 'peeyush-5day-health-reset',
        itemName: CHECKOUT_CONFIG.contentName,
      })
    : { ok: false, status: 0 };

  /* Fulfilment hand-off, BEFORE the CAPI guard below: a missing Meta config
     must never stop a paying buyer from receiving what they bought. Its own
     failure is swallowed, because a non-200 here would make Instamojo retry
     the whole webhook and double-fire Meta and GA4. */
  const pabbly = pabblyReady()
    ? await sendPabblyPurchase({
        leadId: ctx.leadId,
        createdAt: ctx.createdAt,
        firstName,
        lastName,
        email,
        phone,
        city: ctx.city,
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
        /* Instamojo's payment_request_id is the nearest thing it has to an
           order id, and it is what the dashboard indexes a payment under. */
        orderId: paymentRequestId,
        currency: CHECKOUT_CONFIG.currency,
        product: CHECKOUT_CONFIG.contentName,
        occupation: ctx.occupation,
      })
    : { ok: false, status: 0 };

  if (!capiReady()) {
    console.warn('[im-webhook] CAPI not configured, Meta Purchase not sent');
    return NextResponse.json({
      ok: true,
      capi: 'skipped',
      ga4: ga4.ok,
      pabbly: pabbly.ok,
    });
  }

  /* event_id is the Instamojo payment id: unique per payment, stable across a
     webhook retry, and visible to the browser on the redirect too, so nothing
     can double-count the sale from either side. */
  const result = await sendCapiEvent({
    pixelId: CHECKOUT_CONFIG.meta.pixelId,
    accessToken: CHECKOUT_CONFIG.meta.accessToken,
    eventName: 'Purchase',
    eventId: paymentId,
    eventSourceUrl,
    user: {
      email: email || undefined,
      phone: phone || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      country,
      city: ctx.city || undefined,
      externalId: ctx.externalId || undefined,
      fbc: ctx.fbc || undefined,
      fbp: ctx.fbp || undefined,
      /* Captured from the BUYER's request at create-payment and carried here
         in the sealed token. Never from this request: these headers are
         Instamojo's. */
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
    orderId: paymentRequestId || undefined,
    occupation,
    testEventCode: CHECKOUT_CONFIG.meta.testEventCode || undefined,
  });

  /* `ctx` reports as present or absent on every line, because a gateway that
     starts refusing the carrier would otherwise show up as nothing worse than
     a slowly falling match quality. */
  console.log(
    `[im-webhook] ${paymentId} Purchase capi=${result.ok} ga4=${ga4.ok} ` +
      `pabbly=${pabbly.ok} ctx=${ctx.leadId ? 'ok' : 'MISSING'}`,
  );
  return NextResponse.json({
    ok: true,
    capi: result.ok ? 'sent' : 'error',
    ga4: ga4.ok ? 'sent' : 'skipped',
    pabbly: pabbly.ok ? 'sent' : 'skipped',
  });
}

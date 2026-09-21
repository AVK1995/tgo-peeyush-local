import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { CHECKOUT_CONFIG, capiReady, isTestMode } from '@/lib/checkout-config';
import { ga4ServerReady, sendGa4Purchase } from '@/lib/ga4-server';
import { sendCapiEvent, type Occupation } from '@/lib/meta-capi';
import { unpackContext } from '@/lib/order-notes';
import { pabblyReady, sendPabblyPurchase } from '@/lib/pabbly';
import {
  asNotes,
  fetchRazorpayOrder,
  hasPackedContext,
} from '@/lib/razorpay-order';

/** Razorpay timestamps are unix SECONDS. `new Date(n)` would read them as
 *  milliseconds and date every sale to January 1970. */
const isoFromUnix = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '';
  return new Date(n * 1000).toISOString();
};

const str = (v: unknown): string => (v == null ? '' : String(v));

/** Razorpay reports money in paise. Every rupee figure on the payload is this
 *  division and nothing else, so no two of them can disagree. */
const paiseToRupees = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n / 100 : 0;
};

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
    /* Razorpay sends many event types; only a captured payment is a Purchase.
       `order.paid` is called out by name because it is the plausible-looking
       wrong choice: it fires on the same sale and carries the order entity,
       so registering it INSTEAD of payment.captured leaves a site that takes
       money and reports nothing, with a 200 in the delivery log. Registering
       it AS WELL would double every Pabbly row. */
    if (parsed.event === 'order.paid') {
      console.warn(
        '[rzp-webhook] order.paid received and ignored. This route handles ' +
          'payment.captured only; register that event in Settings -> Webhooks.',
      );
    }
    return NextResponse.json({ ok: true, ignored: parsed.event });
  }

  const receivedAt = new Date().toISOString();
  const payment = parsed.payload?.payment?.entity ?? {};
  const paymentId = String(payment.id ?? '');
  const orderId = String(payment.order_id ?? '');
  const amountRupees = paiseToRupees(payment.amount);

  const valueRupees = amountRupees || CHECKOUT_CONFIG.amountRupees;

  /* ── RECOVERING THE BUYER CONTEXT ──────────────────────────────────────
     This block is the fix for "the webhook arrives empty".

     It used to be one line: `unpackContext(payment.notes)`. That reads the
     PAYMENT's notes, and the buyer context was written to the ORDER's notes.
     They are different fields on different entities, and Razorpay does not
     copy one to the other. The `payment.captured` payload contains only the
     payment entity, whose `notes` is `[]` on every sale this site has ever
     taken, so `unpackContext` parsed nothing and returned EMPTY_CONTEXT:
     blank created_at, blank name, blank city, blank UTMs, blank fbc/fbp,
     blank IP, blank user agent. Email, phone and amount still arrived,
     because those are fields on the payment itself, which is why it looked
     like a partial failure rather than a lookup in the wrong place.

     Three sources, in descending order of trust:
       1. an order entity delivered inline (only `order.paid` does this);
       2. the order fetched back from Razorpay by id — the normal path;
       3. the payment's own notes, for the hand-created payment or a future
          flow that sets them.
     See lib/razorpay-order.ts. */
  const inlineOrder = parsed.payload?.order?.entity ?? null;
  let order = inlineOrder as Record<string, unknown> | null;
  let orderNotes = asNotes(order?.notes);

  if (!hasPackedContext(orderNotes) && orderId) {
    const fetched = await fetchRazorpayOrder(
      orderId,
      CHECKOUT_CONFIG.razorpay.keyId,
      CHECKOUT_CONFIG.razorpay.keySecret,
    );
    if (fetched) {
      order = fetched as unknown as Record<string, unknown>;
      orderNotes = asNotes(fetched.notes);
    }
  }

  const paymentNotes = asNotes(payment.notes);
  const notes = hasPackedContext(orderNotes) ? orderNotes : paymentNotes;
  const contextRecovered = hasPackedContext(notes);

  const ctx = unpackContext(notes);

  const country = ctx.country || 'in';

  /* ── The payment entity, unpacked ──────────────────────────────────────
     Read defensively throughout: `card` is present only for card payments,
     `acquirer_data` only once the acquirer has responded, and reading a
     property off an absent object is the one way this route can throw after
     the signature check has already passed. */
  const card = (payment.card ?? {}) as Record<string, unknown>;
  const acquirer = (payment.acquirer_data ?? {}) as Record<string, unknown>;

  const paidAt = isoFromUnix(payment.created_at);
  const orderCreatedAt = isoFromUnix(order?.created_at);

  /* `created_at` means "when the buyer submitted their details", and it comes
     from the order notes. The fallbacks exist so this column is NEVER blank
     again: an order placed before this fix, or one whose context could not be
     recovered, still dates to the order rather than to nothing at all. */
  const createdAt = ctx.createdAt || orderCreatedAt || paidAt || receivedAt;

  /* Validated against the two known answers rather than passed through: this
     value reaches Meta's custom_data, which is unhashed and is read when a
     dataset is classified, so an unrecognised string is dropped rather than
     forwarded. Pabbly still receives the raw value either way. */
  const occupation: Occupation | undefined =
    ctx.occupation === 'working_professional' || ctx.occupation === 'homemaker'
      ? ctx.occupation
      : undefined;
  /* ── WHOSE EMAIL AND PHONE WIN ─────────────────────────────────────────
     This used to read `payment.email` and `payment.contact` on the reasoning
     that "Razorpay is the authority: it holds what the buyer actually paid
     with". That reasoning is wrong for THIS funnel, and it was putting a
     stranger's address on the fulfilment row.

     Razorpay Checkout recognises a returning device and pre-populates its own
     remembered contact details, which can belong to whoever last paid on that
     browser — a different person on a shared laptop, or an old address the
     buyer no longer reads. Those remembered values are what land on the
     payment entity. What the buyer typed into OUR form, on the other hand, is
     the address they just asked us to send the WhatsApp invite and the guides
     to. Fulfilment has to follow the form.

     So the order notes win, and the gateway's copy is demoted to a fallback
     for the one case where the notes could not be recovered. Razorpay's own
     values are still forwarded, under `payment_email` and `payment_contact`,
     because a mismatch between the two is exactly what you want to see when
     reconciling a refund — nothing is lost, it is just no longer in charge.

     The other half of this fix is in app/checkout/page.tsx, which now marks
     the email and contact fields `readonly` so Razorpay cannot overwrite the
     prefill with its remembered values in the first place. */
  const notesEmail = String(notes.email ?? '').trim();
  const notesPhone = String(notes.phone ?? '').trim();
  const gatewayEmail = String(payment.email ?? '').trim();
  const gatewayPhone = String(payment.contact ?? '').trim();

  const email = notesEmail || gatewayEmail;

  /* Normalised to E.164 WITH the leading plus, whichever source won.
     The form stores digits only (`919876543210`) and the gateway stores
     `+919876543210`, so without this the format of the `phone` column would
     flip depending on which source was used — and any Pabbly or WhatsApp step
     that matches on the number would start missing rows. Meta is indifferent:
     hashPhone strips non-digits before hashing. */
  const phoneDigits = (notesPhone || gatewayPhone).replace(/\D/g, '');
  const phone = phoneDigits ? `+${phoneDigits}` : '';

  /* Worth a line in the log, not an error: it is legitimate (a buyer who
     edits the field on the sheet, or pays from a different number), but it is
     also the first thing to check when a buyer says the invite never came. */
  if (notesEmail && gatewayEmail && notesEmail.toLowerCase() !== gatewayEmail.toLowerCase()) {
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
        itemId: 'peeyush-5day-health-reset',
        itemName: CHECKOUT_CONFIG.contentName,
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
        orderId,
        currency: String(payment.currency ?? CHECKOUT_CONFIG.currency),
        product: CHECKOUT_CONFIG.contentName,
        occupation: ctx.occupation,

        /* Campaign, continued: the GA4 id was always carried in the notes and
           never forwarded, and the Meta ad ids are new to this pass. */
        gaClientId: ctx.gaCid,
        utmId: ctx.utmId,
        adId: ctx.adId,
        adsetId: ctx.adsetId,
        campaignId: ctx.campaignId,
        placement: ctx.placement,
        siteSourceName: ctx.siteSourceName,

        /* The payment, as Razorpay describes it. */
        paidAt,
        amountPaise: Number(payment.amount ?? 0),
        amountRefundedRupees: paiseToRupees(payment.amount_refunded),
        paymentEmail: gatewayEmail,
        paymentContact: gatewayPhone,
        feeRupees: paiseToRupees(payment.fee),
        taxRupees: paiseToRupees(payment.tax),
        method: str(payment.method),
        bank: str(payment.bank),
        wallet: str(payment.wallet),
        vpa: str(payment.vpa),
        cardId: str(payment.card_id),
        cardLast4: str(card.last4),
        cardNetwork: str(card.network),
        cardType: str(card.type),
        cardIssuer: str(card.issuer),
        status: str(payment.status),
        captured: Boolean(payment.captured),
        international: Boolean(payment.international),
        description: str(payment.description),
        rrn: str(acquirer.rrn),
        upiTransactionId: str(acquirer.upi_transaction_id),
        bankTransactionId: str(acquirer.bank_transaction_id),
        authCode: str(acquirer.auth_code),
        errorCode: str(payment.error_code),
        errorDescription: str(payment.error_description),

        /* The order. */
        orderReceipt: str(order?.receipt),
        orderAttempts: Number(order?.attempts ?? 0),
        orderCreatedAt,

        /* Provenance, and the alarm for this pass's own regression. */
        webhookEvent: String(parsed.event ?? ''),
        webhookReceivedAt: receivedAt,
        contextRecovered,
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
      `pabbly=${pabbly.ok} ctx=${contextRecovered ? 'ok' : 'MISSING'} ` +
      `method=${str(payment.method) || '-'} amount=${valueRupees}`,
  );
  /* Loud, separate, and on its own line: a recovered context is the whole
     point of this route, and its absence used to be visible only as a Pabbly
     row full of blanks that nobody was watching. */
  if (!contextRecovered) {
    console.error(
      `[rzp-webhook] ${paymentId} NO BUYER CONTEXT on order ${orderId || '-'}. ` +
        'The order notes could not be read: check RAZORPAY_KEY_ID/SECRET are ' +
        'the same pair that created the order (test keys cannot read a live ' +
        'order), and that the order was created by /api/razorpay/create-order.',
    );
  }
  return NextResponse.json({
    ok: true,
    capi: result.ok ? 'sent' : 'error',
    ga4: ga4.ok ? 'sent' : 'skipped',
    pabbly: pabbly.ok ? 'sent' : 'skipped',
  });
}

import crypto from 'crypto';

import { NextResponse } from 'next/server';

import {
  CHECKOUT_CONFIG,
  INSTAMOJO_PURPOSE,
  instamojoReady,
  isTestMode,
} from '@/lib/checkout-config';
import { createPaymentRequest } from '@/lib/instamojo';
import { sealContext } from '@/lib/payment-context';
import { readClientIp, readClientUserAgent } from '@/lib/request-signals';

/**
 * Creates the Instamojo payment request and hands the browser the URL to go to.
 *
 * Instamojo is a REDIRECT gateway: there is no sheet to open over this page and
 * no in-page success callback. This route returns `payUrl` (Instamojo's
 * `longurl`) and the checkout navigates the whole tab to it.
 *
 * THIS IS STILL THE ONE HONEST PLACE TO READ THE BUYER'S IP AND USER AGENT.
 * It is the last request their own browser makes before the gateway takes over.
 * The webhook that eventually proves the payment is a request from Instamojo,
 * so reading those headers there would record Instamojo's server as the buyer's
 * device: a confidently wrong value, which matches worse than a missing one.
 * See lib/request-signals.ts.
 *
 * WHAT CHANGED FROM RAZORPAY, and it is the whole design of this route:
 * Instamojo has no `notes` object and no custom fields, so there is nothing on
 * the payment request to carry any of that context to the webhook. The carrier
 * is the webhook URL itself, which is set here, per payment request. The
 * context is sealed into one opaque token and appended as `?c=`. See
 * lib/payment-context.ts for why it is encrypted rather than merely signed.
 */

const truncate = (v: unknown, max = 256) => {
  const s = v == null ? '' : String(v);
  return s.length > max ? s.slice(0, max) : s;
};

/* Instamojo's published bounds on a payment request, in RUPEES. Asserted here
   rather than trusted, because the amount comes from an env var: a mistyped
   NEXT_PUBLIC_PRICE_RUPEES would otherwise fail at the gateway, in front of the
   buyer, with a message they cannot act on. */
const MIN_RUPEES = 9;
const MAX_RUPEES = 200000;

export async function POST(req: Request) {
  const { clientId, clientSecret, salt, env } = CHECKOUT_CONFIG.instamojo;
  if (!instamojoReady()) {
    console.error('[create-payment] Instamojo credentials not configured');
    return NextResponse.json(
      { ok: false, reason: 'not-configured' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad-json' }, { status: 400 });
  }

  const firstName = truncate(body.firstName, 80).trim();
  const lastName = truncate(body.lastName, 80).trim();
  const email = truncate(body.email, 160).trim();
  const phone = truncate(body.phone, 20).replace(/\D/g, '');
  const city = truncate(body.city, 80).trim();
  const country = truncate(body.country, 2).trim().toLowerCase() || 'in';
  const occupation = truncate(body.occupation, 32).trim();

  if (!firstName || !lastName || !email || !phone || !city || !occupation) {
    return NextResponse.json({ ok: false, reason: 'missing-fields' }, { status: 400 });
  }

  const amountRupees = CHECKOUT_CONFIG.amountRupees;
  if (
    !Number.isFinite(amountRupees) ||
    amountRupees < MIN_RUPEES ||
    amountRupees > MAX_RUPEES
  ) {
    console.error(
      `[create-payment] amount out of Instamojo bounds rupees=${amountRupees} ` +
        `(allowed ${MIN_RUPEES}-${MAX_RUPEES}). Check NEXT_PUBLIC_PRICE_RUPEES.`,
    );
    return NextResponse.json({ ok: false, reason: 'bad-amount' }, { status: 503 });
  }

  const utm = (body.utm ?? {}) as Record<string, string | undefined>;

  /* Identity and timestamp for the fulfilment record. Generated HERE, not in
     the webhook: `created_at` must mean "when this person submitted their
     details", and a webhook stamp would instead record when Instamojo got
     round to calling us, which for a UPI payment can be minutes later. */
  const leadId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  /* Read from headers, never from the request body: the browser cannot know
     its own IP, and a user agent sent up in JSON is trivially forged. */
  const clientIp = readClientIp(req);
  const clientUserAgent = readClientUserAgent(req);

  const token = sealContext(
    {
      createdAt,
      leadId,
      firstName,
      lastName,
      city,
      country,
      occupation,
      externalId: truncate(body.externalId, 64),
      fbc: truncate(body.fbc),
      fbp: truncate(body.fbp),
      gaCid: truncate(body.gaClientId, 64),
      clientIp,
      clientUserAgent,
      utmSource: truncate(utm.source, 100),
      utmMedium: truncate(utm.medium, 100),
      utmCampaign: truncate(utm.campaign, 100),
      utmContent: truncate(utm.content, 100),
      utmTerm: truncate(utm.term, 100),
      fbclid: truncate(body.fbclid, 200),
      referrer: truncate(body.referrer, 200),
      landingUrl: truncate(body.landingUrl, 300),
    },
    salt,
  );

  if (!token) {
    /* Loud, because everything downstream is quietly poorer without it: the
       Purchase loses fbp, fbc, the IP, the user agent and the city, GA4 loses
       the session it belongs to, and Pabbly loses the campaign. The sale still
       completes, which is the right trade, but nobody should discover this
       from a report three weeks later. */
    console.error(
      `[create-payment] context not sealed (salt set: ${Boolean(salt)}). ` +
        'Purchase will report with email, phone and name only.',
    );
  }

  const origin = CHECKOUT_CONFIG.fallbackEventSourceUrl.replace(/\/+$/, '');
  const redirectUrl = `${origin}/api/instamojo/return`;
  const bareWebhook = `${origin}/api/instamojo/webhook`;
  const webhookUrl = token
    ? `${bareWebhook}?c=${encodeURIComponent(token)}`
    : bareWebhook;

  const common = {
    clientId,
    clientSecret,
    env,
    amountRupees,
    purpose: INSTAMOJO_PURPOSE,
    buyerName: `${firstName} ${lastName}`.trim(),
    email,
    phone,
    redirectUrl,
  };

  let result = await createPaymentRequest({ ...common, webhookUrl });

  /* Instamojo publishes no length limit for the `webhook` field, and an
     undocumented limit cannot be designed against, only survived. If the
     request is rejected and we sent a long webhook URL, try once more with the
     bare one. Losing the context costs match quality; losing the payment costs
     the sale, and only one of those is recoverable. */
  if (!result.ok && webhookUrl !== bareWebhook) {
    console.error(
      `[create-payment] rejected with sealed webhook url (len=${webhookUrl.length}) ` +
        `http=${result.status} detail=${result.detail}. Retrying bare.`,
    );
    result = await createPaymentRequest({ ...common, webhookUrl: bareWebhook });
    if (result.ok) {
      console.error(
        '[create-payment] bare webhook accepted: the gateway is refusing the ' +
          'context carrier, so this sale reports without fbp, fbc, IP, user ' +
          'agent, GA4 client id or campaign.',
      );
    }
  }

  if (!result.ok) {
    console.error(
      `[create-payment] instamojo rejected http=${result.status} detail=${result.detail}`,
    );
    return NextResponse.json({ ok: false, reason: 'gateway' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    leadId,
    isTest: isTestMode(),
    paymentRequestId: result.id,
    /* The page to send the buyer to. Nothing secret: it is a public payment
       page and the buyer is about to be standing on it. */
    payUrl: result.payUrl,
  });
}

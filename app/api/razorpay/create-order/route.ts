import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { CHECKOUT_CONFIG, isTestMode } from '@/lib/checkout-config';
import { packContext } from '@/lib/order-notes';
import { readClientIp, readClientUserAgent } from '@/lib/request-signals';

/**
 * Creates the Razorpay order the browser then pays.
 *
 * Called with the Razorpay REST API over fetch rather than the `razorpay` npm
 * package: order creation is one authenticated POST, and avoiding the package
 * keeps a dependency (and its transitive tree) out of this project.
 *
 * THE NOTES ARE THE POINT. Everything Meta needs to match the eventual
 * Purchase to a person and a campaign is written into the order here, because
 * the webhook that fires Purchase receives only what Razorpay stores. Signals
 * not written now are gone by then: the buyer may complete inside a bank app
 * and never return to a page that could report them.
 *
 * This is ALSO the last request the buyer's own browser makes before the
 * payment sheet takes over, which makes it the only honest place to read their
 * IP and user agent. The webhook that fires Purchase is a request from
 * Razorpay, so reading those headers there would record Razorpay's server as
 * the buyer's device. See lib/request-signals.ts.
 *
 * Razorpay allows 15 note keys at 256 chars each and REJECTS the order if
 * either limit is passed, so the machine-readable half of the record is packed
 * into chunked keys by lib/order-notes.ts rather than spread one field per key.
 */

const truncate = (v: unknown, max = 256) => {
  const s = v == null ? '' : String(v);
  return s.length > max ? s.slice(0, max) : s;
};

export async function POST(req: Request) {
  const { keyId, keySecret } = CHECKOUT_CONFIG.razorpay;
  if (!keyId || !keySecret) {
    console.error('[create-order] Razorpay keys not configured');
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

  const utm = (body.utm ?? {}) as Record<string, string | undefined>;

  /* Identity and timestamp for the fulfilment record. Generated HERE, not in
     the webhook: `created_at` must mean "when this person submitted their
     details", and a webhook stamp would instead record when Razorpay got round
     to calling us, which for a UPI payment can be minutes later. */
  const leadId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  /* Read from headers, never from the request body: the browser cannot know
     its own IP, and a user agent sent up in JSON is trivially forged. */
  const clientIp = readClientIp(req);
  const clientUserAgent = readClientUserAgent(req);

  /* FIVE READABLE KEYS + TEN CHUNK KEYS = the 15 Razorpay allows, exactly.
     Nothing further can be added at this level; new fields go into the packed
     context instead, which has headroom. */
  const notes: Record<string, string> = {
    kind: 'peeyush_5day_health_reset',
    lead_id: leadId,
    name: truncate(`${firstName} ${lastName}`.trim()),
    email: truncate(email),
    phone: truncate(phone),
    ...packContext({
      createdAt,
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
      utmId: truncate(utm.id, 100),
      fbclid: truncate(body.fbclid, 200),
      referrer: truncate(body.referrer, 200),
      landingUrl: truncate(body.landingUrl, 300),
      /* Meta's dynamic ad parameters. They cost nothing on an organic visit
         (empty fields are stripped before the context is packed) and they are
         the only way a fulfilment row can be joined back to a specific ad
         without matching on a campaign NAME, which changes under the media
         buyer's hands. */
      adId: truncate(body.adId, 32),
      adsetId: truncate(body.adsetId, 32),
      campaignId: truncate(body.campaignId, 32),
      placement: truncate(body.placement, 48),
      siteSourceName: truncate(body.siteSourceName, 32),
    }),
  };

  /* A rejected order is an unpaid buyer, so the cap is asserted rather than
     assumed. packContext cannot exceed ten keys by construction; this catches
     the case where someone adds a sixth readable key above. */
  if (Object.keys(notes).length > 15) {
    console.error('[create-order] notes over Razorpay 15-key cap', Object.keys(notes).length);
  }

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: CHECKOUT_CONFIG.amountPaise,
        currency: CHECKOUT_CONFIG.currency,
        /* THIS CLIENT'S prefix, not the `kz_` one the scaffold was copied from.
           It is what a receipt is searched by in the Razorpay dashboard, so a
           previous client's initials on it sends whoever is reconciling a
           payment looking in the wrong account. Razorpay caps the receipt at
           40 characters; this is 17. */
        receipt: `dpp_${Date.now()}`,
        notes,
      }),
    });

    const order = await res.json();
    if (!res.ok || !order?.id) {
      /* Flattened onto ONE line on purpose. Logging the raw object makes the
         host's log viewer pretty-print it across many lines and truncate the
         tail, which is exactly where Razorpay puts `description` and `field`,
         the only two values that say what was actually wrong. */
      const err = order?.error ?? {};
      /* A 401 is never about the payload, so print the SHAPE of the credentials
         beside it. The key id is publishable by design (it is handed to the
         browser below), and a length plus a trimmed-flag says nothing about the
         secret's value while catching all four causes of a bad pair: mixed
         test/live modes, a stray space or quote pasted into the host's env UI,
         a regenerated secret, and the two values entered the wrong way round. */
      if (res.status === 401) {
        console.error(
          `[create-order] auth shape keyIdPrefix=${keyId.slice(0, 9)} ` +
            `keyIdLen=${keyId.length} (expect 23) secretLen=${keySecret.length} (expect 24) ` +
            `keyIdClean=${keyId === keyId.trim()} secretClean=${keySecret === keySecret.trim()} ` +
            `secretLooksLikeKeyId=${keySecret.startsWith('rzp_')}`,
        );
      }
      console.error(
        `[create-order] razorpay rejected http=${res.status} code=${err.code ?? '?'} ` +
          `step=${err.step ?? '?'} field=${err.field ?? '-'} desc=${err.description ?? JSON.stringify(order)}`,
      );
      return NextResponse.json({ ok: false, reason: 'gateway' }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      leadId,
      isTest: isTestMode(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId, // publishable by design: the browser needs it to open the sheet
    });
  } catch (e) {
    console.error('[create-order] failed', e);
    return NextResponse.json({ ok: false, reason: 'network' }, { status: 502 });
  }
}

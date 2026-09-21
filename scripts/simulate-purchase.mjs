/**
 * End-to-end test of the fulfilment hand-off, without paying anyone.
 *
 *   node scripts/simulate-purchase.mjs        # or: npm run test:purchase
 *
 * What it does, in order:
 *
 *   1. POSTs a realistic buyer — complete with UTMs, an fbclid, Meta ad ids
 *      and a referrer — to the running dev server's /api/razorpay/create-order.
 *      That creates a REAL order in your Razorpay TEST account, with the
 *      context packed into its notes exactly as a real buyer's would be.
 *
 *   2. Builds the `payment.captured` event Razorpay would send for that order,
 *      signs it with RAZORPAY_WEBHOOK_SECRET the way Razorpay signs its own,
 *      and POSTs it to /api/razorpay/webhook.
 *
 *   3. Prints what came back.
 *
 * ── WHY THIS IS A REAL TEST AND NOT A MOCK ───────────────────────────────
 * The order in step 1 genuinely exists in Razorpay. So when the webhook
 * fetches it back by id to recover the buyer context, that fetch is a real
 * authenticated call against a real order. THAT round trip is the thing that
 * was broken and the thing worth testing: it proves the notes were written,
 * survived, and could be read back. A hand-written notes object would prove
 * nothing.
 *
 * The payment ID is invented, because creating a real one needs a human at a
 * payment sheet. Nothing downstream requires it to exist — it is an idempotency
 * key for Meta and a transaction id for GA4.
 *
 * ── SAFETY ───────────────────────────────────────────────────────────────
 * Refuses to run against live keys. Creating unpaid orders is harmless, but
 * this also fires the real Pabbly URL if one is configured, and an automated
 * fake buyer landing in a live onboarding sheet is a mess to unpick.
 */

import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv[2] ?? 'http://localhost:3000';

const RED = '\u001b[31m';
const GREEN = '\u001b[32m';
const YELLOW = '\u001b[33m';
const DIM = '\u001b[2m';
const BOLD = '\u001b[1m';
const OFF = '\u001b[0m';

const die = (msg) => {
  console.error(`${RED}${BOLD}✗ ${msg}${OFF}`);
  process.exit(1);
};

/* A deliberately minimal .env parser: enough for KEY=value, comments and
   blank lines, which is all this file has. Avoids a dependency and avoids
   requiring a --env-file flag that differs between node versions. */
function loadEnv() {
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
  } catch {
    die('.env.local not found. Fill in the Razorpay test keys first.');
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const keyId = env.RAZORPAY_KEY_ID ?? '';
const secret = env.RAZORPAY_WEBHOOK_SECRET ?? '';

if (!keyId || keyId.includes('PASTE')) {
  die(
    'RAZORPAY_KEY_ID is not filled in .env.local.\n' +
      '  Razorpay Dashboard → switch to Test Mode → Account & Settings →\n' +
      '  API Keys → Generate Test Key.',
  );
}
if (!keyId.startsWith('rzp_test_')) {
  die(
    `RAZORPAY_KEY_ID is "${keyId.slice(0, 12)}…", which is not a test key.\n` +
      '  This script refuses to run against live credentials.',
  );
}
if (!secret) die('RAZORPAY_WEBHOOK_SECRET is empty in .env.local.');

/* A buyer who arrived from a Meta ad with every parameter populated, so that
   an empty column in the output means a bug and never "nothing was sent". */
const landing =
  'http://localhost:3000/?utm_source=facebook&utm_medium=paid_social' +
  '&utm_campaign=health_reset_oct&utm_content=carousel_v3&utm_term=weight_loss' +
  '&utm_id=120209876543210' +
  '&ad_id=120210000000001&adset_id=120210000000002&campaign_id=120210000000003' +
  '&placement=Instagram_Stories&site_source_name=ig' +
  '&fbclid=IwAR3TESTfbclidvalueforlocaltesting1234567890abcdef';

const buyer = {
  firstName: 'Test',
  lastName: 'Buyer',
  email: 'test.buyer@example.com',
  phone: '919876543210',
  city: 'Pune',
  country: 'in',
  occupation: 'working_professional',
  externalId: crypto.randomUUID(),
  gaClientId: '1234567890.1699999999',
  fbc: `fb.1.${Date.now()}.IwAR3TESTfbclidvalueforlocaltesting1234567890abcdef`,
  fbp: `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`,
  fbclid: 'IwAR3TESTfbclidvalueforlocaltesting1234567890abcdef',
  referrer: 'https://l.facebook.com/',
  landingUrl: landing,
  adId: '120210000000001',
  adsetId: '120210000000002',
  campaignId: '120210000000003',
  placement: 'Instagram_Stories',
  siteSourceName: 'ig',
  utm: {
    source: 'facebook',
    medium: 'paid_social',
    campaign: 'health_reset_oct',
    content: 'carousel_v3',
    term: 'weight_loss',
    id: '120209876543210',
  },
};

console.log(`${BOLD}1/3  Creating a real test order…${OFF}`);

let order;
try {
  const res = await fetch(`${BASE}/api/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      /* So the webhook has a plausible buyer IP and UA to carry, the same way
         a browser's request would supply them. */
      'user-agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram',
      'x-forwarded-for': '49.36.180.24',
    },
    body: JSON.stringify(buyer),
  });
  order = await res.json();
  if (!res.ok || !order?.ok) {
    die(
      `create-order failed (HTTP ${res.status}): ${JSON.stringify(order)}\n` +
        '  Is the dev server running (npm run dev) and are the test keys valid?',
    );
  }
} catch (e) {
  die(`could not reach ${BASE}. Is the dev server running?\n  ${e.message}`);
}

console.log(
  `     ${GREEN}✓${OFF} order ${BOLD}${order.orderId}${OFF} ` +
    `for ${order.amount} paise (₹${order.amount / 100}) · isTest=${order.isTest}\n` +
    `     ${DIM}lead_id ${order.leadId}${OFF}`,
);

if (order.amount !== 100) {
  console.log(
    `     ${YELLOW}note: amount is ₹${order.amount / 100}, not ₹1. ` +
      `Set NEXT_PUBLIC_PRICE_RUPEES=1 and restart the dev server.${OFF}`,
  );
}

console.log(`\n${BOLD}2/3  Signing a payment.captured event for it…${OFF}`);

const paymentId = `pay_TEST${crypto.randomBytes(6).toString('hex')}`;
const nowUnix = Math.floor(Date.now() / 1000);

/* Shaped exactly like Razorpay's documented payload, INCLUDING the empty
   `notes: []` on the payment entity. That empty array is the bug this whole
   pass is about: leave it as it really arrives, so the test proves the context
   is recovered from the ORDER and not accidentally read from here. */
const event = {
  entity: 'event',
  account_id: 'acc_TEST00000000',
  event: 'payment.captured',
  contains: ['payment'],
  payload: {
    payment: {
      entity: {
        id: paymentId,
        entity: 'payment',
        amount: order.amount,
        currency: order.currency,
        status: 'captured',
        order_id: order.orderId,
        invoice_id: null,
        international: false,
        method: 'upi',
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        description: '5-Day Complete Health Reset Challenge',
        card_id: null,
        bank: null,
        wallet: null,
        vpa: 'testbuyer@okhdfcbank',
        email: buyer.email,
        contact: `+${buyer.phone}`,
        notes: [],
        fee: Math.round(order.amount * 0.0236),
        tax: Math.round(order.amount * 0.0036),
        error_code: null,
        error_description: null,
        acquirer_data: {
          rrn: String(Math.floor(Math.random() * 1e12)).padStart(12, '0'),
          upi_transaction_id: crypto.randomBytes(16).toString('hex').toUpperCase(),
        },
        created_at: nowUnix,
      },
    },
  },
};

const raw = JSON.stringify(event);
const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex');
console.log(`     ${GREEN}✓${OFF} payment ${BOLD}${paymentId}${OFF} signed`);

console.log(`\n${BOLD}3/3  Delivering it to the webhook…${OFF}`);

const res = await fetch(`${BASE}/api/razorpay/webhook`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-razorpay-signature': signature,
  },
  body: raw,
});

const out = await res.json().catch(() => ({}));

console.log(`     HTTP ${res.status} ${JSON.stringify(out)}`);

if (res.status === 401) {
  die(
    'signature rejected. RAZORPAY_WEBHOOK_SECRET in .env.local does not match\n' +
      '  the one the running server loaded — restart the dev server after editing it.',
  );
}

if (!res.ok) die('webhook returned a non-200.');

console.log(
  `\n${GREEN}${BOLD}Delivered.${OFF} ` +
    `${out.pabbly === 'sent' ? `${GREEN}Pabbly received the payload${OFF}` : `${YELLOW}Pabbly skipped — is PABBLY_WEBHOOK_URL set and the echo server running?${OFF}`}\n` +
    `${DIM}Read the full payload in the echo server's terminal, and check the ` +
    `dev server log for the [rzp-webhook] line: ctx=ok means the buyer context ` +
    `was recovered from the order.${OFF}`,
);

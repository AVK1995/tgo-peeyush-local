import crypto from 'crypto';

/**
 * Instamojo, the gateway primitives.
 *
 * Everything here follows the transcribed reference in INSTAMOJO-API.md at the
 * root of this project, which was taken from Instamojo's own documentation.
 * Nothing in this file is inferred from how another gateway behaves, because
 * Instamojo differs from Razorpay in three structural ways and each one changes
 * a decision:
 *
 *   1. It is a REDIRECT gateway, not a modal. Creating a payment request
 *      returns a `longurl`, and the buyer is sent to it. There is no sheet over
 *      our own checkout and no in-page success callback.
 *   2. There is no `notes` object and no custom fields. See
 *      lib/payment-context.ts for what carries the buyer context instead.
 *   3. Amounts are in RUPEES, bounded to 9 minimum and 200000 maximum.
 */

const HOSTS = {
  live: {
    token: 'https://api.instamojo.com/oauth2/token/',
    api: 'https://api.instamojo.com/v2/',
  },
  test: {
    token: 'https://test.instamojo.com/oauth2/token/',
    api: 'https://test.instamojo.com/v2/',
  },
} as const;

export type InstamojoEnv = keyof typeof HOSTS;

/**
 * The access token, cached in module scope.
 *
 * Application-based auth is OAuth2 client credentials and the token lives for
 * ten hours, so fetching one per payment would add a round trip to every
 * checkout for nothing. It is refreshed five minutes before it expires rather
 * than on the first 401: refreshing on failure means one buyer eats the error
 * every ten hours, and that buyer is mid-payment.
 *
 * A serverless cold start simply starts with an empty cache and fetches one,
 * which is correct, just not cached. Keyed by environment so a test and a live
 * deployment cannot share one entry.
 */
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getAccessToken(params: {
  clientId: string;
  clientSecret: string;
  env: InstamojoEnv;
}): Promise<string> {
  const cacheKey = `${params.env}:${params.clientId}`;
  const hit = tokenCache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.token;

  const res = await fetch(HOSTS[params.env].token, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: params.clientId,
      client_secret: params.clientSecret,
    }).toString(),
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!res.ok || !json.access_token) {
    /* One line, deliberately: a host's log viewer pretty-prints an object
       across many lines and truncates the tail, which is where the reason
       lives. The credential SHAPE is printed beside a 401 because that is
       never a payload problem: it catches a swapped id and secret, a stray
       space pasted into a host's env UI, and test credentials pointed at the
       live host. Neither value itself is logged. */
    if (res.status === 401 || res.status === 400) {
      console.error(
        `[instamojo] auth shape env=${params.env} idLen=${params.clientId.length} ` +
          `secretLen=${params.clientSecret.length} ` +
          `idClean=${params.clientId === params.clientId.trim()} ` +
          `secretClean=${params.clientSecret === params.clientSecret.trim()}`,
      );
    }
    throw new Error(
      `instamojo-token http=${res.status} error=${json.error ?? 'unknown'}`,
    );
  }

  const ttlMs = Math.max(60, Number(json.expires_in ?? 36000)) * 1000;
  tokenCache.set(cacheKey, {
    token: json.access_token,
    /* Five minutes of slack, so a token never expires between being read here
       and being used by the API call two lines later. */
    expiresAt: Date.now() + ttlMs - 5 * 60 * 1000,
  });
  return json.access_token;
}

export type CreatePaymentRequestInput = {
  clientId: string;
  clientSecret: string;
  env: InstamojoEnv;
  /** RUPEES. Not paise. Instamojo bounds this to 9 minimum, 200000 maximum. */
  amountRupees: number;
  /** 30 characters maximum, and the buyer reads it on the payment page. */
  purpose: string;
  buyerName: string;
  email: string;
  phone: string;
  redirectUrl: string;
  webhookUrl: string;
};

export type CreatePaymentRequestResult =
  | { ok: true; id: string; payUrl: string }
  | { ok: false; status: number; detail: string };

/**
 * Create the payment request the buyer is then redirected to.
 *
 * `allow_repeated_payments` is false: one link, one payment. Left true, a
 * shared or bookmarked link can be paid twice and the second payment arrives
 * with no seat behind it.
 *
 * `send_email` is false because the fulfilment mail is Pabbly's job and it
 * carries the WhatsApp invite, which Instamojo's receipt does not.
 *
 * `expires_at` is deliberately NOT set. The maximum it accepts is ten minutes
 * out, and a buyer who opens a bank app, authenticates and comes back in
 * eleven is a lost sale for no gain.
 */
export async function createPaymentRequest(
  input: CreatePaymentRequestInput,
): Promise<CreatePaymentRequestResult> {
  try {
    const token = await getAccessToken(input);

    const body = new URLSearchParams({
      amount: String(input.amountRupees),
      purpose: input.purpose.slice(0, 30),
      buyer_name: input.buyerName.slice(0, 100),
      email: input.email,
      phone: input.phone,
      redirect_url: input.redirectUrl,
      webhook: input.webhookUrl,
      allow_repeated_payments: 'False',
      send_email: 'False',
    });

    const res = await fetch(`${HOSTS[input.env].api}payment_requests/`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof json.id === 'string' ? json.id : '';
    const payUrl = typeof json.longurl === 'string' ? json.longurl : '';

    if (!res.ok || !id || !payUrl) {
      return {
        ok: false,
        status: res.status,
        detail: JSON.stringify(json).slice(0, 500),
      };
    }
    return { ok: true, id, payUrl };
  } catch (e) {
    return { ok: false, status: 0, detail: String(e).slice(0, 500) };
  }
}

/**
 * Three states, not a boolean, and the third one is the important one.
 *
 *   'paid'      the gateway names this payment and calls it Credit.
 *   'not-paid'  the gateway names this payment and calls it something else.
 *               This is the ONLY answer that justifies turning a buyer away.
 *   'unknown'   we could not get a clear answer: the call failed, or the
 *               request carries no matching payment yet.
 *
 * A boolean would collapse 'unknown' into 'not-paid', and that collapse is
 * expensive in exactly one direction: a payment record does not always appear
 * against the request the instant the browser is redirected, and the response
 * shape is documented as liable to grow. Either would tell a buyer who has
 * just paid that their payment failed. Being unsure must never read as no.
 */
export type PaymentVerdict = 'paid' | 'not-paid' | 'unknown';

export type PaymentRequestStatus = {
  verdict: PaymentVerdict;
  amountRupees: number;
  detail: string;
};

/**
 * Confirm a redirect server-side.
 *
 * A buyer arriving back on the redirect URL with `payment_status=Credit` is a
 * CLAIM made by a browser, and the query string is theirs to edit. This asks
 * Instamojo what actually happened before a confirmation page is shown.
 *
 * It is not what reports the sale. The webhook does that, because most buyers
 * here pay by UPI and never come back to be asked.
 */
export async function getPaymentRequest(params: {
  clientId: string;
  clientSecret: string;
  env: InstamojoEnv;
  paymentRequestId: string;
  paymentId: string;
}): Promise<PaymentRequestStatus> {
  try {
    const token = await getAccessToken(params);
    const res = await fetch(
      `${HOSTS[params.env].api}payment_requests/${encodeURIComponent(
        params.paymentRequestId,
      )}/`,
      { headers: { authorization: `Bearer ${token}` } },
    );

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { verdict: 'unknown', amountRupees: 0, detail: `http=${res.status}` };
    }

    /* Parsed defensively rather than destructured: the docs warn the payload
       may grow, and the payments array is the part most likely to change
       shape. An unrecognised shape yields no match, which is 'unknown'. */
    const payments = Array.isArray(json.payments)
      ? (json.payments as Array<Record<string, unknown>>)
      : [];
    const match = payments.find(
      (p) => String(p.payment_id ?? p.id ?? '') === params.paymentId,
    );

    if (!match) {
      return {
        verdict: 'unknown',
        amountRupees: Number(json.amount ?? 0),
        detail: `no-matching-payment in=${payments.length}`,
      };
    }

    const status = String(match.status ?? '');
    return {
      verdict: status.toLowerCase() === 'credit' ? 'paid' : 'not-paid',
      amountRupees: Number(match.amount ?? json.amount ?? 0),
      detail: status || 'no-status',
    };
  } catch (e) {
    return { verdict: 'unknown', amountRupees: 0, detail: String(e).slice(0, 200) };
  }
}

/**
 * Verify a webhook's `mac`.
 *
 * Instamojo's algorithm, from its own documentation: drop `mac` from the
 * posted fields, sort what remains BY KEY, join the VALUES (not the pairs)
 * with a pipe, and HMAC-SHA1 that string with the account's private salt,
 * compared as a hex digest.
 *
 * Note SHA1 and hex, where Razorpay's webhook was SHA256 over the raw body.
 * The comparison is constant-time regardless, after a length check, because
 * timingSafeEqual throws on buffers of unequal length.
 *
 * The field list is read from whatever was posted rather than from a fixed
 * shape, which is what keeps this correct when Instamojo adds a field: the
 * docs say explicitly that they may.
 */
export function verifyWebhookMac(
  fields: Record<string, string>,
  salt: string,
): boolean {
  if (!salt) return false;
  const provided = fields.mac ?? '';
  if (!provided) return false;

  const message = Object.keys(fields)
    .filter((k) => k !== 'mac')
    .sort()
    .map((k) => fields[k] ?? '')
    .join('|');

  const expected = crypto
    .createHmac('sha1', salt)
    .update(message)
    .digest('hex');

  const a = Buffer.from(provided.toLowerCase());
  const b = Buffer.from(expected.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Read a form-encoded webhook body into a flat object.
 *
 * Instamojo posts `application/x-www-form-urlencoded`, NOT JSON, which is the
 * detail most likely to be missed when porting a webhook from a gateway that
 * posts JSON: `await req.json()` throws, the route 500s, and the gateway
 * retries a payment that was fine.
 *
 * Repeated keys take the last value, which is what a dict-based reference
 * implementation does, so the mac is computed over the same string the sender
 * computed it over.
 */
export function parseFormBody(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(raw).entries()) out[k] = v;
  return out;
}

import crypto from 'crypto';

/**
 * The buyer context carrier, for a gateway that has nowhere to put one.
 *
 * ── The problem ───────────────────────────────────────────────────────────
 * Razorpay had a `notes` object on the order: fifteen key-value pairs that the
 * webhook received back verbatim. That is what carried `fbp`, `fbc`, the
 * buyer's IP, their user agent, the GA4 client id and the campaign to the one
 * request where a payment is proven, with no database anywhere.
 *
 * Instamojo has NO notes object and no custom fields. Its own documentation
 * says to "store and maintain any custom fields for a payment request at your
 * end". The only field that travels with a payment request is `purpose`, and
 * that is thirty characters and shown to the buyer.
 *
 * Without a carrier, a webhook-fired Purchase would arrive with the buyer's
 * email, phone and name and nothing else: no fbp, no fbc, no IP, no user
 * agent, no GA4 client id (so the GA4 revenue lands in an unattributed
 * session), no city, no occupation, and no campaign at all, which means every
 * paid sale reports as organic and lib/attribution.ts exists for nothing.
 *
 * ── The carrier ───────────────────────────────────────────────────────────
 * The `webhook` URL is set PER PAYMENT REQUEST, in the same call that creates
 * it. So the URL itself is the carrier: the context is sealed into a compact
 * token and appended as `?c=<token>`, and Instamojo POSTs back to that exact
 * URL, query string included. The `mac` is computed over the posted FIELDS, so
 * a query string on the URL does not disturb verification.
 *
 * SEALED, not merely signed. AES-256-GCM, keyed from the account's private
 * salt. Two reasons, and both matter:
 *
 *   1. Confidentiality. The token holds the buyer's name, email, city and IP,
 *      and it is stored on Instamojo's payment-request record where it is
 *      visible to anyone with dashboard access. Encrypting it means the
 *      gateway stores an opaque string rather than a readable profile.
 *   2. Authenticity. The webhook `mac` proves the POSTED BODY came from
 *      Instamojo; it says nothing about the URL it was posted to. Anyone who
 *      learns the webhook path could replay a genuine payload with their own
 *      `c=` value and write whatever context they liked into our Meta and
 *      Pabbly records. GCM's tag makes a forged or edited token fail to open.
 *
 * ── The limit nobody documents ────────────────────────────────────────────
 * Razorpay's notes limit was published and it REJECTED rather than truncated.
 * Instamojo publishes no length limit for the `webhook` field at all, which is
 * worse: an unknown limit cannot be designed against, it can only be survived.
 * So two things protect the buyer:
 *
 *   - the token is capped at MAX_TOKEN and fields are sacrificed in a declared
 *     order until it fits, exactly as the Razorpay packer did;
 *   - the create-payment route retries ONCE with a bare webhook URL if the
 *     request is rejected. Reduced match quality is a cost we can absorb; a
 *     buyer who cannot pay is not.
 *
 * base64URL, not plain base64, and that is not a detail. Plain base64 produces
 * `+`, `/` and `=`, all three of which change meaning inside a query string
 * and any one of which a gateway could normalise, re-encode or strip while
 * storing and replaying the URL. base64url produces only `A-Z a-z 0-9 - _`,
 * which survives a round trip through somebody else's URL handling unchanged.
 *
 * WHAT IS LOST relative to the Razorpay notes: the five human-readable keys
 * that let someone open a payment in the dashboard and see who it belonged to.
 * Instamojo shows the buyer's name, email and phone on the payment itself, so
 * that need is met by the gateway rather than by us, and the token can be
 * wholly opaque.
 */

/** Everything the webhook will need that the webhook cannot see for itself. */
export type OrderContext = {
  createdAt: string; // ISO 8601, stamped when the buyer submitted the form
  leadId: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string; // ISO 3166-1 alpha-2, lowercase
  occupation: string;
  externalId: string;
  fbc: string;
  fbp: string;
  gaCid: string;
  clientIp: string;
  clientUserAgent: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
};

export const EMPTY_CONTEXT: OrderContext = {
  createdAt: '',
  leadId: '',
  firstName: '',
  lastName: '',
  city: '',
  country: '',
  occupation: '',
  externalId: '',
  fbc: '',
  fbp: '',
  gaCid: '',
  clientIp: '',
  clientUserAgent: '',
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
  utmTerm: '',
  fbclid: '',
  referrer: '',
  landingUrl: '',
};

/* The sealed token's character budget. The webhook URL it hangs off is around
   sixty characters, so a 1,400-character token keeps the whole URL under
   1,500: comfortably inside the 2,048 that every server and proxy in the chain
   handles without argument, and short enough that an undocumented gateway-side
   cap is unlikely to be met. A typical real buyer seals to 700 to 1,100. */
const MAX_TOKEN = 1400;

/* Per-field caps applied BEFORE sealing. Chosen from real values: a user agent
   is typically 110-180 characters, a landing url with campaign params 200-400,
   an fbclid 90-160. Anything over its cap is truncated rather than dropped,
   because a truncated user agent still contributes to a device match while a
   missing one contributes nothing.

   The order of this list is also the ORDER OF SACRIFICE: if the sealed token
   is still over budget, these are emptied from the top down until it fits. The
   user agent goes first because Meta can partially infer the device from the
   IP; the landing url goes last because it is the only record of which page
   the buyer actually arrived on. */
const SACRIFICE: Array<[keyof OrderContext, number]> = [
  ['clientUserAgent', 256],
  ['referrer', 200],
  ['fbclid', 200],
  ['landingUrl', 300],
];

const OTHER_CAPS: Partial<Record<keyof OrderContext, number>> = {
  leadId: 64,
  firstName: 80,
  lastName: 80,
  city: 80,
  country: 2,
  occupation: 32,
  externalId: 64,
  fbc: 255,
  fbp: 128,
  gaCid: 64,
  clientIp: 45,
  utmSource: 100,
  utmMedium: 100,
  utmCampaign: 100,
  utmContent: 100,
  utmTerm: 100,
};

function applyCaps(ctx: OrderContext): OrderContext {
  const out = { ...ctx };
  for (const [k, max] of SACRIFICE) out[k] = String(out[k] ?? '').slice(0, max);
  for (const [k, max] of Object.entries(OTHER_CAPS)) {
    const key = k as keyof OrderContext;
    out[key] = String(out[key] ?? '').slice(0, max as number);
  }
  return out;
}

/* The salt is a shared secret of unknown length and character set, so it is
   run through SHA-256 to produce the fixed 32 bytes AES-256 requires. The
   suffix domain-separates this key from any other use of the same salt, so a
   future feature keyed on it cannot decrypt these tokens by accident. */
function keyFrom(salt: string): Buffer {
  return crypto.createHash('sha256').update(`${salt}|instamojo-ctx`).digest();
}

const b64url = (b: Buffer) => b.toString('base64url');

/**
 * Seal the context into a URL-safe token.
 *
 * Empty fields are dropped from the JSON entirely and restored from
 * EMPTY_CONTEXT on the way out, which is where most of the headroom comes
 * from: an organic visitor with no campaign params seals to a third of the
 * worst case.
 *
 * Returns '' when there is no salt to key it with, or if it still will not fit
 * after every sacrifice. NEVER throws: the alternative to a thin token is a
 * buyer who cannot pay.
 */
export function sealContext(ctx: OrderContext, salt: string): string {
  if (!salt) return '';
  try {
    const key = keyFrom(salt);
    const capped = applyCaps(ctx);

    const seal = (c: OrderContext): string => {
      const json = JSON.stringify(
        Object.fromEntries(
          Object.entries(c).filter(([, v]) => v !== '' && v != null),
        ),
      );
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const body = Buffer.concat([
        cipher.update(json, 'utf8'),
        cipher.final(),
      ]);
      /* iv (12) || tag (16) || ciphertext, one base64url string. */
      return b64url(Buffer.concat([iv, cipher.getAuthTag(), body]));
    };

    let token = seal(capped);
    const working = { ...capped };
    for (const [k] of SACRIFICE) {
      if (token.length <= MAX_TOKEN) break;
      working[k] = '';
      token = seal(working);
    }

    return token.length <= MAX_TOKEN ? token : '';
  } catch {
    return '';
  }
}

/**
 * Open a sealed token.
 *
 * Any failure at all (no salt, a forged token, a truncated one, a rotated
 * salt) returns EMPTY_CONTEXT field by field rather than throwing or
 * returning undefined. The webhook that calls this must return 200 or the
 * gateway retries it and the sale is counted twice, and the Pabbly payload
 * promises every key on every call.
 */
export function openContext(token: string, salt: string): OrderContext {
  if (!token || !salt) return { ...EMPTY_CONTEXT };
  try {
    const raw = Buffer.from(token, 'base64url');
    if (raw.length < 29) return { ...EMPTY_CONTEXT };
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const body = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyFrom(salt), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([
      decipher.update(body),
      decipher.final(),
    ]).toString('utf8');
    const parsed = JSON.parse(json) as Partial<OrderContext>;
    return { ...EMPTY_CONTEXT, ...parsed };
  } catch {
    return { ...EMPTY_CONTEXT };
  }
}

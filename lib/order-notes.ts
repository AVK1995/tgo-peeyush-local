/**
 * The order-notes carrier: everything the webhook will need, packed to fit
 * inside a Razorpay order.
 *
 * The constraint is hard and unforgiving: Razorpay accepts a MAXIMUM OF 15
 * note key-value pairs, each value at most 256 characters, and exceeding
 * either REJECTS THE ORDER outright. It does not drop the extra note and
 * carry on. So a naive "one key per field" layout runs out of room at exactly
 * the moment the payload grows, and it fails at the till, for the buyer,
 * rather than in a log.
 *
 * A flat layout was at 14 of 15 keys with a single slot spare, which was
 * already a design that could not accept another field. The fulfilment
 * hand-off needs twenty-five, including a user agent and a landing url that
 * are individually longer than one note.
 *
 * So the layout is five READABLE keys, for whoever opens the payment in the
 * Razorpay dashboard at 11pm trying to work out who a refund belongs to:
 *
 *     kind, lead_id, name, email, phone
 *
 * ...and ten CHUNK keys, `x0` through `x9`, holding one JSON object sliced
 * into 256-character pieces. 2,560 characters of carrier, against a worst
 * case near 1,600 once every field is at its cap, so there is real headroom
 * rather than a slot.
 *
 * The chunks are opaque in the dashboard, which is the price paid, and it is
 * why the five human fields stay outside them.
 *
 * THIS FILE IS THE REASON RAZORPAY NEEDS NO OTHER CARRIER. It was deleted
 * during the Instamojo pass, because that gateway has no notes object and the
 * context had to ride in an encrypted token on the webhook URL instead. With
 * Razorpay back, the order itself carries the context again: no encryption, no
 * URL length gamble, and the five human keys are readable in the dashboard.
 */

/** The machine-readable half of the order, carried in `x0`..`x9`. */
export type OrderContext = {
  createdAt: string; // ISO 8601, stamped when the order was created
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

const CHUNK_SIZE = 256;
const MAX_CHUNKS = 10; // x0..x9, alongside the five readable keys = 15 total

/* Per-field caps applied BEFORE serialising. Chosen from real values: a user
   agent is typically 110-180 chars, a landing url with campaign params 200-400,
   an fbclid 90-160. Anything over its cap is truncated rather than dropped,
   because a truncated user agent still contributes to a device match while a
   missing one contributes nothing.

   The order of this list is also the order of sacrifice: if the packed object
   still will not fit, fields are emptied from the top down until it does. The
   user agent goes first because Meta can partially infer the device from the
   IP; the landing url goes last because it is the only record of which page
   the buyer actually arrived on. */
const CAPS: Array<[keyof OrderContext, number]> = [
  ['clientUserAgent', 256],
  ['referrer', 200],
  ['fbclid', 200],
  ['landingUrl', 300],
];

const OTHER_CAPS: Partial<Record<keyof OrderContext, number>> = {
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
  for (const [k, max] of CAPS) out[k] = String(out[k] ?? '').slice(0, max);
  for (const [k, max] of Object.entries(OTHER_CAPS)) {
    const key = k as keyof OrderContext;
    out[key] = String(out[key] ?? '').slice(0, max as number);
  }
  return out;
}

function chunk(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += CHUNK_SIZE) {
    out.push(s.slice(i, i + CHUNK_SIZE));
  }
  return out;
}

/**
 * Serialise the context into `x0`..`x9`.
 *
 * Empty fields are omitted from the JSON entirely (`unpackContext` restores
 * them from EMPTY_CONTEXT) which is where most of the headroom comes from: an
 * organic visitor with no campaign params packs into two chunks, not ten.
 *
 * Never throws and never returns more than MAX_CHUNKS keys, because the
 * alternative to a lossy note is a rejected order and an unpaid buyer.
 */
export function packContext(ctx: OrderContext): Record<string, string> {
  const capped = applyCaps(ctx);

  const serialise = (c: OrderContext) =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(c).filter(([, v]) => v !== '' && v != null),
      ),
    );

  let chunks = chunk(serialise(capped));

  /* Still too big: drop the sacrificial fields in order until it fits. */
  const working = { ...capped };
  for (const [k] of CAPS) {
    if (chunks.length <= MAX_CHUNKS) break;
    working[k] = '';
    chunks = chunk(serialise(working));
  }

  const notes: Record<string, string> = {};
  chunks.slice(0, MAX_CHUNKS).forEach((c, i) => {
    notes[`x${i}`] = c;
  });
  return notes;
}

/**
 * Reassemble the context from a Razorpay `notes` object.
 *
 * Falls back to EMPTY_CONTEXT field by field, so a malformed or partially
 * written blob yields empty strings rather than undefined: the Pabbly payload
 * promises every key on every call, and `undefined` would break that promise
 * by disappearing from the JSON.
 */
export function unpackContext(notes: Record<string, unknown>): OrderContext {
  let raw = '';
  for (let i = 0; i < MAX_CHUNKS; i += 1) {
    const part = notes[`x${i}`];
    if (typeof part !== 'string' || !part) break;
    raw += part;
  }
  if (!raw) return { ...EMPTY_CONTEXT };
  try {
    const parsed = JSON.parse(raw) as Partial<OrderContext>;
    return { ...EMPTY_CONTEXT, ...parsed };
  } catch {
    /* A truncated blob is unparseable. Better an empty context than a throw
       inside a webhook that must return 200 or be retried. */
    return { ...EMPTY_CONTEXT };
  }
}

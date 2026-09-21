/**
 * Fetch an order back from Razorpay, because the webhook is not given one.
 *
 * ── THE BUG THIS FILE EXISTS TO FIX ──────────────────────────────────────
 *
 * `app/api/razorpay/create-order` writes the entire buyer context into the
 * ORDER's `notes`. The webhook then read `payload.payment.entity.notes` and
 * assumed Razorpay returned it "verbatim".
 *
 * It does not. Razorpay keeps order notes and payment notes as SEPARATE
 * fields on separate entities, and the `payment.captured` payload carries
 * only the payment entity. Its `notes` is `[]` — an empty ARRAY, not even an
 * object — unless notes were passed again in the browser's checkout options,
 * which they are not (and should not be: anything the browser supplies is
 * forgeable).
 *
 * Razorpay's own docs state it outright: "This payload only contains the
 * payment entity". See https://razorpay.com/docs/webhooks/orders/ — the
 * `payment.captured` sample literally shows `"notes": []`.
 *
 * So every sale reached Pabbly with a blank created_at, blank name, blank
 * city, blank UTMs, blank fbc/fbp, blank IP and blank user agent. Only the
 * email, phone and amount survived, because those come off the payment entity
 * itself. That is exactly the "webhook data is empty" symptom.
 *
 * ── WHY A SERVER-SIDE FETCH, AND NOT THE OTHER TWO FIXES ─────────────────
 *
 * Option A, pass `notes` into the browser's Razorpay checkout options so they
 * land on the payment: rejected. It puts the attribution record in the
 * buyer's hands, where it can be edited with devtools before it is paid, and
 * it would teach the ad account from forged conversions.
 *
 * Option B, switch the dashboard to the `order.paid` event, whose payload does
 * include the order entity: works, but silently turns a dashboard checkbox
 * into a load-bearing dependency. Anyone re-registering the webhook with the
 * documented `payment.captured` would break fulfilment again with no error.
 *
 * This route is authoritative (it is Razorpay's own record, keyed by an id
 * Razorpay itself just sent us), unforgeable, and works under EITHER event.
 * The cost is one authenticated GET per sale, on a path that already awaits
 * three outbound calls.
 */

export type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number; // unix seconds
  notes: Record<string, unknown>;
};

/**
 * GET /v1/orders/{id}.
 *
 * Returns null rather than throwing, on every failure path. The caller is a
 * webhook that must answer 200: a non-200 makes Razorpay retry the delivery,
 * and a retry re-fires Meta and GA4 and double-counts the sale. A missing
 * order costs attribution on one row; a thrown error costs a duplicated
 * conversion and a second WhatsApp invite to the same buyer.
 */
export async function fetchRazorpayOrder(
  orderId: string,
  keyId: string,
  keySecret: string,
): Promise<RazorpayOrder | null> {
  if (!orderId || !keyId || !keySecret) return null;

  try {
    const res = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`,
      {
        method: 'GET',
        headers: {
          authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        },
        /* Razorpay's webhook delivery times out at around 5s and retries on a
           timeout. Cap this well under that so a slow orders API degrades to a
           thinner record rather than to a duplicate sale. */
        signal: AbortSignal.timeout(4000),
      },
    );

    if (!res.ok) {
      console.error(
        `[rzp-order] fetch failed http=${res.status} order=${orderId}`,
      );
      return null;
    }

    const order = await res.json();
    if (!order?.id) return null;
    return order as RazorpayOrder;
  } catch (e) {
    console.error(`[rzp-order] fetch threw order=${orderId}`, e);
    return null;
  }
}

/**
 * Razorpay returns `notes: []` (an empty array) when there are none, and an
 * object when there are. Both are `typeof 'object'`, so a naive spread of the
 * array yields `{}` and a naive `Object.keys` on it yields `[]` — neither
 * throws, and the difference is invisible until you look for a key.
 *
 * This normalises both shapes to a plain object, and is the guard that tells
 * "no notes were written" apart from "notes were written and we looked in the
 * wrong entity".
 */
export function asNotes(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return v as Record<string, unknown>;
}

/** True when this notes object actually carries a packed context (`x0`). */
export function hasPackedContext(notes: Record<string, unknown>): boolean {
  return typeof notes.x0 === 'string' && notes.x0.length > 0;
}

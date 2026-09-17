/**
 * The two signals only the SERVER can read honestly: the caller's IP and their
 * user agent.
 *
 * Meta counts `client_ip_address` and `client_user_agent` as match keys, and
 * they are the two that cost the most when missing: an event without them
 * loses the browser-fingerprint half of the match and the EMQ score drops
 * accordingly. The browser cannot supply its own IP, and a user agent sent up
 * in a JSON body is trivially forgeable, so both are taken from the request
 * headers instead, the same way /api/meta/event has always done it.
 *
 * The catch is WHERE they are read. The Razorpay webhook is a request from
 * Razorpay, not from the buyer, so its headers carry Razorpay's IP and
 * Razorpay's agent. Reading them there would ship a confidently wrong value,
 * which is worse for matching than shipping nothing. So they are captured at
 * create-order time, the last request the buyer's own browser makes before the
 * payment sheet takes over, and carried to the webhook inside the order notes.
 * See lib/order-notes.ts.
 *
 * Header order matters. `x-forwarded-for` is a comma-separated chain in which
 * the ORIGINAL client is first and every proxy appends itself; taking the last
 * entry yields the CDN's own address. Vercel's `x-vercel-forwarded-for` and
 * Cloudflare's `cf-connecting-ip` are single-value and already resolved, so
 * they are preferred where present.
 */

const IP_HEADERS = [
  'cf-connecting-ip',
  'x-vercel-forwarded-for',
  'x-real-ip',
] as const;

/** IPv4 dotted quad, or an IPv6 form (possibly with a zone or brackets). */
function looksLikeIp(v: string): boolean {
  if (!v) return false;
  const s = v.replace(/^\[|\]$/g, '');
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(s) || /^[0-9a-f:]+$/i.test(s);
}

export function readClientIp(req: Request): string {
  for (const h of IP_HEADERS) {
    const v = (req.headers.get(h) ?? '').trim();
    if (looksLikeIp(v)) return v;
  }
  /* First entry, not last: the chain reads client → proxy → proxy. */
  const first = (req.headers.get('x-forwarded-for') ?? '')
    .split(',')[0]
    ?.trim();
  return looksLikeIp(first ?? '') ? (first as string) : '';
}

export function readClientUserAgent(req: Request): string {
  return (req.headers.get('user-agent') ?? '').trim();
}

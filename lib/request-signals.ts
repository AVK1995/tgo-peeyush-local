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

/**
 * Read one cookie off the request, server side.
 *
 * ── WHY THIS EXISTS (2026-09-22) ──────────────────────────────────────────
 * /api/razorpay/create-order is a SAME-ORIGIN request from the buyer's own
 * browser, so every cookie that browser holds is already sitting on it. Until
 * this was added the route ignored them and trusted whatever the client chose
 * to put in the JSON body instead.
 *
 * That mattered most for Meta's `_fbc`. If the pixel is blocked, or is still
 * loading, or the in-app browser restricted the storage the client reader uses,
 * the body arrives with no fbc and the click id is lost for good, even though
 * the cookie was right there on the request.
 *
 * This is the trick the SDP build used and the reason its data was cleaner:
 * read the cookie from the request, not from the client's report of it.
 *
 * Deliberately tolerant: a `Cookie` header is `a=1; b=2`, values are commonly
 * percent-encoded, and a malformed escape must yield the raw value rather than
 * throw inside a payment route.
 */
export function readRequestCookie(req: Request, name: string): string {
  const header = req.headers.get('cookie') ?? '';
  if (!header) return '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return '';
}

/**
 * Attribution, the SERVER-SAFE half.
 *
 * THIS FILE HAS NO `'use client'` DIRECTIVE, AND MUST NOT GAIN ONE.
 *
 * Everything here runs where there is no browser: `middleware.ts` at the edge,
 * and the API routes. Its sibling `lib/attribution.ts` is the browser half and
 * IS marked `'use client'`, which is why these functions cannot live there: a
 * `'use client'` module imported from a route handler becomes a client
 * reference, and calling one server-side throws at runtime. That mistake
 * shipped once and returned a 500 from create-order on a live checkout, with
 * the page itself looking perfectly healthy.
 *
 * The dependency runs ONE WAY ONLY: the browser file may import from this one,
 * never the reverse. The shared shape lives here so both halves agree on it.
 */

export const KEY = 'pp_attr';

export type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
};

export const EMPTY: Attribution = {
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
  utmTerm: '',
  fbclid: '',
  referrer: '',
  landingUrl: '',
};

/* ══════════════════════════════════════════════════════════════════════
   THE EDGE LAYER (ported from ResetByShruti, 2026-09-22)
   ----------------------------------------------------------------------
   Everything above this line runs in the BROWSER, from a React effect. That
   is the layer that was losing data, and it loses it in a way that is biased
   against exactly the traffic we pay for.

   On a heavy landing page inside the Instagram or Facebook in-app browser, a
   visitor can tap the CTA and navigate away BEFORE hydration runs the capture
   above. localStorage is also the first thing those browsers restrict. Either
   way the campaign, the landing url and the referrer are gone by the time the
   checkout asks for them, and the buyer arrives at Pabbly with blank columns.

   So the same values are now ALSO written at the edge, on the first request,
   before a line of JavaScript runs. `middleware.ts` calls these. The browser
   capture stays exactly as it was and becomes the redundant copy rather than
   the only one.

   ONE COOKIE, TWO WRITERS, so both must agree on the shape: it is the same
   `Attribution` object, JSON, under the same name as the storage key.
   ══════════════════════════════════════════════════════════════════════ */

/* Capped at the point of capture, not at the point of sending. These values
   ride to the webhook inside the sealed context token, which hangs off the
   webhook URL and therefore has a hard character budget, and a landing url
   with five utm params and an fbclid on it routinely runs past 400. Trimming
   here keeps the cap a known quantity instead of a silent truncation later,
   and keeps the whole token inside its budget without sacrificing a field. */
export const CAP = {
  utm: 100,
  fbclid: 200,
  referrer: 200,
  landingUrl: 300,
} as const;

export const cut = (v: string | null | undefined, max: number) =>
  (v ?? '').slice(0, max);

export const ATTR_COOKIE = KEY;
export const ATTR_TTL_SECONDS = 30 * 24 * 60 * 60;

const URL_TO_KEY: Record<string, keyof Attribution> = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  utm_content: 'utmContent',
  utm_term: 'utmTerm',
  fbclid: 'fbclid',
};

const filled = (v: unknown): v is string =>
  typeof v === 'string' && v.trim() !== '';

/** The campaign values carried on THIS request's query string. */
export function parseAttributionFromUrl(search: string): Partial<Attribution> {
  const out: Partial<Attribution> = {};
  if (!search) return out;
  try {
    const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    for (const [param, key] of Object.entries(URL_TO_KEY)) {
      const v = sp.get(param);
      if (filled(v)) out[key] = v;
    }
  } catch {
    /* malformed query string: best effort, never throw at the edge */
  }
  return out;
}

/** Tolerant of both wire forms: the value Next has already URL-decoded once,
 *  and a still-encoded one. Raw is tried FIRST, because decoding first would
 *  corrupt %-sequences that legitimately live inside a stored landing url. */
export function readAttrCookie(raw: string | undefined): Partial<Attribution> {
  if (!filled(raw)) return {};
  const attempts = [raw];
  try {
    attempts.push(decodeURIComponent(raw));
  } catch {
    /* malformed %-escape: skip that form */
  }
  for (const s of attempts) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Partial<Attribution>;
      }
    } catch {
      /* try the next form */
    }
  }
  return {};
}

/**
 * Merge a new touch into what is already stored.
 *
 * The two halves age differently, and getting this backwards is how a funnel
 * reports every sale as coming from its own landing page:
 *   CONTEXT (landingUrl, referrer) is FIRST-touch. Where the session began.
 *   CAMPAIGN (utm*, fbclid) is LAST-touch. The click that actually sent them.
 *
 * Same rule the browser capture above already follows, deliberately: two
 * writers on one cookie have to agree or they overwrite each other.
 */
export function mergeAttribution(
  stored: Partial<Attribution>,
  opts: { live: Partial<Attribution>; landingUrl: string; referrer: string },
): { attr: Partial<Attribution>; changed: boolean } {
  const attr: Partial<Attribution> = { ...stored };
  let changed = false;

  if (!filled(attr.landingUrl) && filled(opts.landingUrl)) {
    attr.landingUrl = cut(opts.landingUrl, CAP.landingUrl);
    attr.referrer = filled(opts.referrer) ? cut(opts.referrer, CAP.referrer) : '';
    changed = true;
  }

  const live = opts.live;
  const hasCampaign =
    filled(live.utmSource) || filled(live.utmMedium) || filled(live.utmCampaign) ||
    filled(live.utmContent) || filled(live.utmTerm) || filled(live.fbclid);

  if (hasCampaign) {
    attr.utmSource = cut(live.utmSource ?? '', CAP.utm);
    attr.utmMedium = cut(live.utmMedium ?? '', CAP.utm);
    attr.utmCampaign = cut(live.utmCampaign ?? '', CAP.utm);
    attr.utmContent = cut(live.utmContent ?? '', CAP.utm);
    attr.utmTerm = cut(live.utmTerm ?? '', CAP.utm);
    if (filled(live.fbclid)) attr.fbclid = cut(live.fbclid, CAP.fbclid);
    changed = true;
  }

  return { attr, changed };
}

/**
 * Serialise a small object into ONE Razorpay note value, guaranteed valid
 * JSON and guaranteed under the 256-character limit.
 *
 * IT SHORTENS THE LONGEST VALUE, repeatedly, until the whole thing fits. It
 * never cuts the finished JSON, which is the trap: slicing a serialised object
 * mid-string produces something no parser can read, so ONE long campaign name
 * would take every field in the note down with it rather than just itself.
 */
export function packJsonNote(obj: Record<string, string>, max = 256): string {
  const w: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) w[k] = typeof v === 'string' ? v : String(v ?? '');

  let json = JSON.stringify(w);
  let guard = 0;
  while (json.length > max && guard < 200) {
    guard += 1;
    let key: string | null = null;
    let len = 0;
    for (const [k, v] of Object.entries(w)) {
      if (v.length > len) {
        len = v.length;
        key = k;
      }
    }
    if (!key || len === 0) break;
    const trim = Math.max(1, Math.min(len, json.length - max));
    w[key] = w[key].slice(0, len - trim);
    json = JSON.stringify(w);
  }
  /* Still over after shortening everything: an empty object is readable, a
     truncated one is not. */
  return json.length > max ? '{}' : json;
}

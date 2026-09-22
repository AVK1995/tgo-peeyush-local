'use client';

/**
 * First-touch attribution, captured once and remembered.
 *
 * The problem this solves: `readUtm()` reads the CURRENT url. On /checkout
 * that url has no query string, because the buyer navigated there from the
 * landing page by clicking a link. So every UTM, the fbclid and the referrer
 *, the entire answer to "which ad produced this sale", evaporates one click
 * after arrival, and the order is written with blank campaign fields.
 *
 * So the campaign context is stamped into localStorage on FIRST landing, on
 * whichever page that happens to be, and read back at checkout.
 *
 * Overwrite rule: a visit carrying a utm_source or an fbclid is a new ad
 * click and replaces what is stored, last paid click wins, which is what the
 * ad account is judged on. A visit with neither (a direct return, a bookmark,
 * an organic search) leaves the stored campaign alone rather than blanking it,
 * which is the failure mode that makes paid sales look organic.
 */

const KEY = 'pp_attr';

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

const EMPTY: Attribution = {
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
  utmTerm: '',
  fbclid: '',
  referrer: '',
  landingUrl: '',
};

/* Capped at the point of capture, not at the point of sending. These values
   ride to the webhook inside the sealed context token, which hangs off the
   webhook URL and therefore has a hard character budget, and a landing url
   with five utm params and an fbclid on it routinely runs past 400. Trimming
   here keeps the cap a known quantity instead of a silent truncation later,
   and keeps the whole token inside its budget without sacrificing a field. */
const CAP = {
  utm: 100,
  fbclid: 200,
  referrer: 200,
  landingUrl: 300,
} as const;

const cut = (v: string | null | undefined, max: number) =>
  (v ?? '').slice(0, max);

export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const q = new URLSearchParams(window.location.search);
    const fbclid = q.get('fbclid') ?? '';
    const utmSource = q.get('utm_source') ?? '';

    /* Nothing to record and something already stored: leave it. */
    const stored = window.localStorage.getItem(KEY);
    if (stored && !utmSource && !fbclid) return;

    const next: Attribution = {
      utmSource: cut(utmSource, CAP.utm),
      utmMedium: cut(q.get('utm_medium'), CAP.utm),
      utmCampaign: cut(q.get('utm_campaign'), CAP.utm),
      utmContent: cut(q.get('utm_content'), CAP.utm),
      utmTerm: cut(q.get('utm_term'), CAP.utm),
      fbclid: cut(fbclid, CAP.fbclid),
      /* An internal referrer is not an acquisition source. Recording it would
         report every sale as coming from our own landing page. */
      referrer: isExternal(document.referrer)
        ? cut(document.referrer, CAP.referrer)
        : '',
      landingUrl: cut(window.location.href, CAP.landingUrl),
    };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage disabled: attribution is nice to have, never
       worth throwing into a page load */
  }
}

function isExternal(ref: string): boolean {
  if (!ref) return false;
  try {
    return new URL(ref).host !== window.location.host;
  } catch {
    return false;
  }
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    return EMPTY;
  }
}

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

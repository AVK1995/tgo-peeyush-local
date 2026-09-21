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
  utmId: string;
  fbclid: string;
  referrer: string;
  landingUrl: string;
  /* Meta's dynamic url parameters, if the ad was built with them. See the
     note on OrderContext in lib/order-notes.ts for why these are kept apart
     from the UTMs rather than folded into utm_content. */
  adId: string;
  adsetId: string;
  campaignId: string;
  placement: string;
  siteSourceName: string;
};

const EMPTY: Attribution = {
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  utmContent: '',
  utmTerm: '',
  utmId: '',
  fbclid: '',
  referrer: '',
  landingUrl: '',
  adId: '',
  adsetId: '',
  campaignId: '',
  placement: '',
  siteSourceName: '',
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
  metaId: 32,
  placement: 48,
} as const;

const cut = (v: string | null | undefined, max: number) =>
  (v ?? '').slice(0, max);

/* Meta's dynamic parameters have no single spelling: the value of {{ad.id}}
   lands under whatever key the media buyer typed into the destination url, and
   `ad_id`, `adid` and `fb_ad_id` are all in common use across agencies. Reading
   one spelling and ignoring the rest is how these columns end up empty for
   half the campaigns. First non-empty alias wins. */
const firstOf = (q: URLSearchParams, ...keys: string[]) => {
  for (const k of keys) {
    const v = q.get(k);
    if (v) return v;
  }
  return '';
};

export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const q = new URLSearchParams(window.location.search);
    const fbclid = q.get('fbclid') ?? '';
    const utmSource = q.get('utm_source') ?? '';
    const adId = firstOf(q, 'ad_id', 'adid', 'fb_ad_id', 'hsa_ad');

    /* Nothing to record and something already stored: leave it.
       `adId` joins the test because a Meta ad built purely with dynamic
       parameters and no utm_source is still unambiguously a paid click, and
       treating it as organic is the exact failure this file exists to stop. */
    const stored = window.localStorage.getItem(KEY);
    if (stored && !utmSource && !fbclid && !adId) return;

    const next: Attribution = {
      utmSource: cut(utmSource, CAP.utm),
      utmMedium: cut(q.get('utm_medium'), CAP.utm),
      utmCampaign: cut(q.get('utm_campaign'), CAP.utm),
      utmContent: cut(q.get('utm_content'), CAP.utm),
      utmTerm: cut(q.get('utm_term'), CAP.utm),
      utmId: cut(q.get('utm_id'), CAP.utm),
      fbclid: cut(fbclid, CAP.fbclid),
      /* An internal referrer is not an acquisition source. Recording it would
         report every sale as coming from our own landing page. */
      referrer: isExternal(document.referrer)
        ? cut(document.referrer, CAP.referrer)
        : '',
      landingUrl: cut(window.location.href, CAP.landingUrl),
      adId: cut(adId, CAP.metaId),
      adsetId: cut(
        firstOf(q, 'adset_id', 'adsetid', 'fb_adset_id'),
        CAP.metaId,
      ),
      campaignId: cut(
        firstOf(q, 'campaign_id', 'campaignid', 'fb_campaign_id'),
        CAP.metaId,
      ),
      placement: cut(firstOf(q, 'placement', 'fb_placement'), CAP.placement),
      siteSourceName: cut(q.get('site_source_name'), CAP.metaId),
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

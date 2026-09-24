'use client';

/* The shared shape and the storage key live in the SERVER-SAFE sibling, and
   this file imports from it rather than the other way round. A `'use client'`
   module cannot be called from middleware or an API route: the import
   succeeds, the call throws. Keep the arrow pointing this way. */
import { CAP, EMPTY, KEY, cut, type Attribution } from '@/lib/attribution-edge';

export type { Attribution };

/**
 * First-touch attribution, captured once and remembered. THE BROWSER HALF.
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


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  ATTR_COOKIE,
  ATTR_TTL_SECONDS,
  mergeAttribution,
  parseAttributionFromUrl,
  readAttrCookie,
} from '@/lib/attribution';

/* ============================================================================
   EDGE ATTRIBUTION CAPTURE (ported from ResetByShruti, 2026-09-22)
   ----------------------------------------------------------------------------
   THE PROBLEM THIS FIXES. Attribution was captured only in a React effect, in
   components/MetaPixel.tsx, and written only to localStorage. Two things go
   wrong with that, and both of them go wrong hardest for paid social traffic,
   which is the traffic this funnel buys:

     1. On a heavy landing page in the Instagram or Facebook in-app browser, a
        visitor can tap the CTA and navigate away BEFORE hydration runs the
        capture. Nothing is ever recorded.
     2. Those same in-app browsers are the ones that restrict or wipe
        localStorage. The capture runs, the write is swallowed by its own
        try/catch, and nothing is recorded.

   Either way the campaign, the landing url and the referrer are gone by the
   time the checkout asks for them, and the buyer lands in Pabbly with blank
   columns. The misses are not random: they are concentrated in exactly the
   visitors we paid the most to get.

   Reading the query string HERE, at the edge, on the first request, removes
   the race entirely. The server writes the cookie before a line of JavaScript
   runs, and it cannot be blocked by a storage policy. The browser capture
   stays exactly as it was and becomes the redundant second copy.

   Both writers share one cookie and one shape, so they agree rather than
   overwrite each other. See the note at the foot of lib/attribution.ts.
   ========================================================================== */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const live = parseAttributionFromUrl(req.nextUrl.search);
    const stored = readAttrCookie(req.cookies.get(ATTR_COOKIE)?.value);

    const { attr, changed } = mergeAttribution(stored, {
      live,
      landingUrl: req.nextUrl.href,
      referrer: req.headers.get('referer') ?? '',
    });

    if (changed) {
      /* RAW JSON, not encoded. Next's cookie API encodes it once on the way
         out; encoding it here too would double-encode (%257B...) and the
         browser-side reader would never parse it back. */
      res.cookies.set(ATTR_COOKIE, JSON.stringify(attr), {
        path: '/',
        maxAge: ATTR_TTL_SECONDS,
        sameSite: 'lax',
        /* Readable by the browser ON PURPOSE: lib/attribution.ts reads it as a
           fallback when localStorage is unavailable. It carries campaign
           context, never anything secret. */
        httpOnly: false,
        secure: req.nextUrl.protocol === 'https:',
      });
    }
  } catch {
    /* Attribution is best-effort. It must never break a page render: a visitor
       who cannot see the page is worse than a sale with blank utm columns. */
  }

  return res;
}

/* Real page navigations only. API routes are skipped because the checkout POST
   must not be treated as a new touch, and Next internals and static files are
   skipped because they are not visits. */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

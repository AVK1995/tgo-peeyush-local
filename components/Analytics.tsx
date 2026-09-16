'use client';

import Script from 'next/script';

/**
 * The GA4 base tag and the Microsoft Clarity tag, both driven by env rather
 * than pasted into the layout by hand.
 *
 * This exists because every GA4 call in lib/ga4.ts checks for `window.gtag`
 * and returns quietly when it is absent. Without a base tag on the page, that
 * check never passes: view_item, add_to_cart, begin_checkout, add_payment_info
 * and the browser copy of purchase all silently do nothing, and the failure
 * looks exactly like a working site. The server-side purchase from the payment
 * webhook keeps reporting through the Measurement Protocol, which makes the
 * gap harder to spot, not easier: GA4 shows revenue with no funnel above it.
 *
 * Both tags render nothing when their id is missing, so an unfilled env var
 * leaves no broken script tag behind.
 *
 * afterInteractive, not beforeInteractive: neither tag is needed for first
 * paint, and the first event this page fires (view_item) is dispatched from
 * FunnelTracker's effect, which runs after hydration.
 */
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? '';
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? '';

export default function Analytics() {
  return (
    <>
      {GA4_ID && (
        <>
          <Script
            id="ga4-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=window.gtag||gtag;
gtag('js', new Date());
gtag('config', '${GA4_ID}');`}
          </Script>
        </>
      )}

      {CLARITY_ID && (
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script','${CLARITY_ID}');`}
        </Script>
      )}
    </>
  );
}

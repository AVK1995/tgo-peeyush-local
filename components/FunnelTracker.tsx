'use client';

import { useEffect } from 'react';

import { trackViewItem } from '@/lib/track';

/**
 * Landing-page tracking, mounted once on the page. Renders nothing.
 *
 * AddToCart used to fire from a delegated [data-cta] click listener here. It
 * moved to the checkout's mount, for two reasons:
 *
 *  1. The page carries five to seven CTAs. A reader who clicked two of them
 *     counted twice, which inflates AddToCart volume and deflates the
 *     cost-per-AddToCart the ads are judged on.
 *  2. A click is not an arrival. Counting the checkout's mount counts the
 *     people who actually reached it, and it is the ONLY Meta event a visitor
 *     who opens /checkout directly (from an email, a retargeting ad or a
 *     bookmark) will ever produce.
 *
 * Do not re-add it here: the two together double-count every ordinary buyer.
 */
export default function FunnelTracker() {
  useEffect(() => {
    /* ViewContent: the offer has been seen. Once per session, not per browser
       lifetime, so a returning visitor still feeds the retargeting audience. */
    trackViewItem();
  }, []);

  return null;
}

/**
 * / · Dr. Peeyush Prabhat · 5-Day Complete Health Reset Challenge landing page.
 *
 * Server Component shell. The above-the-fold hero is pure static HTML with zero
 * JavaScript on the critical path, so it paints immediately; everything below
 * arrives as a separate deferred chunk via next/dynamic. `ssr` stays on by
 * default, so all of that markup is still in the server HTML and there is no
 * SEO or visual cost.
 */
import dynamic from 'next/dynamic';

import FunnelTracker from '@/components/FunnelTracker';

import { AnnouncementBar, Hero } from './_landing/hero';
import { C } from './_landing/shared';
import StickyCta from './_landing/sticky-cta';

const BelowFold = dynamic(() => import('./_landing/below-fold'));

/**
 * overflow-x-CLIP on <main>, not hidden. `overflow-x: hidden` computes the
 * other axis to `auto`, which makes the element a scroll container, and a
 * scroll container becomes the containing block for every `position: sticky`
 * descendant, which silently breaks anything that pins. `clip` does the same
 * visual job without creating a scrollport.
 */
export default function Page() {
  return (
    <main className="overflow-x-clip font-body" style={{ background: C.canvas, color: C.ink }}>
      <FunnelTracker />
      <AnnouncementBar />
      <Hero />
      <BelowFold />
      <StickyCta />
    </main>
  );
}

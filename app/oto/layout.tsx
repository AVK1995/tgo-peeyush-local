import type { Metadata } from 'next';

/**
 * Keeps /oto out of the index, for the same reason /checkout is kept out.
 *
 * It is a step INSIDE a funnel, not a destination. A searcher who lands here
 * cold meets a price table with none of the argument that earns it, and it
 * competes with the landing page that is actually built to rank.
 *
 * It exists only to hold this metadata: `app/oto/page.tsx` is a client
 * component (the cards are selectable) and a client component cannot export
 * `metadata`, so the route needs a server layout for the robots directive.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OtoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

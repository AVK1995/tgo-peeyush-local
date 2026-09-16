import type { Metadata } from 'next';

/**
 * Keeps /checkout out of the index.
 *
 * It exists only to hold this metadata: `app/checkout/page.tsx` is a client
 * component, and a client component cannot export `metadata`, so the route
 * needs a server layout for the robots directive to live in.
 *
 * Why at all: a checkout is not a landing page. Indexed, it competes with the
 * page that is actually built to rank, and it puts a payment form in front of
 * searchers who arrive with none of the context the sales page gives them. The
 * reference build (tgo-kaizan) does not do this, which is the one reason it was
 * flagged rather than assumed; it is a divergence on purpose.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

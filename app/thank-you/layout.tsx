import type { Metadata } from 'next';

/**
 * Keeps /thank-you out of the index.
 *
 * Same mechanism as the checkout's layout: the page is a client component and
 * cannot export `metadata` itself, so the directive lives here.
 *
 * Why it matters more here than on the checkout: this page is the post-purchase
 * instructions, including the community invite. Indexed, it hands the joining
 * steps to anyone who searches, and it pollutes the conversion picture by
 * collecting organic arrivals that never paid. The reference build does not do
 * this; the divergence is deliberate.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

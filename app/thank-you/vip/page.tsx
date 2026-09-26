'use client';

/**
 * /thank-you/vip — the UPGRADE pass confirmation.
 *
 * Reached only from the checkout's success handler, which uses the
 * `thankYouHref` the SERVER returned with the order rather than one built from
 * the browser's `?tier=`. So a tampered checkout URL that the server priced as
 * standard lands on /thank-you, not here.
 *
 * Same body as the standard page. The only difference is in the hero, where
 * the three VIP entitlements are set out in an inverted card — see ./_body.
 *
 * It inherits the parent route's layout, so it carries the same
 * `robots: noindex` directive without restating it.
 */
import { TIERS } from '../../_landing/offer';

import ThankYouBody from '../_body';

export default function ThankYouVipPage() {
  return <ThankYouBody tier={TIERS.vip} />;
}

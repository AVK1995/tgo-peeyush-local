'use client';

/**
 * /thank-you — the STANDARD pass confirmation.
 *
 * Deliberately thin. The whole page lives in ./_body, shared with
 * /thank-you/vip, because everything after the hero is identical between the
 * two and a second copy of it is a second copy to keep in step. See the note
 * at the top of ./_body for why the split is one branch rather than two files.
 */
import { TIERS } from '../_landing/offer';

import ThankYouBody from './_body';

export default function ThankYouPage() {
  return <ThankYouBody tier={TIERS.standard} />;
}

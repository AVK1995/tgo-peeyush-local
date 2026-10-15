'use client';

/**
 * /thank-you-complete — the seat PLUS both add-ons.
 *
 * Three joining steps, in this order: the main WhatsApp Community, the
 * separate recordings group, then booking the 1-on-1 slot. The community
 * comes first because the workshop itself depends on it — a buyer who reads
 * only the first card still gets into the thing they primarily paid for.
 */
import ThankYouBody from '@/app/_thank-you/body';

export default function Page() {
  return <ThankYouBody bundle="base_recording_call" />;
}

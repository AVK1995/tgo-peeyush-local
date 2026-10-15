'use client';

/**
 * /thank-you-private — the seat PLUS the private 1-on-1 session.
 *
 * Two joining steps: the main WhatsApp Community, then booking the slot on
 * the calendar link. The booking card is skinned in the page's dark navy
 * rather than WhatsApp green, so it is obvious at a glance that this one is
 * not a WhatsApp link.
 */
import ThankYouBody from '@/app/_thank-you/body';

export default function Page() {
  return <ThankYouBody bundle="base_call" />;
}

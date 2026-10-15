'use client';

/**
 * /thank-you-recording — the seat PLUS the Day 1 + Day 2 recordings.
 *
 * Two joining steps: the main WhatsApp Community, then the separate
 * recordings group. The policy block also flips here — the base page tells
 * buyers recordings are not included, which would be a lie on this one.
 */
import ThankYouBody from '@/app/_thank-you/body';

export default function Page() {
  return <ThankYouBody bundle="base_recording" />;
}

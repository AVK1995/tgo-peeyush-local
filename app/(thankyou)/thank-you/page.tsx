'use client';

/**
 * /thank-you — the BASE purchase: the workshop seat on its own.
 *
 * One joining step, the WhatsApp Community. Unchanged from the page this
 * replaced; it simply reads its bundle from the route now instead of `?b=`.
 *
 * The body is shared with the three add-on pages — see app/_thank-you/body.
 */
import ThankYouBody from '@/app/_thank-you/body';

export default function Page() {
  return <ThankYouBody bundle="base" />;
}

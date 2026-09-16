import type { Metadata } from 'next';

import LegalPageLayout from '@/components/LegalPageLayout';

import { LEGAL } from '../_landing/legal';
import { PRICE } from '../_landing/offer';

export const metadata: Metadata = {
  title: `Refund Policy | ${LEGAL.brand}`,
  description: `Refund terms for the ${LEGAL.product}.`,
  robots: { index: true, follow: true },
};

/**
 * ⚠️⚠️ THIS PAGE IS DELIBERATELY UNFINISHED, AND IT SAYS SO ON THE PAGE.
 *
 * What it used to be: the PREVIOUS funnel's refund window, inherited with the
 * scaffold, promising a full refund "if you do not love Day One" and a two
 * business day processing commitment. None of that was ever agreed for this
 * client. A refund window is a contractual promise, so a plausible-looking one
 * inherited from another project is the most dangerous kind of placeholder:
 * it reads as finished, nobody re-checks it, and it is enforceable against the
 * merchant the moment a buyer quotes it back.
 *
 * What the source copy actually supplies: the phrase "100% Money-Back
 * Guarantee", four times, plus "Join Risk-Free". No window, no conditions, no
 * process, nowhere. That phrase is reproduced here verbatim because it is the
 * client's own wording and it is the promise the buyer already read under
 * every CTA. Everything the client has NOT stated is a visible [TODO].
 *
 * REQUIRED BEFORE LAUNCH, from Dr. Peeyush, and it is four questions:
 *   1. The WINDOW. Until when can a refund be asked for: before Day Two, until
 *      the end of Day Five, seven days from purchase, something else.
 *   2. The CONDITIONS, if any. Attendance required first, or unconditional.
 *   3. The PROCESS. Which inbox, what subject line, what the buyer must send.
 *   4. The TURNAROUND. How long until it is processed.
 *
 * A note on the promise itself, for Atul rather than for the page: "100%
 * Money-Back Guarantee" with no stated window reads as unconditional, and that
 * is how a buyer will read it in a dispute. Whatever window comes back has to
 * be consistent with a page that says those six words four times, and with the
 * thank-you page, which carried an inherited "no refunds for missed live
 * sessions" line until this pass removed it for contradicting them.
 */
export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      effectiveDate={LEGAL.effectiveDate}
      intro={`The ${LEGAL.product} is sold with a 100% Money-Back Guarantee. The terms of that guarantee are set out below.`}
    >
      <h2>1. The guarantee</h2>
      <p>
        The {LEGAL.product} ({PRICE}) is sold with a{' '}
        <strong>100% Money-Back Guarantee</strong>.
      </p>
      <p>
        <strong>
          [TODO: the exact terms of the guarantee. State what a participant has
          to do to claim it, and whether it is unconditional or requires
          attending at least one live session first.]
        </strong>
      </p>

      <h2>2. The window</h2>
      <p>
        <strong>
          [TODO: the deadline. A refund must be requested by when, measured from
          what: the date of purchase, the start of Day Two, the end of the
          batch.]
        </strong>
      </p>

      <h2>3. How to request a refund</h2>
      <ul>
        <li>
          Email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> from the same
          address you used at checkout.
        </li>
        <li>
          Use the subject line{' '}
          <strong>&ldquo;Refund Request: 5-Day Complete Health Reset&rdquo;</strong>.
        </li>
        <li>Include your full name and the date of purchase.</li>
        <li>
          <strong>
            [TODO: anything else the client requires with a request, or confirm
            that the three lines above are the whole process.]
          </strong>
        </li>
      </ul>

      <h2>4. Processing time</h2>
      <p>
        <strong>
          [TODO: how long after a valid request the refund is processed.]
        </strong>{' '}
        Once processed, banks typically take 5 to 7 business days to show the
        credit, which is outside our control.
      </p>

      <h2>5. Refund method</h2>
      <p>
        Refunds go back to the original payment method used at checkout: the same
        card, UPI ID or account. We cannot redirect a refund to a different
        method.
      </p>

      <h2>6. What is not refundable</h2>
      <p>
        <strong>
          [TODO: the exclusions, if any. Requests made outside the window in
          section 2, access given free or as part of a giveaway, and anything
          else the client wants excluded. If there are no exclusions beyond the
          window, say so and this section is deleted.]
        </strong>
      </p>

      <h2>7. Chargebacks</h2>
      <p>
        Please email us before raising a dispute with your bank. A refund within
        the window above is handled directly, and a chargeback simply takes
        longer for everyone.
      </p>

      <h2>8. Contact</h2>
      <p>
        {LEGAL.entity}, trading as {LEGAL.tradeName}, {LEGAL.address}.
        <br />
        Questions about this policy:{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        {' · '}
        <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>.
      </p>
    </LegalPageLayout>
  );
}

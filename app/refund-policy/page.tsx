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
 * The refund policy, written to what the client has actually stated and
 * nothing more.
 *
 * HOW THIS PAGE GOT ITS SHAPE. It first carried the PREVIOUS funnel's window,
 * inherited with the scaffold ("a full refund if you do not love Day One", two
 * business days to process). None of that was ever agreed here, and a refund
 * window is a contractual promise, so an inherited one is the most dangerous
 * kind of placeholder: it reads as finished and it is enforceable the moment a
 * buyer quotes it back. It was replaced by visible placeholder blocks, and on
 * 16 Sep Atul's instruction was to ship without the answers rather than hold
 * the funnel for them.
 *
 * So the sections that cannot be written truthfully are GONE rather than
 * filled. There is no "The window" section and no "What is not refundable"
 * section, because stating either would mean inventing a term the client has
 * never agreed.
 *
 * ⚠️ THE CONSEQUENCE, AND IT IS A REAL ONE. The source copy promises a "100%
 * Money-Back Guarantee" four times plus "Join Risk-Free", and this page now
 * states no window, no conditions and no exclusions against it. A buyer, and a
 * card network in a dispute, will read that as UNCONDITIONAL and open-ended.
 * That is the most buyer-favourable reading and the merchant carries it. It is
 * the honest consequence of publishing the guarantee without terms; the fix is
 * not wording here, it is Dr. Peeyush answering: until when, on what
 * conditions, and how fast it is processed. The moment he does, sections 2 and
 * 6 come back and this note goes.
 *
 * What IS stated here is only what is known: the promise in the client's own
 * words, the inbox that receives requests (the real monitored address from
 * ./legal), that refunds return to the original payment method, and that bank
 * settlement time is outside anyone's control. On Instamojo the refund itself
 * is initiated from the gateway dashboard.
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
        <strong>100% Money-Back Guarantee</strong>. If the challenge is not
        right for you, write to us and we will refund what you paid.
      </p>

      <h2>2. How to request a refund</h2>
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
      </ul>
      <p>
        That is the whole process. You do not need to give a reason, and there is
        no form to fill in.
      </p>

      <h2>3. Processing time</h2>
      <p>
        A refund is initiated as soon as your request has been checked against
        the payment record. Once it is initiated, banks typically take 5 to 7
        business days to show the credit, which is outside our control.
      </p>

      <h2>4. Refund method</h2>
      <p>
        Refunds go back to the original payment method used at checkout: the same
        card, UPI ID or account. We cannot redirect a refund to a different
        method.
      </p>

      <h2>5. Chargebacks</h2>
      <p>
        Please email us before raising a dispute with your bank. A refund
        requested directly is handled faster, and a chargeback simply takes
        longer for everyone.
      </p>

      <h2>6. Contact</h2>
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

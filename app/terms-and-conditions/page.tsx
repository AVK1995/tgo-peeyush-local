import type { Metadata } from 'next';
import Link from 'next/link';

import LegalPageLayout from '@/components/LegalPageLayout';

import { LEGAL, LEGAL_STRUCTURE_KNOWN } from '../_landing/legal';
import { PRICE, SESSION_TIMES_TZ, START_DATE } from '../_landing/offer';

export const metadata: Metadata = {
  title: `Terms and Conditions | ${LEGAL.brand}`,
  description: `The terms that apply when you join the ${LEGAL.product}.`,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      effectiveDate={LEGAL.effectiveDate}
      intro={`These terms apply when you buy or take part in the ${LEGAL.product}. By completing checkout you agree to them.`}
    >
      {/* "sole proprietor" used to sit between the entity and the trade name
          here as a hard-coded string, inherited from the scaffold. Nobody has
          told us what Dr. Peeyush's business actually is, and asserting a
          legal structure in the terms is not a detail: it decides who the
          counterparty is, who is liable, and which name has to match the PAN
          and the payment gateway's merchant record.

          So the structure is NAMED ONLY WHEN IT IS KNOWN. LEGAL.structure is
          empty on Atul's instruction of 16 Sep (the client has not stated it
          and the funnel is not waiting), so this sentence runs without the
          phrase, which is accurate and asserts nothing untrue. Fill the field
          and the sentence reshapes itself around it. */}
      <h2>1. Who we are</h2>
      <p>
        The programme is provided by {LEGAL.entity}
        {LEGAL_STRUCTURE_KNOWN ? `, ${LEGAL.structure},` : ','} trading as{' '}
        {LEGAL.tradeName}, {LEGAL.address}.
      </p>

      <h2>2. What you are buying</h2>
      <p>
        Access to the {LEGAL.product}: five live doctor-led sessions delivered
        on Zoom, starting {START_DATE} at {SESSION_TIMES_TZ}, together with the
        digital guides listed at checkout. The fee is {PRICE}.
      </p>

      <h2>3. Sessions and scheduling</h2>
      <ul>
        <li>
          Sessions run live at the advertised times. Where a recording is made
          available, it is a courtesy and not a guaranteed part of the programme.
        </li>
        <li>
          We may move a session for reasons outside our control. Registered
          participants will be told as early as possible.
        </li>
        <li>You are responsible for your own internet access and device.</li>
      </ul>

      {/* The subject list used to read "movement, mindfulness and nutrition",
          which is the PREVIOUS funnel's programme. These four are this one's,
          taken from the day-by-day schedule in COPY-SOURCE.md: breathing
          (Day 2), the nervous system (Day 3), emotional stress (Day 4) and
          diet-balancing principles (Day 5). A health disclaimer that describes
          the wrong programme protects nobody. */}
      <h2>4. Health disclaimer</h2>
      <p>
        This programme provides general wellness education covering breathing,
        nervous-system regulation, emotional stress and simple diet-balancing
        principles. <strong>It is not medical advice</strong>, it does not
        diagnose or treat any condition, and it is not a substitute for care
        from a qualified clinician.
      </p>
      <p>
        Consult your doctor before starting, particularly if you are pregnant,
        recovering from surgery or injury, taking prescribed medication, or
        living with a heart, joint, blood pressure or hormonal condition. Stop
        immediately and seek medical help if you feel pain, dizziness or
        breathlessness. You take part at your own risk.
      </p>

      <h2>5. Your access</h2>
      <ul>
        <li>Access is personal to you and must not be shared or resold.</li>
        <li>
          Recording, redistributing or republishing any session or guide is not
          permitted.
        </li>
        <li>
          We may withdraw access without refund for abusive conduct toward staff
          or other participants.
        </li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        All session content, guides, recordings and materials remain the property
        of {LEGAL.entity}. You get a personal, non-transferable licence to use
        them for your own benefit.
      </p>

      <h2>7. Results</h2>
      <p>
        We describe what participants commonly notice. We do not promise a
        specific outcome, and results vary with individual circumstances,
        consistency and health status.
      </p>

      <h2>8. Payment and refunds</h2>
      <p>
        Payment is taken at checkout through our payment processor. Refunds are
        governed by our{' '}
        <Link href="/refund-policy">Refund Policy</Link>.
      </p>

      <h2>9. Liability</h2>
      <p>
        To the extent permitted by law, our total liability in connection with
        the programme is limited to the amount you paid for it. Nothing in these
        terms limits liability that cannot lawfully be limited.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of India, and the courts of{' '}
        {LEGAL.jurisdiction} have exclusive jurisdiction.
      </p>

      <h2>11. Contact</h2>
      <p>
        {LEGAL.entity}, trading as {LEGAL.tradeName}, {LEGAL.address}.
        <br />
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        {' · '}
        <a href={`tel:${LEGAL.phoneHref}`}>{LEGAL.phone}</a>
      </p>
    </LegalPageLayout>
  );
}

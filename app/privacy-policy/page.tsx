import type { Metadata } from 'next';

import LegalPageLayout from '@/components/LegalPageLayout';

import { LEGAL } from '../_landing/legal';

export const metadata: Metadata = {
  title: `Privacy Policy | ${LEGAL.brand}`,
  description: `How ${LEGAL.brand} collects, uses and protects your personal information.`,
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate={LEGAL.effectiveDate}
      intro={`This policy explains what ${LEGAL.brand} collects when you visit this site or join the ${LEGAL.product}, why we collect it, and what you can ask us to do with it.`}
    >
      <h2>1. Information we collect</h2>
      <p>Directly from you, when you register or pay:</p>
      <ul>
        <li>Your name, email address and WhatsApp number.</li>
        <li>
          Payment confirmation details from our payment processor. We never see
          or store your full card number, UPI PIN or bank credentials.
        </li>
        <li>Anything you send us by email or message.</li>
      </ul>
      <p>Automatically, when you browse:</p>
      <ul>
        <li>
          Device, browser and approximate location, plus which pages you viewed
          and for how long.
        </li>
        <li>
          Campaign parameters (UTM tags) telling us which ad or link brought you
          here.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>
          To deliver the {LEGAL.product}: Zoom links, session reminders and the
          included guides.
        </li>
        <li>To answer your questions and provide support.</li>
        <li>To send transactional email related to your purchase.</li>
        <li>
          To measure which ads and pages work, so we spend less to reach the
          people we can help.
        </li>
        <li>
          With your consent, to tell you about future {LEGAL.brand} programmes.
          You can stop this at any time.
        </li>
      </ul>

      <h2>3. Advertising and analytics</h2>
      <p>
        We use Meta (Facebook and Instagram) advertising tools and web analytics.
        These may set cookies and receive a hashed, non-readable version of your
        email or phone number so a purchase can be matched to the ad that led to
        it. They do not receive your details in a form that identifies you to
        anyone reading them.
      </p>

      <h2>4. Who we share it with</h2>
      <p>
        Only with the services needed to run the programme: our payment
        processor, our email and messaging providers, our video conferencing
        provider, and our analytics and advertising platforms.{' '}
        <strong>We do not sell your personal information.</strong>
      </p>

      <h2>5. How long we keep it</h2>
      <p>
        For as long as needed to deliver the programme and to meet tax and
        accounting obligations. You can ask us to delete it sooner, subject to
        those obligations.
      </p>

      <h2>6. Your rights</h2>
      <ul>
        <li>Ask for a copy of what we hold about you.</li>
        <li>Ask us to correct anything wrong.</li>
        <li>Ask us to delete it.</li>
        <li>Withdraw consent for marketing at any time.</li>
      </ul>
      <p>
        Email <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we will
        respond within a reasonable period.
      </p>

      <h2>7. Children</h2>
      <p>
        This programme is intended for adults. We do not knowingly collect
        information from anyone under 18.
      </p>

      <h2>8. Changes</h2>
      <p>
        If this policy changes we will update the effective date above. Material
        changes will be communicated to registered participants by email.
      </p>

      <h2>9. Contact</h2>
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

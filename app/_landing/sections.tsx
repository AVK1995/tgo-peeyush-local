import Image from 'next/image';
import {
  BowlFood,
  Brain,
  CheckCircle,
  FirstAid,
  Gift,
  Heart,
  Lightning,
  Moon,
  Plus,
  Shield,
  Wind,
} from '@phosphor-icons/react/dist/ssr';

import { asset } from './asset-version';
import {
  CHALLENGES,
  CHANGES,
  CLIPS_FIRST,
  CLIPS_SECOND,
  FAQS,
  MODULES,
  PRESS_ROW_1,
  PRESS_ROW_2,
  type ChangeKey,
} from './content';
import { BONUSES, BONUS_DELIVERY_NOTE, OFFER_LINE, inr } from './offer';
import { Band, C, Container, CtaBlock, Hl, SectionHeading } from './shared';
import VideoGrid from './video-grid';

/* Phosphor has no lungs or stomach glyph: Wind and BowlFood stand in. */
const CHANGE_ICON: Record<ChangeKey, typeof Wind> = {
  breathe: Wind,
  relieve: FirstAid,
  sleep: Moon,
  energize: Lightning,
  focus: Brain,
  digest: BowlFood,
  destress: Heart,
  recover: Shield,
};

export function SuccessStories() {
  return (
    <Band tone="mint">
      <Container>
        <SectionHeading>
          Real Clients. <Hl>Real Results.</Hl>
        </SectionHeading>
        <VideoGrid clips={CLIPS_FIRST} columns={3} />
      </Container>
    </Band>
  );
}

export function WhatWillChange() {
  return (
    <Band tone="white">
      <Container>
        <SectionHeading>
          What Will Change After this <Hl>2-day Workshop?</Hl>
        </SectionHeading>
        <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {CHANGES.map(({ key, heading, tagline }) => {
            const Icon = CHANGE_ICON[key];
            return (
              <li key={key} className="pp-change-card">
                <Icon weight="duotone" aria-hidden className="pp-change-icon" />
                <h3 className="mt-3 font-display text-[18px] font-extrabold tracking-[0.04em]" style={{ color: C.heading }}>
                  {heading}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
                  {tagline}
                </p>
              </li>
            );
          })}
        </ul>
        <CtaBlock className="mt-12" />
      </Container>
    </Band>
  );
}

export function Challenges() {
  return (
    <Band tone="mint">
      <Container>
        <SectionHeading>
          <span className="font-medium">Are You Facing These</span> Challenges?
        </SectionHeading>
        <ul className="mx-auto grid max-w-[960px] grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
          {CHALLENGES.map(({ title, symptoms }) => (
            <li key={title} className="flex items-start gap-3">
              <CheckCircle weight="fill" aria-hidden className="pp-check" style={{ color: C.heading }} />
              <div>
                <h3 className="font-display text-[17px] font-bold sm:text-[18px]" style={{ color: C.heading }}>
                  {title}
                </h3>
                <p className="mt-1 text-[15px] leading-relaxed sm:text-[16px]" style={{ color: C.inkSoft }}>
                  {symptoms}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <CtaBlock className="mt-12" />
      </Container>
    </Band>
  );
}

export function WhatYoullLearn() {
  return (
    <Band tone="white">
      <Container>
        <SectionHeading>
          <span className="font-medium">What You&apos;ll Learn In This</span> 2-Day Workshop
        </SectionHeading>
        <ul className="pp-learn-grid">
          {MODULES.map(({ title, items }) => (
            <li key={title} className="pp-learn-card">
              <h3 className="pp-learn-head">{title}</h3>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item} className="pp-learn-item">
                    <CheckCircle weight="fill" aria-hidden className="pp-check" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <CtaBlock className="mt-12" />
      </Container>
    </Band>
  );
}

export function SuccessStoriesRepeat() {
  return (
    <Band tone="mint">
      <Container>
        <SectionHeading>
          Success <Hl>Stories</Hl>
        </SectionHeading>
        <VideoGrid clips={CLIPS_SECOND} columns={2} />
      </Container>
    </Band>
  );
}

export function Bonuses() {
  return (
    <Band tone="white">
      <Container>
        <SectionHeading sub="Everything You Need To Continue Your Healing Journey Beyond The Workshop">
          Register Today &amp; Get These <Hl>3 Bonuses FREE</Hl>
        </SectionHeading>
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BONUSES.map((b) => (
            <li key={b.n} className="pp-bonus-card">
              <div className="pp-bonus-head">
                <Gift weight="fill" aria-hidden className="pp-bonus-gift" />
                <span className="font-bold" style={{ color: C.onDark }}>
                  BONUS {b.n}:
                </span>
                <span className="font-semibold" style={{ color: C.accent }}>
                  Worth {inr(b.value)}
                </span>
              </div>
              <h3 className="mt-5 font-display text-[19px] font-extrabold leading-tight sm:text-[20px]" style={{ color: C.heading }}>
                {b.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
                {b.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-6 max-w-3xl text-center text-[14px] font-semibold sm:text-[15px]" style={{ color: C.inkSoft }}>
          {BONUS_DELIVERY_NOTE}
        </p>
        <p className="mx-auto mt-8 max-w-3xl text-center font-display text-[22px] font-bold leading-snug sm:text-[28px]" style={{ color: C.heading }}>
          {OFFER_LINE}
        </p>
        <CtaBlock className="mt-8" />
      </Container>
    </Band>
  );
}

function PressRail({
  photos,
  first,
  reverse,
}: {
  photos: string[];
  first: number;
  reverse?: boolean;
}) {
  return (
    <div className="pp-rail">
      <div className={`pp-rail-track ${reverse ? 'pp-rail-track--reverse' : ''}`}>
        {[0, 1].map((copy) =>
          photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${copy}-${src}`}
              src={asset(src)}
              alt={copy === 0 ? `Press and stage photo ${first + i} of 10` : ''}
              aria-hidden={copy === 1 ? true : undefined}
              data-rail-copy={copy + 1}
              loading="lazy"
              decoding="async"
              className="pp-rail-photo"
            />
          )),
        )}
      </div>
    </div>
  );
}

export function MeetYourGuide() {
  return (
    <Band tone="mint">
      <Container>
        <div className="text-center">
          <p className="pp-eyebrow">MEET YOUR GUIDE</p>
        </div>
        <SectionHeading>
          Meet <Hl>Dr. Peeyush Prabhat</Hl>
        </SectionHeading>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="lg:sticky lg:top-8">
            <Image
              src={asset('/images/peeyush-guide.webp')}
              alt="Dr. Peeyush Prabhat seated in a studio"
              width={840}
              height={560}
              sizes="(min-width: 1109px) 515px, (min-width: 1024px) 46vw, calc(100vw - 40px)"
              className="pp-guide-photo"
            />
          </div>

          <div className="pp-bio">
            <p>
              Dr. Peeyush Prabhat is an MBBS Doctor, Orthopaedic Surgeon &amp; Health Coach who has
              spent years studying how breathing, the nervous system and the mind can affect your
              physical health.
            </p>
            <p>
              His work has reached 1M+ people on YouTube and has been featured on TEDx, Josh Talks
              &amp; television.
            </p>
            <p>
              After personally experiencing stress, anxiety and panic, he went beyond conventional
              symptom management to explore how changing the way we breathe can influence the way
              our body feels and functions.
            </p>
            <p className="pp-bio-strong">That journey led to the 10-Min Breath Healing Method™</p>
            <p>
              A simple, practical approach designed to help people improve their breathing and
              support relief from respiratory issues, migraines, poor sleep, fatigue, stress and
              other recurring health concerns.
            </p>
            <blockquote className="pp-quote">
              &ldquo;Your breath is more than air, it can become one of your body&apos;s most
              powerful tools for healing.&rdquo;
            </blockquote>
            <p className="pp-bio-strong">
              Now, in this 2-Day Live Workshop, Dr. Peeyush will teach you how to use it for
              yourself.
            </p>
          </div>
        </div>
      </Container>

      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-5">
        <PressRail photos={PRESS_ROW_1} first={1} />
        <PressRail photos={PRESS_ROW_2} first={6} reverse />
      </div>
    </Band>
  );
}

export function Faq() {
  return (
    <Band tone="white" className="pb-32 sm:pb-28">
      <Container>
        <SectionHeading>Frequently Asked Questions</SectionHeading>
        <div className="mx-auto max-w-[860px]">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="pp-faq">
              <summary>
                <span>{q}</span>
                <Plus weight="bold" aria-hidden className="pp-faq-icon" />
              </summary>
              <div className="pp-faq-body">
                {a.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </Container>
    </Band>
  );
}

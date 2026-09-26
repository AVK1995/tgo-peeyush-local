/**
 * Above-the-fold: the announcement strip, the header, the dark hero stage and
 * the trust ledger that straddles the seam beneath it.
 *
 * A pure Server Component (no 'use client', no hooks) so it paints from static
 * HTML with zero JavaScript on the critical path.
 *
 * COPY IS VERBATIM from COPY-SOURCE.md. Where a run-on line has been split
 * across elements the words and their order are untouched; nothing is
 * re-voiced, shortened or added. Three things the copy carries that need a
 * human decision are flagged at their call sites: "Price Increases To ₹1599
 * Tomorrow", which cannot run evergreen; the "up to 30%" and "Overcome ...
 * Asthma ... Lifestyle Diseases" claims, which sit against the page's own
 * medical disclaimer; and the unsourced "5.0 Client Rating".
 *
 * The stage is the page's ONE dark section band, per the blueprint: light
 * theme, hero in dark. It is built from HIS deep teals rather than the skin's
 * navy and lit the way his own hero is lit (cyan from the top left, emerald
 * from the right), then closed by the seam hairline where it hands over to the
 * light page. Everything below this file is light bands; where dark appears
 * again it is a contained object inside one, never a band.
 */
import {
  ArrowRight,
  CalendarBlank,
  Clock,
  Heartbeat,
  Lock,
  ShieldCheck,
  Star,
  Stethoscope,
  VideoCamera,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

import { asset } from './asset-version';
import { legoBrick, legoDelay } from './lego-style';
import {
  OTO_HREF,
  CLIENT_RATING,
  CTA_LABEL,
  CTA_LABEL_CARD,
  CTA_NOTE_HERO,
  HEALTH_TRANSFORMATIONS,
  PRICE,
  PRICE_RISES_TO,
  SESSION_TIMES,
  START_DATE,
} from './offer';
import { Art, C } from './shared';

/* ══ 0 · Announcement strip (R10) ══════════════════════════════════════════
   A slim strip in his deep teal, with one live red dot and a slow shine, so it
   reads as alive rather than as a static sale bar. It sits ABOVE the lit hero
   and runs flatter and deeper than the stage's top stop, which is what keeps it
   a rail rather than part of the stage. It names a specific price, a specific
   anchor and a specific date — never "limited time".

   ⚠️ FLAG FOR ATUL: "Price Increases To ₹1599 Tomorrow" is rendered verbatim
   from the copy. On an evergreen page "Tomorrow" is a claim that stops being
   true the day after launch, and this page will be live from 13 Sep for a
   30 Sep cohort, so it is untrue for seventeen days. Either the campaign
   carries a real dated deadline, or that segment needs re-wording by
   NO-BRAINER. Not silently changed here. */
export function AnnouncementBar() {
  const segments = [
    <>
      <span className="font-bold">Special Offer:</span> 5-Day Complete Health
      {/* goldInk, not gold. The bar is light now; his cyan (#06B6D4) is 2.4:1
          on it and these two tokens are 12.5-13.5px, which is small text and
          needs the 4.5:1 step. */}
      Reset Challenge for <span style={{ color: C.goldInk }}>{PRICE}</span>
    </>,
    <>
      Price Increases To{' '}
      <span style={{ color: C.goldInk }}>{PRICE_RISES_TO}</span>{' '}
      Tomorrow
    </>,
    <>100% Money-Back Guarantee</>,
    <>
      Live · Starts {START_DATE} · {SESSION_TIMES}
    </>,
  ];

  /* One copy of the strip. Rendered twice inside the track, which is what makes
     a -50% translate loop seamlessly: at the reset the second copy sits exactly
     where the first began. The duplicate is decorative, so it is hidden from
     assistive tech rather than read out twice. */
  const strip = (copy: '1' | '2') => (
    <ul
      key={copy}
      data-marquee-copy={copy}
      aria-hidden={copy === '2' ? true : undefined}
      className="flex shrink-0 items-center gap-x-3 whitespace-nowrap pr-3 text-[12.5px] leading-snug sm:text-[13.5px]"
    >
      {segments.map((seg, i) => (
        <li key={i} className="inline-flex items-center gap-3 pr-3">
          {i === 0 ? (
            <span
              className="lego-pulse-dot inline-block h-[7px] w-[7px] shrink-0 rounded-full"
              style={{
                background: C.coral,
                ['--dot-pulse' as string]: 'rgba(220,38,38,0.6)',
              }}
            />
          ) : (
            <span aria-hidden style={{ color: C.lineStrong }}>
              |
            </span>
          )}
          <span>{seg}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="cta-shimmer w-full py-2.5"
      style={{
        /* Light, because the stage under it is light. A deep-teal strip above a
           near-white hero reads as a leftover from another page rather than as
           the top of this one. A cyan-washed tint keeps it as its own band
           without reintroducing the dark slab. */
        background: C.goldWash,
        color: C.ink,
        borderBottom: `1px solid ${C.line}`,
        ['--shimmer' as string]: 'rgba(6,182,212,0.22)',
      }}
    >
      {/* The mask lives on this inner element, NOT on the bar. A mask applies to
          the element's own background as well as its content, so masking the bar
          faded the strip's own fill and let the page behind show through at both
          ends. */}
      <div className="kz-marquee">
        <div className="kz-marquee-track">
          {strip('1')}
          {strip('2')}
        </div>
      </div>
    </div>
  );
}

/* ══ 0b · Header ═══════════════════════════════════════════════════════════
   REMOVED. This carried the type-set wordmark, which Atul has cut everywhere.
   The stage now opens straight on the headline, and the announcement strip
   above it is what establishes the page before the first line of copy.

   Nothing replaces it: a header holding one "back" link or an empty rule would
   be furniture, and this is a single-offer page where every link out of it is a
   way to not buy. The air the header occupied is given back to the section's
   top padding, so the headline does not start flush against the strip. When a
   real logo arrives, this is where it goes. */

/* ══ 1 · Hero ══════════════════════════════════════════════════════════════ */

const HERO_FACTS = [
  { icon: CalendarBlank, text: `Starts ${START_DATE}` },
  { icon: Clock, text: SESSION_TIMES },
  { icon: VideoCamera, text: 'Live, Doctor-Led Sessions' },
];

export function Hero() {
  return (
    <>
      <section data-hero className="kz-stage pb-24 pt-10 sm:pt-12">
        <div className="mx-auto grid max-w-[1180px] items-center gap-9 px-5 pt-6 sm:gap-12 md:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:pt-10">
          {/* ══ LEFT ══════════════════════════════════════════════════════ */}
          <div className="text-center lg:text-left">
            {/* The gate line: who this is for, said before anything is sold.
                72 characters, which is long for a pill. Measured: at 10.5px
                uppercase bold the string runs ~545px with 0.1em tracking, and
                the left column is ~580px from lg up, so it holds one line on
                desktop and wraps to two on a phone — hence the explicit leading
                and the shrink-0 dot. The Kaizen original was 11px/0.14em, which
                would have broken it onto two lines at every width. */}
            <span
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-left text-[10.5px] font-bold uppercase leading-[1.5] tracking-[0.1em]"
              style={{
                background: C.goldWash,
                border: `1px solid rgba(6,182,212,0.38)`,
                /* goldInk: this is 10.5px uppercase, the smallest type on the
                   screen, so it takes the 4.5:1 step on the light ground. */
                color: C.goldInk,
              }}
            >
              <span
                className="lego-pulse-dot inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: C.coral,
                  ['--dot-pulse' as string]: 'rgba(220,38,38,0.6)',
                }}
              />
              For People Struggling With Chronic Pain, Stress &amp; Lifestyle
              Health Concerns
            </span>

            {/* The headline is ONE sentence in the source, and it is long: 150
                characters, which at a single hero size is a six-line wall on
                both a phone and a desktop. So it is set in two tiers instead —
                the promise, then its extension — with every word and the
                original order intact. Nothing is dropped and nothing is
                re-voiced; only the type size steps down at the clause.

                ONE lit token: the figure that carries the promise. Everything
                else stays warm white, which is what stops the line reading as a
                highlighter pass. (C2/C3)

                ⚠️ FLAG FOR ATUL: "by up to 30%" and "Overcome Migraine, Asthma
                ... Lifestyle Diseases" are specific clinical claims, made by a
                named MBBS doctor, on a page whose own disclaimer says it does
                not "diagnose, treat, cure or prevent any disease". Those two
                statements are in tension. Rendered verbatim, flagged here. */}
            {/* Weight and leading move with the face, not with the copy.
                Poppins 800 is his headline voice and it sets wider and tighter
                than the serif this replaced: measured at lg the first tier runs
                65 characters at ~0.58em of advance less 0.025em of tracking,
                which is ~1650px in a 547px column, so it still breaks to three
                lines and the leading comes in from 1.12 to 1.06 to stop the
                block opening up. The second tier goes to 600 because 500 is not
                one of the three weights loaded, and an unloaded weight is a
                synthetic one.

                The lit token is the kz-lit gradient rather than a flat colour:
                his highlight phrase carries a cyan-to-emerald sweep, and it is
                the same object the price uses, so "the lit thing" is one
                treatment on this page rather than two.

                ⚠️ `.kz-lit`, NOT `.kz-lit-dark`, since 24 Sep. The two are the
                same sweep on different steps: `-dark` is mixed bright to carry
                on a deep ground, and on the light stage it renders at about
                2.0:1 — a headline you cannot read. Swapping the stage without
                swapping this pair is the one change here that fails silently,
                because it still LOOKS like a lit phrase. */}
            <h1
              className="mt-7 font-display text-[30px] font-extrabold leading-[1.06] sm:text-[38px] lg:text-[46px]"
              style={{ color: C.ink }}
            >
              Reduce Chronic Stress, Anxiety &amp; Body Pain by{' '}
              <span className="kz-lit">up to 30%</span> in 5 Days
              <span className="mt-3 block text-[21px] font-semibold leading-[1.24] sm:text-[24px] lg:text-[27px]">
                &amp; Overcome Migraine, Asthma, Low Energy &amp; Lifestyle
                Diseases
              </span>
            </h1>

            {/* ══ THE MOBILE BANNER ════════════════════════════════════════
                Phone ONLY, and directly under the headline, which is where the
                reference puts it.

                It exists because of what the two layouts do differently. From
                `lg` up the offer card sits in the right column, level with the
                headline, so the screen already has its one large image and a
                second one here would be a repeat — which is exactly what the
                comment that used to occupy this slot said about a hero
                photograph. Below `lg` that card is not beside the headline at
                all, it is stacked a long way below it, so the top of a phone
                screen is pure type from the announcement bar to the CTA. This
                is the image that breaks that up.

                `lg:hidden`, not `md:hidden`: the grid goes two-column at `lg`
                (see the wrapper above), so the banner must persist through the
                whole single-column range or a tablet gets the same wall of
                type the phone had.

                16/9 is the file's own ratio — 1672x941 — declared so the space
                is reserved before the bytes land and the headline above it does
                not jump. `sizes="100vw"` because in this range it genuinely is
                the full width, and no `priority`: the LCP candidate on this
                screen is the headline, and preloading a 1.7MB PNG would push
                the text it sits under further out. */}
            <Art
              src={asset('/banner/peeyush-banner.png')}
              alt="Dr. Peeyush Prabhat's 5-Day Complete Health Reset Challenge"
              ratio="16 / 9"
              sizes="100vw"
              className="mt-7 lg:hidden"
            />

            {/* The disqualifier line: the turn in the argument, not body copy.
                It used to be set in the display italic, which worked because
                the display face was a serif. Poppins italic is a slanted
                geometric sans and reads as a mistake next to an 800 headline,
                so the turn is now carried by the BODY italic plus the second
                accent. Emerald rather than cyan: this line is the relief in the
                argument, and it is the one place above the fold where his
                second accent does a job. */}
            <p
              className="mx-auto mt-5 max-w-[600px] font-body text-[17px] font-medium italic leading-[1.5] sm:text-[18.5px] lg:mx-0"
              /* emeraldInk, not emerald. #10B981 was 7.4:1 on the dark stage
                 and is 2.8:1 on this one; the deep step is his same second
                 accent at 5.4:1. */
              style={{ color: C.emeraldInk }}
            >
              without endless yoga, gym workouts, medicines or expensive
              treatments...
            </p>

            {/* No hero photograph exists yet. When a still of Dr. Peeyush is
                supplied, this is where a mobile-only crop would go: the offer
                card below already carries the one reserved art slot on this
                screen, and two large images back to back read as a repeat. */}

            <p
              className="mx-auto mt-6 max-w-[600px] text-[16px] leading-[1.7] lg:mx-0"
              style={{ color: C.inkSoft }}
            >
              Across 5 doctor-led live sessions, Dr. Peeyush will help you
              uncover the breathing, energy, nervous-system and emotional
              patterns affecting your health, then guide you through practical
              techniques to help your body function, recover and feel better.
            </p>

            <div className="mt-9 flex justify-center lg:justify-start">
              {/* Shimmer, but no breath: the offer card beside it is the page's
                  focal action and carries the one breathing CTA. Two breathing
                  buttons on one screen is two primaries, which is none. */}
              <Link
                href={OTO_HREF}
                data-cta
                className="lego-press cta-shimmer group inline-flex min-h-[58px] w-full items-center justify-center gap-2.5 rounded-full px-8 font-body text-[15.5px] font-bold sm:w-auto"
                style={{
                  background: C.ctaGold,
                  /* onAccent, NOT ink: dark ink on the bright cyan pill, 7.7:1.
                     Unchanged by the stage flip — the pill is its own ground. */
                  color: C.onAccent,
                  /* Softened with the stage. A shadow built to seat a pill on a
                     near-black slab reads as smudge under it on near-white. */
                  boxShadow:
                    '0 14px 30px -16px rgba(14,39,51,0.45), 0 10px 28px -10px rgba(6,182,212,0.45)',
                  ['--shimmer' as string]: 'rgba(255,255,255,0.55)',
                }}
              >
                <span className="inline-flex items-center gap-2.5">
                  {CTA_LABEL}
                  <ArrowRight
                    weight="bold"
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </div>

            {/* Welded to the button, never floated away from it. */}
            <p
              className="mt-4 flex items-center justify-center gap-2 text-[13.5px] font-medium lg:justify-start"
              style={{ color: C.inkSoft }}
            >
              {/* Emerald, not the spark. The spark is true red in this palette
                  and a red shield beside a money-back guarantee reads as a
                  warning; emerald is the confirm colour on his own page. */}
              <ShieldCheck weight="fill" className="h-4 w-4 shrink-0" style={{ color: C.emeraldInk }} />
              {CTA_NOTE_HERO}
            </p>

            {/* The three facts, on a hairline rule rather than in boxes. */}
            <ul
              className="mt-9 flex flex-col items-stretch gap-px overflow-hidden rounded-2xl sm:flex-row"
              style={{
                /* This background IS the 1px rules: the rows sit on gap-px and
                   this shows through between them. On the dark stage that meant
                   it had to be BRIGHTER than the rows; now the rows are white,
                   so the same trick needs it DARKER. Same mechanism, inverted
                   relationship — the reason to keep this note. */
                background: C.lineStrong,
                border: `1px solid ${C.line}`,
              }}
            >
              {HERO_FACTS.map(({ icon: Icon, text }, idx) => (
                <li
                  key={text}
                  data-lego=""
                  className="flex flex-1 items-center justify-center gap-2.5 px-4 py-3.5 text-[13px] font-semibold"
                  style={{
                    ...legoDelay(idx, 90),
                    /* Opaque paper. The old value was a translucent dark tile
                       that let the stage glow travel under it; against a light
                       stage the equivalent is a clean white row, and leaving it
                       translucent would let the dot grid read through the
                       type. */
                    background: C.surface,
                    color: C.ink,
                  }}
                >
                  <Icon weight="bold" className="h-4 w-4 shrink-0" style={{ color: C.goldInk }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* ══ RIGHT — the offer card ════════════════════════════════════
              The page's single focal object. There is no video and no
              photography yet, so the offer itself is what catches the light: a
              paper card on the dark stage, ringed in a thin cyan halo, which is
              the oldest trick there is for making one object the focus. The
              card carries the LIGHT page's ink inside it (C12, a local
              re-theme), which is why everything in here reads in the same
              values as the sections below the fold. When a founder clip or a
              stack image lands, it slots into the reserved slot above the
              eyebrow and nothing else has to change. */}
          <div>
            <div
              data-lego=""
              /* Centred on mobile, left from lg up. On a phone the card is the
                 whole screen and a centred stack reads as one deliberate
                 object; on desktop it sits beside a left-aligned headline, and
                 centring it there would break that shared edge. */
              className="rounded-[28px] p-7 text-center sm:p-8 lg:text-left"
              style={{
                ...legoDelay(2, 90),
                /* `surface`, not `canvas`. On the dark stage the card was the
                   only light object and any near-white read as paper; on a
                   light stage canvas (#FAFDFE) is within two steps of the
                   ground and the card stops being an object. Pure white plus
                   the ring below is what still separates it. */
                background: C.surface,
                border: `1px solid ${C.lineStrong}`,
                /* The halo used to be the card's own light bleeding onto a dark
                   slab. It cannot do that job here, so it becomes a plain cyan
                   ring, and the shadow drops from near-black to the ink tint —
                   a 0.6 black shadow under a card on near-white is a bruise. */
                boxShadow:
                  '0 0 0 8px rgba(6,182,212,0.07), 0 28px 60px -34px rgba(14,39,51,0.42)',
              }}
            >
              {/* The offer-stack render, landed 15 Sep. 4:3 is ITS OWN ratio
                  (1448x1086), not the 3:2 the slot was reserved at: the box was
                  a guess and the artwork is the fact, and cropping a render
                  whose whole job is to show the five day cards and the four
                  guides would cut off the thing it is there to show.
                  `priority` because this is the hero's LCP candidate, and the
                  sizes hint is the card's real width, not a viewport fraction:
                  the card is capped, so 100vw would pull a 1440px source down a
                  420px slot. */}
              <Art
                src={asset('/system/offer-stack.webp')}
                alt="Dr. Peeyush Prabhat with the 5-Day Complete Health Reset Challenge: the five live sessions and the four included guides"
                ratio="4 / 3"
                sizes="(min-width: 1024px) 460px, 100vw"
                priority
                className="mb-6"
              />

              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em]"
                style={{ background: C.goldPale, color: C.goldInk }}
              >
                PAIN RELIEF · MIND-BODY RESET · BETTER HEALTH
              </span>

              <h2
                className="mt-4 font-display text-[26px] font-extrabold leading-[1.12]"
                style={{ color: C.ink }}
              >
                5-Day Complete Health Reset Challenge
              </h2>
              <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
                Live doctor-led sessions · Zoom · 2 session timings
              </p>

              <div
                className="mt-6 flex items-baseline justify-center gap-3 border-t pt-6 lg:justify-start"
                style={{ borderColor: C.line }}
              >
                <span className="kz-lit font-display text-[46px] font-extrabold leading-none">
                  {PRICE}
                </span>
                <span className="text-[13px]" style={{ color: C.inkSoft }}>
                  one-time
                </span>
              </div>

              {/* THE breathing CTA. The only one on the page, and the heavier
                  of the two buttons on this screen: a deep teal pill on paper
                  against a cyan pill on the stage. Three things separate them —
                  the fill, the shape (full-width and squared against a pill),
                  and the breath, which only this one carries. */}
              <Link
                href={OTO_HREF}
                data-cta
                className="lego-press cta-shimmer cta-breath group mt-6 inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl font-body text-[15.5px] font-bold"
                style={{
                  background: C.ink,
                  color: C.canvas,
                  ['--shimmer' as string]: 'rgba(34,211,238,0.38)',
                }}
              >
                <span className="inline-flex items-center gap-2.5">
                  {/* CTA_LABEL_CARD, the priceless one. This button sits two
                      rows under the card's own price line, so a label carrying
                      the amount again would read as a second charge. It is the
                      ONLY button on the site worded this way. */}
                  {CTA_LABEL_CARD}
                  <ArrowRight
                    weight="bold"
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </span>
              </Link>

              <p
                className="mt-4 flex items-center justify-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.inkSoft }}
              >
                <Lock weight="fill" className="h-3.5 w-3.5 shrink-0" style={{ color: C.goldInk }} />
                100% Secure · UPI / Card / NetBanking
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="kz-stage-seam" aria-hidden />
      <TrustLedger />
    </>
  );
}

/* ══ 2 · The trust ledger ══════════════════════════════════════════════════
   Four figures on a ruled row, lifted so the card straddles the seam between
   the dark stage and the light page — the join is a designed object rather
   than a colour change.

   The source copy sets these with emoji (⭐ ★ 🛡️ 🩺). They are rendered as
   matched-weight line icons instead: emoji as UI is the single loudest
   template tell, and it renders differently on every device the audience owns.
   The words are untouched.

   One deliberate substitution: the copy marks BOTH the first and second cell
   with a star. Two identical glyphs side by side read as a repeat rather than
   as two different proofs, so the transformations cell takes a Heartbeat and
   the star is spent where the copy actually means a star rating.

   ⚠️ FLAG FOR ATUL: "5.0 Client Rating" names no platform. An unsourced
   perfect score is the weakest proof on the page and the easiest to challenge.
   Rendered verbatim. */
const STATS = [
  {
    icon: Heartbeat,
    big: HEALTH_TRANSFORMATIONS,
    small: 'Health Transformations',
    bed: C.coralBed,
    fg: C.coralInk,
  },
  { icon: Star, big: CLIENT_RATING, small: 'Client Rating', bed: C.goldPale, fg: C.goldInk },
  /* The emerald bed carries the guarantee: on his page emerald is the confirm
     colour. `emeraldInk` rather than `emerald`, because this is a 20px glyph on
     a pale mint bed and his bright value is 1.5:1 there — the deep step holds
     4.9:1. That rule runs page-wide: on light, emerald is the ink step. */
  {
    icon: ShieldCheck,
    big: '100%',
    small: 'Money-Back Guarantee',
    bed: C.navyBed,
    fg: C.emeraldInk,
  },
  {
    icon: Stethoscope,
    big: 'Doctor-Led',
    small: 'Live Guidance',
    bed: C.goldPale,
    fg: C.goldInk,
  },
];

function TrustLedger() {
  return (
    <div className="relative z-10 mx-auto -mt-14 max-w-[1120px] px-5 md:px-8">
      <ul
        className="grid grid-cols-2 gap-x-5 gap-y-7 rounded-3xl px-6 py-8 sm:px-9 lg:grid-cols-4"
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          boxShadow: '0 26px 54px -30px rgba(14,39,51,0.35)',
        }}
      >
        {STATS.map(({ icon: Icon, big, small, bed, fg }, idx) => (
          /* lego-hover-icon: the whole row is the hover target so the hit area
             stays generous, but only the glyph moves. Lifting a figure drags
             the eye off the number, which is the one thing worth reading. */
          <li
            key={small}
            data-lego=""
            className="lego-hover-icon flex items-center gap-3.5"
            style={legoBrick(idx, 85)}
          >
            <span
              data-lego-stud=""
              className="lego-stud grid h-11 w-11 shrink-0 place-items-center rounded-full"
              style={{ ...legoBrick(idx, 85), background: bed }}
            >
              <Icon weight="fill" className="h-5 w-5" style={{ color: fg }} />
            </span>
            <span className="leading-tight">
              <span
                className="block font-display text-[20px] font-extrabold"
                style={{ color: C.ink }}
              >
                {big}
              </span>
              <span className="mt-0.5 block text-[12.5px]" style={{ color: C.inkSoft }}>
                {small}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

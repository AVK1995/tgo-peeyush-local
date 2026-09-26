'use client';

/**
 * Everything below the hero, in the order COPY-SOURCE.md sets out:
 *
 *   7  Testimonials .............. ./proof   ← HOISTED, see the note below
 *   3a THE RESULTS ............... this file
 *   3b What you'll experience .... this file
 *   4  Your 5-Day Schedule ....... this file  ← the signature beat
 *   5  Live sessions band ........ this file
 *   5b Recognition (YouTube/TEDx)  this file
 *   6  Does this sound like you? . ./proof
 *   8  The toolkit ............... ./toolkit
 *   9  Meet your guide ........... ./close
 *  10  Why this works ............ ./close
 *  11  Two options ............... ./close
 *  12  Recap + final CTA ......... ./close  ← the premium peak
 *  13  Disclaimer + colophon ..... ./close
 *
 * COPY IS VERBATIM. Where the source wraps a sentence across several lines it
 * is joined back into one string; no wording, ordering or punctuation is
 * changed, and nothing is added.
 *
 * ⚠️ NO SECOND STATS BAND IS BUILT HERE, deliberately. The source copy carries
 * exactly one set of figures (1000+ · 5.0 ★ · 100% · Doctor-Led) and those are
 * already the trust ledger straddling the hero seam. A second band would have to
 * invent numbers, so THE RESULTS takes that slot instead: it is the beat the
 * copy actually has here and it had not been built yet.
 */
import {
  ArrowRight,
  Bone,
  Brain,
  CalendarBlank,
  Clock,
  Compass,
  Fire,
  FlowerLotus,
  ForkKnife,
  HandHeart,
  Lightning,
  Microphone,
  MicrophoneStage,
  Moon,
  Pulse,
  ShieldPlus,
  Television,
  UsersThree,
  VideoCamera,
  Wind,
  YoutubeLogo,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import Close from './close';
import { legoBrick, legoDelay } from './lego-style';
import { domAnimation, LazyMotion } from './motion-lite';
import {
  OTO_HREF,
  CTA_LABEL,
  CTA_NOTE,
  SESSION_TIMES,
  SESSION_TIMES_TZ,
} from './offer';
import { Recognition, Testimonials } from './proof';
import { C, SectionHeading } from './shared';
import Toolkit from './toolkit';

/* Three beds, rotated. Not seven: the brand has three colours, and a card grid
   that cycles a rainbow reads as decoration rather than as a set.

   Each bed carries its OWN accent as the glyph, and every one of these beds is
   a PALE bed on a LIGHT band, so all three glyphs take the deep step: goldInk,
   coralInk, emeraldInk. The bright values (C.gold, C.emerald) are 2.4:1 and
   1.5:1 on their own beds, so they belong on the dark stage, not here. Same rule
   the trust ledger in ./hero follows. */
const BEDS = [
  { bed: C.goldPale, fg: C.goldInk },
  { bed: C.coralBed, fg: C.coralInk },
  { bed: C.navyBed, fg: C.emeraldInk },
];

/* ══ 3a · THE RESULTS ══════════════════════════════════════════════════════
   Seven domains, thirty-three named items. The structure is BREADTH — "this
   touches every one of these systems" — and breadth of this density is an
   INDEX, not a card grid.

   So it is rendered boxless: each domain is an icon + a title over a hairline
   ledger of its items, tiled in columns. That matters because the section
   immediately below it (the Experience beat) is a grid of lifted cards, and two
   card grids back to back read as one very long section the eye gives up on.
   Different structure, different form.

   Two deliberate restraints:

   1. NO TICK MARKS. Every item is the NAME OF A SYMPTOM ("Chronic body aches",
      "High BP"), sitting under a heading about changes you can begin to notice.
      A green check beside "Bronchial asthma" turns a list of areas into a list
      of cures, which is a claim this page's own disclaimer says it does not
      make. A neutral hairline dash carries the list without adding a promise.
   2. The heading and every item are verbatim, including "Feeling calmer,
      clearer & more positive", which is the one positively-worded item in an
      otherwise symptom-worded set.

   ⚠️ FLAG FOR ATUL: the copy's note "Each section to come with icons (as shown
   in the reference snip above)" had no snip attached, so the seven glyphs are
   chosen here (Phosphor, matched weight, one per domain, never emoji). */
const RESULTS: { icon: React.ElementType; title: string; items: string[] }[] = [
  {
    icon: Bone,
    title: 'Pain, Stiffness & Everyday Discomfort',
    items: [
      'Chronic body aches',
      'Neck, back, knee and joint pain',
      'Muscle tension and stiffness',
      'Recurring headaches & migraines',
    ],
  },
  {
    icon: Brain,
    title: 'Stress, Anxiety, Sleep & Mental Clarity',
    items: [
      'Chronic stress and anxiety',
      'Restlessness and panic',
      'Poor or disturbed sleep',
      'Mental fatigue & low focus',
      'Feeling calmer, clearer & more positive',
    ],
  },
  {
    icon: Fire,
    title: 'Energy, Metabolism & Weight',
    items: [
      'Low energy & constant fatigue',
      'Poor recovery',
      'Sluggish metabolism',
      'Unexplained weight gain',
      'Insulin resistance & blood-sugar imbalance',
    ],
  },
  {
    icon: Pulse,
    title: 'Lifestyle Health Concerns',
    items: [
      'High BP',
      'High blood sugar / diabetes',
      'High cholesterol',
      'Inflammation',
      'Hormonal imbalance',
    ],
  },
  {
    /* Wind, not a pair of lungs: this Phosphor build has no Lungs glyph, and
       Wind is already the page's breathing mark in ./toolkit. */
    icon: Wind,
    title: 'Breathing & Respiratory Health',
    items: [
      'Dysfunctional breathing patterns',
      'Bronchial asthma',
      'Breathlessness & poor breathing efficiency',
      'Recurring cold & cough tendencies',
      'Lower respiratory resilience',
    ],
  },
  {
    icon: ForkKnife,
    title: 'Digestion & Gut Health',
    items: [
      'Acidity',
      'Bloating',
      'Poor digestion',
      'Gut discomfort',
      'Stress-linked digestive issues',
    ],
  },
  {
    icon: ShieldPlus,
    title: 'Immunity & Overall Recovery',
    items: [
      'Low immunity',
      'Frequent minor illnesses',
      'Feeling run-down easily',
      'Slower recovery & reduced resilience',
    ],
  },
];

function Results() {
  return (
    <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvasAlt }}>
      <SectionHeading eyebrow="THE RESULTS">
        The Changes You Can Begin to Notice Across Your{' '}
        <span style={{ color: C.goldDeep }}>Body, Mind &amp; Health</span>
      </SectionHeading>

      {/* Column-masonry rather than a grid: the seven domains carry four or five
          items each, so a grid would leave a ragged row of half-empty cells.
          Columns let each domain take exactly the height it needs, and a boxed
          domain in a grid would stretch to its row's tallest sibling and end on
          a pocket of dead space. The 20px column gap matches the Experience
          grid's gap-5 so the two card beats sit on the same rhythm. */}
      <ul
        className="kz-masonry mx-auto mt-12 max-w-[1120px]"
        style={{ columnGap: '20px' }}
      >
        {RESULTS.map(({ icon: Icon, title, items }, idx) => {
          const skin = BEDS[idx % BEDS.length];
          return (
            <li
              key={title}
              data-lego=""
              className="lego-hover rounded-3xl p-6 sm:p-7"
              style={{
                ...legoBrick(idx),
                /* Boxed, on the same anatomy as the Experience cards: white
                   `surface`, a hairline edge and a 3px rule along the top in
                   the domain's own bed colour. No seat shadow here, unlike
                   Experience: that beat is on `canvas` where white-on-near-white
                   needs lifting, and this one is on the `canvasAlt` band, which
                   is 4% darker, so the hairline alone draws the edge. */
                background: C.surface,
                border: `1px solid ${C.line}`,
                borderTop: `3px solid ${skin.bed}`,
                /* .kz-masonry ships a 16px bottom margin for the screenshot
                   wall it was written for; 20px matches the column gap so the
                   grid reads square. */
                marginBottom: '20px',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  data-lego-stud=""
                  className="lego-stud grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                  style={{ ...legoBrick(idx), background: skin.bed }}
                >
                  <Icon weight="duotone" className="h-[22px] w-[22px]" style={{ color: skin.fg }} />
                </span>
                <h3
                  className="font-display text-[17px] font-extrabold leading-[1.25]"
                  style={{ color: C.ink }}
                >
                  {title}
                </h3>
              </div>

              {/* The rules go back to `--line` now that the group is boxed:
                  the token is drawn for white cards, where it reads at 1.23:1.
                  It was stepped up to `lineStrong` only while this beat sat
                  boxless on the band, where `--line` is 1.11:1 and the rules
                  were the only structure the domain had. The border and the row
                  rules must stay one colour, and `.kz-ledger > li + li` in
                  globals.css draws the rows off `var(--line)`, so the top
                  border reads the same token rather than a literal. */}
              <ul
                className="kz-ledger mt-4"
                style={{ borderTop: `1px solid ${C.line}` }}
              >
                {items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 py-2.5 text-[14.5px] leading-[1.45]"
                    style={{ color: C.inkSoft }}
                  >
                    {/* goldDeep, not goldMid. `goldMid` is the hairline accent
                        for a DARK ground (8.9:1 there); on this band it is
                        1.7:1, so a 1px dash in it is a dash nobody can see, and
                        thirty-three list items would lose their marker. The deep
                        step is 3.4:1 on the band: a quiet rule, still not a
                        tick. */}
                    <span
                      aria-hidden
                      className="mt-[10px] h-px w-3 shrink-0"
                      style={{ background: C.goldDeep }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ══ 3b · Here's What You'll Experience In Just 5 Days ═════════════════════
   Seven parallel capabilities, each with a title and a body. A set, not a
   sequence — so it is a grid of equal pieces, and the ordering carries no
   meaning the reader has to follow. */
const EXPERIENCE = [
  {
    icon: VideoCamera,
    title: 'Live, Doctor-Led Sessions',
    body: 'Join Dr. Peeyush live on Zoom every day for guided practical sessions, real-time interaction and support you can actively participate in from home.',
  },
  {
    icon: HandHeart,
    title: 'Relief From Everyday Pain & Discomfort',
    body: 'Experience practices designed to help your body feel less tense, stiff and uncomfortable, especially if recurring aches have slowly become your new normal.',
  },
  {
    icon: Lightning,
    title: 'More Energy Through Your Day',
    body: 'Begin noticing what helps you feel more active, refreshed and energised, instead of constantly pushing through tiredness and afternoon crashes.',
  },
  {
    icon: FlowerLotus,
    title: 'A Calmer Mind & Body',
    body: 'Experience what it feels like when your body genuinely begins to slow down and relax, even if stress, anxiety or restlessness have made that difficult lately.',
  },
  {
    icon: Moon,
    title: 'Better Rest & Recovery',
    body: "Support your body in feeling more settled, rested and recovered, so poor sleep and constant exhaustion don't keep controlling your day.",
  },
  {
    icon: Compass,
    title: 'A Better Understanding of Your Own Body',
    body: 'Start recognising the signals your body has been giving you and understand why pain, fatigue, stress, sleep and other health concerns may not always exist in isolation.',
  },
  {
    icon: UsersThree,
    title: 'A Supportive Health Community',
    body: 'Be part of a supportive community where people with similar health concerns learn, participate and take meaningful steps towards better health together.',
  },
];

function Experience() {
  return (
    <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvas }}>
      <SectionHeading sub="Don't take our word for it. Experience the approach live and start noticing the difference in how your body feels, responds and recovers across 5 days.">
        Here&apos;s What You&apos;ll Experience{' '}
        <span style={{ color: C.goldDeep }}>In Just 5 Days</span>
      </SectionHeading>

      <ul className="mx-auto mt-14 grid max-w-[1120px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EXPERIENCE.map(({ icon: Icon, title, body }, idx) => {
          /* Seven cards leave a single orphan in the last row at both
             breakpoints (2-col: 3 rows + 1 · 3-col: 2 rows + 1). The orphan
             spans the full row but is width-capped and centred, so it reads as
             one normal card rather than a stranded left-aligned one. The
             widths mirror the gap-5 (20px) track maths at each breakpoint. */
          const isOrphan = idx === EXPERIENCE.length - 1;
          const placement = [
            isOrphan && EXPERIENCE.length % 2 === 1
              ? 'sm:col-span-2 sm:mx-auto sm:w-full sm:max-w-[calc(50%-10px)]'
              : '',
            isOrphan && EXPERIENCE.length % 3 === 1
              ? 'lg:col-span-3 lg:mx-auto lg:max-w-[calc(33.333%-13.334px)]'
              : '',
          ]
            .filter(Boolean)
            .join(' ');
          const skin = BEDS[idx % BEDS.length];

          return (
            <li
              key={title}
              data-lego=""
              className={`lego-hover flex flex-col rounded-3xl p-7 ${placement}`}
              style={{
                ...legoBrick(idx),
                /* `surface` (white) on this section's `canvas` ground. The two
                   are 1.5% apart in value, so on a LIGHT page the fill is not
                   what makes this a card: the hairline draws the edge and the
                   teal-tinted shadow seats it. Both are required here: a white
                   card on near-white with neither is a paragraph. Teal, never
                   neutral black: black under a cyan brand reads as dirt. */
                background: C.surface,
                border: `1px solid ${C.line}`,
                boxShadow: '0 18px 44px -26px rgba(14,39,51,0.34)',
                /* A 3px rule along the top edge ties the card to its bed
                   without letting colour take a large area. */
                borderTop: `3px solid ${skin.bed}`,
              }}
            >
              <span
                data-lego-stud=""
                className="lego-stud grid h-12 w-12 place-items-center rounded-2xl"
                style={{ ...legoBrick(idx), background: skin.bed }}
              >
                <Icon weight="duotone" className="h-6 w-6" style={{ color: skin.fg }} />
              </span>
              <h3
                className="mt-5 font-display text-[19px] font-extrabold leading-snug"
                style={{ color: C.ink }}
              >
                {title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                {body}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ══ 4 · Your 5-Day Schedule ═══════════════════════════════════════════════
   The signature beat, and the page's ONE heavy motion moment.

   Five days is a genuine sequence: the copy's own deck says each day "takes you
   one step deeper", so the structure is a spine with a filling rail rather than
   five cards in a row. The rail's progress is a single CSS variable written by
   a rAF-throttled scroll handler; nodes ignite as the fill reaches them.
 */
const DAYS = [
  {
    n: 'DAY 01',
    title: 'Decode What Your Health Problems May Have in Common',
    body: 'Quick health assessment + discover the hidden connection between seemingly different health concerns, followed by your first guided activation experience.',
  },
  {
    n: 'DAY 02',
    title: 'Fix the Breathing Dysfunction Draining Your Energy',
    body: 'Identify hidden breathing patterns that may be affecting your energy + learn a complete 3-level breathing practice to help your body breathe and function better.',
  },
  {
    n: 'DAY 03',
    title: 'Switch Off the Survival Mode Keeping Your Body on Edge',
    body: "Discover why your body can remain stuck in fight-or-flight + experience Dr. Peeyush's guided relaxation response to help your system settle and recover.",
  },
  {
    n: 'DAY 04',
    title: 'Release the Emotional Load Your Body Keeps Holding Onto',
    body: 'Discover how prolonged emotional stress can influence your physical health + experience a guided somatic practice designed to help release stored tension.',
  },
  {
    n: 'DAY 05',
    title: 'Build Your Complete Health Reset Routine',
    body: 'Bring all five days together with healing practices, daily health habits and simple diet-balancing principles + see how to turn what you experienced into a repeatable routine.',
  },
];

/**
 * Scroll-linked progress for the spine.
 *
 * Writes `--tl-p` (0 → 1) straight onto the <ol> node, so the rail fills
 * without React re-rendering once per frame. The only React state is `active`,
 * which changes five times per pass at most.
 *
 * The "read line" sits at 62% of the viewport height rather than the middle: a
 * day should light as it arrives at the comfortable reading position, not once
 * it has already gone past.
 */
function useSpineProgress(count: number) {
  const olRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const ol = olRef.current;
    if (!ol) return;

    // Reduced motion: show the finished state and never listen to scroll.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ol.style.setProperty('--tl-p', '1');
      setActive(count - 1);
      return;
    }

    let raf = 0;
    const measure = () => {
      raf = 0;
      const box = ol.getBoundingClientRect();
      if (!box.height) return;

      const line = window.innerHeight * 0.62;
      const p = Math.min(1, Math.max(0, (line - box.top) / box.height));
      ol.style.setProperty('--tl-p', p.toFixed(4));

      /* offsetTop is no use here: each node's offsetParent is its own <li>,
         not the list. Both rects are current, so the difference is the node's
         position within the rail. */
      const travelled = p * box.height;
      let last = -1;
      ol.querySelectorAll<HTMLElement>('[data-tl-node]').forEach((node, i) => {
        const r = node.getBoundingClientRect();
        if (travelled >= r.top + r.height / 2 - box.top) last = i;
      });
      setActive(last);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [count]);

  return { olRef, active };
}

function Schedule() {
  const { olRef, active } = useSpineProgress(DAYS.length);

  return (
    <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvasAlt }}>
      <SectionHeading
        sub={`Each day takes you one step deeper into understanding how your energy, breathing, nervous system, emotions and daily habits can influence the way your body feels and recovers. Join live at ${SESSION_TIMES_TZ}.`}
      >
        Your <span style={{ color: C.goldDeep }}>5-Day Schedule</span>
      </SectionHeading>

      {/* Alternating spine. The rail is centred on desktop and slides to the
          left edge on mobile, where a zig-zag has no room. */}
      <ol ref={olRef} className="relative mx-auto mt-14 max-w-[920px]">
        <span aria-hidden className="tl-rail">
          <span className="tl-fill" />
        </span>

        {DAYS.map((d, i) => {
          const left = i % 2 === 0; // card in the left column on desktop
          return (
            <li
              key={d.n}
              className={`relative mb-6 pl-14 sm:mb-9 sm:w-1/2 sm:pl-0 ${
                left ? 'sm:pr-12 sm:text-right' : 'sm:ml-auto sm:pl-12'
              }`}
            >
              {/* Positioning lives on the outer span and the snap animation on
                  the inner one: one element cannot both hold a centring
                  translate and keyframe its transform. */}
              <span
                data-tl-node
                className={`tl-node ${left ? 'tl-node-right' : 'tl-node-left'} ${
                  i <= active ? 'is-on' : ''
                }`}
              >
                <span aria-hidden className="tl-node-ring" />
                <span className="tl-node-inner">{i + 1}</span>
              </span>

              {/* data-lego-loop, not data-lego: this is the ONE run on the page
                  that replays on every scroll pass, because the spine is meant
                  to be re-read. */}
              <div
                data-lego-loop="x"
                className="lego-hover rounded-2xl p-6"
                style={{
                  ...legoDelay(0),
                  ['--lego-from' as string]: left ? '26px' : '-26px',
                  border: `1px solid ${i <= active ? C.lineStrong : C.line}`,
                  /* The day card is a CARD: it lifts off the band, and the
                     border brightens as the rail reaches it. Leaving it on
                     canvas would have made the lit node hang beside a hole. */
                  background: C.surface,
                }}
              >
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    left ? 'sm:flex-row-reverse' : ''
                  }`}
                  style={{ background: C.coralBed, color: C.coralInk }}
                >
                  <CalendarBlank weight="bold" className="lego-stud h-3 w-3" />
                  {d.n}
                </span>
                <h3
                  className="mt-3.5 font-display text-[20px] font-extrabold leading-snug"
                  style={{ color: C.ink }}
                >
                  {d.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                  {d.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ══ 5 · Live Sessions, Twice A Day ════════════════════════════════════════
   A CTA band, not a section with a structure: two timings and a click.

   THIS IS ONE OF THE PAGE'S THREE CONTAINED DARK OBJECTS (with the Option 2
   card and the video bed), which is the only way dark is allowed to appear
   below the hero: as an OBJECT inside a light band, never as a band. It is the
   stage floor, lifted onto the page, and it is the loudest thing in this section
   because it is the only dark shape in it.

   Three things seat it, and all three are light-page devices:
     · a CYAN hairline, not the page's grey rule. `--line` is a light grey and
       on a #06141C card it draws a white ring around the object.
     · a wash of its own light over the top edge, so it is lit rather than flat.
     · a teal-tinted drop shadow underneath. On a light ground a dark object is
       seated by a SHADOW; the cyan bloom is kept low, because a bloom is the
       dark-page device and at full strength on white it reads as a spotlight
       someone left switched on. */
function SessionsBand() {
  return (
    <section className="px-4 py-14" style={{ background: C.canvas }}>
      <div
        className="mx-auto max-w-[920px] rounded-[28px] px-6 py-12 text-center sm:px-12"
        style={{
          background: `radial-gradient(ellipse 92% 62% at 50% 0%, rgba(6,182,212,0.12), transparent 64%), ${C.navyDeep}`,
          border: '1px solid rgba(6,182,212,0.22)',
          boxShadow:
            '0 0 46px -24px rgba(6,182,212,0.2), 0 30px 60px -34px rgba(14,39,51,0.45)',
        }}
      >
        <span
          data-lego=""
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
          style={{ background: 'rgba(6,182,212,0.16)', color: C.gold }}
        >
          <Clock weight="bold" className="h-3 w-3" />
          Live Sessions, Twice A Day
        </span>

        <h2
          className="mx-auto mt-6 max-w-[620px] font-display text-[clamp(26px,3.8vw,38px)] font-extrabold leading-[1.16]"
          style={{ color: C.onDark }}
        >
          {SESSION_TIMES}, <span style={{ color: C.gold }}>live on Zoom</span>.
        </h2>
        <p className="mt-3 text-[15.5px]" style={{ color: C.onDarkMute }}>
          Pick whichever time fits your day.
        </p>

        <div className="mx-auto mt-8 flex max-w-[430px] flex-col items-center">
          <Link
            href={OTO_HREF}
            data-cta
            className="lego-press cta-shimmer group inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-full px-7 font-body text-[15px] font-bold"
            style={{
              background: C.ctaGold,
              /* onAccent, NEVER ink. Ink is white in this palette and white on
                 this cyan is 2.4:1; the dark label is 7.7:1. */
              color: C.onAccent,
              boxShadow: '0 10px 30px -12px rgba(6,182,212,0.5)',
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
          <p className="mt-3.5 text-[13.5px] font-medium" style={{ color: C.onDarkMute }}>
            {CTA_NOTE}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ══ 5b · Recognition ══════════════════════════════════════════════════════
   §12 AUTHORITY, as a credential ledger rather than a paragraph.

   The source sentence is "His work has reached 1M+ people on YouTube, along
   with appearances on TEDx, Josh Talks and television." That is a SET of four
   credentials wearing the clothes of a sentence, and a set scans as a set: one
   figure and three named stages, on a hairline grid.

   Three notes, all of which need Atul rather than a designer:

   ⚠️ 1. The set is DUPLICATED. Those exact words also sit inside the founder
   bio in ./close (pass 3), where they must stay verbatim. A credential strip
   here plus the same clause in the bio 1500px later is the normal pill-row
   pattern (chips beside the portrait), but here they are separated, so it reads
   twice. If that grates on the live page, the fix is to cut the CLAUSE from the
   bio, not this band — and that is a copy edit, so it is flagged, not made.

   ⚠️ 2. The copy supplies NO heading and NO eyebrow for a standalone
   recognition beat, so this band runs without one rather than with an invented
   "AS SEEN ON". If you want a line here, NO-BRAINER should write it.

   ⚠️ 3. No TEDx / Josh Talks / television stills exist. Glyphs are a permanent
   answer rather than a placeholder, so nothing is reserved: if stills do land,
   they slot in as a 16:9 four-up above this ledger without disturbing it. */
const RECOGNITION = [
  { icon: YoutubeLogo, big: '1M+', small: 'people on YouTube' },
  { icon: MicrophoneStage, big: 'TEDx', small: 'appearances' },
  { icon: Microphone, big: 'Josh Talks', small: 'appearances' },
  { icon: Television, big: 'Television', small: 'appearances' },
];

function RecognitionBand() {
  return (
    <section className="px-4 py-12 sm:py-14" style={{ background: C.canvasAlt }}>
      {/* gap-px over a line-coloured ground is the hairline grid: four cells
          divided by one pixel of rule, no boxes inside boxes. */}
      <ul
        className="mx-auto grid max-w-[1000px] grid-cols-2 gap-px overflow-hidden rounded-3xl lg:grid-cols-4"
        style={{ background: C.line, border: `1px solid ${C.line}` }}
      >
        {RECOGNITION.map(({ icon: Icon, big, small }, idx) => (
          <li
            key={big}
            data-lego=""
            className="lego-hover-icon flex flex-col items-center gap-2.5 px-5 py-8 text-center"
            /* The cells are the raised object; the 1px gaps are the rule
               showing through from the <ul> behind them. So the cell sits above
               the band it is on (surface > canvasAlt) and the rule stays
               brighter than the cell (line > surface). On canvas the four
               credentials read as four holes cut in the band instead. */
            style={{ ...legoBrick(idx, 85), background: C.surface }}
          >
            <span
              data-lego-stud=""
              className="lego-stud grid h-11 w-11 place-items-center rounded-full"
              style={{ ...legoBrick(idx, 85), background: C.goldPale }}
            >
              <Icon weight="fill" className="h-5 w-5" style={{ color: C.goldInk }} />
            </span>
            <span
              className="font-display text-[20px] font-extrabold leading-none"
              style={{ color: C.ink }}
            >
              {big}
            </span>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkSoft }}
            >
              {small}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function BelowFold() {
  /* LazyMotion mounts the single IntersectionObserver that adds `bw-in` to
     revealed elements. Without it every .bw-reveal-* stays at opacity 0 once
     .bw-js is on the document. */
  return (
    <LazyMotion features={domAnimation}>
      {/* ⚠️ TESTIMONIALS FIRST, since 24 Sep (Atul's call). They were beat 7,
          after the schedule and the recognition band; they now open everything
          below the hero, so the first thing after the offer is other people
          saying it worked.

          It is the FIRST child of this component on purpose: `BelowFold` is
          rendered immediately after `<Hero />` in app/page.tsx, so first here
          is "directly below the hero" without moving the block out of the
          deferred chunk and onto the critical path.

          "Does this sound like you?" did NOT move with it — see the note on
          `Testimonials` in ./proof for why that beat has to stay in argument
          order. */}
      <Testimonials />
      <Results />
      <Experience />
      <Schedule />
      <SessionsBand />
      <RecognitionBand />
      <Recognition />
      <Toolkit />
      <Close />
    </LazyMotion>
  );
}

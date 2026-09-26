'use client';

/**
 * The closing half of the page: the guide, the mechanism, the decision, the
 * recap and the colophon.
 *
 *   9  Meet your guide ....... Guide      (blueprint beat 10 · AUTHORITY)
 *  10  Why this works ........ Mechanism  (beat 12 · SEQUENCE)
 *  11  Two options ........... TwoOptions (beat 14 · CONTRAST)
 *  12  Recap + final CTA ..... Recap      (beat 15 · the premium peak)
 *  13  Disclaimer + legal .... Colophon   (beat 16, via the shared SiteFooter)
 *
 * ⚠️ THERE IS NO "THE RESULTS" SECTION HERE. The Kaizen build had one in this
 * file, about women and menopause; THE RESULTS on this page is the seven-domain
 * index at the top of ./below-fold, which is the beat the source copy actually
 * writes. Two sections under one title is the failure this note exists to
 * prevent — do not re-add one here.
 *
 * BAND RHYTHM. The page alternates ground / band the whole way down, and
 * removing the stale section flipped the parity of this tail. It is restored
 * here rather than absorbed: Toolkit (ground) → Guide (band) → Mechanism
 * (ground) → TwoOptions (band) → Recap (ground) → footer (the deepest ink).
 *
 * BOTH tones are LIGHT (`canvas` and `canvasAlt`). That is the blueprint's
 * rhythm and it governs here, not his own site's, which is dark end to end. The
 * only dark below the hero is a contained OBJECT inside a light band: in this
 * file that is the Option 2 card and the footer, and nothing else. A dark
 * SECTION anywhere in this tail is the bug an earlier pass introduced.
 *
 * The recap's 7px frame ring is canvas-coloured, so on the ground it merges with
 * the page and the cyan ring outside it reads as a single drawn rule. If that
 * section ever moves onto the band, the ring has to move with it.
 *
 * COPY IS VERBATIM. Three things in the source are rendered as written and
 * flagged rather than quietly corrected — see the notes on Guide (a duplicated
 * credential clause and two orphan direction notes), the guarantee (stated with
 * no window anywhere in the copy) and TwoOptions (a bracketed button label).
 */
import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  ArrowsClockwise,
  BowlFood,
  Check,
  HandHeart,
  Minus,
  Plus,
  Quotes,
  Waves,
  Wind,
  YinYang,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

import SiteFooter from '@/components/SiteFooter';

import { asset } from './asset-version';
import { legoDelay } from './lego-style';
import {
  OTO_HREF,
  CTA_LABEL,
  CTA_NOTE,
  INCLUDED,
  INCLUDED_TOTAL,
  inr,
  PRICE,
  SESSION_TIMES,
  START_DATE,
} from './offer';
import { C, CtaNote, MediaPlaceholder, PrimaryCTA, SectionHeading } from './shared';

/* ══ 9 · Meet your guide ═══════════════════════════════════════════════════
 *
 * NO COMPONENT. This one is prose and stays prose.
 *
 * A founder's story has no inherent structure — no sequence, no contrast, no
 * set — and forcing one onto it (a fake timeline, three "pillar" cards cut out
 * of his paragraphs) is the design equivalent of inventing a claim. So this is
 * clean, well-set type on a capped measure, with ONE object in it: the
 * pull-quote, which is editorial scaffolding rather than a manufactured
 * structure.
 *
 * PHOTOGRAPHY LANDED 16 Sep 2026. The left column is the 3:4 portrait and
 * nothing else; the two reserved squares that sat under it are gone, because
 * the appearances they were holding space for are now the two photo rails under
 * the bio.
 *
 * ⚠️ FLAG FOR ATUL 1 — A DUPLICATED CLAUSE. "His work has reached 1M+ people on
 * YouTube, along with appearances on TEDx, Josh Talks and television" is
 * rendered here verbatim, as the copy writes it. The SAME four credentials are
 * already a ledger band in ./below-fold (pass 2 flagged this), roughly 1500px
 * up the page, so a reader meets them twice. That is the normal pattern when
 * the chips sit beside the portrait, but here they are separated, so it reads
 * as a repeat rather than as a caption. The fix, if it grates on the live page,
 * is to cut the CLAUSE from this paragraph, not to cut the band — and that is a
 * copy edit, so it is flagged, not made.
 *
 * THE TWO ORPHAN DIRECTION NOTES ARE ANSWERED. The source copy repeats "Move
 * from right to left" and "Move from left to right" immediately under this bio
 * with nothing between them, and for three passes nothing was built for them,
 * because inventing what travelled in them would have been inventing proof.
 * Atul supplied the photographs on 16 Sep: they are now two `kz-rail` rows in
 * those two directions, run on the same machinery as the testimonial rails in
 * ./proof.
 */
/* RESOLVED 16 Sep 2026. The portrait landed, and the two reserved squares under
   it are gone: in their place are the two photo rails the source copy's own
   "Move from right to left" / "Move from left to right" notes asked for.

   Every path goes through asset() so the version is the cache key: a photograph
   replaced under the same filename reaches nobody otherwise. Bump ASSET_V in the
   same pass as any in-place replacement. */
const PORTRAIT = asset('/gallery/peeyush-portrait.webp');

/**
 * The two rails under the bio.
 *
 * Each photograph keeps its OWN width. The two folders hold a mix of 3:2
 * landscape, 3:4 portrait, 4:3 and one 2.2:1 panorama, and forcing that into a
 * uniform card would crop a head out of a frame in a section whose whole job is
 * to show the man himself. So the rail fixes the HEIGHT and lets width follow
 * the picture, which is how a contact strip reads anyway.
 *
 * The files are pre-sized to exactly 560px tall, so `w` and `h` below are the
 * real intrinsic dimensions. They are declared rather than measured at runtime
 * because a rail of thirty images whose widths arrive one network response at a
 * time would reflow the row under the reader's eye as it scrolls.
 *
 * Row one is his public appearances, row two the people he is photographed
 * with, which is the split the two folders already make.
 */
type Shot = { src: string; w: number; h: number };

const ROW_APPEARANCES: Shot[] = [
  { src: asset('/gallery/feature-0t9a0473.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-dsc01521.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-dsc01522.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-dr-peeyush-prabhat-tedx-jpg.webp'), w: 420, h: 560 },
  { src: asset('/gallery/feature-img-0163.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-img-7841.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-img-7842-1.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-img-9846.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-lamping.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-tedx-png.webp'), w: 420, h: 560 },
  { src: asset('/gallery/feature-wa-2023-04-02-at-19-00-46-2.webp'), w: 750, h: 560 },
  { src: asset('/gallery/feature-img-0153.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-img-20250821-182825.webp'), w: 1243, h: 560 },
  { src: asset('/gallery/feature-speking-tree-2.webp'), w: 420, h: 560 },
  { src: asset('/gallery/feature-dsc9893.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-dsc9901.webp'), w: 840, h: 560 },
  { src: asset('/gallery/feature-dsc9968.webp'), w: 840, h: 560 },
];

const ROW_PEOPLE: Shot[] = [
  { src: asset('/gallery/people-award-with-poonam-dillon.webp'), w: 840, h: 560 },
  { src: asset('/gallery/people-dsc02587.webp'), w: 840, h: 560 },
  { src: asset('/gallery/people-img-0162.webp'), w: 840, h: 560 },
  { src: asset('/gallery/people-tedx.webp'), w: 420, h: 560 },
  { src: asset('/gallery/people-wa-2023-04-02-at-18-58-07.webp'), w: 747, h: 560 },
  { src: asset('/gallery/people-wa-2023-04-02-at-18-59-54.webp'), w: 747, h: 560 },
  { src: asset('/gallery/people-wa-2023-04-02-at-19-00-46-1.webp'), w: 420, h: 560 },
  { src: asset('/gallery/people-wa-2024-09-15-at-15-06-18-b754354c.webp'), w: 420, h: 560 },
  { src: asset('/gallery/people-wa-2024-09-15-at-15-06-19-96374f7d.webp'), w: 420, h: 560 },
  { src: asset('/gallery/people-wa-2024-11-14-at-3-47-30-pm.webp'), w: 500, h: 560 },
  { src: asset('/gallery/people-wa-2025-07-13-at-1-58-35-pm.webp'), w: 420, h: 560 },
  { src: asset('/gallery/people-img-1-1723179744289.webp'), w: 840, h: 560 },
];

/**
 * One self-scrolling row, on the same `kz-rail` machinery as the testimonial
 * rails in ./proof: the track holds the set TWICE and travels exactly -50%, so
 * the loop is seamless, and the duplicate is aria-hidden so a screen reader
 * hears each photograph once.
 *
 * No card, no mat, no caption. These are documentary frames rather than
 * exhibits, and thirty of them in thirty white boxes would read as a stock
 * grid. A hairline and a soft radius, and the photographs do the work.
 */
function PhotoRail({ shots, reverse = false, label }: { shots: Shot[]; reverse?: boolean; label: string }) {
  return (
    <div className="kz-rail" role="region" aria-label={label}>
      <div className={`kz-rail-track${reverse ? ' kz-rail-track--reverse' : ''}`}>
        {[0, 1].map((copy) =>
          shots.map((shot, idx) => (
            <figure
              key={`${copy}-${idx}`}
              aria-hidden={copy === 1 ? true : undefined}
              className="h-[140px] shrink-0 overflow-hidden rounded-2xl sm:h-[176px]"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.src}
                alt=""
                width={shot.w}
                height={shot.h}
                loading="lazy"
                decoding="async"
                /* Height is fixed by the figure, width follows the picture. The
                   intrinsic pair above still ships so the browser reserves the
                   right width before the bytes arrive. */
                className="h-full w-auto max-w-none object-cover"
              />
            </figure>
          )),
        )}
      </div>
    </div>
  );
}

/* One slot. Renders the real image when a path exists and a reserved box at the
   same ratio when it does not, so the two states are never different sizes. */
function GuideShot({
  src,
  ratio,
  label,
  alt,
}: {
  src: string | null;
  ratio: string;
  label: string;
  alt: string;
}) {
  if (src) {
    return (
      <div
        className="overflow-hidden rounded-3xl"
        style={{ border: `1px solid ${C.line}`, background: C.surface }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          style={{ aspectRatio: ratio }}
          loading="lazy"
        />
      </div>
    );
  }
  return <MediaPlaceholder ratio={ratio} label={label} className="rounded-3xl" />;
}

function Guide() {
  return (
    <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvasAlt }}>
      <SectionHeading eyebrow="MEET YOUR GUIDE">
        Meet the Doctor Behind the{' '}
        <span style={{ color: C.goldDeep }}>Complete Health Reset Approach</span>
      </SectionHeading>

      <div className="mx-auto mt-12 max-w-[1060px] lg:grid lg:grid-cols-[0.8fr_1fr] lg:items-start lg:gap-12">
        {/* The portrait alone now. The two squares that used to sit under it are
            gone: the appearances they were reserving are the two rails below the
            bio, and repeating that evidence twice in one section would make the
            column longer without making it say more. */}
        <div className="mb-10 lg:mb-0">
          <GuideShot
            src={PORTRAIT}
            ratio="3 / 4"
            label="Dr. Peeyush portrait · 3:4"
            alt="Dr. Peeyush Prabhat, MBBS doctor, orthopaedic surgeon and health coach"
          />
        </div>

        <div>
          {/* Left-aligned at every width even though the masthead is centred:
              centred paragraphs of this length are hard work to read. */}
          <div className="space-y-4 text-[16px] leading-[1.75]" style={{ color: C.inkSoft }}>
            <p>
              Dr. Peeyush Prabhat is an MBBS doctor, Orthopaedic Surgeon and
              Health Coach who has spent years studying the connection between
              the mind, nervous system, breathing, energy and physical health.
              His work has reached 1M+ people on YouTube, along with appearances
              on TEDx, Josh Talks and television.
            </p>
            <p>
              His interest in this work is also personal. After experiencing
              stress, anxiety and panic himself, he began exploring approaches
              beyond conventional symptom management and developed a deeper
              understanding of how our internal state can influence the way the
              body feels and functions.
            </p>
          </div>

          {/* The one object in the section. A quotation mark in the accent, a
              cyan rule down the left edge, and the line itself in a true italic
              — the page's editorial voice, not a coloured box.

              BOTH the rule and the glyph are `goldDeep`, not `goldMid`.
              `goldMid` is the flourish colour for a DARK ground; on this white
              card it is 1.8:1, which is a left rule and a 28px quotation mark
              that simply are not there. The deep step is 3.6:1: still an
              ornament, but one that draws. */}
          <figure
            data-lego=""
            className="relative mt-9 rounded-2xl px-7 py-8 sm:px-9"
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              borderLeft: `2px solid ${C.goldDeep}`,
              boxShadow: '0 18px 40px -30px rgba(14,39,51,0.35)',
            }}
          >
            <Quotes
              weight="fill"
              aria-hidden
              className="absolute -top-3 left-6 h-7 w-7"
              style={{ color: C.goldDeep }}
            />
            {/* BODY italic. Poppins loads 600/700/800 roman only, so
                `font-display italic` is a sheared roman the browser invents;
                DM Sans ships a real italic and it is loaded. Same reason the
                hero's turn-line and the testimonial quotes moved. */}
            <blockquote
              className="font-body text-[clamp(18px,2.2vw,23px)] font-medium italic leading-[1.5]"
              style={{ color: C.ink }}
            >
              &ldquo;Health is everything, and everything is health.&rdquo;
            </blockquote>
          </figure>

          <p className="mt-7 text-[16px] leading-[1.75]" style={{ color: C.inkSoft }}>
            That&rsquo;s why he created the 5-Day Complete Health Reset
            Challenge, to help you understand how different health concerns may
            be connected and experience a more complete, practical approach to
            feeling better.
          </p>
        </div>
      </div>

      {/* The two rails the source copy asked for under this bio, in its own two
          directions: right to left, then left to right. They sit OUTSIDE the
          1060px column so they run the full width of the band, which is what
          makes a strip read as a strip rather than as a widget inside a column.
          The negative margin cancels the section's own side padding. */}
      <div className="-mx-4 mt-12 space-y-4 sm:mt-16">
        <PhotoRail shots={ROW_APPEARANCES} label="Dr. Peeyush Prabhat, public appearances" />
        <PhotoRail shots={ROW_PEOPLE} reverse label="Dr. Peeyush Prabhat with guests and audiences" />
      </div>
    </section>
  );
}

/* ══ 10 · Why This Works ═══════════════════════════════════════════════════
 *
 * The mechanism, and it reads as "the six principles of the approach" rather
 * than "the old way vs the new way" — so it is a numbered ledger, not a
 * comparison. Hairline-ruled rows with big lit ordinals: a ledger reads audited
 * and accountable, which is what sells competence. It is deliberately NOT
 * another icon-card grid, because the Experience section further up already is
 * one.
 *
 * The ordinals are the source's own, unbroken 01 → 06. Titles and bodies are
 * verbatim; only the icons are chosen here, one distinct glyph per pillar, and
 * Wind is the page's established breath mark rather than a new one.
 */
const PILLARS: { n: string; title: string; icon: Icon; body: string }[] = [
  {
    n: '01',
    title: 'Breathing & Energy Production',
    icon: Wind,
    body: 'Better breathing supports the way your body produces and uses energy.',
  },
  {
    n: '02',
    title: 'Nervous System Regulation',
    icon: Waves,
    body: 'Recovery becomes easier when your body is not constantly stuck in fight-or-flight.',
  },
  {
    n: '03',
    title: 'Emotional Stress Release',
    icon: HandHeart,
    body: 'Stored tension and unresolved stress can keep affecting how your body feels and responds.',
  },
  {
    n: '04',
    title: 'Daily Habits & Internal Balance',
    icon: ArrowsClockwise,
    body: 'Small everyday habits can either support recovery or keep adding to the load your body is already carrying.',
  },
  {
    n: '05',
    title: 'Mind, Body & Lifestyle Working Together',
    icon: YinYang,
    body: 'Instead of treating every symptom separately, the approach works on the connected patterns influencing your overall health.',
  },
  {
    n: '06',
    title: 'Nutrition Without Another Complicated Diet',
    icon: BowlFood,
    body: 'The focus is on simple balancing principles that support the body, not another restrictive plan you struggle to follow.',
  },
];

function Mechanism() {
  return (
    <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvas }}>
      <SectionHeading
        eyebrow="READ THIS BEFORE YOU DECIDE"
        sub="Most health solutions focus on the symptom you can see. Dr. Peeyush's approach works on the deeper patterns that can influence how your body produces energy, responds to stress, recovers and functions every day."
      >
        Why This <span style={{ color: C.goldDeep }}>Works</span>.
      </SectionHeading>

      {/* A 1px-gap grid, so the GAPS become the rules: a ruled ledger with no
          card boxes. The <ul> background IS the rule colour and the rows sit on
          `surface` above it — on canvas the rows would be the same tone as the
          section and the ledger would read as six rules drawn on nothing.

          THE SEAT IS ON THE LIST, NOT ON THE ROWS. The whole ledger is one
          object on the light ground, so it takes one shadow at its edge; six
          row-level shadows would bleed across the 1px gaps and turn the rules
          into smudges. This is the deliberate exception to the card rule. */}
      <ul
        className="mx-auto mt-14 grid max-w-[1000px] gap-px overflow-hidden rounded-2xl sm:grid-cols-2"
        style={{
          background: C.line,
          border: `1px solid ${C.line}`,
          boxShadow: '0 20px 48px -28px rgba(14,39,51,0.32)',
        }}
      >
        {PILLARS.map((p, i) => (
          <li
            key={p.n}
            data-lego=""
            className="lego-hover-sm flex items-start gap-5 px-6 py-7 sm:px-8"
            style={{ ...legoDelay(i, 70), background: C.surface }}
          >
            {/* Icon and ordinal stack rather than sit side by side: the row is
                a ledger line, and two glyphs abreast would read as two columns
                of data instead of one marker. */}
            <span className="flex shrink-0 flex-col items-center gap-2">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: C.goldPale, border: `1px solid ${C.line}` }}
                aria-hidden="true"
              >
                <p.icon weight="duotone" className="h-5 w-5" style={{ color: C.goldInk }} />
              </span>
              {/* goldInk: 18px bold sits just under the 18.66px large-text
                  threshold, so the ordinal takes the 5.2:1 step rather than the
                  3.6:1 one the headline highlight above it uses. */}
              <span
                className="font-display text-[18px] font-extrabold leading-none"
                style={{ color: C.goldInk }}
              >
                {p.n}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block font-display text-[19px] font-extrabold leading-snug"
                style={{ color: C.ink }}
              >
                {p.title}
              </span>
              <span className="mt-2 block text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                {p.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ══ 11 · Two options ══════════════════════════════════════════════════════
   A decision with two sides, so it is argued with visual weight rather than
   with a red ✗ and a green ✓: Option 1 is set back — it takes the band's own
   fill, so it reads as an outlined space rather than as an object — and Option
   2 is the lit panel that carries the click. The layout decides before the copy
   is read.

   The ranking is carried by VALUE, not by a change of colour. Option 1 takes
   the band's own fill and sits flat in it; Option 2 is the section's CONTAINED
   DARK OBJECT: the stage floor, lifted onto a light band, washed with its own
   cyan light at the top edge and seated on a teal shadow. On a light page the
   shadow does the lifting and the bloom is only a trace: that is the inverse of
   how the hero's white card works on the dark stage, and deliberately so, since
   between them they are the page's two focal objects on opposite grounds.

   ⚠️ FLAG FOR ATUL: the source writes this button as "[Take Action · ₹497 →]".
   The square brackets and the arrow are the copy's shorthand for "this is a
   button", so they were never rendered literally. As of 24 Sep the WORDING is
   no longer verbatim either: the label is now the standard CTA_LABEL, so the
   page describes its one action one way throughout. That is a deliberate
   departure from the source copy — say the word and it gets its own constant
   back. */
function TwoOptions() {
  return (
    <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvasAlt }}>
      <SectionHeading>
        Now You Have <span style={{ color: C.goldDeep }}>Two Options</span> From
        Here
      </SectionHeading>

      <div className="mx-auto mt-12 grid max-w-[940px] items-start gap-5 sm:grid-cols-2">
        {/* The one being set down. */}
        <div
          data-lego="x"
          className="rounded-3xl p-7 sm:p-8"
          style={{
            /* The set-back option takes the BAND'S OWN fill, so it reads as an
               outlined space rather than as a card, which is the whole point of
               setting it down. It does not move to `surface` with the rest of
               the page's cards: a card step here would lift it against Option 2
               and un-decide the section. The hairline is the quiet rule, the
               strong one belongs to the option being picked up. */
            ['--lego-from' as string]: '-30px',
            background: C.canvasAlt,
            border: `1px solid ${C.line}`,
            opacity: 0.86,
          }}
        >
          <span
            className="lego-stud inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ background: C.canvas, color: C.inkSoft, border: `1px solid ${C.line}` }}
          >
            <Minus weight="bold" className="h-3 w-3" />
            OPTION 1
          </span>
          <p className="mt-5 text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
            Keep treating every health concern as a separate problem and
            continue trying different diets, routines and wellness fixes
            whenever something new shows up.
          </p>
        </div>

        {/* The one being picked up. */}
        <div
          data-lego="x"
          className="rounded-3xl p-7 sm:p-8"
          style={{
            ['--lego-from' as string]: '30px',
            ['--lego-d' as string]: '110ms',
            background: `radial-gradient(ellipse 96% 58% at 50% 0%, rgba(6,182,212,0.16), transparent 66%), ${C.navyDeep}`,
            /* A CYAN hairline, never `line`. `line` is a light grey and on a
               #06141C card it draws a white ring around the object, which is the
               single clearest tell that a dark card was left over from a dark
               page. Every contained dark object on this page carries the same
               rgba(6,182,212,0.22) edge. */
            border: '1px solid rgba(6,182,212,0.22)',
            /* A 6px cyan halo held against the band, a low bloom, and the teal
               seat that does the actual lifting. The bloom is well below the
               strength it carried on the dark page: at 0.32 over a light band it
               stops being an edge and becomes a haze around the box. */
            boxShadow:
              '0 0 0 6px rgba(6,182,212,0.10), 0 0 44px -20px rgba(6,182,212,0.2), 0 26px 56px -28px rgba(14,39,51,0.42)',
          }}
        >
          <span
            className="lego-stud inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ background: 'rgba(6,182,212,0.18)', color: C.gold }}
          >
            <Plus weight="bold" className="h-3 w-3" />
            OPTION 2
          </span>
          <p className="mt-5 text-[15px] leading-relaxed" style={{ color: C.onDark }}>
            Spend 5 days connecting the dots, experience Dr. Peeyush&rsquo;s
            approach live and discover how much can begin to shift when you work
            on the patterns behind your health instead of one symptom at a time.
          </p>

          <Link
            href={OTO_HREF}
            data-cta
            className="lego-press cta-shimmer group mt-7 inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full px-6 font-body text-[15px] font-bold"
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
              {/* Was "Take Action · ₹497", hard-coded here and the only button
                  on the site with its own wording. Standardised 24 Sep: this is
                  the same single action as every other CTA, so it carries the
                  same label. See the note on the three labels in ./offer. */}
              {CTA_LABEL}
              <ArrowRight
                weight="bold"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══ 12 · Recap ════════════════════════════════════════════════════════════
 *
 * The premium peak. The last thing the reader touches before paying, so it is
 * the most finished object on the page: a layered frame with a cyan flourish
 * and ornament, a medallion seal, a hairline-ruled ledger with a value on EVERY
 * row (never one lump), and the value collapse dramatised — the ₹4,791 draws
 * its own strike-through, then ₹497 pops in lit.
 *
 * The rows are the SAME array the toolkit renders (INCLUDED, in ./offer) and
 * the total is summed from it, so the four values a reader can add up on this
 * beat cannot disagree with the four they read two sections ago.
 *
 * It stays on the page's own light ground rather than taking a colour of its
 * own, and it is NOT a dark section: the peak is earned with craft, depth and
 * one soft wash of light, not by inverting the page at the moment of decision.
 * The wash is cyan at 0.14, well under the 0.34 the amber carried on the skin's
 * cream, because cyan blooms hotter and a large tint over a near-white canvas
 * stops reading as light and starts reading as a fourth ground.
 *
 * ⚠️ THE GUARANTEE, AND WHAT IS MISSING FROM IT. Blueprint beat 13 is
 * risk-reversal "welded to the CTA", and that is exactly how it is rendered:
 * the shield seal at the head of this frame, and the reassurance line under
 * every button on the page ("Join Risk-Free · 100% Money-Back Guarantee",
 * verbatim). There is NO standalone guarantee section, because the source copy
 * supplies no guarantee copy to put in one: no window, no conditions, no
 * process, nowhere on the page. Six words repeated in a box is not a section,
 * and inventing "7 days, no questions asked" would be inventing the single most
 * legally load-bearing sentence on a payment page. Supply the terms and this
 * becomes a real beat in one pass.
 */
function Recap() {
  return (
    <section
      data-final
      className="px-4 py-20 sm:py-28"
      style={{
        /* 0.14, not 0.22. A cyan wash over a near-white canvas tints a very
           large area, and at the strength it needed on the dark page it reads as
           a coloured section rather than as light falling on the peak, which
           would break the band rhythm by inventing a fourth ground. */
        background: `radial-gradient(ellipse 68% 44% at 50% 0%, rgba(6,182,212,0.14), transparent 62%), ${C.canvas}`,
      }}
    >
      <div data-lego="" className="kz-recap">
        {/* The guarantee mark. Given a real accessible name rather than being
            hidden: it is the risk-reversal beat, not an ornament. */}
        <div className="kz-seal" role="img" aria-label="100% Money-Back Guarantee">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <h2
          className="text-center font-display text-[clamp(26px,3.6vw,40px)] font-extrabold leading-[1.14]"
          style={{ color: C.ink, textWrap: 'balance' } as React.CSSProperties}
        >
          Recap of Everything{' '}
          <span style={{ color: C.goldDeep }}>You&rsquo;ll Get</span>
        </h2>

        {/* Column headers in the page's spec voice: tracked uppercase. */}
        <div
          className="mt-10 flex items-center justify-between border-b pb-3 text-[10.5px] font-bold uppercase tracking-[0.2em]"
          style={{ borderColor: C.lineStrong, color: C.inkSoft }}
        >
          <span>INCLUDED</span>
          <span>VALUE</span>
        </div>

        <ul className="kz-ledger">
          {INCLUDED.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-5 py-4">
              <span className="flex min-w-0 items-start gap-3">
                {/* EMERALD on the emerald bed, matching the toolkit's access
                    ticks and the hero's guarantee shield. One rule on this
                    page: anything that CONFIRMS is emerald, the accent is for
                    what is being pointed at.

                    The INK step, because `navyBed` is a pale mint and the bright
                    #10B981 is 1.5:1 on it: four invisible ticks on the page's
                    most important ledger. `emeraldInk` holds 4.9:1 there. */}
                <span
                  className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.navyBed }}
                >
                  <Check weight="bold" className="h-2.5 w-2.5" style={{ color: C.emeraldInk }} />
                </span>
                <span className="text-[14.5px] leading-snug" style={{ color: C.ink }}>
                  {item.title}
                </span>
              </span>
              <span
                className="shrink-0 font-display text-[16px] font-extrabold"
                style={{ color: C.inkSoft }}
              >
                {inr(item.value)}
              </span>
            </li>
          ))}
        </ul>

        {/* The value moment. Total value is struck as it arrives; the price
            you actually pay lands lit, a beat later. */}
        <div
          className="mt-3 flex items-center justify-between gap-5 border-t py-5"
          style={{ borderColor: C.lineStrong }}
        >
          <span
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.inkSoft }}
          >
            TOTAL VALUE
          </span>
          <span
            className="kz-strike font-display text-[22px] font-extrabold"
            style={{ color: C.inkSoft }}
          >
            {inr(INCLUDED_TOTAL)}
          </span>
        </div>

        <div
          className="mt-2 rounded-2xl px-6 py-8 text-center"
          style={{ background: C.goldWash, border: `1px solid ${C.lineStrong}` }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: C.goldInk }}>
            GET EVERYTHING TODAY FOR
          </p>
          <p className="kz-price kz-lit mt-3 font-display text-[56px] font-extrabold leading-none">
            {PRICE}
          </p>
          <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
            (One-time payment)
          </p>
        </div>

        <div className="mx-auto mt-9 flex max-w-[520px] flex-col items-center">
          <PrimaryCTA label={CTA_LABEL} tone="navy" full />
          <CtaNote text={CTA_NOTE} />
        </div>
      </div>
    </section>
  );
}

/* ══ 13 · Colophon ════════════════════════════════════════════════════════
 *
 * The cohort line and the mark. Everything below it — the brand · product
 * line, the client's disclaimer and the three policy links — comes from the
 * shared SiteFooter, so the legal text appears on the checkout and the
 * thank-you page too rather than only here.
 *
 * (RESOLVED, and the note is kept as the trail: SiteFooter used to hard-code
 * the KAIZEN disclaimer, menopause and HRT and a gynaecologist. It now renders
 * {LEGAL_DISCLAIMER} from ./legal, which is the client's own wording, verbatim.
 * See the note in ./legal for the business facts that may still be Kaizen's:
 * entity, address, phone and email are NOT a designer's to invent.)
 */
function Colophon() {
  return (
    <SiteFooter>
      {/* The type-set wordmark that used to open this block is gone, cut
          everywhere on Atul's instruction. The cohort line now leads, and the
          brand · product line SiteFooter renders directly under it is what
          names the business in the footer. */}
      <p className="mx-auto mb-8 max-w-[640px] text-[13px]" style={{ color: C.onDarkMute }}>
        <span className="inline-block">
          Starts {START_DATE} · {SESSION_TIMES} · Live on Zoom
        </span>
        <span aria-hidden className="hidden sm:inline">
          {' · '}
        </span>
        <span className="block sm:inline">{PRICE}, 100% money-back guarantee</span>
      </p>
    </SiteFooter>
  );
}

export default function Close() {
  return (
    <>
      <Guide />
      <Mechanism />
      <TwoOptions />
      <Recap />
      <Colophon />
    </>
  );
}

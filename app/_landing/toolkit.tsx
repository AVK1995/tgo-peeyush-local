'use client';

/**
 * Section 8 · the toolkit. (Blueprint beat 9 · ACCUMULATION.)
 *
 * Four things that sum to a price, so the shape is accumulation. Two rules
 * decide the treatment:
 *
 *  1. The value is shown PER ITEM, never as one lump "worth ₹4,791" — a lump
 *     is a claim, a line-item is a contract.
 *  2. The challenge itself is the item that dominates (₹2,500 of the ₹4,791
 *     and the only LIVE one), so it is lifted out of the grid and given the
 *     lead card on the page's one accent surface. The layout says which one
 *     matters before the copy does.
 *
 * This is the FIRST of the page's two accumulation beats. The second is the
 * closing recap in ./close, which is a ruled ledger — the two are deliberately
 * different forms so the recap reads as a summing-up rather than as a repeat.
 * Both read the SAME array (INCLUDED, in ./offer), so they cannot drift.
 *
 * ⚠️ NO COVER ART EXISTS. /public is empty: there is no render of the five day
 * cards and no mockup for any of the three guides. Every item therefore carries
 * a reserved slot at ONE ratio (1:1), labelled with what belongs in it, so the
 * grid cannot tile at four different heights on the day the artwork lands and
 * the swap is a one-line change per item (set `cover` below).
 */
import type { Icon } from '@phosphor-icons/react';
import {
  Broadcast,
  CheckCircle,
  FirstAidKit,
  Lightning,
  PersonSimpleTaiChi,
  VideoCamera,
  Wind,
} from '@phosphor-icons/react/dist/ssr';

import { asset } from './asset-version';
import { legoBrick, legoDelay } from './lego-style';
import { INCLUDED, inr, type IncludedItem } from './offer';
import { Art, C, MediaPlaceholder, SectionEyebrow } from './shared';

/* One glyph per item, keyed off the stable key rather than the array order, so
   re-ordering the stack can never re-assign the icons.

   Wind is the page's breath mark by now — it carries the Breathing &
   Respiratory domain in ./below-fold and pillar 01 in ./close — so the breath
   guide takes it too. That is a motif, not a collision. */
const GLYPH: Record<IncludedItem['key'], Icon> = {
  challenge: Broadcast,
  breath: Wind,
  stress: FirstAidKit,
  mobility: PersonSimpleTaiChi,
};

/**
 * Reserved art, one slot per item.
 *
 * TO GO LIVE: put the file under /public/images and set its path here as
 * asset('/images/whatever.png') — import { asset } from './asset-version', and
 * bump ASSET_V there in the SAME pass as any in-place replacement, because the
 * path is the cache key in the browser, at the CDN edge and in Next's image
 * optimizer. Anything left null keeps its reserved box at the same ratio, so
 * the section can also run with only some of the covers supplied and nothing
 * reflows either way.
 */
const COVERS: Record<IncludedItem['key'], string | null> = {
  challenge: asset('/system/challenge-days.webp'),
  breath: asset('/system/guide-breath.webp'),
  stress: asset('/system/guide-stress.webp'),
  /* ⚠️ STILL MISSING. The renders supplied on 15 Sep are: the five day cards,
     the Breath blueprint, and TWO different Stress Emergency Toolkit
     compositions (the spare is /system/guide-stress-alt.webp). There is no
     10-Minute Joint Mobility & Pain Relief Playbook cover, and putting the
     spare Stress render here would show the buyer the wrong product, so this
     slot keeps its reserved box at the same 1:1. */
  mobility: null,
};

const COVER_LABEL: Record<IncludedItem['key'], string> = {
  challenge: 'The 5 day cards · 1:1',
  breath: 'Breath for Health Blueprint cover · 1:1',
  stress: 'Stress Emergency Toolkit cover · 1:1',
  mobility: 'Joint Mobility Playbook cover · 1:1',
};

/** Real image when a path exists, a reserved box at the same ratio when it does
 *  not. The two states are never different sizes. */
function Cover({
  item,
  className = '',
  sizes,
}: {
  item: IncludedItem;
  className?: string;
  sizes?: string;
}) {
  const src = COVERS[item.key];
  if (src) {
    return (
      <Art
        src={src}
        alt={`${item.title} cover`}
        ratio="1 / 1"
        sizes={sizes}
        className={className}
      />
    );
  }
  return <MediaPlaceholder ratio="1 / 1" label={COVER_LABEL[item.key]} className={className} />;
}

/* A bed, not a bare glyph: at this size an unbedded icon reads as debris next
   to a 26px ordinal. Gold-pale is the page's established icon bed. */
function IconBed({ icon: Glyph, size = 'md' }: { icon: Icon; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
  const glyph = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl ${box}`}
      style={{ background: C.goldPale, border: `1px solid ${C.line}` }}
      aria-hidden="true"
    >
      <Glyph weight="duotone" className={glyph} style={{ color: C.goldInk }} />
    </span>
  );
}

/* The chip bed is `goldPale`, the page's established one (the section eyebrow,
   the hero's category pill), NOT `canvas` and not `surface`. This one tag has to
   read on TWO different grounds (the lead card's accent wash and the guide
   card's white surface), and a chip filled with either of those disappears into
   one of them. The bed carries all three glyphs at label size: 13.2:1 for the
   ink label, 4.8:1 for the cyan mark, 4.9:1 for the tick.

   The tick is EMERALD, in its INK step. Emerald because the spark is true red in
   this palette and a red ✓ next to "instant access" reads as a failure state,
   and the ink step because this is a 12px glyph on a pale bed: his bright
   #10B981 is 1.5:1 there, which is a tick you cannot see. Light ground → the
   `Ink` step, every time. */
function AccessTag({ text, access }: { text: string; access: IncludedItem['access'] }) {
  const Mark = access === 'live' ? VideoCamera : Lightning;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
      style={{ background: C.goldPale, border: `1px solid ${C.lineStrong}`, color: C.ink }}
    >
      <Mark weight="fill" className="h-3 w-3" style={{ color: C.goldInk }} />
      {text}
      <CheckCircle weight="fill" className="h-3 w-3" style={{ color: C.emeraldInk }} />
    </span>
  );
}

export default function Toolkit() {
  const [lead, ...rest] = INCLUDED;
  const LeadGlyph = GLYPH[lead.key];

  return (
    <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvas }}>
      <div className="mx-auto max-w-[820px] text-center">
        <div className="mb-5 flex justify-center">
          <SectionEyebrow text="GET INSTANT ACCESS TO" />
        </div>
        <h2
          className="font-display text-[clamp(28px,4.4vw,46px)] font-extrabold leading-[1.14]"
          style={{ color: C.ink, textWrap: 'balance' } as React.CSSProperties}
        >
          Your 5-Day Complete Health Reset &amp;{' '}
          <span style={{ color: C.goldDeep }}>At-Home Health Support Toolkit</span>
        </h2>
      </div>

      <div className="mx-auto mt-14 max-w-[1080px]">
        {/* ── the lead item ─────────────────────────────────────────────── */}
        <article
          data-lego=""
          className="lego-hover-soft rounded-[28px] p-8 sm:p-10"
          style={{
            ...legoDelay(0, 90),
            /* The wash resolves into `surface`, not into `canvas`. This section
               stands ON canvas, so a card that fades to canvas fades into the
               page: the lead item would lose its own bottom edge. */
            background: `linear-gradient(160deg, ${C.goldWash} 0%, ${C.surface} 62%)`,
            border: `1px solid ${C.lineStrong}`,
            /* The money card, so it is the one card in the section with a trace
               of its own light, but on a LIGHT ground the lift is the shadow
               and the bloom is only a hint. A cyan glow at the strength it
               carried on the dark page is a cyan haze ringing a white box here,
               which is the "glow" failure rather than a lit edge. */
            boxShadow:
              '0 0 40px -22px rgba(6,182,212,0.22), 0 24px 54px -30px rgba(14,39,51,0.36)',
          }}
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex shrink-0 flex-col items-start gap-4">
              <span
                className="font-display text-[44px] font-extrabold leading-none"
                style={{ color: C.goldDeep }}
              >
                {lead.n}
              </span>
              <IconBed icon={LeadGlyph} size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="font-display text-[24px] font-extrabold leading-snug sm:text-[27px]"
                style={{ color: C.ink }}
              >
                {lead.title}
              </h3>
              {/* goldInk, not goldDeep. `goldDeep` is 3.6:1 and clears the
                  LARGE-text bar only, which starts at 18.66px bold: this line is
                  18px bold and falls just under it, so it takes the 5.2:1 step.
                  The ordinal above (44px) and the headline highlights are the
                  sites that are genuinely large. */}
              <p
                className="mt-1.5 font-display text-[18px] font-extrabold"
                style={{ color: C.goldInk }}
              >
                ({inr(lead.value)} Value)
              </p>
              <p
                className="mt-3.5 max-w-[620px] text-[15px] leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                {lead.body}
              </p>
              <div className="mt-6">
                <AccessTag text={lead.tag} access={lead.access} />
              </div>
            </div>

            <Cover
              item={lead}
              sizes="(min-width: 640px) 240px, 100vw"
              className="w-full sm:w-[240px] sm:shrink-0"
            />
          </div>
        </article>

        {/* ── the three guides ─────────────────────────────────────────────
            Three tiles, one per column from md up and a single column below
            it: no orphan at any breakpoint, so none of the placement maths the
            five- and seven-card grids on this page need. */}
        <ul className="mt-5 grid gap-5 md:grid-cols-3">
          {rest.map((item, i) => {
            const Glyph = GLYPH[item.key];
            return (
              <li
                key={item.key}
                data-lego=""
                className="lego-hover flex flex-col rounded-3xl p-7"
                style={{
                  ...legoBrick(i + 1, 80),
                  /* `surface` (white) on the section's `canvas` ground: 1.5%
                     apart, so the fill is not the card: the hairline draws the
                     edge and the teal seat lifts it. Same pair as every other
                     card on a light band, one notch quieter than the lead card
                     above, which is the only one allowed its own light. */
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                  boxShadow: '0 18px 44px -26px rgba(14,39,51,0.34)',
                }}
              >
                {/* Cover art sits above the title, which is where a guide's
                    cover was always going to go. */}
                <Cover
                  item={item}
                  sizes="(min-width: 768px) 320px, 100vw"
                  className="mb-6"
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <IconBed icon={Glyph} />
                    <span
                      className="font-display text-[26px] font-extrabold leading-none"
                      style={{ color: C.goldDeep }}
                    >
                      {item.n}
                    </span>
                  </div>
                  {/* goldInk at 16px, for the same reason as the lead card's
                      value line: below 18.66px bold the 3:1 step is not enough.
                      The 26px ordinal beside it stays on goldDeep. */}
                  <span
                    className="font-display text-[16px] font-extrabold"
                    style={{ color: C.goldInk }}
                  >
                    ({inr(item.value)} Value)
                  </span>
                </div>
                <h3
                  className="mt-4 font-display text-[19px] font-extrabold leading-snug"
                  style={{ color: C.ink }}
                >
                  {item.title}
                </h3>
                <p className="mt-2.5 flex-1 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                  {item.body}
                </p>
                <div className="mt-6">
                  <AccessTag text={item.tag} access={item.access} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

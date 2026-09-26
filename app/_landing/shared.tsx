/**
 * Shared landing primitives: the palette, and the framer-free leaf components
 * used by BOTH the static hero and the lazily-hydrated below-the-fold chunk.
 *
 * Kept animation-runtime-free on purpose so it can be imported from a Server
 * Component without dragging anything into the initial bundle.
 *
 * PALETTE · DEEP CYAN CLINIC. The locked challenge skin re-branded onto
 * Dr. Peeyush's OWN theme, measured off breathforhealth.in/breath and recorded
 * in THEME-SOURCE.md. The short version:
 *
 *   LIGHT is the environment. CYAN is the accent, EMERALD is the second accent
 *   (ticks, confirmation), and RED is the spark, spent more scarcely than
 *   either. Three icon beds, not seven.
 *
 * ⚠️ THE SECTION RHYTHM IS THE SKIN'S, NOT HIS SITE'S. His page is dark end to
 * end; this page is not. Light bands alternate (`canvas` / `canvasAlt`), the
 * HERO is the single dark stage, and dark appears below the hero ONLY as a
 * contained object inside a light band — the live-sessions card, the Option 2
 * card, the video bed. His palette is the brand identity that goes INTO that
 * rhythm; it does not replace the rhythm.
 *
 * Two consequences worth holding in your head while editing:
 *
 *   1. ELEVATION IS SHADOW AGAIN. A card is `surface` (white) with a `line`
 *      hairline and a teal-tinted shadow. The lit top edge survives only as a
 *      thin cyan stud line on hover.
 *   2. HIS CYAN IS NOT A TEXT COLOUR ON LIGHT. #06B6D4 is 2.4:1 on the canvas.
 *      On a light ground it is a FILL or a graphic; type uses `goldDeep`
 *      (large) or `goldInk` (small). The `*Ink` suffix means exactly that
 *      throughout: the step that is readable on the light page.
 *
 * ⚠️ This object is ONE of THREE copies of the palette. The other two are the
 * `:root` block in app/globals.css and the `colors` block in
 * tailwind.config.ts. All three change together or the page ships in two
 * palettes. The token NAMES are left at the skin's originals (navyDeep, gold*,
 * coral*) on purpose: twelve files reference them, and renaming them buys
 * accuracy at the price of a page-wide rename. Read them as roles:
 * navyDeep = the dark stage, gold* = THE ACCENT, coral* = THE SPARK.
 */
import { ImageSquare } from '@phosphor-icons/react/dist/ssr';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';

import { OTO_HREF } from './offer';

export const C = {
  /* ── environment. Never pure white: #FAFDFE is faintly COOL, which is the
     mirror of the skin's warm cream and the right ground under a cyan brand ── */
  canvas: '#FAFDFE',
  /* The alternating band. Cool near-NEUTRAL rather than pale cyan, for the same
     reason the skin's band is warm grey and not warm gold: a page whose bands
     are the accent is a page standing on its own highlight. */
  canvasAlt: '#F0F4F5',
  /* The card. KEPT from the dark pass and re-pointed: on light, "the card" is
     the one surface above BOTH grounds, so it is plain white and its edge is
     carried by `line` plus a teal-tinted shadow. Every call site that already
     says `surface` still means the right thing. */
  surface: '#FFFFFF', // 15.5:1 with ink
  navyDeep: '#06141C', // THE DARK STAGE. His page ground, verbatim: the hero,
  //                      the announcement rail, and every contained dark object
  //                      below the fold are built from this one value.

  /* ── ink ── */
  ink: '#0E2733', // his own card teal, now the page ink. 15.1:1 on canvas
  inkSoft: '#4A6472', // secondary body. 6.1:1 on canvas, 5.7:1 on the band
  onDark: '#F2FAFC', // text on the dark stage. Cool off-white, never pure white
  onDarkMute: 'rgba(242,250,252,0.74)', // secondary on the stage. 9.9:1
  onAccent: '#04141C', // KEPT. Dark ink ON the bright cyan pill. 7.7:1

  /* ── cyan: THE ACCENT ──────────────────────────────────────────────────
     THREE steps, and they are not interchangeable. `gold` is his measured
     value and it is a bright accent: 7.7:1 on the dark stage, 2.4:1 on this
     canvas, so on light it is a FILL or a graphic and never type. goldDeep is
     the LARGE-text highlight, the price and the focus ring (3.6:1, which
     clears the 3:1 large bar and nothing else). Anything at label or body size
     uses goldInk (5.2:1). Getting this pair backwards is how a page ends up
     with illegible eyebrows. */
  gold: '#06B6D4', // his accent, verbatim. Type on DARK; a fill on light
  /* Icon beds and washes. Cool near-NEUTRAL, because a cyan bed behind a cyan
     glyph makes every icon on the page a cyan object. The glyph keeps the
     colour, the bed does not. */
  goldPale: '#EFF3F4',
  /* The ONE accent surface, spent on the two money moments: the lead item in
     the toolkit and the price box in the recap. goldInk holds 4.8:1 on it. */
  goldWash: '#E2F6FA',
  goldMid: '#22D3EE', // hairline flourishes and rules ONLY, never a numeral
  goldDeep: '#0891B2', // LARGE TEXT, the price, the focus ring. 3.6:1
  goldInk: '#0E7490', // small text and eyebrows. 5.2:1 canvas, 4.8:1 on the bed
  ctaGold: '#06B6D4', // the CTA fill ON THE DARK STAGE. His pill; label =
  //                     onAccent (7.7:1). The light page's primary is `ink`,
  //                     because a 2.4:1 pill on white is not a button.

  /* ── emerald: THE SECOND ACCENT, because his theme has two.
     Ticks, guarantees, anything that confirms. Same convention as the cyan:
     `emerald` is his value and belongs on dark or as a fill, `emeraldInk` is
     the step that reads as a tick or as text on the light page. ── */
  emerald: '#10B981', // 7.4:1 on the stage; a fill only on light
  emeraldInk: '#047857', // 5.4:1 on canvas, 4.9:1 on navyBed

  /* ── red: the spark, spent even more scarcely than either accent.
     Back to HIS #DC2626: it had to be lightened to survive the dark ground,
     and on light it clears small text unchanged. ── */
  coral: '#DC2626', // 4.7:1 on canvas
  coralBed: '#FDEAEA',
  coralInk: '#B91C1C', // red as readable text. 6.3:1 on canvas, 5.6:1 on the
  //                      bed — the pills that use it are 10px, so it has to
  //                      clear 4.5 on the BED, not just the canvas.

  /* ── beds. Three, deliberately, so the page reads as one palette.
     navyBed is the EMERALD bed (role name kept, per the header note). ── */
  navyBed: '#E6F6F0',

  /* ── rules. Cool grey, a hair off neutral so they sit under a cyan brand ── */
  line: '#E2E9EB',
  lineStrong: '#C8D4D8',
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 *  Eyebrow. ALWAYS uppercase, every section that has one.
 *
 *  Sections whose source copy supplies no eyebrow run without one rather than
 *  with an invented label: the copy is the client's, and a two-word kicker is
 *  still copy.
 *
 *  Re-voiced to his: cyan, uppercase, wide tracking, a dot before the word. He
 *  sets his at 12px / 3px of tracking, which is 0.25em; the pill bed is the
 *  skin's and stays. Measured at 11px: the longest eyebrow on the page is
 *  "GET INSTANT ACCESS TO" (21 characters), which at 0.9em of effective advance
 *  runs ~208px plus 28px of padding — it holds one line on the narrowest phone.
 *
 *  The dot is EMERALD, not the spark. In this palette the spark is his true
 *  red, and a pulsing red dot beside every section label reads as an error
 *  state rather than as something alive. Red is kept for where it means
 *  urgency: the announcement strip. `emerald` rather than `emeraldInk` because
 *  a 6px dot is a fill, not a glyph, and the pulse ring is what makes it read
 *  as alive.
 * ═══════════════════════════════════════════════════════════════════════ */
export function SectionEyebrow({ text }: { text: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em]"
      style={{ background: C.goldPale, color: C.goldInk }}
    >
      <span
        className="lego-pulse-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          background: C.emerald,
          ['--dot-pulse' as string]: 'rgba(16,185,129,0.5)',
        }}
      />
      {text}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Section masthead: eyebrow → display headline (one lit word) → deck.
 *  Capped measure on both, centred, ≤820px. (R1 / C13.)
 * ═══════════════════════════════════════════════════════════════════════ */
export function SectionHeading({
  eyebrow,
  children,
  sub,
}: {
  eyebrow?: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[820px] px-1 text-center">
      {eyebrow && (
        <div className="mb-5 flex justify-center">
          <SectionEyebrow text={eyebrow} />
        </div>
      )}
      {/* font-extrabold, not semibold: his headline weight is Poppins 800, and
          a Tailwind weight utility out-specifies the element rule in globals,
          so leaving this at 600 would quietly pin every section head at the
          weight that was chosen for the old serif. Leading tightens with it —
          800 at 46px needs less room between lines than a 600 serif did. */}
      <h2
        className="font-display text-[clamp(28px,4.4vw,46px)] font-extrabold leading-[1.1]"
        style={{ color: C.ink, textWrap: 'balance' } as React.CSSProperties}
      >
        {children}
      </h2>
      {sub && (
        <p
          className="mx-auto mt-5 max-w-[660px] text-[15.5px] leading-relaxed sm:text-[16.5px]"
          style={{ color: C.inkSoft }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  The primary CTA (R3).
 *
 *  One saturated pill, generous padding, a slow shimmer with a long rest, and
 *  the price IN the label. `breathe` is the idle glow and belongs to exactly
 *  one instance per screen — never to two buttons the reader can see at the
 *  same time. (It animates box-shadow, so it supersedes the seat below.)
 *
 *  `tone` is what lets the same component sit on all three grounds this page
 *  has, and BOTH the fill and the LABEL are tokens in every branch:
 *
 *    navy  · the light page. Deep teal fill, canvas label, 15.1:1. This is the
 *            default and it is deliberately NOT his cyan pill: #06B6D4 is
 *            2.4:1 against the canvas, so a cyan button on a white section is
 *            a shape you have to hunt for rather than the loudest object in
 *            the band. The cyan comes back as the shimmer and the ring.
 *    gold  · ON THE DARK STAGE. His pill exactly: cyan fill, dark ink label,
 *            7.7:1, with a standing cyan bloom under it.
 *    cream · on a dark card, where a cyan pill would sit inside its own cyan
 *            bloom and stop reading as an object.
 * ═══════════════════════════════════════════════════════════════════════ */
export function PrimaryCTA({
  href = OTO_HREF,
  label,
  tone = 'navy',
  breathe = false,
  full = false,
}: {
  href?: string;
  label: string;
  /** navy = on the light page · gold = on the dark stage · cream = on a dark card */
  tone?: 'navy' | 'gold' | 'cream';
  breathe?: boolean;
  full?: boolean;
}) {
  const skin =
    tone === 'gold'
      ? {
          background: C.ctaGold,
          color: C.onAccent,
          shimmer: 'rgba(255,255,255,0.55)',
          /* On the dark stage a drop shadow does nothing, so the button is
             lifted by the light it throws. This is his standing bloom. */
          shadow: '0 14px 30px -14px rgba(0,0,0,0.6), 0 10px 32px -10px rgba(6,182,212,0.4)',
        }
      : tone === 'cream'
        ? {
            background: C.canvas,
            color: C.ink,
            shimmer: 'rgba(6,182,212,0.4)',
            shadow: '0 14px 30px -14px rgba(0,0,0,0.55)',
          }
        : {
            background: C.ink,
            color: C.canvas,
            shimmer: 'rgba(34,211,238,0.38)',
            shadow: '0 14px 30px -14px rgba(14,39,51,0.5)',
          };

  return (
    <Link
      href={href}
      data-cta
      className={`lego-press cta-shimmer group inline-flex min-h-[58px] items-center justify-center gap-2.5 rounded-full px-8 py-4 font-body text-[15.5px] font-bold ${
        breathe ? 'cta-breath' : ''
      } ${full ? 'w-full' : 'w-full sm:w-auto'}`}
      style={{
        background: skin.background,
        color: skin.color,
        boxShadow: skin.shadow,
        ['--shimmer' as string]: skin.shimmer,
      }}
    >
      <span className="inline-flex items-center gap-2.5">
        {label}
        <ArrowRight
          weight="bold"
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

/**
 * The reassurance line, welded tight under the button — never separated from
 * it, because the rush and the reassurance are one beat.
 *
 * `onDark` means what it says again: the page has two grounds, so the note
 * under a button on the hero stage or inside a dark card takes `onDarkMute`
 * (9.9:1 there) and everything on a light band takes `inkSoft` (6.1:1).
 */
export function CtaNote({ text, onDark = false }: { text: string; onDark?: boolean }) {
  return (
    <p
      className="mt-3.5 text-center text-[13.5px] font-medium"
      style={{ color: onDark ? C.onDarkMute : C.inkSoft }}
    >
      {text}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  Art: a supplied image, in the slot a MediaPlaceholder was holding.
 *
 *  Same API as MediaPlaceholder on purpose (ratio + className), so swapping one
 *  for the other never disturbs the surrounding layout.
 *
 *  `ratio` must match the asset's OWN aspect ratio. Every image on this page is
 *  a product mockup carrying text (guide titles, day names, the price seal), and
 *  object-cover in a mismatched box crops that text away. Match the ratio and
 *  nothing is ever cut.
 * ═══════════════════════════════════════════════════════════════════════ */
export function Art({
  src,
  alt,
  ratio = '1 / 1',
  className = '',
  sizes = '(min-width: 1024px) 33vw, 100vw',
  priority = false,
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 *  MediaPlaceholder — a reserved slot for art that has not arrived yet.
 *
 *  Deliberately a designed object rather than a grey box: it holds the exact
 *  aspect ratio the real image will take, so nothing reflows when art lands,
 *  and it reads as "reserved" rather than as a failed image. Swap it for an
 *  <img> at the same ratio and no surrounding layout changes.
 *
 *  `label` says what belongs there, so whoever supplies the art knows what is
 *  being asked for without opening the file.
 * ═══════════════════════════════════════════════════════════════════════ */
export function MediaPlaceholder({
  ratio = '16 / 10',
  label,
  className = '',
}: {
  ratio?: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl ${className}`}
      style={{
        aspectRatio: ratio,
        /* The stripes run over `surface`, because every slot on this page sits
           inside a white card: filling a placeholder with the page ground would
           read as a hole punched in the card rather than as a reserved slot.
           ⚠️ The one exception is the proof section's video bed, which is a
           DARK object — a light placeholder there reads as a lit slab until the
           clips land. It is a placeholder, so that is tolerable; if it ships
           without clips, give that call site a dark variant. */
        background: `repeating-linear-gradient(135deg, ${C.goldPale} 0px, ${C.goldPale} 10px, ${C.surface} 10px, ${C.surface} 20px)`,
        border: `1px dashed ${C.lineStrong}`,
      }}
      role="img"
      aria-label={`${label}, image to be supplied`}
    >
      <ImageSquare weight="duotone" className="h-6 w-6" style={{ color: C.goldInk }} />
      <span
        className="px-3 text-center text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: C.goldInk }}
      >
        {label}
      </span>
    </div>
  );
}

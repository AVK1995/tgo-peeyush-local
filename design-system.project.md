# Skin · Kaizen Warm Navy (project override)

> ## ⚠️ STALE FOR THIS PROJECT. Read the code, not this file.
>
> This document was inherited with the Kaizen machinery and still describes
> **Kaizen's** navy-and-gold palette. `/workspace/tgo-peeyush` has been
> re-branded to **CLINIC PINE & AMBER** (13 Sep 2026), and the authoritative
> palette now lives in exactly three places, which are kept in step with each
> other and with nothing else:
>
> 1. the `:root` block in `app/globals.css`
> 2. the `C` object in `app/_landing/shared.tsx`
> 3. the `colors` block in `tailwind.config.ts`
>
> The token NAMES are unchanged and are roles, not colours: `--navy-deep` is
> the dark stage (deep pine), `--gold-*` is THE ACCENT (amber), `--coral-*` is
> THE SPARK (clay). Everything below about **structure** (the one-line brief,
> the section rhythm, the effects, the component anatomy) still holds exactly:
> only the colours moved. Every hex written below is Kaizen's and must not be
> copied into this project.

> Layer 3 skin for `/workspace/tgo-kaizan` (Kaizen · 5-Day (Peri)Menopause Reset
> Challenge). Overrides the default wellness skin. The brain
> (`~/.claude/system/design-system.base.md`, concepts C1–C13 + recipes R1–R12) is
> unchanged and still wins any disagreement.
>
> Reverse-engineered from the client's own logo (navy script wordmark, coral dot)
> and built on the challenge-funnel machinery proven in `/workspace/tgo-superme`.

## The one-line brief
**A light, warm, cream page with a single dark navy hero.** Atul's instruction,
verbatim: "Keep it a light theme only, with the hero in dark theme." Every
section band below the hero is light. Dark is allowed only as a *contained
object* inside a light band (the Live-Sessions CTA card, the Option 2 card) and
in the footer, never as another full section band.

## Tokens

```
/* environment — warm, never pure white (C12) */
--canvas:       #FFFDF8   /* page */
--canvas-2:     #FAF4EA   /* alternate section band */
--navy-deep:    #16264A   /* hero stage floor */

/* ink */
--ink:          #1F325C   /* brand navy: headings, body, CTA fill.   12.3:1 on canvas */
--ink-soft:     #5A6786   /* secondary body.                          5.6:1 on canvas */
--on-dark:      #FDF9F1   /* body on the navy stage */
--on-dark-mute: rgba(253,249,241,0.74)

/* accent — GOLD is the accent, spent like a spotlight (C2) */
--gold:         #F2DDB6   /* the brand beige: surfaces, dark-stage highlight word */
--gold-pale:    #F9F0DE   /* icon beds, washes */
--gold-mid:     #D9B571   /* hairline flourishes, rules ONLY — 1.9:1, never a numeral */
--gold-deep:    #A87C33   /* headline highlight on light.   3.7:1 → LARGE TEXT ONLY */
--gold-ink:     #8A6424   /* small text / eyebrows on light. 5.3:1 → safe at 11px */
--cta-gold:     #EBC98D   /* CTA fill on the dark stage, navy label at 7.9:1 */

/* spark — CORAL is the logo dot, used scarcer than the accent */
--coral:        #EE7778   /* live dots, glyphs on dark (4.5:1 on navy) */
--coral-bed:    #FDECEA
--coral-ink:    #B84447   /* coral as TEXT on light. 5.2:1 on canvas, 4.6:1 on coral-bed */

/* rules */
--line:         #EBE2D3
--line-strong:  #DCCEB6
--navy-bed:     #EDF1F8   /* the third icon bed, so the page has 3 beds not 7 */
```

**Contrast is derived, not eyeballed.** `--gold-deep` is the *headline*
highlight (3.7:1 clears the 3:1 large-text bar and nothing else); anything at
label size uses `--gold-ink`. On the navy stage the highlight flips to `--gold`
(9.4:1), exactly as the reference funnel flips its highlight on dark bands.

## Type (C1, with one documented exception)
- **display** — **Fraunces** (`--font-display`). Warm, high-contrast serif with a
  soft-square skeleton; sits with a script wordmark without competing with it.
  Headlines only, never below headline size.
- **body** — **Manrope** (`--font-body`), 17px base / 1.65. The audience is women
  40–55, so the base size sits a notch above the usual 15–16px and nothing on
  the page relies on a hairline weight.
- **spec voice** — *exception:* the third voice is **tracked uppercase Manrope
  700**, not a mono. A monospace reads clinical/technical against a hand-script
  logo and a menopause-support offer; the tracked caps do the same
  "spec/label/credibility" job in this register. Documented, deliberate.
- **Eyebrows are ALWAYS uppercase** (house rule), `0.2em` tracking, `--gold-ink`.

## Section rhythm
`canvas` → `canvas-2` → `canvas` … alternating, with the hero as the single dark
stage at the top and a navy colophon footer at the bottom. Section padding
`clamp(64px, 8vw, 112px)`.

## Signature effects (all live in `app/globals.css`)
- **Hero stage atmosphere** — two gold radial blooms + one coral bloom over a
  navy floor ramp, plus a faint edge-masked dot grid. Never a flat navy fill (C5).
- **The lego entrance system** — ported from the reference challenge funnel: a
  piece drops from above, overshoots, and *clicks* into its slot
  (`lego-snap`), staggered by `--lego-d`, with the icon tile popping just after
  (`lego-stud`). Gated behind `.bw-js` so no-JS users and crawlers see
  everything (C7 fail-open).
- **Scroll-linked 5-day spine** — the rail fills to `--tl-p` and each day-node
  ignites as the fill reaches it. This is the page's ONE heavy motion moment
  (C2: keep the signature scarce).
- **Gold shimmer sweep on the primary CTA** — a slow diagonal highlight with a
  long rest, plus a gold-tinted glow breath. Only the primary CTA breathes.
- **Strike-draw + price pop** on the closing recap: the ₹5,485 anchor draws its
  strike-through on reveal, then ₹497 pops in lit.
- **Reduced motion** — every keyframe above is disabled under
  `prefers-reduced-motion`, and every hidden reveal state is forced visible.

## What this skin does NOT do
- No emoji as UI (the source copy uses ❤️⭐🛡️💯☑️🔒 — all are rendered as
  matched-weight Phosphor line icons instead, per C11).
- No rainbow accent set. Three beds only: gold-pale, coral-bed, navy-bed.
- No dark section bands below the hero (see the one-line brief).

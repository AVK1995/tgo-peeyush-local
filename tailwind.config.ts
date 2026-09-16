import type { Config } from 'tailwindcss';

/**
 * Dr. Peeyush Prabhat · 5-Day Complete Health Reset Challenge.
 *
 * PALETTE · DEEP CYAN CLINIC, taken off his own page (breathforhealth.in/breath,
 * measured in THEME-SOURCE.md) and set into the locked challenge skin's section
 * rhythm: light bands alternating, the hero as the single dark stage, and dark
 * below the hero only as a contained object inside a light band. Cyan is the
 * accent, emerald is the second accent, red is the spark used more scarcely
 * than either.
 *
 * ⚠️ THIRD of three copies of the palette. The other two are the `:root` block
 * in app/globals.css and the `C` object in app/_landing/shared.tsx. All three
 * change together: this file has silently held a stale colour before, and the
 * only way to catch it is to grep the hex before calling a re-skin done.
 * The keys keep the skin's original names and are roles, not colours:
 * `ink.deep` = the dark stage, `gold.*` = the accent, `coral.*` = the spark.
 * `gold.deep` / `gold.ink` are the two steps of the accent that are readable on
 * a light ground (large text and small text); `gold.DEFAULT` is his bright
 * value and is a fill there, never type. `emerald.ink` is the same idea for the
 * second accent.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: { DEFAULT: '#FAFDFE', alt: '#F0F4F5', surface: '#FFFFFF' },
        ink: {
          DEFAULT: '#0E2733',
          soft: '#4A6472',
          deep: '#06141C',
          on: '#04141C',
        },
        gold: {
          DEFAULT: '#06B6D4',
          pale: '#EFF3F4',
          wash: '#E2F6FA',
          mid: '#22D3EE',
          deep: '#0891B2',
          ink: '#0E7490',
          cta: '#06B6D4',
        },
        /* `emerald.bed` is the same value as `C.navyBed` in shared.tsx, which
           keeps the skin's role name. Same colour, two names, on purpose. */
        emerald: { DEFAULT: '#10B981', ink: '#047857', bed: '#E6F6F0' },
        coral: { DEFAULT: '#DC2626', bed: '#FDEAEA', ink: '#B91C1C' },
        line: { DEFAULT: '#E2E9EB', strong: '#C8D4D8' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { pill: '999px' },
      boxShadow: {
        /* Teal-tinted, never neutral black: a grey shadow under a cyan brand
           reads as dirt. Elevation on light is the shadow plus the hairline;
           the lit top edge survives only as the cyan stud line on hover (C4). */
        soft: '0 4px 20px -10px rgba(14,39,51,0.3)',
        card: '0 18px 44px -26px rgba(14,39,51,0.34)',
        lift: '0 2px 0 0 rgba(6,182,212,0.34), 0 22px 42px -22px rgba(14,39,51,0.34)',
      },
    },
  },
  plugins: [],
};

export default config;

'use client';

/**
 * /oto · Choose your pass.
 *
 * THE NEW STEP IN THE FUNNEL: Ads → Landing → **here** → Checkout → Thank-you.
 * Every CTA on the landing page used to go straight to /checkout; they now land
 * here first, and the pass the buyer picks rides on to the checkout as
 * `?tier=`.
 *
 * ── WHY SELECTABLE CARDS AND ONE BUTTON ───────────────────────────────────
 * The obvious build is two cards with a CTA each. The supplied copy is not
 * shaped that way: it ends with a single "Total due today ₹2,499 ₹497" and one
 * "Reserve My Spot · ₹497", which only makes sense if the cards are a CHOICE
 * and the total reflects it.
 *
 * It is also the better mechanic. Two buttons is two decisions — which pass,
 * and then whether to commit — and the second one is where people leave. One
 * button means the page asks once.
 *
 * ── WHAT THE SELECTION IS AND IS NOT ──────────────────────────────────────
 * It is a radiogroup, built from real <input type="radio"> elements rather
 * than clickable divs. That is not pedantry: a radiogroup gives arrow-key
 * navigation, a single tab stop, correct announcement of "2 of 2 selected",
 * and form semantics to screen readers, all of which a div with an onClick
 * silently loses. The card is the <label>, so the entire card is the hit area.
 *
 * It is NOT the price. Nothing here is trusted: the checkout re-reads the tier
 * from the query string and the create-order route resolves the rupees from
 * the id server-side. See the note on `tierPricing` in lib/checkout-config.ts.
 *
 * ── MOBILE ────────────────────────────────────────────────────────────────
 * Cards stack below `md`. The total and the button are docked to the bottom of
 * the viewport below `md` (the page is taller than a phone screen and a buried
 * CTA is an unread one) and sit inline in the flow from `md` up. The docked bar
 * is rendered ONCE and repositioned with classes rather than duplicated, so the
 * two can never drift apart, and a spacer reserves its height so the last
 * section is not covered.
 */
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  Check,
  Clock,
  Lock,
  ShieldCheck,
  VideoCamera,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import SiteFooter from '@/components/SiteFooter';
import { trackAddToCart, trackViewItem } from '@/lib/track';

import {
  DEFAULT_TIER_ID,
  GUIDES,
  GUIDES_LABEL,
  SESSION_TIMES_TZ,
  START_DATE,
  TIER_LIST,
  TIERS,
  checkoutHref,
  inr,
  type TierId,
} from '../_landing/offer';
import { C } from '../_landing/shared';

const FACTS = [
  { icon: CalendarBlank, text: `Starts ${START_DATE}` },
  { icon: Clock, text: SESSION_TIMES_TZ },
  { icon: VideoCamera, text: 'Live on Zoom' },
];

/* The three steps under the cards, verbatim from the copy. */
const NEXT_STEPS = [
  "Pay on Razorpay's secure page.",
  'Join the WhatsApp group from your confirmation page.',
  `Your Zoom link arrives before ${START_DATE.replace(/ \d{4}$/, '')}.`,
];

export default function OtoPage() {
  const [tier, setTier] = useState<TierId>(DEFAULT_TIER_ID);

  /* ViewContent-equivalent for this step. Fired once on mount, not per
     selection: the buyer is looking at one offer with two shapes, and firing
     per toggle would report a browsing session as repeated intent. */
  useEffect(() => {
    trackViewItem();
  }, []);

  /* ── THE SPACER IS MEASURED, NOT GUESSED ───────────────────────────────
     The docked total bar is `position: fixed` below `md`, so it is out of
     flow and sits ON TOP of whatever the page ends with — which is the
     footer, and specifically the merchant-of-record and legal lines.

     This started as `h-[132px]`, a number worked out by adding up the bar's
     paddings and line heights. It was wrong on the live page, and a hardcoded
     guess was always going to be: the bar's real height moves with the
     viewport (the "100% Secure · UPI · Cards · NetBanking" line wraps to two
     lines on a narrow phone), with the safe-area inset on notched iOS, and
     with the user's own font-size setting. Any constant is correct at exactly
     one width.

     So the bar reports its own height and the spacer takes it. ResizeObserver
     rather than a resize listener, because the thing that changes is the
     BAR's height, not the window's — the secure line re-wrapping does not
     fire a window resize.

     Zero from `md` up, where the bar is `static` and already occupies its own
     space in the flow. Driven by matchMedia rather than a CSS class, because
     an inline height would win over `md:h-0` and silently leave a gap above
     the footer on desktop. */
  const barRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const docked = window.matchMedia('(max-width: 767.98px)');
    const measure = () => setBarHeight(docked.matches ? el.offsetHeight : 0);

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    docked.addEventListener('change', measure);

    return () => {
      ro.disconnect();
      docked.removeEventListener('change', measure);
    };
  }, []);

  return (
    <main className="min-h-screen" style={{ background: C.canvasAlt }}>
      <Header />

      <section className="px-4 pb-10 pt-9 sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-[1040px]">
          {/* ══ The ask ══════════════════════════════════════════════════ */}
          <div className="text-center">
            <h1
              className="font-display text-[28px] font-extrabold leading-[1.1] sm:text-[38px]"
              style={{ color: C.ink, textWrap: 'balance' } as React.CSSProperties}
            >
              Choose your pass
            </h1>
            <p
              className="mx-auto mt-3 max-w-[560px] text-[15px] leading-relaxed sm:text-[16.5px]"
              style={{ color: C.inkSoft }}
            >
              Both include all five live sessions with Dr. Peeyush. Nothing is
              charged until the next page.
            </p>

            {/* The three facts, as a wrapping row of pills rather than the
                hero's ruled strip: there are only three and they are short, and
                a full-width ruled band here would compete with the cards, which
                are the thing to read. */}
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {FACTS.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold"
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.line}`,
                    color: C.ink,
                  }}
                >
                  <Icon weight="bold" className="h-3.5 w-3.5 shrink-0" style={{ color: C.goldInk }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* ══ The two passes ═══════════════════════════════════════════
              A real radiogroup. See the note at the top of the file for why
              this is not two divs with onClick. */}
          {/* ⚠️ NO `items-start`. It was there, and it is what made the two
              cards different heights on desktop: it overrides the grid's
              default `stretch`, so each card shrank to its own content and
              the VIP one — which has three bullets against the standard
              pass's four-plus-a-guide-list — ended a good 80px short.

              With stretch restored, both cards fill the row and each one
              pushes its closing note to its own bottom edge (see `mt-auto`
              in PassCard), so the two notes sit on the same line.

              Below `md` the grid is one column, where stretch is a no-op:
              a single item per row is already its own height. */}
          <div
            role="radiogroup"
            aria-label="Choose your pass"
            className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 md:gap-5"
          >
            {TIER_LIST.map((t) => (
              <PassCard
                key={t.id}
                tier={t}
                checked={t.id === tier}
                onSelect={() => setTier(t.id)}
              />
            ))}
          </div>

          {/* ══ Total + the one button ═══════════════════════════════════ */}
          <TotalBar tier={tier} barRef={barRef} />

          {/* ══ What happens next ════════════════════════════════════════ */}
          <div className="mx-auto mt-10 grid max-w-[860px] gap-4 sm:mt-12 md:grid-cols-2">
            <section
              className="rounded-2xl p-5 sm:p-6"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <h2
                className="font-display text-[17px] font-extrabold"
                style={{ color: C.ink }}
              >
                What happens next
              </h2>
              <ol className="mt-4 space-y-3">
                {NEXT_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3 text-[14px] leading-relaxed">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums"
                      style={{ background: C.goldWash, color: C.goldInk }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: C.inkSoft }}>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className="rounded-2xl p-5 sm:p-6"
              style={{
                background: C.navyBed,
                border: `1px solid ${C.lineStrong}`,
              }}
            >
              <h2
                className="flex items-center gap-2 font-display text-[17px] font-extrabold"
                style={{ color: C.ink }}
              >
                <ShieldCheck weight="fill" className="h-5 w-5 shrink-0" style={{ color: C.emeraldInk }} />
                100% Money-Back Guarantee
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                Come to Day 1. If it is not for you, tell us before Day 2 begins
                and we refund you in full.
              </p>
              <p className="mt-2 text-[14px] font-semibold" style={{ color: C.ink }}>
                No questions, no forms.
              </p>
            </section>
          </div>

          {/* The merchant-of-record line. It belongs on the page BEFORE the
              payment sheet, not after: an unfamiliar name on a bank statement
              is a chargeback, and this is the last screen where saying so can
              still prevent one. */}
          <p
            className="mx-auto mt-8 max-w-[640px] text-center text-[12.5px] leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            Payments in India are collected by Breath for health program. That
            name appears on the payment page and on your statement.
          </p>
        </div>
      </section>

      <SiteFooter />

      {/* ⚠️ AFTER THE FOOTER, NOT BEFORE IT. This is the whole fix and it is
          easy to get backwards — the first version put the spacer here but
          above <SiteFooter />, which only pushed the footer DOWN. The bar is
          fixed to the bottom of the VIEWPORT, so at the end of the page it
          covered the last 147px of whatever was there regardless; all the
          spacer did was change which legal line got hidden.

          Space has to exist BELOW the last content for the bar to sit over.
          Painted in the footer's own navy so it reads as the bottom of the
          footer rather than as a pale gap under it, and sized from the bar's
          measured height (see the note on `barHeight`) so it is exactly the
          bar and not a guess — it was 147px at 390px wide, against the 132px
          that was originally hardcoded here.

          Zero from `md` up, where the bar is in normal flow and needs no
          room reserved. */}
      <div
        aria-hidden
        style={{ height: barHeight, background: C.navyDeep }}
      />
    </main>
  );
}

/* ══ One pass ═══════════════════════════════════════════════════════════ */

function PassCard({
  tier,
  checked,
  onSelect,
}: {
  tier: (typeof TIER_LIST)[number];
  checked: boolean;
  onSelect: () => void;
}) {
  const accent = checked ? C.goldDeep : C.line;

  return (
    <label
      /* `h-full` + `flex-col` so the card fills the stretched grid cell and
         its note can be pushed to the bottom. Without `h-full` the label
         stretches as a grid item but its own content still stacks at the
         top, and `mt-auto` below would have nothing to push against. */
      className="relative flex h-full cursor-pointer flex-col rounded-[22px] p-5 transition-shadow sm:p-6"
      style={{
        background: C.surface,
        /* TWO rings, not a thicker border. A border that changes width on
           selection reflows the card's inner box by a pixel and the text
           visibly shifts; an outline-style ring is painted outside the box
           and moves nothing. */
        border: `1px solid ${accent}`,
        boxShadow: checked
          ? `0 0 0 3px ${C.goldWash}, 0 18px 40px -26px rgba(14,39,51,0.45)`
          : '0 10px 30px -26px rgba(14,39,51,0.35)',
      }}
    >
      {/* The real control. Visually hidden but focusable, so the keyboard and
          the screen reader get a proper radiogroup while the card is the hit
          area. `sr-only` alone would take it out of the a11y tree on some
          older Safari builds when combined with `appearance-none`, so it is
          positioned rather than hidden. */}
      <input
        type="radio"
        name="pass"
        value={tier.id}
        checked={checked}
        onChange={onSelect}
        className="absolute h-px w-px opacity-0"
        style={{ clipPath: 'inset(50%)' }}
      />

      {tier.ribbon ? (
        <span
          className="absolute -top-3 right-5 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em]"
          style={{ background: C.ink, color: C.canvas }}
        >
          {tier.ribbon}
        </span>
      ) : null}

      <div className="flex items-start gap-3">
        {/* The dot. Drawn, not an input, because the input above is hidden. */}
        <span
          aria-hidden
          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors"
          style={{
            border: `2px solid ${checked ? C.goldDeep : C.lineStrong}`,
            background: checked ? C.goldDeep : 'transparent',
          }}
        >
          {checked ? (
            <Check weight="bold" className="h-3 w-3" style={{ color: C.surface }} />
          ) : null}
        </span>

        <div className="min-w-0 flex-1">
          <h2
            className="font-display text-[17.5px] font-extrabold leading-[1.25] sm:text-[19px]"
            style={{ color: C.ink }}
          >
            {tier.name}
          </h2>
          <span
            className="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em]"
            style={{ background: C.goldWash, color: C.goldInk }}
          >
            {tier.badge}
          </span>
        </div>
      </div>

      {/* Price. The anchor is marked up with <s>, not styled with a line, so
          it is announced as "was" rather than read out as a current price. */}
      <p className="mt-4 flex flex-wrap items-baseline gap-2.5">
        <span
          className="font-display text-[30px] font-extrabold leading-none tabular-nums sm:text-[34px]"
          style={{ color: C.ink }}
        >
          {inr(tier.rupees)}
        </span>
        <s className="text-[15px] tabular-nums" style={{ color: C.inkSoft }}>
          {inr(tier.compareAtRupees)}
        </s>
      </p>

      {tier.lead ? (
        <p className="mt-3 text-[13.5px] font-semibold" style={{ color: C.emeraldInk }}>
          {tier.lead}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2.5">
        {tier.bullets.map((b) => (
          <li key={b} className="flex gap-2.5 text-[14px] leading-relaxed">
            <Check
              weight="bold"
              className="mt-[3px] h-4 w-4 shrink-0"
              style={{ color: C.emeraldInk }}
            />
            <span style={{ color: C.inkSoft }}>{b}</span>
          </li>
        ))}

        {/* ── THE THREE PDFs ────────────────────────────────────────────
            A bullet with a nested list rather than three more top-level
            bullets. The guide titles run to 56 characters and sit at the
            same rank as "5 days of live, doctor-led sessions" if they are
            flattened, which buries the thing the pass is actually for.
            Indented, they read as what they are: one line item with three
            parts.

            The names come from GUIDES — derived from the value stack — so
            they cannot drift from the checkout or the landing page.

            The label says "3 PDF guides", NOT "instant access": they are
            handed over in the WhatsApp group at the end of the challenge.
            See the note on GUIDES in ../_landing/offer. */}
        {tier.guides ? (
          <li className="flex gap-2.5 text-[14px] leading-relaxed">
            <Check
              weight="bold"
              className="mt-[3px] h-4 w-4 shrink-0"
              style={{ color: C.emeraldInk }}
            />
            <span style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.ink }}>
                {GUIDES_LABEL}:
              </span>
              <span className="mt-1.5 block space-y-1">
                {GUIDES.map((g) => (
                  <span key={g} className="flex gap-2">
                    <span aria-hidden style={{ color: C.lineStrong }}>
                      •
                    </span>
                    <span>{g}</span>
                  </span>
                ))}
              </span>
            </span>
          </li>
        ) : null}
      </ul>

      {/* The flexible gap. A zero-height spacer with `mt-auto` absorbs
          whatever vertical room the shorter card has spare, which pins the
          note below to the bottom edge.

          It is a separate element ON PURPOSE. Putting `mt-auto` on the note
          itself would make its top margin collapse to zero on the TALLER
          card — the one with no spare room — and the rule would sit flush
          against the last bullet. This way the note keeps its own `mt-4`
          breathing room on both. */}
      <div aria-hidden className="mt-auto" />

      {tier.note ? (
        <p
          className="mt-4 border-t pt-3 text-[12.5px]"
          style={{ borderColor: C.line, color: C.inkSoft }}
        >
          {tier.note}
        </p>
      ) : null}
    </label>
  );
}

/* ══ The total and the single CTA ═══════════════════════════════════════
   ONE element, repositioned by breakpoint: `fixed` below `md`, `static` from
   `md` up. Rendering a docked copy and an inline copy would be two sources of
   the same number, and the mobile one is the copy nobody checks. ────────── */

function TotalBar({
  tier,
  barRef,
}: {
  tier: TierId;
  /* The page measures this element to size the spacer that keeps the bar off
     the footer. See the note on `barHeight` in OtoPage. */
  barRef: React.RefObject<HTMLDivElement>;
}) {
  const t = TIERS[tier];

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-50 md:static md:z-auto md:mt-8"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="mx-auto flex max-w-[1040px] flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center md:justify-between md:rounded-[22px] md:px-6 md:py-5"
        style={{
          background: 'rgba(250,253,254,0.96)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: `1px solid ${C.lineStrong}`,
          boxShadow: '0 -12px 36px -24px rgba(14,39,51,0.45)',
        }}
      >
        <div className="flex items-baseline justify-between gap-3 md:justify-start md:gap-4">
          <span
            className="text-[12.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.inkSoft }}
          >
            Total due today
          </span>
          <span className="flex items-baseline gap-2">
            <s className="text-[13.5px] tabular-nums" style={{ color: C.inkSoft }}>
              {inr(t.compareAtRupees)}
            </s>
            <span
              className="font-display text-[24px] font-extrabold leading-none tabular-nums"
              style={{ color: C.ink }}
            >
              {inr(t.rupees)}
            </span>
          </span>
        </div>

        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <Link
            href={checkoutHref(tier)}
            data-cta
            onClick={() => trackAddToCart()}
            className="lego-press cta-shimmer group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold"
            style={{
              background: C.ink,
              color: C.canvas,
              boxShadow: '0 10px 30px -12px rgba(14,39,51,0.5)',
              ['--shimmer' as string]: 'rgba(34,211,238,0.38)',
            }}
          >
            Reserve My Spot · {inr(t.rupees)}
            <ArrowRight
              weight="bold"
              className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
          <p
            className="flex items-center justify-center gap-1.5 text-[11.5px] font-semibold"
            style={{ color: C.inkSoft }}
          >
            <Lock weight="fill" className="h-3.5 w-3.5 shrink-0" style={{ color: C.goldInk }} />
            100% Secure · UPI · Cards · NetBanking
          </p>
        </div>
      </div>
    </div>
  );
}

/* Back to the sales page, and nothing else. Every other link here is a way
   not to buy. Matches the checkout's header so the two steps read as one
   flow. */
function Header() {
  return (
    <header className="px-4 py-4 sm:px-6" style={{ background: C.navyDeep, color: C.onDark }}>
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: C.onDarkMute }}
        >
          <ArrowLeft weight="bold" className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>
    </header>
  );
}

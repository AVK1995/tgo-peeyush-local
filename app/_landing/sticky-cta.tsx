'use client';

/**
 * The docked CTA (page chrome, not a section).
 *
 * ⚠️ NO REVEAL DELAY, SINCE 24 SEP (Atul's call). This used to stay hidden
 * until the hero had scrolled off, and it docked in with the brick motion on a
 * short delay. Both are gone: it is on screen from the very first paint.
 *
 * That is a deliberate trade, not an oversight. A bar that appears only after
 * the hero leaves cannot be tapped by the reader who decides during the hero,
 * and on a phone the hero is two or three screens tall. The cost is that it now
 * overlaps the hero, which is why it is initialised `true` in state rather than
 * being switched on by the effect — a `false` first render would paint the page
 * without it and slide it in on hydration, which is the flash the delay was
 * supposed to avoid.
 *
 * ONE rule survives: it still hides once the closing recap is in view. A docked
 * bar duplicating a CTA the reader can already see is two primaries, which is
 * none. That also means it is never on screen at the foot of the page, so there
 * is still nothing to reserve flow space for.
 */
import { ArrowRight, CalendarBlank, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  OTO_HREF,
  CTA_LABEL_STICKY,
  CTA_NOTE_STICKY,
  START_DATE,
} from './offer';
import { C } from './shared';

export default function StickyCta() {
  /* `true`, so the bar is in the server HTML and the first paint. See the
     note above: this is the whole "no reveal delay" requirement. */
  const [show, setShow] = useState(true);

  /* ── HIDE ON THE FINAL CTA, AND ON THE FOOTER ──────────────────────────
     The bar is `position: fixed`, so it is out of flow and paints over
     whatever the page ends with. There is no flow spacer (see below), which
     is only safe while the bar is guaranteed to be hidden by the time the
     bottom of the page is on screen.

     Watching `[data-final]` ALONE did not guarantee that. It hides the bar
     while the closing recap is in view, but once the reader scrolls past it
     the recap stops intersecting, the bar comes back, and it comes back
     exactly over the footer — which on this site carries the legal text and
     the merchant-of-record line. The failure only shows at the very bottom of
     the page, which is the part nobody scrolls to while building it.

     So the FOOTER is observed too, and either one showing hides the bar.
     Belt and braces: even if the recap is ever removed, retitled or has its
     marker dropped, the footer rule still keeps the bar off the legal text. */
  useEffect(() => {
    const targets = [
      document.querySelector('[data-final]'),
      document.querySelector('footer'),
    ].filter((el): el is Element => el !== null);

    if (!targets.length) return;

    /* One entry per target, so a target that scrolls out cannot clear a flag
       another target still holds. Keyed by the element itself. */
    const visible = new Set<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        setShow(visible.size === 0);
      },
      { threshold: 0 },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* No spacer, and that is load-bearing on the observer above: the bar is
          hidden by both the closing recap AND the footer, so it is never on
          screen at the foot of the page and there is
          nothing to reserve room for. A spacer here rendered as dead space
          below the footer, which is exactly where it was most visible. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-opacity duration-300 ${
          show ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{
          /* Paper glass. The page is light end to end — the hero included,
             since the stage flipped — so it is a near-opaque tint of the CANVAS
             with blur behind it. Slightly transparent so the section under it
             still moves, opaque enough that type never fights the content. */
          background: 'rgba(250,253,254,0.94)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: `1px solid ${C.lineStrong}`,
          boxShadow: '0 -12px 36px -24px rgba(14,39,51,0.45)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* The lit hairline that makes the bar read as a lifted surface rather
            than as a panel taped to the bottom of the window. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${C.goldMid}, transparent)`,
          }}
        />

        {/* ══ THE TWO LAYOUTS ══════════════════════════════════════════════
            Phone:   the reassurance line centred, the button full width under
                     it — two rows.
            Desktop: the same reassurance line on the left, the button on the
                     right — one row.

            Which is one flex direction change, not two blocks of markup. The
            row is `flex-col` by default and `sm:flex-row sm:justify-between`
            above it, so the copy is written once and neither layout can drift
            from the other.

            What used to be here — the product name, the price as its own
            token, and the session times — is gone. The bar now carries the two
            things the reference shows and nothing else: the guarantee and the
            date on one line, and the action. The price still appears, inside
            the button label, which is where CTA_LABEL already puts it. */}
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-2.5 px-4 py-3 sm:flex-row sm:justify-between sm:gap-4 sm:px-8">
          {/* ⚠️ NOT `truncate`, and NOT CTA_NOTE_HERO.
              The first attempt used both and clipped at BOTH edges on a 390px
              screen: "Join Risk-Free · 100% Money-Back Guarantee · Starts 7th
              October 2026" is ~62 characters, and at 12px in a centred flex it
              simply does not fit. `truncate` hid the failure rather than
              solving it — an ellipsis on a guarantee reads as a broken bar.

              So the "Join Risk-Free ·" prefix is dropped here (it is still on
              the hero's own note, where there is room) and the line is allowed
              to WRAP instead of clip. The guarantee and the date each stay
              whole on their own line at any width, which is what the reference
              shows. */}
          <p
            className="flex items-center justify-center gap-2 text-center text-[11.5px] font-semibold leading-snug sm:justify-start sm:text-left sm:text-[13px]"
            style={{ color: C.inkSoft }}
          >
            <ShieldCheck
              weight="fill"
              className="h-4 w-4 shrink-0"
              style={{ color: C.emeraldInk }}
            />
            <span>
              <span className="whitespace-nowrap">{CTA_NOTE_STICKY}</span>
              <span className="mx-1.5" style={{ color: C.lineStrong }}>
                ·
              </span>
              <span className="whitespace-nowrap">
                <CalendarBlank
                  weight="bold"
                  className="mb-[2px] mr-1 inline h-3 w-3"
                  style={{ color: C.goldInk }}
                />
                Starts {START_DATE}
              </span>
            </span>
          </p>

          <Link
            href={OTO_HREF}
            data-cta
            /* Full width on a phone, hugging its label from `sm` up. A pill
               that only spans half a 360px screen reads as secondary, and this
               is the page's docked primary. */
            className="lego-press cta-shimmer group inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-bold sm:w-auto sm:px-7 sm:text-[15px]"
            style={{
              /* The light page's primary, same as every other button on a light
                 band: his cyan pill is 2.4:1 against this bar and would read as
                 a tinted panel rather than as the thing to press. */
              background: C.ink,
              color: C.canvas,
              boxShadow: '0 8px 26px -10px rgba(14,39,51,0.5)',
              ['--shimmer' as string]: 'rgba(34,211,238,0.38)',
            }}
          >
            <span className="inline-flex items-center gap-2">
              {CTA_LABEL_STICKY}
              <ArrowRight
                weight="bold"
                className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}

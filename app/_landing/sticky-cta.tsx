'use client';

/**
 * The docked CTA (page chrome, not a section).
 *
 * Hidden until the hero has left the screen, and hidden AGAIN once the closing
 * recap is in view — a docked bar that duplicates a CTA the reader can already
 * see is two primaries, which is none. It docks in with the same brick motion
 * as everything else, on a short delay so it lands after the page has settled
 * rather than competing with it.
 *
 * The flow spacer is not optional. Without it the bar sits over the last of
 * the colophon at every viewport, and on iOS the home indicator eats the
 * button.
 */
import { ArrowRight, CalendarBlank, Clock } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CHECKOUT_HREF, CTA_LABEL, PRICE, SESSION_TIMES, START_DATE } from './offer';
import { C } from './shared';

export default function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('[data-hero]');
    const final = document.querySelector('[data-final]');
    if (!hero) return;

    const state = { pastHero: false, atFinal: false };
    const apply = () => setShow(state.pastHero && !state.atFinal);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero) state.pastHero = !e.isIntersecting;
          if (e.target === final) state.atFinal = e.isIntersecting;
        }
        apply();
      },
      { threshold: 0 },
    );

    io.observe(hero);
    if (final) io.observe(final);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* No spacer. The bar hides once the final CTA is in view (see atFinal
          above), so it is never on screen at the foot of the page and there is
          nothing to reserve room for. A spacer here rendered as dead space
          below the footer, which is exactly where it was most visible. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-opacity duration-300 ${
          show ? 'kz-dock opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{
          /* Paper glass. The bar only ever appears below the hero, where the
             page is light end to end, so it is a near-opaque tint of the CANVAS
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

        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="min-w-0">
            <p
              className="truncate font-display text-[15px] font-extrabold leading-tight sm:text-[16.5px]"
              style={{ color: C.ink }}
            >
              5-Day Complete Health Reset
              <span className="mx-1.5" style={{ color: C.lineStrong }}>
                ·
              </span>
              {/* goldInk, not goldDeep. This price sets at 15-16.5px, which is
                  below the 18.66px-bold large-text threshold, so it needs the
                  4.5:1 step (5.2:1) rather than the 3:1 one. */}
              <span style={{ color: C.goldInk }}>{PRICE}</span>
            </p>
            <p
              className="mt-0.5 flex items-center gap-3 truncate text-[11.5px] sm:text-[12px]"
              style={{ color: C.inkSoft }}
            >
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <CalendarBlank weight="bold" className="h-3 w-3" style={{ color: C.goldInk }} />
                Starts {START_DATE}
              </span>
              <span className="hidden shrink-0 items-center gap-1.5 min-[420px]:inline-flex">
                <Clock weight="bold" className="h-3 w-3" style={{ color: C.coralInk }} />
                {SESSION_TIMES}
              </span>
            </p>
          </div>

          <Link
            href={CHECKOUT_HREF}
            data-cta
            className="lego-press cta-shimmer group inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-bold sm:px-7 sm:text-[15px]"
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
              <span className="sm:hidden">Reserve My Spot</span>
              <span className="hidden sm:inline">{CTA_LABEL}</span>
              <ArrowRight
                weight="bold"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}

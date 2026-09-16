'use client';

/**
 * lego — the entrance driver for the page-wide brick motion.
 *
 * Two IntersectionObservers and one MutationObserver, mounted once from the
 * root layout, for the WHOLE document. Nothing here is per-component: a section
 * opts in purely by putting an attribute on an element (see globals.css).
 *
 * Why a MutationObserver as well: the whole below-the-fold tree arrives in a
 * lazily-imported chunk AFTER this mounts, so a one-shot querySelectorAll would
 * miss all of it.
 *
 * `lego-done` is added when the animation ends, which drops `animation: both`
 * and hands the transform back to :hover. Without that step the piece is frozen
 * at its final keyframe and the hover lift silently does nothing.
 */
import { useEffect } from 'react';

const SELECTOR = '[data-lego],[data-lego-loop],[data-lego-stud]';

export default function LegoObserver() {
  useEffect(() => {
    // Reduced motion: the CSS already forces every piece visible, so there is
    // nothing to observe and no reason to pay for the observers.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const seen = new WeakSet<Element>();

    const onEnd = (e: AnimationEvent) => {
      const el = e.currentTarget as HTMLElement;
      if (e.animationName.startsWith('lego-snap') || e.animationName === 'lego-stud') {
        el.classList.add('lego-done');
      }
    };

    /* Plays once, then stops being watched. Everything that is not the 5-day
       spine uses this: replaying a whole page of cards on every scroll pass
       would be noise, not motion. */
    const once = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('lego-in');
          once.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.14 },
    );

    /* Re-arms on exit. Used by the 5-day spine, which is meant to replay every
       time you scroll back through it. */
    const loop = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.classList.add('lego-in');
          } else {
            // Clearing `lego-done` too is what re-arms it: that class kills the
            // animation, so leaving it on would freeze the replay.
            el.classList.remove('lego-in', 'lego-done');
          }
        }
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0.1 },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.addEventListener('animationend', onEnd);
        (el.hasAttribute('data-lego-loop') ? loop : once).observe(el);
      });
    };

    scan();

    // Coalesce bursts of DOM churn (a lazy chunk landing) into one scan on the
    // next frame.
    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    /* Safety sweep. IntersectionObserver is asynchronous and a viewport can
       move faster than it delivers: a jump to an #anchor, a restored scroll
       position on reload, a flung mobile scroll. If a piece is skipped it stays
       at opacity 0 — invisible content, which is far worse than a missed
       animation. So once scrolling settles, anything sitting in the viewport
       without `lego-in` simply gets it. A backstop, not the mechanism. */
    let sweepTimer = 0;
    const sweep = () => {
      const h = window.innerHeight;
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (el.classList.contains('lego-in')) return;
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < h) el.classList.add('lego-in');
      });
    };
    const onScroll = () => {
      window.clearTimeout(sweepTimer);
      sweepTimer = window.setTimeout(sweep, 220);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      mo.disconnect();
      once.disconnect();
      loop.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(sweepTimer);
      if (queued) cancelAnimationFrame(queued);
      document
        .querySelectorAll<HTMLElement>(SELECTOR)
        .forEach((el) => el.removeEventListener('animationend', onEnd));
    };
  }, []);

  return null;
}

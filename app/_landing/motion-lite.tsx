'use client';

/**
 * motion-lite — a drop-in replacement for the subset of the framer-motion API
 * this page uses. It renders plain DOM elements and drives entrance animations
 * with CSS plus a single shared IntersectionObserver, so the page ships ZERO
 * animation runtime and the heavy below-the-fold tree hydrates cheaply.
 *
 * framer-motion stays in package.json: the API surface below is deliberately
 * identical, so swapping back is a one-line import change in below-fold.tsx if
 * a section ever needs something genuinely imperative.
 *
 * Supported surface:
 *   m.<tag>                                            → plain <tag>
 *   variants + initial="hidden" + whileInView="show"   → CSS scroll-reveal
 *   initial={{...}} + whileInView={{...}}              → CSS scroll-reveal
 *   whileHover={{ y } | { scale }}                     → CSS :hover transform
 *   LazyMotion / domAnimation                          → provider + no-op
 */
import React, { forwardRef, useEffect } from 'react';

export type Variants = Record<string, Record<string, unknown>>;
export const domAnimation = {} as const;

/* One observer for the whole subtree. Reveal elements are PURE (no hooks), so
   hydration is cheap; this one effect finds every [data-bw-reveal] and adds
   `bw-in` via the DOM. Because the elements' className prop never changes,
   React reconciliation never wipes it. */
export function LazyMotion({
  children,
}: {
  children: React.ReactNode;
  features?: unknown;
}) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-bw-reveal]'));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('bw-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return <>{children}</>;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function revealClassFor(hidden: Record<string, unknown> | null): string | null {
  if (!hidden) return null;
  const { x, y, scale, opacity } = hidden as Record<string, number | undefined>;
  if (typeof scale === 'number') return 'bw-reveal-scale';
  if (typeof x === 'number' && x !== 0) return x < 0 ? 'bw-reveal-right' : 'bw-reveal-left';
  if (typeof y === 'number' && y !== 0)
    return Math.abs(y) <= 16 ? 'bw-reveal-up-sm' : 'bw-reveal-up';
  if (typeof opacity === 'number' && opacity === 0) return 'bw-reveal-fade';
  return null; // empty (a stagger container) → no reveal of its own
}

function hoverClassFor(hover: Record<string, unknown> | undefined): string | null {
  if (!hover) return null;
  const h = hover as Record<string, number | undefined>;
  if (typeof h.scale === 'number') return 'bw-hover-scale';
  if (typeof h.y === 'number') return h.y <= -4 ? 'bw-hover-lift' : 'bw-hover-lift-sm';
  return null;
}

type StyleLike = React.CSSProperties & Record<string, unknown>;

function sanitizeStyle(style: StyleLike | undefined): React.CSSProperties | undefined {
  if (!style) return style;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(style)) {
    if (v == null) continue;
    if (typeof v === 'string' || typeof v === 'number') out[k] = v;
  }
  return out as React.CSSProperties;
}

type MotionProps = {
  variants?: Variants;
  initial?: unknown;
  animate?: unknown;
  whileInView?: unknown;
  whileHover?: Record<string, unknown>;
  whileTap?: unknown;
  transition?: { duration?: number } & Record<string, unknown>;
  viewport?: unknown;
  className?: string;
  style?: StyleLike;
  children?: React.ReactNode;
  /* Deliberately `any`, and deliberately WITHOUT an eslint-disable comment.
     This is the pass-through for every prop the real framer-motion API accepts
     that is not modelled above, and it is spread straight onto the element.
     The project extends next/core-web-vitals only, so @typescript-eslint is not
     loaded: naming one of its rules in a disable directive makes ESLint fail on
     the unknown rule, which is the error this comment used to cause. */
  [key: string]: any;
};

function RevealEl({
  tag,
  revealClass,
  hoverClass,
  className,
  style,
  children,
  ...rest
}: { tag: string; revealClass: string; hoverClass: string | null } & MotionProps) {
  const Tag = tag as unknown as React.ElementType;
  return (
    <Tag
      data-bw-reveal=""
      className={cx(className, 'bw-reveal', revealClass, hoverClass)}
      style={sanitizeStyle(style)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const cache = new Map<string, React.ComponentType<MotionProps>>();

function getComponent(tag: string): React.ComponentType<MotionProps> {
  const hit = cache.get(tag);
  if (hit) return hit;

  const Comp = forwardRef<HTMLElement, MotionProps>(function MotionLite(props, ref) {
    const {
      variants,
      initial,
      animate: _animate,
      whileInView,
      whileHover,
      whileTap: _whileTap,
      transition: _transition,
      viewport: _viewport,
      className,
      style,
      children,
      ...rest
    } = props;
    const Tag = tag as unknown as React.ElementType;
    const hoverClass = hoverClassFor(whileHover);

    const hidden =
      (variants && (variants.hidden as Record<string, unknown>)) ||
      (initial && typeof initial === 'object' ? (initial as Record<string, unknown>) : null);
    const isReveal =
      !!hidden &&
      (initial === 'hidden' ||
        whileInView === 'show' ||
        typeof whileInView === 'object' ||
        typeof initial === 'object');
    const revealClass = isReveal ? revealClassFor(hidden) : null;

    if (revealClass) {
      return (
        <RevealEl
          tag={tag}
          revealClass={revealClass}
          hoverClass={hoverClass}
          className={className}
          style={style}
          {...rest}
        >
          {children}
        </RevealEl>
      );
    }

    return (
      <Tag ref={ref} className={cx(className, hoverClass)} style={sanitizeStyle(style)} {...rest}>
        {children}
      </Tag>
    );
  });

  cache.set(tag, Comp as React.ComponentType<MotionProps>);
  return Comp as React.ComponentType<MotionProps>;
}

export const m: Record<string, React.ComponentType<MotionProps>> = new Proxy(
  {},
  { get: (_t, tag: string) => getComponent(tag) },
) as Record<string, React.ComponentType<MotionProps>>;

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

import { LEGAL } from '@/app/_landing/legal';
import { C } from '@/app/_landing/shared';

/**
 * The shell all three legal pages share: navy masthead with a way back, then a
 * capped measure of prose. Type is set by the .legal-content rules in
 * globals.css so the three pages cannot drift from each other.
 */
export default function LegalPageLayout({
  title,
  effectiveDate,
  intro,
  children,
}: {
  title: string;
  effectiveDate: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main style={{ background: C.canvas }}>
      <header
        className="px-4 py-14 sm:px-6 sm:py-16"
        style={{ background: C.navyDeep, color: C.onDark }}
      >
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: C.onDarkMute }}
          >
            <ArrowLeft size={14} weight="bold" aria-hidden="true" />
            Back to {LEGAL.brand}
          </Link>
          <h1 className="mt-5 font-display text-[30px] font-extrabold leading-[1.08] sm:text-[38px]">
            {title}
          </h1>
          <p
            className="mt-3 text-[12.5px] font-medium uppercase tracking-[0.18em]"
            style={{ color: C.onDarkMute }}
          >
            Effective {effectiveDate}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[15.5px] leading-relaxed sm:text-[16.5px]" style={{ color: C.inkSoft }}>
          {intro}
        </p>
        <div
          className="legal-content mt-8 space-y-7 text-[15px] leading-relaxed sm:mt-10 sm:text-[16px]"
          style={{ color: C.inkSoft }}
        >
          {children}
        </div>
      </article>
    </main>
  );
}

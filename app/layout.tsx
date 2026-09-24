import type { Metadata, Viewport } from 'next';
import { DM_Sans, Poppins } from 'next/font/google';

import Analytics from '@/components/Analytics';
import MetaPixel from '@/components/MetaPixel';
import LegoObserver from './_landing/lego';
import { PRICE, SESSION_TIMES, START_DATE } from './_landing/offer';
import './globals.css';

/**
 * Two faces, three voices. Both are HIS, taken off breathforhealth.in/breath
 * rather than chosen: the point of this pass is that his page and this page
 * look like the same practice.
 *
 * Poppins (display) does the headlines at 800 with negative tracking. It is a
 * geometric sans with a tall x-height and circular bowls, so it goes loud
 * without going shouty, and at 800 it holds on both of this page's grounds:
 * reversed out of the dark hero stage, where the serif it replaces would have
 * thinned, and set dark on the light bands below it. It never appears below
 * headline size.
 *
 * DM Sans (body) does the reading at a 17px base: low contrast, open apertures
 * and clean lining figures, which matters on a page carrying prices, times,
 * day numbers and a value ledger. It is also the face his buttons and eyebrows
 * are set in, so the whole page below headline size is one voice.
 *
 * The third voice, the "spec" one that labels and credentials use, is tracked
 * uppercase DM Sans rather than a monospace. Deliberate: a mono reads like a
 * terminal, and next to a doctor's credentials it reads like a lab report
 * rather than like care. Tracked caps do the same job in the right register.
 */
/* Poppins is NOT a variable family on Google Fonts, so this one MUST pass a
   weight array (next/font throws without it) and every weight is a separate
   file. Three, and only three: 600 for the small display labels, 700 where the
   page asks for bold, 800 for the headlines. Any class asking for a weight
   outside this set gets a synthesised face, which is why the hero's second tier
   was moved off 500.
   DM Sans IS variable, so it passes no weight and loads the whole wght axis in
   one file per style. Italic is loaded because the page sets its one turn-line
   in a body italic: Poppins italic is a slanted geometric and reads as a
   mistake next to an 800 headline. */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});

const DESCRIPTION = `A live, doctor-led 5-day challenge for people struggling with chronic pain, stress and lifestyle health concerns. Five sessions with Dr. Peeyush Prabhat on breathing, energy, the nervous system and emotional load. Starts ${START_DATE}, ${SESSION_TIMES}, live on Zoom, for ${PRICE}.`;

const FALLBACK_ORIGIN = 'https://drpeeyushprabhat.com';

function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (!raw) return FALLBACK_ORIGIN;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

const SITE_URL = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: '5-Day Complete Health Reset Challenge | Dr. Peeyush Prabhat',
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: '5-Day Complete Health Reset Challenge | Dr. Peeyush Prabhat',
    description: DESCRIPTION,
    siteName: 'Dr. Peeyush Prabhat',
  },
  twitter: {
    card: 'summary_large_image',
    title: '5-Day Complete Health Reset Challenge | Dr. Peeyush Prabhat',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  /* The announcement strip, which is the topmost thing on the page, so the
     phone browser chrome continues it rather than cutting a line above it.

     ⚠️ This tracks the STRIP, and the strip changed colour on 24 Sep when the
     hero stage went light. It was --navy-deep (#06141C) to match a dark rail;
     leaving it there now would paint a near-black band above a pale strip,
     which on a phone is the most visible edge on the page. This is the
     goldWash the strip is filled with. */
  themeColor: '#E2F6FA',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${poppins.variable} ${dmSans.variable}`}>
      <body>
        {/* Marks the document as JS-capable BEFORE first paint, so the CSS
            scroll reveals only hide content when JS is there to reveal it.
            No-JS users and crawlers see everything, and there is no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('bw-js')",
          }}
        />
        {/* One set of observers for the whole document, mounted here rather
            than per-section. Renders nothing. */}
        <LegoObserver />
        <MetaPixel />
        {/* GA4 + Clarity, from env. Renders nothing until the ids are set.
            Without this every browser-side GA4 call is a silent no-op and the
            webhook reports purchases with no funnel above them. */}
        <Analytics />
        {children}
      </body>
    </html>
  );
}

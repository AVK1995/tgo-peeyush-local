/**
 * Every date, time, price and destination on the page comes through this file.
 * Nothing below it should ever hard-code one again: when the cohort moves, one
 * edit here moves the announcement bar, the hero, the pills, the schedule
 * heading, the docked bar, the footer and the metadata together.
 */

/**
 * THE price, in RUPEES. One number, from one env var, used by the copy, the
 * GA4 event values and the amount the gateway charges. Nothing anywhere else
 * may declare a price: two sources drift, and the drift is invisible until the
 * charge and the label disagree on a live page.
 *
 * This file stays rupees-only even though Razorpay charges in PAISE. The
 * conversion lives once, in `lib/checkout-config.ts`, next to the code that
 * actually talks to the gateway. It was briefly exported here as
 * `PRICE_PAISE`; that came back to bite when the funnel moved to a
 * rupees-denominated gateway and again when it moved back, so the rule is now:
 * the landing page speaks rupees, the payment layer converts.
 */
/* `??` does NOT catch an empty string, and .env.example ships every key blank.
   So a copied-but-unfilled .env.local would give Number('') === 0: a page
   advertising ₹0 and an order for nothing, with nothing throwing. Guard on a
   positive number, not on null. */
const RAW_PRICE = Number(process.env.NEXT_PUBLIC_PRICE_RUPEES);
export const PRICE_RUPEES = Number.isFinite(RAW_PRICE) && RAW_PRICE > 0 ? RAW_PRICE : 497;
export const PRICE = `₹${PRICE_RUPEES.toLocaleString('en-IN')}`;
/** The anchor the announcement bar names. Rising, per the source copy. */
export const PRICE_RISES_TO = '₹1599';

/* The cohort. The source copy wrote the date as "[30th September]", in
   brackets, which is the shape of a fill-in-the-blank rather than a date, so
   the brackets were dropped: rendering them literally would ship a template
   marker to a live page.

   MOVED TO 7TH OCTOBER 2026 (Atul, 2026-09-18). The year is carried in the
   string now: the cohort is weeks out and a bare day-and-month on a live page
   is ambiguous once it is close to a year boundary. */
export const START_DATE = '7th October 2026';
export const SESSION_TIMES = '6:30 AM & 7:30 PM';
export const SESSION_TIMES_TZ = '6:30 AM or 7:30 PM IST';

/**
 * The two figures in the trust row. They are claims about the client's track
 * record, so they live here as data rather than inside a component: if either
 * turns out to be unsupportable, it is one edit, not a hunt.
 *
 * ⚠️ UNVERIFIED. The source copy asserts "1000+ Health Transformations" and a
 * "5.0 Client Rating" with no platform named behind the rating. A 5.0 with no
 * source is the weakest kind of proof and the easiest to challenge. Flagged for
 * Atul, not changed.
 */
export const HEALTH_TRANSFORMATIONS = '1000+';
export const CLIENT_RATING = '5.0';

/**
 * The WhatsApp community invite. The thank-you page is built around joining it
 * as the single next step, so an empty value there shows the buyer a dead
 * button at the exact moment they have just paid.
 *
 * ⚠️ REQUIRED BEFORE LAUNCH. Create the group, take the invite link.
 */
export const WHATSAPP_INVITE = process.env.NEXT_PUBLIC_WHATSAPP_INVITE ?? '';

/** The next click is a payment. Every CTA on the page, including the docked
 *  bar, points here. */
export const CHECKOUT_HREF = '/checkout';

/**
 * The CTA label and its reassurance line, as written in the source copy.
 *
 * The source repeats the same pair at the hero, the live-sessions card and the
 * final recap, so HERO and the general note are the same string here rather
 * than two variants. They stay separate exports because the two render on
 * different grounds (dark stage vs paper) and a future copy pass may want to
 * split them again.
 */
export const CTA_LABEL = `Start Your 5-Day Health Reset · ${PRICE}`;
export const CTA_NOTE_HERO = 'Join Risk-Free · 100% Money-Back Guarantee';
export const CTA_NOTE = 'Join Risk-Free · 100% Money-Back Guarantee';

/** Beat 14's button, which the copy words differently from every other CTA. */
export const CTA_LABEL_ACTION = `Take Action · ${PRICE}`;

/** ₹2,500 → "₹2,500". One formatter, so a value never renders two ways. */
export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/**
 * THE VALUE STACK — four items, in the order the source copy lists them.
 *
 * ONE source for BOTH beats that carry it: the toolkit cards (./toolkit) and
 * the closing recap ledger (./close). On the Kaizen build these were two
 * hand-typed lists and they drifted the moment an item was revalued — the
 * ledger showed rows adding to one figure with a different total struck out
 * beside them, on the one beat of the page a reader actually does the
 * arithmetic on. Deriving both from this array makes that impossible.
 *
 * `value` is a NUMBER, never a formatted string, so the total is SUMMED rather
 * than typed. The copy's stated total (₹4,791) is exactly this sum; if an item
 * is ever revalued the recap follows it on its own.
 *
 * Titles, values, bodies and access tags are verbatim from COPY-SOURCE.md.
 */
export type IncludedItem = {
  /** Stable key. The toolkit maps it to a glyph; nothing else depends on it. */
  key: 'challenge' | 'breath' | 'stress' | 'mobility';
  n: string;
  title: string;
  value: number;
  body: string;
  tag: string;
  /** 'live' for the challenge itself, 'instant' for the three downloads. */
  access: 'live' | 'instant';
};

export const INCLUDED: IncludedItem[] = [
  {
    key: 'challenge',
    n: '01',
    title: '5-Day Live Complete Health Reset Challenge',
    value: 2500,
    body: 'Experience five doctor-led live sessions designed to help you understand your body better, reduce stress & internal overload, improve energy and start working on your health from within.',
    tag: 'LIVE ACCESS · INCLUDED',
    access: 'live',
  },
  {
    key: 'breath',
    n: '02',
    title: 'Breath for Health Blueprint',
    value: 997,
    body: 'Your practical companion guide covering sleep, energy, nervous-system recovery and better breathing, with self-assessments, simple protocols and a 7-day practice plan you can follow step by step.',
    tag: 'INSTANT ACCESS · INCLUDED',
    access: 'instant',
  },
  {
    key: 'stress',
    n: '03',
    title: 'Stress Emergency Toolkit',
    value: 797,
    body: 'A quick-reference toolkit with 4 simple techniques for stressful moments, sleepless nights, low energy and anxiety, so you know exactly what to use when you need support most.',
    tag: 'INSTANT ACCESS · INCLUDED',
    access: 'instant',
  },
  {
    key: 'mobility',
    n: '04',
    title: 'The 10-Minute Daily Joint Mobility & Pain Relief Playbook',
    value: 497,
    body: 'A simple 10-minute, office-chair friendly routine to help loosen stiff joints, ease neck and back tension, improve everyday mobility and support better pain relief, with no gym or equipment required.',
    tag: 'INSTANT ACCESS · INCLUDED',
    access: 'instant',
  },
];

/** Summed, never typed. Equals the copy's ₹4,791. */
export const INCLUDED_TOTAL = INCLUDED.reduce((n, item) => n + item.value, 0);

/* The only file allowed to declare a price, a date, a session time or a
   destination. Strings are verbatim from COPY-SOURCE.md. */

/* Guard on a positive number: `??` does not catch an empty string, so an
   unfilled env var would otherwise give a ₹0 page and a zero-paise order. */
const RAW_PRICE = Number(process.env.NEXT_PUBLIC_PRICE_RUPEES);
export const PRICE_RUPEES = Number.isFinite(RAW_PRICE) && RAW_PRICE > 0 ? RAW_PRICE : 99;

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const PRICE = inr(PRICE_RUPEES);

export const WORKSHOP_NAME = '2-Day Breath Healing Mastery Workshop';
export const AUDIENCE_LINE =
  "For people who've tried everything - yet still struggle with recurring health issues";
export const FORMAT = '2-Day Live, Doctor-Led Workshop';

/* Change weekly in Vercel env (then redeploy: NEXT_PUBLIC_* is inlined at build).
   Blank or unset falls back to the defaults below. */
const envText = (v: string | undefined, fallback: string) => (v || '').trim() || fallback;

export const DATES = envText(process.env.NEXT_PUBLIC_WORKSHOP_DATES, '17th & 18th October');
export const SESSION_TIME = envText(process.env.NEXT_PUBLIC_SESSION_TIME, '11:00 AM - 1:00 PM');
export const SESSION_TIME_TZ = `${SESSION_TIME} IST`;

// ⚠️ UNVERIFIED claim. Confirm a public Trustpilot profile carries 4.8.
export const RATING = '4.8';
export const RATING_LABEL = 'Trust Pilot Rating';

export const CHECKOUT_HREF = '/checkout';

export const CTA_LABEL = 'Book My Seat Now - 81% Off Today!';

/* The regular price the checkout strikes through; null hides the strike. */
export const LIST_PRICE_RUPEES: number | null = 521;
export const LIST_PRICE = LIST_PRICE_RUPEES ? inr(LIST_PRICE_RUPEES) : '';

/** The seat count shown on load; seat-count.tsx steps it down from here. */
export const SEATS_START = 44;

export const PROMISE_NAME = 'Get-Relief Promise';
export const PROMISE_TEXT = 'Notice visible relief in your symptoms or get 100% refund!';
export const CTA_NOTE = `${PROMISE_NAME}: ${PROMISE_TEXT}`;

/* The main community every buyer joins: session links, reminders, bonuses. */
export const WHATSAPP_INVITE = process.env.NEXT_PUBLIC_WHATSAPP_INVITE ?? '';

/**
 * The SEPARATE group the Day 1 + Day 2 recordings are delivered in, for
 * buyers who paid for the recordings add-on.
 *
 * ⚠️ A DIFFERENT GROUP FROM `WHATSAPP_INVITE`, and it has to stay that way.
 * The recordings are a paid extra; posting them in the main community hands
 * them to every ₹99 buyer who did not pay, which is both a refund argument
 * from the people who did and the end of the add-on as a product.
 *
 * ⚠️ REQUIRED BEFORE THE RECORDINGS ADD-ON GOES LIVE. Empty renders the card
 * with a visibly disabled button and a "write to us" fallback rather than a
 * dead link — but that is a failure state, not a launch state.
 */
export const WHATSAPP_RECORDINGS_INVITE =
  process.env.NEXT_PUBLIC_WHATSAPP_RECORDINGS_INVITE ?? '';

/**
 * The booking page where a private-session buyer picks their slot — a
 * Calendly/Cal.com-style link, opened in a new tab so the buyer does not lose
 * this page (which is still carrying their other joining steps).
 *
 * ⚠️ REQUIRED BEFORE THE 1-ON-1 ADD-ON GOES LIVE. Same failure handling as
 * above: an empty value shows a disabled card with the support address rather
 * than a button that goes nowhere.
 */
export const CALL_BOOKING_URL = process.env.NEXT_PUBLIC_CALL_BOOKING_URL ?? '';

/* All bonuses are released in the WhatsApp Community after Day 2, never at registration. */
export const BONUS_DELIVERY_NOTE = 'All bonuses are shared in the WhatsApp Community after Day 2 of the workshop.';

/* ── WHEN THE TWO PAID ADD-ONS ARRIVE ─────────────────────────────────────
   Declared once each, because both answer a question a buyer asks BEFORE
   paying and again the moment after. The checkout card, the thank-you card
   and the FAQ all render these strings rather than paraphrasing them: three
   paraphrases of a delivery promise is three slightly different promises, and
   the one the buyer quotes back is always the most generous.

   ⚠️ "After the final session on Day 2" is deliberately phrased against the
   SESSION, not a date. DATES is env-driven and moves per cohort; this line
   stays true whenever the workshop runs. */
export const RECORDING_DELIVERY_NOTE =
  'Recordings are shared right after the final session on Day 2, once the workshop ends.';

export const CALL_BOOKING_NOTE =
  'Book any time that suits you, before or after the workshop.';

/**
 * How every link a buyer needs actually reaches them.
 *
 * ⚠️ THE BOOKING LINK IS NOT POSTED IN ANY WHATSAPP GROUP, and the copy has
 * to say so. The group invites are, by their nature, group links; the 1-on-1
 * booking link is personal and lives in three places only — the thank-you
 * page, the confirmation email and the confirmation WhatsApp message.
 *
 * Saying it matters because the rest of this funnel trains the opposite
 * expectation: session links come in the group, bonuses come in the group,
 * recordings come in the group. A buyer who has read all that will sit
 * waiting for a booking link in a group it is never going to appear in, and
 * then ask for a refund on a session they could have booked on day one.
 */
export const LINKS_DELIVERY_NOTE =
  'Every link here is also in your confirmation email and WhatsApp message, so you can come back to them any time.';

export const CALL_LINK_LOCATION_NOTE =
  'Your booking link is on this page, in your email and in your WhatsApp message. It is not posted in any group.';

export type Bonus = {
  n: 1 | 2 | 3;
  title: string;
  value: number;
  body: string;
};

export const BONUSES: Bonus[] = [
  {
    n: 1,
    title: '10-min Breath Healing Mastery Booklet',
    value: 2500,
    body: 'A simple step-by-step guide to practise the 10-Min Breath Healing Method™ at home.',
  },
  {
    n: 2,
    title: 'Breath For Health Blueprint',
    value: 1500,
    body: 'Your practical guide to better breathing, deeper sleep, higher energy and nervous-system recovery with simple protocols and a 7-day practice plan.',
  },
  {
    n: 3,
    title: 'Stress Emergency Toolkit',
    value: 999,
    body: 'Get 4 quick breathing techniques you can use during stressful moments, anxiety, sleepless nights or low-energy days, so you know exactly what to do when you need relief most.',
  },
];

/* Summed, never typed. Equals the copy's "Bonuses worth 4999". */
export const BONUS_TOTAL = BONUSES.reduce((sum, b) => sum + b.value, 0);
export const BONUS_TOTAL_LABEL = `Bonuses worth ${inr(BONUS_TOTAL)}`;

export const OFFER_LINE = `Get The 2-Day Workshop + All 3 Bonuses For Just ${PRICE}`;

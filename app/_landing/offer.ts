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

export const WHATSAPP_INVITE = process.env.NEXT_PUBLIC_WHATSAPP_INVITE ?? '';

/* All bonuses are released in the WhatsApp Community after Day 2, never at registration. */
export const BONUS_DELIVERY_NOTE = 'All bonuses are shared in the WhatsApp Community after Day 2 of the workshop.';

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

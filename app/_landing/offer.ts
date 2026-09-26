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

/* ══════════════════════════════════════════════════════════════════════════
 *  THE TWO PASSES  (added 26 Sep 2026, the OTO step)
 *
 *  The funnel gained a step: Ads → Landing → **OTO** → Checkout → Thank-you.
 *  The landing no longer sends anyone straight to a payment; it sends them to
 *  /oto, where they choose between the standard pass and the VIP pass, and the
 *  choice is carried into the checkout as `?tier=`.
 *
 *  ⚠️ THIS IS THE ONLY PLACE EITHER PRICE IS DECLARED, and the rule at the top
 *  of this file now covers two numbers instead of one. `lib/checkout-config.ts`
 *  converts to paise from HERE, and the create-order route looks the amount up
 *  from HERE by tier id.
 *
 *  ⚠️ AND THE SERVER NEVER TRUSTS A CLIENT AMOUNT. The browser sends a tier
 *  ID — the string "standard" or "vip" — and the route resolves the rupees
 *  itself. If it accepted an amount, anyone could open devtools and buy the VIP
 *  pass for ₹1. `resolveTier()` below is that lookup, and it falls back to the
 *  standard pass for anything it does not recognise rather than throwing, so a
 *  mangled URL sells the cheaper thing instead of failing at the till.
 * ═══════════════════════════════════════════════════════════════════════ */

export type TierId = 'standard' | 'vip';

export type Tier = {
  id: TierId;
  /** The card's title. Also the `product` on the fulfilment record. */
  name: string;
  /** Short form for the docked bar and the order summary, where the full
   *  title does not fit. */
  shortName: string;
  rupees: number;
  /** The struck-through anchor beside the price. */
  compareAtRupees: number;
  /** The small line under the title: what this pass is, in two words. */
  badge: string;
  /** The corner flag. Only the VIP pass carries one. */
  ribbon?: string;
  /** The line above the bullets on the upgrade card. */
  lead?: string;
  bullets: string[];
  /**
   * Whether to list the three PDF guides under the bullets.
   *
   * A FLAG, NOT A LIST. The guide titles are not repeated here — they come
   * from `GUIDES` below, which is derived from `INCLUDED`, the value stack
   * the landing page and the checkout already render. Writing them out a
   * second time is how the same PDF ends up with two names on one funnel.
   *
   * Only the standard pass sets it. The VIP card does not need it: its copy
   * is "Everything above, plus:", so repeating the guides there would say the
   * upgrade adds something it does not.
   */
  guides?: boolean;
  /** The caveat under the bullets. */
  note?: string;
  /** Where a buyer of this pass lands after paying. */
  thankYouHref: string;
};

/* The VIP price, from its own env var so a ₹1 smoke test can move both.
   ⚠️ SETTING NEXT_PUBLIC_PRICE_RUPEES ALONE LEAVES VIP AT ₹997. For a live
   test of the upgrade path set this one too, or the OTO shows ₹1 beside ₹997
   and the second card is the only thing that charges real money. */
const RAW_VIP = Number(process.env.NEXT_PUBLIC_VIP_PRICE_RUPEES);
export const VIP_PRICE_RUPEES =
  Number.isFinite(RAW_VIP) && RAW_VIP > 0 ? RAW_VIP : 997;

export const TIERS: Record<TierId, Tier> = {
  standard: {
    id: 'standard',
    name: '5-Day Complete Health Reset Challenge',
    shortName: '5-Day Complete Health Reset',
    rupees: PRICE_RUPEES,
    compareAtRupees: 2499,
    badge: 'Included',
    bullets: [
      '5 days of live, doctor-led sessions with Dr. Peeyush Prabhat',
      'Both daily slots: 6:30 AM or 7:30 PM IST, attend either',
      'Day 1 to Day 4 health assessment and tracking',
    ],
    guides: true,
    note: 'Live access only. Recordings are not included.',
    thankYouHref: '/thank-you',
  },
  vip: {
    id: 'vip',
    name: '5-Day Complete Health Reset Challenge + VIP Access',
    shortName: '5-Day Reset + VIP Access',
    rupees: VIP_PRICE_RUPEES,
    compareAtRupees: 4999,
    badge: 'Recordings included',
    ribbon: 'Most chosen',
    /* The copy is explicit that this REPLACES the standard price rather than
       adding to it, because "+ VIP Access" beside a second number reads as an
       add-on and buyers assume ₹497 + ₹997. Kept verbatim. */
    lead: `₹${VIP_PRICE_RUPEES.toLocaleString('en-IN')} total, not on top. Everything above, plus:`,
    bullets: [
      'Lifetime replay library: all 5 sessions, both slots',
      '15-minute extended Q&A after each session with Dr. Peeyush',
      'Priority real-time, on-camera breathing technique correction',
    ],
    /* The counterpart to the standard pass's "Live access only" line, and the
       reason both cards can be the same height without padding one out: this
       card had a note-shaped hole at the bottom and nothing in it.

       It is not filler. It answers the question the replay library raises —
       where the recordings actually turn up, and for how long — which is the
       same answer the thank-you page gives, and it matches how the PDF guides
       are handed over. */
    note: 'Replays are shared in the WhatsApp group and stay available after the challenge ends.',
    thankYouHref: '/thank-you/vip',
  },
};

export const TIER_LIST: Tier[] = [TIERS.standard, TIERS.vip];

/** The pass a visitor gets if they never choose: the cheaper one. */
export const DEFAULT_TIER_ID: TierId = 'standard';

/**
 * Turn anything at all into a real tier. Used by the checkout page (reading a
 * query string a human can edit) and by the create-order route (reading a JSON
 * body anyone can forge), which is why it never throws and never trusts.
 */
export function resolveTier(v: unknown): Tier {
  return v === 'vip' ? TIERS.vip : TIERS.standard;
}

/** ⚠️ FLAG FOR ATUL — three numbers in the supplied OTO copy disagree with
 *  what is already on the site, rendered as given and listed here rather than
 *  silently reconciled:
 *
 *  1. The OTO says "₹497 until Monday 5th October · then ₹997". The landing's
 *     announcement bar says the price rises to ₹1599 (PRICE_RISES_TO above).
 *     Two different "then" prices on one funnel.
 *  2. That same line makes the standard pass ₹997 after the 5th — which is the
 *     VIP price. After the deadline the two passes cost the same.
 *  3. The OTO anchors the standard pass at ₹2,499. The landing's own value
 *     stack (INCLUDED below) sums to ₹4,791 for what looks like the same
 *     thing.
 *
 *  The deadline line is NOT rendered on the page for that reason — see the
 *  note in app/oto/page.tsx. Everything else is verbatim. */
export const OTO_DEADLINE_LINE = `₹${PRICE_RUPEES.toLocaleString('en-IN')} until Monday 5th October · then ₹997`;

/** Where a landing CTA goes now: the pass chooser, not the payment. */
export const OTO_HREF = '/oto';

/** Where an OTO card sends a buyer once a pass is chosen. The tier rides as a
 *  query param; the SERVER resolves the price from it. */
export const CHECKOUT_HREF = '/checkout';
export const checkoutHref = (tier: TierId) =>
  tier === DEFAULT_TIER_ID ? CHECKOUT_HREF : `${CHECKOUT_HREF}?tier=${tier}`;

/**
 * THE THREE CTA LABELS. There are exactly three, and every button on the site
 * uses one of them — standardised 24 Sep 2026 on Atul's call.
 *
 * Before this the page carried four different wordings: "Start Your 5-Day
 * Health Reset · ₹497" in three places, "Reserve My Spot" on the offer card,
 * "Take Action · ₹497" hard-coded into beat 14, and a fourth on the docked
 * bar. A reader scrolling the page met the same single action described four
 * ways, which reads as four different offers rather than one.
 *
 * ⚠️ THE SPLIT IS BY POSITION, NOT BY SECTION. Adding a button means picking
 * from these three, not writing a fifth:
 *
 *   CTA_LABEL         the default. The hero, the live-sessions band, the final
 *                     recap, beat 14 — everything that is not one of the two
 *                     cases below.
 *   CTA_LABEL_CARD    the button UNDER THE OFFER-STACK IMAGE only. It carries
 *                     no price because the card states the price on its own
 *                     line two rows above the button, and repeating it inside
 *                     the label reads as a second, different charge.
 *   CTA_LABEL_STICKY  the docked bar only. Worded for someone who has already
 *                     scrolled past the offer, so it names the outcome rather
 *                     than the programme.
 *
 * ⚠️ FLAG FOR ATUL, carried over: the source copy writes beat 14's button as
 * "[Take Action · ₹497 →]". That wording is now REPLACED by CTA_LABEL, which
 * is a deliberate departure from verbatim copy in favour of one consistent
 * action. Say the word and it goes back to its own constant.
 */
export const CTA_LABEL = `Start Your 5-Day Reset · ${PRICE}`;
export const CTA_LABEL_CARD = 'Reserve My Spot';
export const CTA_LABEL_STICKY = `Get Instant Access · ${PRICE}`;

export const CTA_NOTE_HERO = 'Join Risk-Free · 100% Money-Back Guarantee';
export const CTA_NOTE = 'Join Risk-Free · 100% Money-Back Guarantee';
/** The docked bar's own line, which names the guarantee without the prefix:
 *  it sits at 11.5px on a phone and the longer note clipped at both edges. */
export const CTA_NOTE_STICKY = '100% Money-Back Guarantee';

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

/**
 * The PDF guides, by name, derived from INCLUDED rather than listed again.
 *
 * The OTO card, the checkout summary and the value stack all name these three
 * guides. Typing them out per surface is how "The 10-Minute DAILY Joint
 * Mobility & Pain Relief Playbook" becomes "The 10-Minute Joint Mobility &
 * Pain Relief Playbook" on one page and not another — a buyer then cannot
 * tell whether the checkout is selling them the same thing the offer did.
 *
 * ⚠️ NOT "INSTANT ACCESS" (26 Sep 2026, Atul). The guides are handed over in
 * the WhatsApp group at the END of the challenge, not on payment, so every
 * surface that promised them immediately was promising the wrong thing. The
 * word is gone from the OTO card and the checkout summary.
 *
 * It is NOT yet gone from the landing page, which still carries
 * `tag: 'INSTANT ACCESS · INCLUDED'` on all three items below and a
 * "GET INSTANT ACCESS TO" eyebrow over the toolkit section. Those are SHAPE's
 * copy and are left for a copy pass rather than changed here — but they now
 * contradict the delivery, and a buyer who reads them will email support on
 * day one asking where the downloads are.
 *
 * `access: 'instant'` survives as the DISCRIMINATOR only: it is what tells a
 * download apart from the live session, and the toolkit picks its icon from
 * it. The value's NAME is a leftover from the same wrong assumption; renaming
 * it to 'download' belongs in that same copy pass.
 *
 * ⚠️ DECLARED BELOW `TIERS`, AND THAT IS DELIBERATE. A `const` cannot be read
 * before its initialiser runs, so `TIERS` carries a boolean flag (`guides`)
 * and the components pull the names from here. Referencing this array inside
 * the TIERS literal above would throw at module load.
 */
export const GUIDES = INCLUDED.filter(
  (item) => item.access === 'instant',
).map((item) => item.title);

/** "3 PDF guides" — counted, never typed, for the same reason the total above
 *  is summed. Adding a fourth guide to INCLUDED updates the label, the OTO
 *  card and the checkout in one edit. */
export const GUIDES_LABEL = `${GUIDES.length} PDF guides`;

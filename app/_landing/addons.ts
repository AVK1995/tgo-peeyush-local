/**
 * The two optional add-ons, and the one place their prices are declared.
 *
 * The checkout sells a ₹99 seat with two upsells the buyer can tick: the
 * workshop recordings, and a private one-on-one session. Four orders are
 * possible, and every one of them has to be distinguishable downstream — the
 * Razorpay amount, the Meta/GA4 product name and the Pabbly row all derive
 * from here so they cannot disagree.
 *
 * ── THE SERVER NEVER TRUSTS A CLIENT AMOUNT ───────────────────────────────
 * The browser sends add-on IDS — the strings "recording" and "call" — and the
 * create-order route resolves the rupees itself from this file. If it ever
 * accepted an amount from the request body, anyone could open devtools and
 * buy the ₹1,500 call for ₹1. `resolveAddons` is the gate: it accepts only
 * the two known ids, drops everything else without throwing, dedupes, and
 * returns them in a FIXED order so the same basket always produces the same
 * bundle code and the same product string.
 *
 * ── WHY THE PRICES ARE ENV-DRIVEN ─────────────────────────────────────────
 * Same rule the seat price already follows: one declaration, overridable per
 * environment, so a ₹1 smoke test can move all three numbers without a code
 * change and without the displayed price drifting from the charged one.
 *
 * ⚠️ THE DEFAULTS BELOW ARE PLACEHOLDERS taken from the reference funnel this
 * was modelled on (₹500 and ₹1,500 against its ₹97 seat). They are NOT a
 * priced decision for this workshop — set the real numbers in the env before
 * this goes live.
 */

import { CALL_BOOKING_NOTE, RECORDING_DELIVERY_NOTE, inr } from './offer';

const envPrice = (raw: string | undefined, fallback: number) => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const ADDON_RECORDING_RUPEES = envPrice(
  process.env.NEXT_PUBLIC_ADDON_RECORDING_RUPEES,
  500,
);
export const ADDON_CALL_RUPEES = envPrice(
  process.env.NEXT_PUBLIC_ADDON_CALL_RUPEES,
  1500,
);

export type AddonId = 'recording' | 'call';

export type Addon = {
  id: AddonId;
  /** The corner flag on the card. */
  flag: string;
  title: string;
  rupees: number;
  blurb: string;
  bullets: string[];
  /** Two or three words for the product string and the Pabbly row, where the
   *  full card title is too long to be useful. */
  shortName: string;
  /** The label on the compact row inside the phone's docked bar. Written as
   *  an action ("Add …") because in the dock it IS the control, not a
   *  heading, and the card above already explains what the thing is.
   *
   *  ⚠️ KEEP IT UNDER ~16 CHARACTERS. The row is box + flag pill + label +
   *  price on ONE line, and the label is the only part that may shorten —
   *  the price and the "what is this" pill cannot. Measured: at 360px (the
   *  commonest Android width) the label has roughly 146px, and the first
   *  draft, "Add workshop recordings", truncated to "Add workshop r…" there
   *  and at 320. These fit both without truncating. */
  miniLabel: string;
};

/* ⚠️ ORDER IS LOAD-BEARING. `bundleCode` and the product string are built by
   walking this array, so reordering it renames every bundle and breaks any
   Pabbly router already matching on those strings. Append, never reorder. */
export const ADDONS: Addon[] = [
  {
    id: 'recording',
    flag: 'Recommended',
    title: 'Workshop recordings, Day 1 + Day 2',
    rupees: ADDON_RECORDING_RUPEES,
    blurb:
      'Attend live, then keep both days. Rewatch the practices whenever you need them.',
    bullets: [
      'Full recording of Day 1, start to finish',
      'Full recording of Day 2, start to finish',
      'Lifetime access, no expiry date',
      'Practise along at your own pace, as many times as you need',
      'Your live seat is still included',
      /* WHEN they arrive, on the card where the buyer decides. Without it
         people assume "recordings" means instant access and ask for a refund
         on Day 1 when nothing has appeared. */
      RECORDING_DELIVERY_NOTE,
    ],
    shortName: 'Workshop Recordings',
    miniLabel: 'Add recordings',
  },
  {
    id: 'call',
    flag: 'One-on-one',
    title: 'Private 1-on-1 session with Dr. Peeyush',
    rupees: ADDON_CALL_RUPEES,
    blurb:
      'A private session with Dr. Peeyush himself. You practise the breathing with him, and he tells you what to do next.',
    bullets: [
      'A private one-on-one session, not a group call',
      'Practise the breathing techniques live with him',
      'Guidance based on how your own body responds',
      'Ask your questions directly, with no group and no waiting',
      /* Replaces "Slot booked after registration", which read as "we will
         assign you one" and left people waiting to be contacted. The buyer
         books it themselves, and there is no window they can miss. */
      CALL_BOOKING_NOTE,
      /* WHERE the link turns up, stated before payment. Every other thing on
         this funnel is delivered in a WhatsApp group, so without this a buyer
         assumes the booking link will be too, and waits in a group it never
         appears in. */
      'Booking link on the next page, plus your email and WhatsApp',
    ],
    shortName: '1-on-1 Session',
    miniLabel: 'Add 1-on-1 call',
  },
];

export const ADDON_BY_ID: Record<AddonId, Addon> = {
  recording: ADDONS[0],
  call: ADDONS[1],
};

const KNOWN: AddonId[] = ['recording', 'call'];

/**
 * Turn anything at all into a clean, ordered list of add-on ids.
 *
 * Fed straight from `JSON.parse`d request bodies and from Razorpay order
 * notes, so it must survive every shape an attacker or a truncated note can
 * produce: non-arrays, nested objects, numbers, duplicates, unknown strings,
 * and objects pretending to be add-ons by carrying a `rupees` field.
 *
 * Returns ids ONLY. Prices are looked up from ADDONS afterwards, never read
 * off the input — see the note at the top of this file.
 */
export function resolveAddons(v: unknown): AddonId[] {
  const raw: unknown[] = Array.isArray(v)
    ? v
    : typeof v === 'string'
      ? v.split(',')
      : [];

  const picked = new Set<AddonId>();
  for (const item of raw) {
    /* Accept a bare id, or an object that carries one — but take ONLY the id
       off it, so `{id:'call', rupees:1}` buys the call at its real price. */
    const id =
      typeof item === 'object' && item !== null && 'id' in item
        ? (item as { id?: unknown }).id
        : item;
    if (typeof id !== 'string') continue;
    const trimmed = id.trim();
    if ((KNOWN as string[]).includes(trimmed)) picked.add(trimmed as AddonId);
  }

  /* Fixed order, from ADDONS rather than from insertion order, so the same
     basket always yields the same bundle code. */
  return KNOWN.filter((id) => picked.has(id));
}

export const addonsTotalRupees = (ids: AddonId[]) =>
  ids.reduce((sum, id) => sum + ADDON_BY_ID[id].rupees, 0);

/**
 * The stable machine code for a basket. This is what a Pabbly router should
 * branch on — not the product name, which is prose and will change the next
 * time the copy does, and not the amount, which stops identifying a bundle
 * the moment there is a discount or a price change.
 */
export function bundleCode(ids: AddonId[]): string {
  return ids.length ? `base_${ids.join('_')}` : 'base';
}

/**
 * Where a buyer of this basket lands after paying.
 *
 * FOUR REAL PATHS, not one page with a query string. The bundle used to ride
 * as `?b=`, which meant every link had to be constructed by hand and a
 * mistyped one silently showed the wrong page; these are URLs a human can
 * type, share and test, and they carry no payment id.
 *
 * ⚠️ THESE STRINGS ARE THE ROUTES. Each one must match a folder under
 * `app/(thankyou)/` exactly — rename one without the other and buyers land on
 * a 404 immediately after paying, which is the single worst moment on the
 * funnel to break.
 */
const THANK_YOU_PATHS: Record<string, string> = {
  base: '/thank-you',
  base_recording: '/thank-you-recording',
  base_call: '/thank-you-private',
  base_recording_call: '/thank-you-complete',
};

export function thankYouPath(ids: AddonId[]): string {
  /* Falls back to the base page rather than throwing: an unmapped bundle
     after a paid order must still land somewhere real. */
  return THANK_YOU_PATHS[bundleCode(ids)] ?? '/thank-you';
}

/** Human product name for Meta, GA4, the receipt and the sheet. */
export function bundleName(workshopName: string, ids: AddonId[]): string {
  if (!ids.length) return workshopName;
  return `${workshopName} + ${ids.map((id) => ADDON_BY_ID[id].shortName).join(' + ')}`;
}

/** "TAP TO ADD FOR ₹500 MORE" — built here so the card and the summary can
 *  never show two different numbers for the same add-on. */
export const addonCta = (a: Addon) => `Tap to add for ${inr(a.rupees)} more`;

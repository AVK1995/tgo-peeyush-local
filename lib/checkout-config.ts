import {
  addonsTotalRupees,
  bundleCode,
  bundleName,
  resolveAddons,
  thankYouPath,
  type AddonId,
} from '@/app/_landing/addons';
import { PRICE_RUPEES, WORKSHOP_NAME } from '@/app/_landing/offer';

/* The one origin literal in the codebase. `||` rather than `??` so a blank
   env value falls back too; the trailing slash is stripped because the
   webhook appends `/checkout` to it. */
export const SITE_ORIGIN = ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() ||
  'https://drpeeyushprabhat.com').replace(/\/+$/, '');

export const CHECKOUT_CONFIG = {
  amountRupees: PRICE_RUPEES,
  amountPaise: PRICE_RUPEES * 100,
  currency: 'INR',
  /* GA4 item name and the Pabbly `product` column only. Never sent to Meta. */
  contentName: WORKSHOP_NAME,
  /* Written into notes.kind by create-order and matched by the webhook, which
     ignores every payment on the Razorpay account that does not carry it. */
  orderKind: 'peeyush_2day_breath_workshop',
  fallbackEventSourceUrl: SITE_ORIGIN,
  meta: {
    pixelId: process.env.META_PIXEL_ID ?? '',
    accessToken: process.env.META_CAPI_ACCESS_TOKEN ?? '',
    testEventCode: process.env.META_CAPI_TEST_EVENT_CODE ?? '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    /* Settings -> Webhooks, not the API Keys page. */
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },
} as const;

/**
 * THE ORDER, PRICED SERVER-SIDE.
 *
 * Takes whatever the browser (or a Razorpay note) claims the basket is, and
 * returns what it actually costs plus everything downstream needs to name it.
 * The seat price is never optional; only the add-ons vary.
 *
 * ⚠️ NEVER GIVE THIS AN `amount` PARAMETER, and never add one to the route
 * that calls it. The input is attacker-controlled: `resolveAddons` reduces it
 * to at most two known ids and the rupees are looked up here, which is the
 * difference between a tampered request buying the wrong BASKET and one
 * buying the ₹1,500 session for ₹1.
 */
export const orderPricing = (addonsInput: unknown) => {
  const addons: AddonId[] = resolveAddons(addonsInput);
  const addonRupees = addonsTotalRupees(addons);
  const rupees = PRICE_RUPEES + addonRupees;

  return {
    addons,
    /* "" when nothing was added, so the note key is cheap and the Pabbly
       column is blank rather than the string "none". */
    addonsCsv: addons.join(','),
    baseRupees: PRICE_RUPEES,
    addonRupees,
    rupees,
    /* Rounded, not truncated: a price set to a fractional rupee in the env
       would otherwise lose a paisa and mismatch the displayed total. */
    paise: Math.round(rupees * 100),
    bundle: bundleCode(addons),
    /* The route this buyer is sent to after paying, decided HERE from the
       basket the server priced — not built in the browser from what it
       thinks it ticked. If the two ever disagree, the buyer sees the page
       matching what they were actually charged for. */
    thankYouPath: thankYouPath(addons),
    productName: bundleName(WORKSHOP_NAME, addons),
    hasRecording: addons.includes('recording'),
    hasCall: addons.includes('call'),
  };
};

export const capiReady = () =>
  Boolean(CHECKOUT_CONFIG.meta.pixelId && CHECKOUT_CONFIG.meta.accessToken);

/* Derived from the key prefix so it cannot drift from the keys in use. */
export const isTestMode = () =>
  CHECKOUT_CONFIG.razorpay.keyId.startsWith('rzp_test_') ||
  Boolean(CHECKOUT_CONFIG.meta.testEventCode);

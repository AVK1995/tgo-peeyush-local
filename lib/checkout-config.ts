import { PRICE_RUPEES } from '@/app/_landing/offer';

/**
 * Every server-side constant the payment and tracking routes need, in one
 * place. The price comes from offer.ts, which reads it from a single env var,
 * so the amount charged can never drift from the amount displayed.
 *
 * NOTE ON UNITS. Instamojo charges in RUPEES, not paise. There is no
 * `amountPaise` here any more and there must not be one: paise is a Razorpay
 * concept, and a paise figure handed to Instamojo would be a charge a hundred
 * times too large, quietly, on a live page. `PRICE_PAISE` has been deleted from
 * offer.ts as well, so there is no paise value anywhere in the codebase to
 * reach for by accident.
 */
export const CHECKOUT_CONFIG = {
  amountRupees: PRICE_RUPEES,
  currency: 'INR',
  contentName: '5-Day Complete Health Reset Challenge',
  /* The launch domain as the fallback, not example.com: this value is sent to
     Meta as event_source_url and is what the redirect and webhook URLs handed
     to Instamojo are built from, so an unset env var would quietly attribute
     live events to a domain we do not own and point the gateway's callbacks at
     it as well.

     `||`, not `??`. A host that defines the key with a blank value yields an
     empty string, which `??` passes straight through, and an empty
     event_source_url is silently worthless to Meta. */
  fallbackEventSourceUrl:
    (process.env.NEXT_PUBLIC_SITE_URL || '').trim() ||
    'https://challenge.drpeeyushprabhat.com',
  meta: {
    pixelId: process.env.META_PIXEL_ID ?? '',
    accessToken: process.env.META_CAPI_ACCESS_TOKEN ?? '',
    testEventCode: process.env.META_CAPI_TEST_EVENT_CODE ?? '',
  },
  instamojo: {
    clientId: process.env.INSTAMOJO_CLIENT_ID ?? '',
    clientSecret: process.env.INSTAMOJO_CLIENT_SECRET ?? '',
    /* The account's PRIVATE SALT, from the dashboard's Integrations page. It is
       a separate value from the API credentials and it is the one that gets
       missed. Two things depend on it: verifying the `mac` on every webhook,
       and the key that seals the buyer context this integration has to carry
       through the gateway itself. */
    salt: process.env.INSTAMOJO_SALT ?? '',
    /* 'test' points every call at the sandbox host. Declared rather than
       derived, because Instamojo does not stamp the environment into the
       credential the way Razorpay's rzp_test_ prefix did. Default is 'live':
       if the flag and the credentials disagree the API rejects the call, which
       is a loud failure, whereas defaulting to test would let a live-looking
       deployment take fake payments. */
    env: (process.env.INSTAMOJO_ENV ?? '').trim().toLowerCase() === 'test'
      ? ('test' as const)
      : ('live' as const),
  },
} as const;

/**
 * The `purpose` string, which is the ONLY field that travels with an Instamojo
 * payment request, and it is capped at 30 characters by the gateway.
 *
 * The buyer reads it on the payment page, so it is the product name rather
 * than an internal code, truncated to the longest faithful prefix that fits:
 * "5-Day Complete Health Reset Challenge" is 37 characters and would be
 * rejected. The slice is belt and braces in case the name above is ever
 * edited without counting.
 */
export const INSTAMOJO_PURPOSE = '5-Day Complete Health Reset'.slice(0, 30);

/** True only when a real CAPI call can be made. Routes check this and skip
 *  quietly rather than posting to Meta with an empty pixel id. */
export const capiReady = () =>
  Boolean(CHECKOUT_CONFIG.meta.pixelId && CHECKOUT_CONFIG.meta.accessToken);

/** True only when a payment request can actually be created. */
export const instamojoReady = () =>
  Boolean(
    CHECKOUT_CONFIG.instamojo.clientId && CHECKOUT_CONFIG.instamojo.clientSecret,
  );

/**
 * Whether this deployment is transacting in test mode.
 *
 * It rides to Pabbly as `is_test` so a staging purchase can be routed away
 * from the live WhatsApp invite instead of onboarding a fictional buyer. A
 * Meta test event code counts as test too, because events sent with one do not
 * reach optimisation and the sale they describe is not real.
 */
export const isTestMode = () =>
  CHECKOUT_CONFIG.instamojo.env === 'test' ||
  Boolean(CHECKOUT_CONFIG.meta.testEventCode);

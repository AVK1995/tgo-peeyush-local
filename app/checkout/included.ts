/**
 * The line items, and the one place they are defined.
 *
 * They are NOT defined here. The landing page's `INCLUDED` array in
 * `app/_landing/offer.ts` is the single source: the recap the buyer just read
 * and the summary they pay against must be the same four rows at the same
 * total, and two arrays drift silently until a buyer notices the checkout
 * promising something the page did not.
 */
export { INCLUDED as RECAP, INCLUDED_TOTAL as VALUE_TOTAL, inr } from '@/app/_landing/offer';

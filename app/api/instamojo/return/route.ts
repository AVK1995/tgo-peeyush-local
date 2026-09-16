import { NextResponse } from 'next/server';

import { CHECKOUT_CONFIG, instamojoReady } from '@/lib/checkout-config';
import { getPaymentRequest } from '@/lib/instamojo';

/**
 * Where Instamojo sends the buyer back to.
 *
 * Razorpay handed the browser a success callback inside our own page.
 * Instamojo does not: it appends `payment_id`, `payment_status` and
 * `payment_request_id` to a URL and navigates the tab. So this route exists to
 * turn a claim made by a browser into something we have checked, and then to
 * put the buyer on the thank-you page with the one parameter that page already
 * reads.
 *
 * IT REPORTS NOTHING. No Meta event, no Pabbly hand-off, no server-side GA4.
 * The webhook owns all three, because the buyer this funnel actually sees pays
 * by UPI inside a bank app and never arrives here at all. Firing a Purchase
 * from this route as well would count the returning half of buyers twice and
 * leave the other half depending on a page they never open.
 *
 * The query string belongs to the buyer and is theirs to edit, so a `Credit`
 * here is confirmed against Instamojo before a confirmation page is shown. The
 * one case that is deliberately generous: if the confirmation call itself
 * fails (network, expired credentials), the buyer still lands on the thank-you
 * page. A real payer must not be told their payment failed because OUR call to
 * the gateway did, and nothing on that page reports a sale to Meta anyway.
 */

/* Never cached, asserted rather than relied on. Next.js does treat a GET
   handler that reads the request as dynamic, but the failure mode if that ever
   stops being true is one buyer's payment id being served to the next buyer
   from the edge, and that is not a risk worth leaving to an inference. */
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get('payment_id') ?? '';
  const paymentStatus = url.searchParams.get('payment_status') ?? '';
  const paymentRequestId = url.searchParams.get('payment_request_id') ?? '';

  const to = (path: string) =>
    NextResponse.redirect(new URL(path, url.origin), 303);

  /* `Credit` is Instamojo's success value. Anything else is not a payment. */
  if (paymentStatus.toLowerCase() !== 'credit' || !paymentId) {
    console.warn(
      `[im-return] not a completed payment status=${paymentStatus || 'none'} ` +
        `pr=${paymentRequestId || 'none'}`,
    );
    return to('/checkout?pay=incomplete');
  }

  if (!instamojoReady() || !paymentRequestId) {
    /* Nothing to confirm against. Let the buyer through rather than accusing
       them, and say so in the log. */
    console.warn('[im-return] cannot confirm, sending buyer through unverified');
    return to(`/thank-you?p=${encodeURIComponent(paymentId)}`);
  }

  const check = await getPaymentRequest({
    clientId: CHECKOUT_CONFIG.instamojo.clientId,
    clientSecret: CHECKOUT_CONFIG.instamojo.clientSecret,
    env: CHECKOUT_CONFIG.instamojo.env,
    paymentRequestId,
    paymentId,
  });

  /* Only an explicit NO turns a buyer away. 'unknown' does not, and that is
     deliberate: a payment record does not always appear against the request
     the instant the browser is redirected, so treating "cannot tell" as "did
     not pay" would tell a paying buyer their payment failed at the worst
     possible moment. The webhook is what actually decides whether this sale
     exists; this route only decides which page to show. */
  if (check.verdict === 'not-paid') {
    console.warn(
      `[im-return] claimed Credit but gateway says ${check.detail} pid=${paymentId}`,
    );
    return to('/checkout?pay=incomplete');
  }

  if (check.verdict === 'unknown') {
    console.warn(
      `[im-return] could not confirm (${check.detail}), letting ` +
        `pid=${paymentId} through to the thank-you page`,
    );
  }

  return to(`/thank-you?p=${encodeURIComponent(paymentId)}`);
}

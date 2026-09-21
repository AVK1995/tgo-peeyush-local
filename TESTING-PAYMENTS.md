# Testing the ₹1 payment and the webhook payload

Everything here runs in Razorpay **Test Mode**. No real money moves.

---

## 0. The bug this was written to verify

The Pabbly webhook was arriving with almost every field blank — no
`created_at`, no name, no city, no UTMs, no fbc/fbp, no IP. Only email, phone
and amount survived.

**Cause.** The buyer context is written into the Razorpay **order's** `notes`
at create-order time. The webhook was reading `payload.payment.entity.notes` —
the **payment's** notes. Those are two different fields on two different
entities, and Razorpay does not copy one to the other. Razorpay's docs are
explicit that the `payment.captured` payload "only contains the payment
entity", and its sample shows `"notes": []`.

So `unpackContext` was parsing an empty array on every single sale, and
returning a blank context. Email, phone and amount came through only because
those are fields on the payment itself — which is exactly why it looked like a
partial failure rather than a lookup in the wrong place.

**Fix.** The webhook now fetches the order back from Razorpay by id and reads
the notes from there (`lib/razorpay-order.ts`). That is authoritative, cannot
be forged from the browser, and works under either webhook event.

The payload also now carries a `context_recovered` boolean. **If that is ever
`false`, this bug is back** — branch a Pabbly router on it if you want an alert.

### The wrong email (fixed 21 Sep 2026)

A fulfilment row carried `nirmitmaniar@gmail.com` for a buyer who had typed
something else.

**Cause, in two halves.** Razorpay Checkout recognises a returning device and
fills the contact and email fields from *its own* remembered customer, which
beats the `prefill` we pass. On a shared browser that is a previous payer. The
webhook then read `payment.email` — the remembered value — on the reasoning
that "Razorpay is the authority". So the invite was addressed to a stranger
while the buyer who actually paid got nothing.

**Fix, in two halves.**

- [`app/checkout/page.tsx`](app/checkout/page.tsx) now passes
  `readonly: { email: true, contact: true }`, Razorpay's documented lever for
  pinning those fields to our values. `name` is deliberately left editable —
  it is the *cardholder* name and legitimately differs (a spouse's card).
  `contact` is also now `+`-prefixed, per Razorpay's stated format.
- The webhook now takes email and phone from the **order notes** (the form),
  with the gateway's copy only as a fallback. Razorpay's values are still
  forwarded as `payment_email` and `payment_contact`, so a mismatch stays
  visible for refunds — and a differing email is logged as a warning.

`phone` is normalised to E.164 **with** the leading `+` whichever source wins,
so the column format cannot flip between sources and break a WhatsApp step.

### The double slash (fixed 21 Sep 2026)

`event_source_url` read `http://drpeeyushprabhat.com//checkout`, because
`NEXT_PUBLIC_SITE_URL` was set with a trailing slash — which is how a browser
hands you the address when you copy it. Meta treats that as a different URL and
quietly splits the event's attribution. Trailing slashes are now stripped in
[`lib/checkout-config.ts`](lib/checkout-config.ts).

That production value is also `http://`, not `https://`. Worth correcting
separately: Meta records the URL as given.

---

## 1. Fill in `.env.local`

Already created at the project root, gitignored. Four values:

| Key | Where |
|---|---|
| `RAZORPAY_KEY_ID` | Dashboard → **switch to Test Mode** → Account & Settings → API Keys → Generate Test Key |
| `RAZORPAY_KEY_SECRET` | same screen, shown once |
| `RAZORPAY_WEBHOOK_SECRET` | any string for local testing; must match the dashboard for a real payment |
| `PABBLY_WEBHOOK_URL` | `http://localhost:4000/pabbly` for local, or the real Pabbly URL |

`NEXT_PUBLIC_PRICE_RUPEES=1` is already set. ₹1 is Razorpay's **minimum** — it
rejects anything under 100 paise.

> ### ⚠️ Check the key prefix before you test
>
> If `.env.local` holds **live** keys (`rzp_live_…`) then with
> `NEXT_PUBLIC_PRICE_RUPEES=1` every payment is a **real ₹1 charge on a real
> card**, settling to the real account, with real fees. It also fires the real
> Pabbly workflow. This has happened — check the prefix, not your memory.
>
> `npm run test:purchase` refuses to run against live keys by design — it
> creates orders automatically, and an automated fake buyer in a live
> onboarding sheet is unpleasant to unpick.
>
> Swap in a **test** key pair to use the fast path. If you genuinely want to
> validate against live (a real ₹1 charge is a legitimate final smoke test),
> do it through the sheet by hand and refund it from the dashboard.

The key id must start with `rzp_test_`. `is_test` on the payload is derived
from that prefix, so there is no separate flag to remember. **Test keys cannot
read an order created by live keys** — mixing them is the one way to see
`context_recovered: false` on an otherwise healthy setup.

> Restart the dev server after editing `.env.local`. Next.js reads it at boot.

---

## 2. Fast path — no payment, no tunnel (~30 seconds)

Three terminals:

```bash
npm run test:echo        # 1. stands in for Pabbly, prints the payload
npm run dev              # 2. the site
npm run test:purchase    # 3. runs the test
```

`test:purchase` creates a **real order in your Razorpay test account** with the
full context packed into its notes, then signs and delivers the exact
`payment.captured` event Razorpay would send for it.

That means the order fetch in step 3 is a real authenticated call against a
real order — which is the precise round trip that was broken, so this is a
genuine test and not a mock. Only the payment ID is invented.

The echo terminal prints a **PASS/FAIL** line and flags any empty critical
field. Expect ~57 populated fields.

In the dev server log, look for:

```
[rzp-webhook] pay_xxx Purchase capi=… ga4=… pabbly=true ctx=ok method=upi amount=1
```

**`ctx=ok` is the thing to check.** `ctx=MISSING` means the context was not
recovered and an error line will say why.

---

## 3. Full path — a real ₹1 payment through the sheet

Razorpay cannot reach `localhost`, so the webhook needs a public URL.

```bash
npx cloudflared tunnel --url http://localhost:3000
# or: ngrok http 3000
```

Then:

1. Put the tunnel URL in `NEXT_PUBLIC_SITE_URL` and restart the dev server.
2. Dashboard → Settings → **Webhooks** → Add New Webhook
   - URL: `<tunnel-url>/api/razorpay/webhook`
   - Active event: **`payment.captured`** — this one only.
   - Secret: the same string as `RAZORPAY_WEBHOOK_SECRET`.
3. Open the landing page **with campaign parameters**, so there is something to
   attribute — this matters, because the UTMs are captured on *first landing*
   and read back at checkout:

```
<tunnel-url>/?utm_source=facebook&utm_medium=paid_social&utm_campaign=test_oct&utm_content=ad_v1&utm_id=120209876543210&ad_id=120210000000001&adset_id=120210000000002&campaign_id=120210000000003&placement=Instagram_Stories&site_source_name=ig&fbclid=IwARtest123
```

4. Click through to checkout, fill the form, pay ₹1 with Razorpay's test
   instruments — UPI `success@razorpay`, or card `4111 1111 1111 1111` with any
   future expiry and any CVV. (Confirm current test values in the dashboard.)

### ⚠️ Do not register `order.paid`

It fires on the same sale and looks like the better choice because its payload
includes the order. But:

- registering it **instead of** `payment.captured` means nothing fires at all —
  the route ignores it and logs a warning;
- registering it **as well** double-fires the Pabbly hand-off and you get two
  rows and two WhatsApp invites per buyer.

Meta and GA4 are safe either way (both dedupe on the payment id). Pabbly is not.

---

## 4. What should be populated

**Always:** `created_at`, `paid_at`, `first_name`, `last_name`, `email`,
`phone`, `city`, `country_code`, `amount`, `amount_paise`, `currency`,
`payment_id`, `order_id`, `order_receipt`, `payment_method`, `payment_status`,
`payment_captured`, `lead_id`, `product`, `occupation`, `is_test`,
`context_recovered`, `webhook_event`, `webhook_received_at`.

**From a Meta ad click:** `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term`, `utm_id`, `fbclid`, `fbc`, `fbp`, `ad_id`,
`adset_id`, `campaign_id`, `placement`, `site_source_name`, `referrer`,
`landing_url`, `external_id`, `ga_client_id`, `client_ip_address`,
`client_user_agent`.

**Method-dependent, empty is correct:** `card_last4` / `card_network` /
`card_type` / `card_issuer` / `card_id` are card-only; `payment_vpa` /
`upi_transaction_id` are UPI-only; `payment_bank` is netbanking; `error_code` /
`error_description` are empty on a successful capture.

`razorpay_fee` and `razorpay_tax` are in **rupees** (converted from paise, to
match `amount`) and may be `0` until Razorpay computes them.

### Re-train the Pabbly field mapper

Pabbly builds its field map from the **first** payload it sees. The workflow was
trained on the old, mostly-empty payload, so the new columns will arrive and be
silently ignored until you re-run the trigger's *capture webhook response* step
once against this build. Do this before reading anything into the outcome.

---

## 5. Going back to live

1. Remove or blank `NEXT_PUBLIC_PRICE_RUPEES` → the price returns to **₹497**
   (the fallback in `app/_landing/offer.ts`), or set the real launch price.
2. Swap in the live `rzp_live_` key pair. `is_test` follows automatically.
3. Register the webhook on the **production** domain with its own secret —
   dashboard webhooks are per-mode, so the test registration does not carry
   over.
4. Clear `META_CAPI_TEST_EVENT_CODE`, or every live sale is flagged as a test
   and excluded from optimisation.

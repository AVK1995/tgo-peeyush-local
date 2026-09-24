# Testing the ₹1 payment and the webhook payload

Everything here runs in Razorpay **Test Mode**. No real money moves.

---

## 0. The bug this was written to verify

The Pabbly webhook was arriving with almost every field blank — no
`created_at`, no name, no city, no UTMs, no fbc/fbp, no IP. Only email, phone
and amount survived.

**Cause.** The context was serialised into one JSON blob and sliced across ten
note keys, `x0`..`x9`. When the blob overflowed ten chunks the packer ended
with `chunks.slice(0, 10)`, which cuts the JSON mid-token. The webhook's
`JSON.parse` then threw, the handler fell back to an empty context, and **all
twenty fields went blank together**. One long campaign name was enough. Email,
phone and amount survived only because those are read off the payment entity
directly rather than out of the notes.

**Fix** (upstream, 22 Sep 2026). The chunked blob is gone. Each signal is now
its own note key — fourteen against Razorpay's limit of fifteen — so an
oversized value can only ever cost its own field instead of taking the whole
record down with it. The two small bundles that remain (`cust`, `utm`, `meta`)
are kept valid by `packJsonNote`, which shortens the longest *value* rather
than cutting the finished JSON. See `app/api/razorpay/create-order/route.ts`.

> **A correction worth recording.** This was first diagnosed here as the
> webhook reading the *payment's* notes rather than the *order's*, on the
> strength of Razorpay's docs showing `"notes": []` in the `payment.captured`
> sample. That sample is generic: in practice the order's notes do reach the
> payment entity, which is why the one-field-per-key fix works without any
> extra lookup. A `lib/razorpay-order.ts` that fetched the order back by id was
> written against the wrong premise and has been removed.

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
from that prefix, so there is no separate flag to remember.

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

The order in step 1 genuinely exists in your Razorpay test account, with the
context written into its notes exactly as a real buyer's would be — so the
packing and unpacking being tested is the real thing, not a hand-written
fixture. Only the payment ID is invented.

The echo terminal prints a **PASS/FAIL** line and flags any empty critical
field.

In the dev server log, look for:

```
[rzp-webhook] pay_xxx Purchase capi=… ga4=… pabbly=true notes=ok
```

**`notes=ok` is the thing to check.** `notes=EMPTY` means the buyer context did
not survive the order notes — the failure this whole pass was about.

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

TGO's ad URLs use a **non-standard UTM convention** — read
`app/api/razorpay/create-order/route.ts` before changing any cap, because three
of the five carry Meta *names* that run to 40–60 characters:

| Parameter | Carries |
|---|---|
| `utm_source` | `{{placement}}` — e.g. `instagram_reels` |
| `utm_medium` | `{{campaign.name}}` |
| `utm_campaign` | `{{adset.name}}` |
| `utm_term` | `{{ad.id}}` — the numeric id |
| `utm_content` | `{{ad.name}}` |

So a representative test URL is:

```
<tunnel-url>/?utm_source=instagram_reels&utm_medium=Health_Reset_Oct_Prospecting&utm_campaign=Postpartum_Women_25_44_Broad&utm_term=120210000000001&utm_content=Carousel_MummyBelly_V3&fbclid=IwARtest123
```

4. Click through to checkout, fill the form, pay ₹1 with Razorpay's test
   instruments — UPI `success@razorpay`, or card `4111 1111 1111 1111` with any
   future expiry and any CVV. (Confirm current test values in the dashboard.)

### ⚠️ Do not register `order.paid`

It fires on the same sale and looks like the better choice because its payload
includes the order. But:

- registering it **instead of** `payment.captured` means nothing fires at all —
  the route ignores every other event type and answers 200, so the delivery log
  looks healthy while no sale is ever reported;
- registering it **as well** double-fires the Pabbly hand-off and you get two
  rows and two WhatsApp invites per buyer.

Meta and GA4 are safe either way (both dedupe on the payment id). Pabbly is not.

---

## 4. What should be populated

**Always:** `created_at`, `first_name`, `last_name`, `email`, `payment_email`,
`phone`, `dial_code`, `city`, `country_code`, `amount`, `currency`,
`payment_id`, `order_id`, `lead_id`, `product`, `occupation`, `is_test`,
`type`, `event`, `purchase_event_id`, `event_source_url`.

**From a Meta ad click:** `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term`, `fbclid`, `fbc`, `fbp`, `referrer`, `landing_url`,
`external_id`, `client_ip_address`, `client_user_agent`.

`created_at` is Razorpay's own `payment.created_at` — the moment of capture,
not of form submission. It can no longer be lost, because nothing has to carry
it through the notes.

`email` is what the buyer typed on **our** checkout; `payment_email` is what
Razorpay had on file. They should usually match — when they don't, the server
log carries an `email differs:` warning and the form's value is what
fulfilment uses.

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

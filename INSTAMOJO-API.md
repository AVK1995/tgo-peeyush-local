# INSTAMOJO · API reference for this build

Researched from the official docs on 15 Sep 2026, because this client is on
**Instamojo, not Razorpay**. Everything below is from Instamojo's own
documentation, not from memory. Sources at the foot.

Instamojo is not a drop-in swap for Razorpay. Three differences drive the whole
integration, and they are listed first because each one changes a decision.

1. **It is a REDIRECT gateway, not a modal.** Razorpay opens a sheet over your
   own checkout and hands you a callback in the same tab. Instamojo returns a
   payment-page URL (`longurl`) and you send the buyer to it. They come back on
   your `redirect_url` afterwards.
2. **There is no `notes` object and no custom fields.** Razorpay's `notes` is
   what this codebase uses to carry `fbp`, `fbc`, the client IP, the user agent
   and the GA4 client id to the webhook, which is what makes a server-side
   Purchase match well without a database. Instamojo has no equivalent: the
   docs say to "store and maintain any custom fields for a payment request at
   your end". The only field that travels with the request is `purpose`, capped
   at **30 characters**.
3. **Amounts are in RUPEES, not paise**, and the request itself is bounded:
   minimum 9, maximum 200000. `PRICE_RUPEES` goes across as-is; `PRICE_PAISE`
   is a Razorpay concept and does not apply.

## Authentication (application-based, OAuth2 client credentials)

```
POST https://api.instamojo.com/oauth2/token/
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
client_id=<CLIENT_ID>
client_secret=<CLIENT_SECRET>
```

Response: `access_token`, `token_type` (Bearer), `expires_in` (36000, so ten
hours), `scope`. Pass it as `Authorization: Bearer <access_token>`.

The token is long-lived, so fetching one per request is wasteful; cache it in
module scope with its expiry and refresh early rather than on failure.

## Create a payment request

```
POST https://api.instamojo.com/v2/payment_requests/
Authorization: Bearer <access_token>
```

| Field | Required | Notes |
|---|---|---|
| `amount` | yes | in rupees. min 9, max 200000 |
| `purpose` | yes | **30 characters maximum**, and the buyer sees it on the payment page |
| `buyer_name` | no | prefills the payment page |
| `email` | no | prefills |
| `phone` | no | prefills |
| `redirect_url` | no | where the buyer lands afterwards |
| `webhook` | no | server-to-server POST after payment |
| `allow_repeated_payments` | no | defaults false. Keep it false: one link, one payment |
| `send_email` | no | defaults false |
| `expires_at` | no | UTC timestamp, max 600 seconds out |

Response carries `id` (the payment_request_id), `status` ("Pending"), and
**`longurl`**, which is the page to send the buyer to.

## What comes back on the redirect

The buyer returns to `redirect_url` with three query parameters appended:

```
?payment_id=MOJO5a06005J21512197&payment_status=Credit&payment_request_id=d66cb2...
```

`payment_status` is **`Credit`** on success. Treat anything else as not paid.
A redirect is a claim by the browser, not proof: confirm it server-side with
the Get endpoint, or trust only the webhook.

## Confirming server-side

```
GET https://api.instamojo.com/v2/payment_requests/{payment_request_id}/
Authorization: Bearer <access_token>
```

Returns the request plus its payments, so a redirect's `payment_id` can be
checked against the record rather than believed.

## The webhook

Instamojo POSTs `application/x-www-form-urlencoded` (NOT JSON) to the `webhook`
URL given on the payment request. Fields documented: `payment_id`,
`payment_request_id`, `status` ("Credit" or "Failed"), `amount`, `fees`,
`buyer` (email), `buyer_name`, `buyer_phone`, `currency`, `purpose`, `longurl`,
`shorturl`, and **`mac`**. The docs warn the field list may grow, so parse
defensively rather than destructuring a fixed shape.

Configure both the webhook and the redirect: the docs call the webhook the
fallback for buyers who close the tab before the redirect completes, which on
UPI is most of them.

### Verifying the `mac`

HMAC-SHA1, keyed with the account's **private salt** (dashboard →
`/integrations`), over every posted field EXCEPT `mac` itself:

1. drop `mac` from the posted fields
2. sort the remaining pairs by key
3. join the **values** (not the pairs) with a pipe `|`
4. `hmac_sha1(salt, joined).hexdigest()` and compare, timing-safe

Instamojo's own Python sample:

```python
mac_provided = d.pop('mac')
message = '|'.join(str(i) for i in zip(*sorted(d.iteritems()))[1])
mac_calculated = hmac.new(salt, message, hashlib.sha1).hexdigest()
```

Note it is SHA1 and a hex digest, where Razorpay's webhook is SHA256. Keep the
comparison constant-time anyway.

## Sandbox

| | Base | Credentials |
|---|---|---|
| Sandbox | `https://test.instamojo.com/` | `https://test.instamojo.com/integrations/` |
| Live | `https://www.instamojo.com/` (API at `https://api.instamojo.com/`) | `https://www.instamojo.com/integrations/` |

Sandbox needs no onboarding documents. Test card 4242 4242 4242 4242, expiry
01/20, CVV 111, 2FA 1221.

## The consequence that needs a decision

Because there is no `notes` field, a webhook-originated Purchase cannot carry
`fbp`, `fbc`, the buyer's IP, their user agent or the GA4 client id unless
those are stored somewhere between checkout and webhook. The webhook DOES carry
the buyer's email, phone and name, which are strong Meta match keys once
hashed, and `payment_id` is a stable string both the server and the browser can
see, so a deterministic `event_id` derived from it lets the webhook Purchase and
a browser Purchase deduplicate without any shared storage.

What that leaves genuinely missing on a webhook-only Purchase (a UPI buyer who
never returns): `fbp`/`fbc` and the GA4 client id. Never substitute the
webhook's own IP or user agent for the buyer's: those belong to Instamojo's
server, and sending them is worse than sending nothing.

## Sources

- [Create a Payment Request](https://docs.instamojo.com/reference/create-a-payment-request-1)
- [Get a Payment Request](https://docs.instamojo.com/reference/get-a-payment-request-1)
- [Generate Access token](https://docs.instamojo.com/reference/generate-access-token-application-based-authentication)
- [Integration guide](https://docs.instamojo.com/reference/payments-api)
- [What is a webhook?](https://docs.instamojo.com/reference/what-is-a-webhook)
- [Custom fields](https://docs.instamojo.com/reference/can-i-add-custom-fields-to-a-payment-request)
- [Sandbox vs production](https://docs.instamojo.com/reference/what-is-the-difference-between-the-sandbox-and-production-environment)
- [MAC computation](https://www.instamojo.com/blog/introducing-instamojo-webhooks/)

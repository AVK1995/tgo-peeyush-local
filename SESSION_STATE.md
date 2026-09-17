# SESSION STATE · tgo-peeyush

Last updated: 17 Sep 2026 (LAUNCH pass: Razorpay restored, Instamojo removed)

## What this is
Landing funnel for **Dr. Peeyush Prabhat · 5-Day Complete Health Reset Challenge**.
Dated live challenge, ₹497 (anchor ₹1599), starts 30 September 2026, live on Zoom
at 6:30 AM and 7:30 PM IST. Next click on the page is a payment.

## How it was built
Scaffolded byte-for-byte from `/workspace/tgo-kaizan` (the reference challenge
build), then the landing page was built by the **SHAPE** agent in three passes
against the 17-beat CHALLENGE FUNNEL BLUEPRINT and the locked Kaizen Warm Navy
skin, re-branded. Copy source: `COPY-SOURCE.md`, reproduced verbatim.

## Skin · Breath For Health
Dr. Peeyush's own live page (breathforhealth.in/breath), measured in the browser
on 14 Sep 2026 and written up in `THEME-SOURCE.md`, applied as IDENTITY inside
the locked challenge rhythm.

His page is dark end to end; this one is not, and that is deliberate. The
blueprint's rhythm governs: eleven light bands alternating `#FAFDFE` / `#F0F4F5`,
the hero as the SINGLE dark stage in his deep teal `#06141C`, and dark below it
only as contained objects (the live-sessions card, the Option 2 card, the video
bed) plus the footer as chrome. Cards are white with a hairline and a teal seat.

His cyan is 2.4:1 on light, so it is a fill and a graphic there, never type. Both
accents run in steps: cyan `#06B6D4` fill / `#0891B2` large text / `#0E7490`
labels; emerald `#10B981` on dark / `#047857` as a tick on light. Headlines
**Poppins 800**, body **DM Sans**, eyebrows cyan uppercase.

The palette lives in THREE files and must move in all three together: `:root` in
`app/globals.css`, `C` in `app/_landing/shared.tsx`, `colors` in
`tailwind.config.ts`.

## Page order as built
announcement marquee → hero + offer card → trust ledger → THE RESULTS (7-domain
hairline ledger, 33 items) → Experience card grid → 5-Day schedule (scroll-linked
`tl-*` spine, the one heavy motion moment) → live-sessions CTA card → recognition
ledger → "Does this sound like you?" → two testimonial rails (6 then 7, opposite
directions) → toolkit value stack → founder → Why This Works (numbered ledger) →
two options → recap with strike-and-pop price → colophon footer.

## Single sources of truth
- `app/_landing/offer.ts`: every date, time, price, CTA label, and the
  `INCLUDED` value stack (₹4,791 summed, never typed). The checkout re-exports
  it via `app/checkout/included.ts`, so page and checkout cannot disagree.
- `app/_landing/legal.ts`: business facts + `LEGAL_DISCLAIMER` (the client's own
  disclaimer wording, rendered by `SiteFooter` on every page).

## State
- Landing page: **built**, structurally verified by SHAPE (class coverage, brace
  balance, `var()` scope, mount chain, no Kaizen hex in the landing half).
  Nothing has been run or built: Atul verifies on the live page.
- LAUNCH side: **done, payments included.** Ran 15 Sep 2026 (one run
  interrupted, then a finishing pass that re-audited everything, then a payment
  pass). Checkout, thank-you, the three legal pages, the footer, Meta CAPI,
  GA4, Clarity, Pabbly, `legal.ts` and `.env.example` are this client's, and
  the tracking is verified against the build bible's event map.
  **No placeholders render anywhere any more.** On 16 Sep Atul's call was to
  ship without the facts nobody has rather than hold the funnel, so instead of
  filling them: `legal.ts` carries an empty `structure` (the terms page omits
  the phrase rather than guessing) and an address without a PIN (incomplete,
  not false), and `app/refund-policy/page.tsx` dropped its "The window" and
  "What is not refundable" sections rather than invent terms. Read as it now
  stands, the guarantee is unconditional and open-ended, which is the reading a
  card network takes in a dispute. Giving it a window is a decision from
  Dr. Peeyush, not an edit.
- **Payments are on RAZORPAY again, and Instamojo is gone** (17 Sep). Deleted:
  `lib/instamojo.ts`, `lib/payment-context.ts` and
  `app/api/instamojo/{create-payment,webhook,return}`, plus `INSTAMOJO-API.md`.
  Restored: `lib/order-notes.ts`, `app/api/razorpay/create-order`,
  `app/api/razorpay/webhook`, the `razorpay` block in `lib/checkout-config.ts`
  and the SDK loader plus sheet handler in `app/checkout/page.tsx`. No npm
  dependency: the REST API is called over fetch. Purchase, the server-side GA4
  purchase and the Pabbly hand-off all come from the webhook only, because a
  UPI buyer does not come back.
- It is a **SHEET over the checkout, not a redirect**: the buyer never leaves
  the site, so there is no return route, no `?pay=incomplete` arrival and no
  back-forward-cache reset. The sheet's `ondismiss` resets the pay button and
  its success handler forwards to `/thank-you?p=<razorpay_payment_id>`.
- The context carrier is the **order notes** again (five readable keys plus ten
  256-char chunk keys, the 15 Razorpay allows), not an encrypted token on a
  URL. fbp, fbc, the buyer's IP and user agent, the GA4 client id, city,
  occupation and the whole campaign ride in the order and come back to the
  webhook verbatim. Razorpay REJECTS an order that breaches 15 keys or 256
  chars, so the packer sacrifices fields in a declared order rather than
  risking the sale.
- The receipt prefix is **`dpp_`**, this client's, not the inherited `kz_`.
  Order notes `kind` is `peeyush_5day_health_reset`.
- **Still unconfigured.** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
  `RAZORPAY_WEBHOOK_SECRET` are present but blank in `.env.local` (as is every
  other var in it). Until the first two are filled the pay button says
  "Payments are not switched on yet. Nothing has been charged."
- **The webhook must be registered in the dashboard again**: Settings ->
  Webhooks, URL `<site>/api/razorpay/webhook`, event `payment.captured` only,
  and the secret you choose there goes into `RAZORPAY_WEBHOOK_SECRET`. This is
  a step Instamojo did not have, because it took the webhook URL per payment
  request.
- **No `image` key on the payment sheet**, deliberately: there is no
  `public/brand/peeyush-square.jpg` and a missing file renders a broken tile
  inside Razorpay's iframe. The sheet falls back to the logo uploaded in the
  Razorpay dashboard. The line to restore is commented in
  `app/checkout/page.tsx`.
- Testimonials are **in**: 13 Vimeo clips wired into `proof.tsx` (6 + 7,
  opposite directions), poster frames under `public/images/testimonials/`. They
  were delivered 16:9, not the 9:16 the rail was first built for, so
  `CLIP_RATIO` and `CARD_W` were switched; the one true-vertical master (Saniya)
  carries `fit: 'contain'`.
- Artwork, as of 15 Sep: `public/system/*.webp` feeds the hero offer card and
  three of the four value-stack covers. STILL MISSING and still reserved as
  `MediaPlaceholder`s at the real aspect ratio, so nothing reflows when art
  lands: the Dr. Peeyush portrait (3:4) and two stage stills, the 10-Minute
  Joint Mobility Playbook cover (1:1), an OG share image and a favicon.
  `public/famous-personalities/` and `public/public-feature/` are on disk and
  wired to NOTHING: say which frames to use. There is no logo, by instruction.
  Bump `ASSET_V` (currently `'1'`) on any drop that REPLACES a served file.

See `PENDING.md` for everything still needed.

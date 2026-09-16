# SESSION STATE · tgo-peeyush

Last updated: 15 Sep 2026 (LAUNCH payment pass, Instamojo)

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
- **Payments are on INSTAMOJO, not Razorpay**, and Razorpay is gone: both
  routes, the config block, the SDK loader, the client handler and
  `lib/order-notes.ts` were deleted and nothing imports them. New:
  `lib/instamojo.ts`, `lib/payment-context.ts`, and
  `app/api/instamojo/{create-payment,webhook,return}`. It is a REDIRECT
  gateway, so the checkout navigates the tab to Instamojo's `longurl` and the
  buyer returns through `/api/instamojo/return`, which confirms the payment
  with the gateway before forwarding to `/thank-you?p=`. Purchase, the
  server-side GA4 purchase and the Pabbly hand-off all come from the webhook
  only, because a UPI buyer does not come back.
- Instamojo has **no notes field**, so the buyer context (fbp, fbc, IP, user
  agent, GA4 client id, city, occupation, campaign) is sealed with AES-256-GCM,
  keyed from the account's private salt, and carried on the webhook URL, which
  Instamojo takes per payment request. If the gateway ever refuses that URL,
  create-payment retries once with a bare one: a thinner Purchase is
  recoverable, a buyer who cannot pay is not.
- **Still unconfigured.** `INSTAMOJO_CLIENT_ID`, `INSTAMOJO_CLIENT_SECRET`,
  `INSTAMOJO_SALT` and `INSTAMOJO_ENV` are not in `.env.local`, which still
  carries the three dead `RAZORPAY_*` keys. Until they are filled the pay
  button says "Payments are not switched on yet. Nothing has been charged."
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

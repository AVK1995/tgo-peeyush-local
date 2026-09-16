# PENDING · tgo-peeyush

Everything the build cannot invent. Grouped by who unblocks it.

## From Dr. Peeyush / the client

**Assets (public/ is empty)**
- Logo (SVG preferred, plus a square mark for OG/favicon)
- Portrait of Dr. Peeyush for the founder beat (3:4), plus two 1:1 stage stills. NOTE: `public/famous-personalities/` and `public/public-feature/` were dropped in and are NOT wired yet; say which of those to use and they go in as webp.
- Any session / TEDx / Josh Talks / television stills for the recognition beat
- ~~Offer stack + bonus covers~~ MOSTLY DONE (15 Sep): `public/system/*.webp` now feeds the hero offer card and three of the four value-stack covers. **Still missing: a 10-Minute Daily Joint Mobility & Pain Relief Playbook cover.** Two different Stress Emergency Toolkit renders were supplied instead; the spare is parked at `/system/guide-stress-alt.webp` and the mobility slot keeps its reserved 1:1 box.
- The 13 testimonial videos from the Drive folder in COPY-SOURCE.md. **Built and
  reserved for: 13 clips, VERTICAL 9:16, split 6 (row one) + 7 (row two) exactly
  as the copy sets them out, each with a poster frame at 1080 × 1920.** Preferred
  delivery is Vimeo (an id per clip) rather than mp4s under `/public`. If the
  Drive folder turns out to hold 16:9 Zoom recordings instead, say so: it is a
  two-line change (`CLIP_RATIO` and `CARD_W` at the top of
  `app/_landing/proof.tsx`), but it has to be made before the clips are cut.
- Nothing on the page currently names a testimonial speaker. A name only goes
  under a frame if the client has consent to show it.

**Facts**
- Legal entity name, legal structure, trading name, registered address, support phone, support email, jurisdiction, effective date. As of the LAUNCH pass (15 Sep) these are **nine** visible `[TODO]` markers in `app/_landing/legal.ts` and they RENDER on the page. They used to be Kaizen's real details. Ask whether the business is a proprietorship or a company before filling `entity` vs `tradeName`: they are two fields on purpose, and `structure` is the third half of the same answer. `structure` was added on the finishing pass because `app/terms-and-conditions/page.tsx` had "sole proprietor" hard-coded into its opening sentence, inherited with the scaffold and never confirmed for this client.
- Confirm the start date: the copy writes it once as "[30th September]" in brackets and once plain. Building against **30 September 2026**.
- WhatsApp community invite link for the thank-you page
- Money-back guarantee terms. The copy promises "100% Money-Back Guarantee" four times with no window, conditions or process anywhere. `app/refund-policy/page.tsx` was rewritten in the LAUNCH pass: the previous funnel's inherited window ("if you do not love Day One", 2-day processing) is GONE and the four open terms are visible `[TODO]` blocks on the live page. Four questions to answer: the window, the conditions, the process, the turnaround.
- Related: `app/thank-you/page.tsx` carried an inherited "No refunds for missed live sessions" line that flatly contradicted the guarantee. It was removed. A second inherited line went on the finishing pass: the note under the policy block read "(Our refund policy covers the **Day One guarantee** in full.)", which was the previous funnel's refund window promised to a buyer who had just paid. It now names his own six words instead. Its two remaining policy lines ("No rescheduling to future batches", "Recordings are not guaranteed"), the three prep lines and the community-benefit list are house-standard copy, NOT from COPY-SOURCE.md, and want Dr. Peeyush's read.
- A third inherited thank-you line, "Keep a yoga mat or soft surface ready", was cut rather than left flagged: it contradicted the "No equipment required" line at the foot of the same section AND the sales page's own "without endless yoga, gym workouts, medicines or expensive treatments". If his sessions do need a mat or a floor, say so and it goes back in, and the no-equipment line comes out with it.
- Zoom joining detail for the thank-you page
- The "1000+ Health Transformations" and "5.0 ★ Client Rating" claims: confirm they are real and substantiated before they go live.

## Env (`.env.example` is now this project's, 15 vars, parity verified both ways)
- `NEXT_PUBLIC_SITE_URL` (and correct the `FALLBACK_ORIGIN` literal in `app/layout.tsx`, currently the placeholder `challenge.drpeeyushprabhat.com`)
- `NEXT_PUBLIC_PRICE_RUPEES=497`
- `NEXT_PUBLIC_WHATSAPP_INVITE`
- Meta pixel id (twice) + CAPI token, GA4 measurement id + API secret, Clarity tag
- `PABBLY_WEBHOOK_URL`
- **PAYMENTS ARE BUILT, ON INSTAMOJO, AND UNCONFIGURED.** Razorpay is gone from this codebase: both routes, the config block, the SDK loader and the client handler were deleted, and nothing imports them. Three values are needed and all three come from the same Instamojo Integrations page: `INSTAMOJO_CLIENT_ID`, `INSTAMOJO_CLIENT_SECRET` and `INSTAMOJO_SALT`, plus `INSTAMOJO_ENV=test` for a sandbox run. `.env.local` still carries the three dead `RAZORPAY_*` keys and none of the Instamojo ones.
- There is **no webhook to register in the dashboard**. Instamojo takes the webhook URL per payment request, which is what lets it carry the sealed buyer context. The flip side: if `INSTAMOJO_SALT` is wrong there is no settings page that says so, the webhook simply rejects every call.
- The `kz_` order-receipt prefix is **resolved by deletion**: Instamojo has no receipt field and the Razorpay route that stamped it no longer exists. The browser storage keys were already `pp_*`.
- Remove `META_CAPI_TEST_EVENT_CODE` before real spend.

The full, project-specific launch list is the closing block of `.env.example`.

## Copy decisions waiting on you (flagged by SHAPE, built verbatim)
1. "Price Increases To ₹1599 Tomorrow" cannot run evergreen. The page goes live now for a 30 Sep cohort, so "tomorrow" is untrue for seventeen days. Needs a real dated deadline or a NO-BRAINER re-word.
2. "by up to 30% in 5 Days" and "Overcome Migraine, Asthma, Low Energy & Lifestyle Diseases" are specific clinical claims by a named MBBS doctor, on a page whose own disclaimer says it does not diagnose, treat, cure or prevent any disease. Sign-off question, not a design one.
3. "5.0 ★ Client Rating" names no platform and "1000+ Health Transformations" is unverified. Both sit in `offer.ts` as data, so either is a one-line edit.
4. "[30th September]" brackets dropped; building against 30 September 2026.
5. THE RESULTS: the copy's note says "Each section to come with icons (as shown
   in the reference snip above)" and no snip was attached. The seven glyphs are
   chosen in the build (Phosphor, one per domain). Swap any of them in one line.
6. THE RESULTS items are symptom NAMES ("Bronchial asthma", "High BP") under a
   heading about changes you can begin to notice. They are set with a neutral
   hairline dash, not ticks: a tick beside a disease name turns a list of areas
   into a list of cures, which is the same claim tension as flag 2 above.
7. The recognition beat (1M+ on YouTube · TEDx · Josh Talks · television) has no
   headline or eyebrow in the source, so it runs as a bare credential strip. If
   you want a line over it, NO-BRAINER should write it.
8. The same recognition clause also sits inside the founder bio, which is built
   verbatim in `close.tsx`. It therefore appears twice on the page. The fix, if
   it grates, is a copy edit to the bio, not a design change.
9. There is no second set of figures in the copy, so no second stats band was
   built: the four figures are the hero trust ledger. THE RESULTS occupies that
   slot instead.

## Testimonials · two things to check
- The clip Atul labelled **Saniya** is titled "Soniya Rohhila ji ..." on Vimeo. The card captions it "Saniya" as supplied. Confirm the spelling before launch: it names a real person.
- Most clips carry a **burnt-in royal-blue title banner** from an older template, and several are a vertical phone recording pillarboxed inside a 16:9 canvas with black bars. They work, but the blue fights the pine and amber page. Re-exporting them on a neutral or on-brand card is the upgrade, and needs no page change.
- Shreedhar's clip runs 3m27s; the others are 10 to 75 seconds.

## Decisions SHAPE made that are one-line reversible
- THE RESULTS items carry a neutral hairline dash, not a green tick: a check beside "Bronchial asthma" or "High BP" turns a list of areas into a list of cures.
- Seven Phosphor glyphs picked without a reference snip (Bone, Brain, Fire, Pulse, Wind, ForkKnife, ShieldPlus).
- "[Take Action · ₹497 →]" rendered as "Take Action · ₹497" with the page's own arrow token, on the assumption the brackets were shorthand.
- The 150-character h1 is set in two tiers (all words, original order); lit token is "up to 30%".
- The "1M+ on YouTube, TEDx, Josh Talks and television" clause appears twice: as the recognition ledger and verbatim inside the founder bio. If it grates, cut it from the bio (a copy edit).
- Nothing was built for the second "Move from right to left / left to right" pair: no stills, captions or count were supplied. If it is a photo marquee of the appearances, send the stills, it is two rows on machinery already in proof.tsx.
- No guarantee SECTION: the six words carry no terms anywhere in the copy, so reassurance stays welded under every CTA plus the seal on the recap.

## Build state
- Landing page: built by SHAPE (locked challenge rhythm, Breath For Health skin).
- LAUNCH pass run 15 Sep 2026 with payments excluded, then a second pass the same day that built payments on **Instamojo**. Checkout, thank-you, the three legal pages, the footer, Meta CAPI, GA4, Clarity, Pabbly, the payment layer and `.env.example` are this client's. No Kaizen string, colour or value survives outside `app/_landing/**`.
- A first LAUNCH run was interrupted mid-pass; a **finishing pass** on 15 Sep re-audited every file it had touched and everything it had not. What the finishing pass changed, beyond the state above:
  - `app/terms-and-conditions/page.tsx` (never touched by the interrupted run): "sole proprietor" was asserted as a hard-coded fact and is now `LEGAL.structure`, a `[TODO]`; the programme description in section 2 said "expert-led" where his own copy says doctor-led; the health disclaimer in section 4 described the PREVIOUS funnel's subjects ("movement, mindfulness and nutrition") and now names this one's, from the day-by-day schedule in COPY-SOURCE.md.
  - `app/privacy-policy/page.tsx` (also never touched): audited, nothing wrong. It drives everything off `LEGAL`, including the effective date, so it carries no stale scaffold.
  - `app/checkout/page.tsx`: the form said "all **six** guides go to these" when the value stack has three; the pay button was his cyan `#06B6D4` on a white form card (2.4:1, and the tone reserved for the dark hero stage) and is now the light-page tone `C.ink` on `C.canvas`, the same decision `PrimaryCTA` makes; the label is now wrapped in a `<span>` so `.cta-shimmer > *` can lift it above the sweep.
  - `app/thank-you/page.tsx`: the "Day One guarantee" line and the yoga-mat prep line (see Facts above); "expert-led" to doctor-led.
  - `app/api/meta/event/route.ts`: the client IP was read straight off `x-forwarded-for` here while `lib/request-signals.ts` existed to do it properly. It now uses `readClientIp` / `readClientUserAgent`, so this route and create-order resolve the same address from the same headers, preferring `cf-connecting-ip` and `x-vercel-forwarded-for`.
  - `lib/attribution.ts`, `lib/client-signals.ts`, `lib/ga4.ts`: browser storage keys renamed `kz_*` to `pp_*`. Two stale comments in `lib/ga4.ts` and `lib/track.ts` still said "once per browser" after `once()` was split into a durable purchase key and a per-session key for everything else.
  - Em dashes swept out of every file on the LAUNCH side. The ones left are in `app/_landing/**` and `app/globals.css` (SHAPE's, not touched). The two that were left in the Razorpay routes left with them.
- `.env.example` parity re-verified mechanically in both directions after the changes: no `process.env` reference without a declared var, no declared var that nothing reads.
- Tracking verified against the build bible's event map: ViewContent once per session from `FunnelTracker`, AddToCart + begin_checkout on the checkout's ref-guarded mount, InitiateCheckout + add_payment_info + QualifiedLead on the pay tap only, Purchase from the payment webhook only. `custom_data` carries value, currency, order_id and the occupation enum and nothing else. `event_source_url` is reduced to the origin server-side. `capi()` takes the closed `SendableEvent` union rather than a string.
- **Instamojo pass, 15 Sep 2026.** Razorpay was removed wholesale (both routes, the config block, the SDK loader, the client handler, `lib/order-notes.ts`) and replaced with `lib/instamojo.ts`, `lib/payment-context.ts` and three routes under `app/api/instamojo/`: `create-payment`, `webhook`, `return`. No npm dependency: the REST API is called over fetch, as before. The gateway is a REDIRECT, so the checkout navigates the tab to Instamojo's `longurl` and the buyer returns through `/api/instamojo/return`, which confirms the payment server-side before forwarding to `/thank-you?p=`. Purchase, the server GA4 copy and the Pabbly hand-off all still come from the webhook and nowhere else. Instamojo has no notes field, so the buyer context (fbp, fbc, IP, user agent, GA4 client id, city, occupation, campaign) is sealed with AES-256-GCM and carried on the webhook URL set per payment request. Unconfigured, so the pay button still reports "Payments are not switched on yet. Nothing has been charged."
- Live domain unknown: `FALLBACK_ORIGIN` in `app/layout.tsx` is a placeholder (`challenge.drpeeyushprabhat.com`). No OG image and no favicon exist.
- No logo anywhere, by instruction. The type-set wordmark was cut and `app/_landing/brand-mark.tsx` deleted; the checkout header and the footer carry continuity through the dark strip instead.

## Skin
**Breath For Health**, matched to Dr. Peeyush's own live page at
breathforhealth.in/breath (measured, see `THEME-SOURCE.md`) and dropped into the
locked challenge rhythm: light bands alternating, the hero as the single dark
stage in his deep teal `#06141C`, dark below it only as contained cards (the
live-sessions card, Option 2, the video bed). Cyan `#06B6D4` CTA pill with a
glow, emerald second accent, Poppins 800 headlines over DM Sans. Both accents
run in two steps because the bright values fail on a light ground. The palette
lives in three files (`:root` in globals.css, `C` in shared.tsx, colors in
tailwind.config.ts) and must be changed in all three together.

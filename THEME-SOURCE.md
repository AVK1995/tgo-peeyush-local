# THEME SOURCE · breathforhealth.in/breath

Dr. Peeyush's own live workshop page, measured in the browser on 14 Sep 2026.
Atul's instruction: "Checkout this https://breathforhealth.in/breath for his
theme and then apply the same theme."

## How this reference is applied

His page supplies the **identity**: palette, accent, type, button shape. It does
NOT supply the section rhythm. This is a CHALLENGE funnel, so the blueprint's
rhythm governs: light bands alternating, the hero as the single dark stage, and
dark below the hero only as a contained object inside a light band. His grounds
(#06141C and friends) are therefore the STAGE and the contained cards, not the
page.

His cyan is 2.4:1 on a light ground, so on the light bands it is a fill and a
graphic, never type. The accent runs in three steps, the way the skin's gold
did: #0891B2 for large text and the price, #0E7490 for labels and eyebrows,
#06B6D4 for fills and for type on the dark stage (7.7:1 there). Emerald splits
the same way: #10B981 inside dark objects, #047857 for ticks on light.

## Measured tokens (read off the live page, not eyeballed)

The page scopes its own variables on `.breath-scope`:

```
--bw-bg:      #06141C   /* the page ground. The WHOLE page is this dark. */
--bw-fg:      #FFFFFF
--bw-accent:  #10B981   /* emerald */
--bw-cta:     #06B6D4   /* cyan, the CTA fill */
--bw-muted:   rgba(255,255,255,0.85)
--bw-border:  rgba(6,182,212,0.18)   /* hairlines are tinted cyan, not grey */
```

Also in use across the page:

```
band / alternate section:  #0A1F2A
card surface:              #0E2733
CTA label ink:             #04141C   (dark ink ON the cyan pill)
secondary body:            rgba(255,255,255,0.9) / 0.85 / 0.8
amber, used sparingly:     #F59E0B
red, urgency only:         #DC2626
highlight-word gradient:   linear-gradient(to right, #06B6D4, #10B981)
hero glows:                radial-gradient(at 20% 0%, rgba(6,182,212,0.18), transparent 50%)
                           radial-gradient(at 80% 30%, rgba(16,185,129,0.x), transparent)
```

## Type

- **Headlines: Poppins 800.** h1 60px desktop, letter-spacing -1.5px, line-height
  1.0. h2 36px, tracking normal. White, with the highlight phrase carrying the
  cyan-to-emerald gradient.
- **Body, buttons, eyebrows: DM Sans** (400/500/600/700).
- **Eyebrows:** DM Sans, 12px, uppercase, 3px tracking, cyan `#06B6D4`, usually
  with a small cyan dot before the word.
- (Playfair Display is loaded on his page but does no headline work.)

## Component look

- **CTA:** full pill (`border-radius: 9999px`), cyan `#06B6D4` fill, dark ink
  label, DM Sans 700 at 18px, right arrow, cyan glow bloom beneath it.
- **Cards:** `#0E2733`, radius 16-24px, hairline border in cyan-tinted rgba,
  image on top, Poppins 800 white title, muted body under it.
- **Ticks:** emerald `#10B981` check glyphs on the dark ground.
- **Numbered chips:** cyan square with a dark ink numeral.
- **Section rhythm:** dark throughout, `#06141C` ground alternating with the
  `#0A1F2A` band. There is no light section anywhere on his page.

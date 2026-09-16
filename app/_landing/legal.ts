/**
 * The business facts every legal page needs.
 *
 * Collected here rather than scattered through three pages so it is one edit,
 * and so a placeholder cannot hide in a paragraph.
 *
 * FILLED 15 Sep 2026 from the client's own details, except two fields called
 * out below. They used to be the PREVIOUS client's real registered details
 * (Kaizen Wellness, a Goa address, a working phone and a monitored inbox),
 * carried in with the scaffold, which pointed this funnel's refund and data
 * requests at a real third party's inbox.
 *
 * STILL OPEN, both marked [TODO] inline so they ship loudly rather than
 * quietly:
 *   - `structure`: proprietorship, partnership or company. It decides who the
 *     counterparty is in the terms.
 *   - the PIN code on `address`.
 *
 * These strings appear in the footer of EVERY page (landing, checkout,
 * thank-you) and inside sentences on all three policy pages.
 *
 * The payment gateway's merchant review checks for the entity, the address,
 * the phone and the email on the site itself, not buried in a policy page. A
 * reviewer who cannot find them fails the account rather than writing to ask.
 *
 * `brand`, `product` and the disclaimer below ARE this client's and are
 * correct: they come verbatim from COPY-SOURCE.md.
 */
export const LEGAL = {
  /* The LEGAL person. Supplied by Atul, 15 Sep 2026. */
  entity: 'Breath for health program',
  /* The name the BUYER recognises. Two fields, never one: collapsing them gets
     one of the two audiences wrong. Here the client gave the same string for
     both, which is normal when the business trades under its registered name. */
  tradeName: 'Breath for health program',
  /* The legal STRUCTURE, which the terms page names in its opening sentence.
     It was hard-coded there as "sole proprietor", inherited with the scaffold
     and never confirmed for this client. Asserting the wrong one in the terms
     is not cosmetic: it decides who the counterparty is, who carries the
     liability, and which name has to match the PAN and the payment-gateway
     merchant record.
     ⚠️ STILL OPEN. The name supplied reads as a business name rather than an
     individual, so it is probably NOT a sole proprietorship, but that is an
     inference and this field is a legal assertion. Fill with the phrase as it
     should READ in a sentence, lower case: 'sole proprietor', 'a partnership
     firm', 'a private limited company'. Until then the terms page says the
     entity operates the programme without naming a structure at all, which is
     accurate and says nothing untrue. */
  structure: '[TODO: legal structure]',
  /* Supplied by Atul, 15 Sep 2026.
     ⚠️ THE PIN IS MISSING. He was asked for the address with PIN and gave
     "B block, harinagar delhi". A PIN is not a detail to guess: it goes on the
     merchant record and on the refund address. Add it here the moment it
     arrives, in this one place. */
  address: 'B Block, Hari Nagar, New Delhi, Delhi [TODO: PIN]',
  /** A monitored number, in the form it should be read as. */
  phone: '+91 99104 29440',
  /** The same number, digits and + only, for the tel: href. */
  phoneHref: '+919910429440',
  /** Refund and data requests land here. */
  email: 'breath4healthcommunity@gmail.com',
  /* Supplied as the jurisdiction STATE (Delhi). The terms name a city forum,
     and for this address that is Delhi itself, so the two agree. */
  jurisdiction: 'Delhi',
  /* The date the policies are published under. Set to the day the business
     facts landed; move it if the funnel goes live later, because a policy
     dated before it was published is the kind of detail a dispute picks at. */
  effectiveDate: '15 September 2026',

  /* ── this client's, verbatim from the copy source ───────────────────────── */
  brand: 'Dr. Peeyush Prabhat',
  product: '5-Day Complete Health Reset Challenge',
} as const;

/**
 * Has the legal structure actually been answered?
 *
 * The terms page names the structure in its opening sentence, and that
 * sentence is a contractual statement about who the buyer's counterparty is.
 * An unfilled field must not appear there in either of the two wrong ways: as
 * a guess, or as a bracketed placeholder rendered into the middle of a legal
 * sentence. So while this is false the sentence runs WITHOUT a structure,
 * which is accurate and asserts nothing untrue.
 *
 * It stays a launch blocker either way. This only decides how the page reads
 * until it is answered.
 */
export const LEGAL_STRUCTURE_KNOWN = !LEGAL.structure.includes('[TODO');

/**
 * THE DISCLAIMER, verbatim from COPY-SOURCE.md.
 *
 * This is the client's own wording and it is legal copy: do not reword it, do
 * not split it, and do not let it drift between pages, which is the whole
 * reason it lives as one string. It is landing-page copy that also has to
 * appear on the checkout and the thank-you page, so it is defined here and
 * rendered by the shared footer.
 *
 * RESOLVED, and the note is kept as the trail: components/SiteFooter.tsx used
 * to hard-code the previous client's menopause and HRT disclaimer. It now
 * renders this string, so the wording is identical on the landing page, the
 * checkout, the thank-you page and all three policy pages.
 */
export const LEGAL_DISCLAIMER =
  'All content, live sessions and resources are for educational and general wellness purposes only. This is not medical advice and does not diagnose, treat, cure or prevent any disease. The challenge complements, but does not replace, care from your doctor. Consult a qualified healthcare professional before changing your health routine, especially if you have a medical condition, take medication or are undergoing treatment. Do not stop or alter prescribed medication without medical guidance. Individual results vary based on age, medical history, lifestyle, participation and consistency. Testimonials reflect individual experiences and do not guarantee similar results. This website is not affiliated with or endorsed by Meta. FACEBOOK and INSTAGRAM are trademarks of Meta Platforms, Inc.';

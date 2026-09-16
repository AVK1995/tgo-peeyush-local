'use client';

/**
 * /checkout - 5-Day Complete Health Reset Challenge.
 *
 * Built to the same pattern as the ankita-postpartum checkout, which is the
 * house standard for challenge funnels: header with a way back, a centred
 * masthead, then a two-column body with the form on the left and a STICKY order
 * summary on the right that collapses into a tap-to-open accordion on a phone.
 *
 * Skinned in this project's own palette rather than ankita's pink, and it
 * imports the landing page's tokens instead of redeclaring them, so the two
 * pages cannot drift apart.
 *
 * PAYMENT IS INSTAMOJO, AND IT IS A REDIRECT, NOT A SHEET.
 *
 * That is the one structural thing to hold on to when reading this file.
 * There is no SDK to load, no modal to open over this page, and no in-page
 * success callback to write. The pay button posts the form to
 * /api/instamojo/create-payment, gets back a payment-page URL, and navigates
 * the whole tab to it. The buyer comes back, if they come back at all, on
 * /api/instamojo/return, which confirms the payment server-side and forwards
 * them to /thank-you.
 *
 * Two consequences live in the code below:
 *   - InitiateCheckout fires BEFORE the navigation, which is safe because
 *     lib/track posts it with keepalive: true. It is pay intent, and it is the
 *     last thing this page can report.
 *   - the button is left in its busy state on the way out, and reset on
 *     `pageshow`, because a buyer who presses back arrives on a page restored
 *     from the back-forward cache with the state it had when they left, which
 *     is a disabled pay button and no way to try again.
 *
 * The button degrades honestly when the gateway is unconfigured:
 * create-payment reports `not-configured` and the form says "Payments are not
 * switched on yet. Nothing has been charged." rather than failing silently.
 */

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ArrowLeft,
  CaretDown,
  CheckCircle,
  CreditCard,
  Lock,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';

import { CTA_NOTE, PRICE, PRICE_RUPEES, SESSION_TIMES_TZ, START_DATE } from '../_landing/offer';
import PaymentLogos from '@/components/PaymentLogos';
import SiteFooter from '@/components/SiteFooter';
import { collectSignals } from '@/lib/client-signals';
import {
  trackAddToCart,
  trackBeginCheckout,
  trackInitiateCheckout,
} from '@/lib/track';

import { C } from '../_landing/shared';
import { RECAP, VALUE_TOTAL, inr } from './included';

/* Dial codes carry the ISO-2 alongside them because Meta's CAPI wants the
   COUNTRY as a hashed ISO 3166-1 alpha-2 code, not a dial code. India first,
   then the places this audience actually lives. */
const COUNTRIES: { iso: string; dial: string; label: string }[] = [
  { iso: 'in', dial: '+91', label: 'India (+91)' },
  { iso: 'ae', dial: '+971', label: 'UAE (+971)' },
  { iso: 'gb', dial: '+44', label: 'UK (+44)' },
  { iso: 'us', dial: '+1', label: 'USA (+1)' },
  { iso: 'ca', dial: '+1', label: 'Canada (+1)' },
  { iso: 'au', dial: '+61', label: 'Australia (+61)' },
  { iso: 'sg', dial: '+65', label: 'Singapore (+65)' },
  { iso: 'qa', dial: '+974', label: 'Qatar (+974)' },
  { iso: 'om', dial: '+968', label: 'Oman (+968)' },
  { iso: 'kw', dial: '+965', label: 'Kuwait (+965)' },
  { iso: 'sa', dial: '+966', label: 'Saudi Arabia (+966)' },
  { iso: 'nz', dial: '+64', label: 'New Zealand (+64)' },
  { iso: 'za', dial: '+27', label: 'South Africa (+27)' },
  { iso: 'my', dial: '+60', label: 'Malaysia (+60)' },
  { iso: 'de', dial: '+49', label: 'Germany (+49)' },
];

/* Exactly the two the client asked for, and no "other": a two-way split is the
   point of the question. The VALUE is what travels to the webhook, so keep it
   stable even if the label is reworded. */
const OCCUPATIONS = [
  { value: 'working_professional', label: 'Working professional' },
  { value: 'homemaker', label: 'Homemaker' },
];

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  country: string; // ISO-2
  phone: string;
  occupation: string;
};

export default function CheckoutPage() {
  const [f, setF] = useState<Fields>({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    country: 'in',
    phone: '',
    occupation: '',
  });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState('');

  /* Arrival at the checkout. GA4 gets begin_checkout, Meta gets AddToCart.
     Meta's InitiateCheckout deliberately does NOT fire here: it waits until the
     details are valid and the payment sheet actually opens, which is a far
     stronger buying signal than a page load and is what the ads optimise on.

     This is also the only Meta event a DIRECT arrival ever gets. Someone who
     opens /checkout from an email, a retargeting ad or a bookmark never touches
     the landing page, so without this they were invisible to Meta until the pay
     tap. Ref-guarded so StrictMode's double effect and a remount cannot inflate
     the count. */
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current) return;
    arrived.current = true;
    trackBeginCheckout();
    trackAddToCart();
  }, []);

  /* Coming BACK from the gateway.
     Two arrivals are handled here and neither existed on a modal gateway.

     A buyer who abandons the Instamojo page and presses back lands on this
     page restored from the back-forward cache, with the exact state it had
     when they left: `busy` true and the pay button disabled. The `persisted`
     flag on `pageshow` is the only reliable signal that this happened, since
     no effect re-runs on a bfcache restore.

     And /api/instamojo/return sends a buyer here with ?pay=incomplete when the
     gateway did not confirm the payment. Read from window.location rather than
     useSearchParams on purpose: this is a client page with no Suspense
     boundary around it, and useSearchParams would demand one. */
  useEffect(() => {
    const restore = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(false);
    };
    window.addEventListener('pageshow', restore);
    if (new URLSearchParams(window.location.search).get('pay') === 'incomplete') {
      setFailed(
        'That payment did not go through, so nothing has been charged. You can try again below.',
      );
    }
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  const v = useMemo(() => {
    const digits = f.phone.replace(/\D/g, '');
    return {
      firstName: f.firstName.trim().length > 1,
      lastName: f.lastName.trim().length > 0,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()),
      city: f.city.trim().length > 1,
      /* The dial code is chosen from the picker, so this validates the SUBSCRIBER
         number only: 7 to 12 digits covers every country in the list without
         pulling in libphonenumber-js. India is the strict case at exactly 10. */
      phone: f.country === 'in' ? digits.length === 10 : digits.length >= 7 && digits.length <= 12,
      occupation: f.occupation !== '',
    };
  }, [f]);
  const valid =
    v.firstName && v.lastName && v.email && v.city && v.phone && v.occupation;

  const dial = COUNTRIES.find((c) => c.iso === f.country)?.dial ?? '+91';
  /* E.164 without the plus, which is what both Meta and Instamojo expect. */
  const e164 = `${dial}${f.phone}`.replace(/\D/g, '');

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setFailed('');
    if (!valid || busy) return;
    setBusy(true);

    /* Meta InitiateCheckout + GA4 add_payment_info. Fired before the buyer is
       handed to the gateway rather than after payment, because this is the
       moment intent is real: details are valid and the buyer is committing.

       It is also the LAST thing this page will ever report, because the next
       navigation leaves the site entirely. lib/track posts it with
       keepalive: true, which is what makes that safe. */
    trackInitiateCheckout({
      email: f.email.trim(),
      phone: e164,
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      city: f.city.trim(),
      country: f.country,
      occupation: f.occupation,
    });

    try {
      const res = await fetch('/api/instamojo/create-payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: f.firstName.trim(),
          lastName: f.lastName.trim(),
          email: f.email.trim(),
          phone: e164,
          city: f.city.trim(),
          country: f.country,
          occupation: f.occupation,
          ...collectSignals(),
        }),
      });
      const created = await res.json();

      if (!res.ok || !created?.ok || !created?.payUrl) {
        setBusy(false);
        setFailed(
          created?.reason === 'not-configured'
            ? 'Payments are not switched on yet. Nothing has been charged.'
            : 'We could not start the payment. Please try again.',
        );
        return;
      }

      /* The redirect. Everything this page can report has been reported by
         now, and Purchase is NOT one of those things: the webhook owns it, so
         a UPI payer who finishes inside their bank app and never comes back is
         still counted.

         `assign`, not `replace`: back from the payment page should land the
         buyer on their filled-in checkout, not on the landing page. */
      window.location.assign(created.payUrl as string);
    } catch {
      setBusy(false);
      setFailed('We could not start the payment. Please try again.');
    }
  };

  return (
    <main className="min-h-screen" style={{ background: C.canvasAlt }}>
      <Header />

      <section className="py-8 md:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8">
          <div className="mb-8 text-center sm:mb-10 md:mb-12">
            <span
              className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
              style={{ background: C.goldWash, color: C.goldInk }}
            >
              <CheckCircle weight="fill" className="h-3 w-3 shrink-0" />
              5-Day Complete Health Reset
            </span>

            <h1
              className="mt-4 font-display text-[22px] font-extrabold leading-tight sm:text-[28px] md:text-[34px]"
              style={{ color: C.ink, textWrap: 'balance' } as React.CSSProperties}
            >
              Add your details to confirm your seat.
            </h1>
            <p className="mt-3 text-[13px] sm:text-[13.5px]" style={{ color: C.inkSoft }}>
              Starts {START_DATE} · Live on Zoom · {SESSION_TIMES_TZ}
            </p>
          </div>

          {/* Form left, summary right. The summary is sticky on desktop so the
              price stays in view while the form is filled, and collapses to an
              accordion on a phone so it never pushes the fields below the fold. */}
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(320px,380px)] lg:items-start lg:gap-10">
            <form
              onSubmit={startPayment}
              noValidate
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
                style={{ color: C.goldInk }}
              >
                Your details
              </p>
              <h2
                className="mt-2 font-display text-[20px] font-extrabold leading-snug sm:text-[22px]"
                style={{ color: C.ink }}
              >
                Where should we send your seat?
              </h2>
              <p className="mt-2 text-[12.5px] sm:text-[13px]" style={{ color: C.inkSoft }}>
                Your Zoom link, reminders and all three guides go to these.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {/* First and last are separate fields, not one "Full name"
                    split on a space. Splitting guesses: it gives a two-word
                    surname to the first name, and a single-word entry no last
                    name at all. Meta hashes fn and ln independently, so a bad
                    guess is a permanently worse match. */}
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="First name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={f.firstName}
                    onChange={(x) => setF((s) => ({ ...s, firstName: x }))}
                    bad={touched && !v.firstName}
                  />
                  <Field
                    label="Last name"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Last name"
                    value={f.lastName}
                    onChange={(x) => setF((s) => ({ ...s, lastName: x }))}
                    bad={touched && !v.lastName}
                  />
                </div>

                <Field
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={f.email}
                  onChange={(x) => setF((s) => ({ ...s, email: x }))}
                  bad={touched && !v.email}
                />

                <Field
                  label="Town / City"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Your town or city"
                  value={f.city}
                  onChange={(x) => setF((s) => ({ ...s, city: x }))}
                  bad={touched && !v.city}
                />

                {/* The dial code is its own control rather than something the
                    buyer types, so the number that reaches Meta and Instamojo is
                    always a clean E.164 and the country arrives as an ISO-2 we
                    can hash. */}
                <label className="block">
                  <span
                    className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: C.inkSoft }}
                  >
                    WhatsApp number
                  </span>
                  <div className="flex gap-2">
                    <select
                      className="w-[124px] shrink-0 rounded-xl px-3 py-3 text-[15px] outline-none"
                      autoComplete="tel-country-code"
                      aria-label="Country dialling code"
                      value={f.country}
                      onChange={(e) => setF((s) => ({ ...s, country: e.target.value }))}
                      style={{
                        background: C.canvasAlt,
                        color: C.ink,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.iso} value={c.iso}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="98XXX XXXXX"
                      value={f.phone}
                      onChange={(e) => setF((s) => ({ ...s, phone: e.target.value }))}
                      aria-invalid={(touched && !v.phone) || undefined}
                      style={{
                        background: C.canvasAlt,
                        color: C.ink,
                        border: `1px solid ${touched && !v.phone ? C.coralInk : C.line}`,
                      }}
                    />
                  </div>
                  <span className="mt-1.5 block text-[11.5px]" style={{ color: C.inkSoft }}>
                    Your session reminders go here.
                  </span>
                </label>

                <label className="block">
                  <span
                    className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: C.inkSoft }}
                  >
                    Are you a working professional or a homemaker?
                  </span>
                  <select
                    className="w-full rounded-xl px-4 py-3 text-[15px] outline-none"
                    value={f.occupation}
                    onChange={(e) => setF((s) => ({ ...s, occupation: e.target.value }))}
                    aria-invalid={(touched && !v.occupation) || undefined}
                    style={{
                      background: C.canvasAlt,
                      color: f.occupation ? C.ink : C.inkSoft,
                      border: `1px solid ${touched && !v.occupation ? C.coralInk : C.line}`,
                    }}
                  >
                    <option value="" disabled>
                      Select one
                    </option>
                    {OCCUPATIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {touched && !valid && (
                <p className="mt-4 text-[12.5px]" style={{ color: C.coralInk }}>
                  Please add your name, a working email and a valid number.
                </p>
              )}
              {failed && (
                <p className="mt-4 text-[12.5px]" style={{ color: C.coralInk }}>
                  {failed}
                </p>
              )}

              {/* The pay button takes the LIGHT-page tone, which is the same
                  decision PrimaryCTA makes in ./_landing/shared: deep ink fill,
                  canvas label, cyan only in the shimmer. It was his cyan pill
                  until this pass, which is the tone reserved for the dark hero
                  stage: #06B6D4 is 2.4:1 against a white form card, so the one
                  button on the page that has to be the loudest object was the
                  hardest to find, and it did not match a single CTA the buyer
                  had just clicked to get here. */}
              <button
                type="submit"
                disabled={busy}
                className="lego-press cta-shimmer mt-7 inline-flex min-h-[58px] w-full items-center justify-center rounded-2xl px-6 text-[15.5px] font-bold disabled:opacity-60"
                style={{
                  background: C.ink,
                  color: C.canvas,
                  ['--shimmer' as string]: 'rgba(34,211,238,0.38)',
                }}
              >
                {/* The label is wrapped, exactly as PrimaryCTA wraps its own.
                    `.cta-shimmer > *` is what lifts a child to z-index 2 above
                    the z-index 1 sweep, and a bare text node is not a child it
                    can select, so the highlight was passing OVER the words
                    instead of behind them. */}
                <span>
                  {busy ? 'Taking you to payment…' : `Pay ${PRICE} & Join the Reset`}
                </span>
              </button>

              {/* The three pointers that sit under every checkout CTA we ship.
                  Dot-separated on one line, each nowrap so a narrow phone wraps
                  BETWEEN them rather than mid-phrase. */}
              <div
                className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10.5px] sm:text-[11px]"
                style={{ color: C.inkSoft }}
              >
                <span className="inline-flex items-center gap-1 whitespace-nowrap sm:gap-1.5">
                  <Lock weight="fill" className="h-3 w-3 shrink-0" style={{ color: C.goldInk }} />
                  Instamojo Secured
                </span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">SSL Encrypted</span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">{CTA_NOTE}</span>
              </div>

              <p
                className="mt-5 text-center text-[12px] leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                Your personal data will be used to process your order, support
                your experience, and for other purposes described in our{' '}
                <Link
                  href="/privacy-policy"
                  className="font-semibold underline"
                  style={{ color: C.goldInk }}
                >
                  privacy policy
                </Link>
                .
              </p>

              <PaymentMethods />
            </form>

            <div className="lg:sticky lg:top-8">
              <OrderSummary />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

/* ── Header. A way back, and nothing else: every other link is a way to not
      pay. The type-set wordmark that used to sit on the left is gone, cut
      everywhere on Atul's instruction, so what carries continuity from the
      landing page is the strip itself (same deep teal, same cyan, same type)
      rather than a mark. The row is left-aligned now that it holds one item;
      `justify-between` on a single child would push the link to the left edge
      anyway, but saying so in the class is what stops the next person reading
      it as a bug. ────────────────────────────────────────────────────────── */
function Header() {
  return (
    <header
      className="px-4 py-4 sm:px-6"
      style={{ background: C.navyDeep, color: C.onDark }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: C.onDarkMute }}
        >
          <ArrowLeft weight="bold" className="h-3.5 w-3.5" />
          Back
        </Link>
      </div>
    </header>
  );
}

/* ── Order summary. Ported from the ankita-postpartum checkout, which is the
      house standard, and re-skinned to this project's tokens. Same blocks in
      the same order: lead item, included list, subtotal / bonus value, the
      ruled Total, the method tile, then the guarantee line.
      Accordion below lg, always open from lg up. ───────────────────────── */
function OrderSummary() {
  const [open, setOpen] = useState(false);
  const [lead, ...bonuses] = RECAP;
  const bonusValue = VALUE_TOTAL - lead.value;

  return (
    <div
      className="rounded-2xl p-5 sm:p-6"
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="order-summary-details"
        className="flex w-full items-center justify-between gap-3 text-left lg:pointer-events-none"
      >
        <span className="min-w-0">
          <span
            className="block text-[10.5px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.goldInk }}
          >
            Order summary
          </span>
          <span
            className="mt-2 block font-display text-[20px] font-extrabold leading-snug sm:text-[22px]"
            style={{ color: C.ink }}
          >
            The 5-Day Reset, in full
          </span>
          <span className="mt-1 block text-[12px] lg:hidden" style={{ color: C.inkSoft }}>
            {open ? 'Tap to hide details' : 'Tap to view what is included'}
          </span>
        </span>
        <CaretDown
          weight="bold"
          className={`h-4 w-4 shrink-0 transition-transform lg:hidden ${open ? 'rotate-180' : ''}`}
          style={{ color: C.inkSoft }}
        />
      </button>

      {/* Lead item, always visible: it is the thing being bought. */}
      <div
        className="mt-5 flex items-start gap-3 rounded-2xl p-3"
        style={{ background: C.canvasAlt, border: `1px solid ${C.line}` }}
      >
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14"
          style={{ background: C.navyDeep }}
        >
          <span
            className="font-display text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.gold }}
          >
            Live
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-[13.5px] font-semibold leading-snug sm:text-[14px]"
            style={{ color: C.ink }}
          >
            {lead.title}
          </p>
          <p className="mt-0.5 text-[11px] sm:text-[11.5px]" style={{ color: C.inkSoft }}>
            {START_DATE} · {SESSION_TIMES_TZ}
          </p>
        </div>
        <div
          className="shrink-0 text-right font-display text-[14px] font-extrabold tabular-nums sm:text-[15px]"
          style={{ color: C.ink }}
        >
          {inr(lead.value)}
        </div>
      </div>

      <div id="order-summary-details" className={`${open ? 'block' : 'hidden'} lg:block`}>
        <div className="mt-4 space-y-1.5">
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.inkSoft }}
          >
            Free bonuses included
          </p>
          <ul className="space-y-1.5 text-[12px] sm:text-[12.5px]" style={{ color: C.inkSoft }}>
            {bonuses.map((r) => (
              <li key={r.title} className="flex items-start gap-2">
                <CheckCircle
                  weight="fill"
                  className="mt-[3px] h-3.5 w-3.5 shrink-0"
                  style={{ color: C.coralInk }}
                />
                <span className="flex-1 leading-snug">{r.title}</span>
                <span className="shrink-0 font-medium tabular-nums">{inr(r.value)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="my-5 h-px" style={{ background: C.line }} />

        <div className="space-y-2 text-[13.5px]">
          <div className="flex justify-between" style={{ color: C.inkSoft }}>
            <span>Subtotal</span>
            <span className="tabular-nums">{inr(PRICE_RUPEES)}</span>
          </div>
          <div className="flex justify-between" style={{ color: C.inkSoft }}>
            <span>Total bonus value</span>
            <s
              className="decoration-[2.5px] underline-offset-2 tabular-nums"
              style={{ color: C.inkSoft, textDecorationColor: C.coralInk }}
            >
              {inr(bonusValue)}
            </s>
          </div>
        </div>
      </div>

      <div className="my-4 h-px" style={{ background: C.line }} />

      {/* The ruled Total. Gold appears here and nowhere else on the page. */}
      <div
        className="flex items-baseline justify-between gap-3 rounded-2xl px-4 py-3.5"
        style={{ background: C.goldWash, border: `1px solid ${C.lineStrong}` }}
      >
        <span
          className="font-display text-[13px] font-bold uppercase tracking-[0.12em] sm:text-[14px] sm:tracking-[0.14em]"
          style={{ color: C.ink }}
        >
          Total
        </span>
        <div className="text-right">
          <div
            className="font-display text-[26px] font-extrabold leading-none tabular-nums sm:text-[32px]"
            style={{ color: C.goldDeep }}
          >
            {PRICE}
          </div>
          <s className="text-[12px] tabular-nums sm:text-[12.5px]" style={{ color: C.inkSoft }}>
            {inr(VALUE_TOTAL)}
          </s>
        </div>
      </div>

      {/* Method */}
      <div
        className="mt-5 flex items-start gap-3 rounded-2xl p-3"
        style={{ background: C.canvasAlt, border: `1px solid ${C.line}` }}
      >
        <CreditCard weight="duotone" className="h-5 w-5 shrink-0" style={{ color: C.goldInk }} />
        <div className="text-[12.5px]">
          <p className="font-semibold" style={{ color: C.ink }}>
            UPI · Cards · NetBanking
          </p>
          <p className="mt-0.5" style={{ color: C.inkSoft }}>
            Pay securely via Instamojo.
          </p>
        </div>
      </div>

      <p
        className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px]"
        style={{ color: C.inkSoft }}
      >
        <ShieldCheck weight="fill" className="h-3.5 w-3.5" style={{ color: C.goldInk }} />
        {CTA_NOTE}
      </p>
    </div>
  );
}

/* ── One field. Kept as a component so every input carries the same label
      treatment, the same error state and the same focus ring. ──────────── */
function Field({
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
  bad,
  note,
}: {
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  bad: boolean;
  note?: string;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em]"
        style={{ color: C.inkSoft }}
      >
        {label}
      </span>
      <input
        className="w-full rounded-xl px-4 py-3 text-[15px] outline-none"
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={bad || undefined}
        style={{
          background: C.canvasAlt,
          color: C.ink,
          border: `1px solid ${bad ? C.coralInk : C.line}`,
        }}
      />
      {note && (
        <span className="mt-1.5 block text-[11.5px]" style={{ color: C.inkSoft }}>
          {note}
        </span>
      )}
    </label>
  );
}

function PaymentMethods() {
  return (
    <div
      className="mt-6 rounded-2xl p-4"
      style={{ background: C.canvasAlt, border: `1px solid ${C.line}` }}
    >
      <p
        className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.16em]"
        style={{ color: C.inkSoft }}
      >
        100% Secure &amp; Safe Payments
      </p>
      <PaymentLogos size="full" />
    </div>
  );
}


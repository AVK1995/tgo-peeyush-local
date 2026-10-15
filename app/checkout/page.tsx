'use client';

/* Ankita house checkout: back link, centred masthead, form left, sticky order
   summary right (an accordion below lg). Razorpay opens as a sheet over this
   page; its handler only navigates. Purchase belongs to the webhook. */

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ArrowLeft,
  CaretDown,
  Check,
  CheckCircle,
  CreditCard,
  Lock,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';

import {
  ADDONS,
  ADDON_BY_ID,
  addonsTotalRupees,
  type AddonId,
} from '../_landing/addons';
import {
  BONUS_DELIVERY_NOTE,
  CTA_NOTE,
  DATES,
  LIST_PRICE,
  LIST_PRICE_RUPEES,
  PRICE,
  PRICE_RUPEES,
  PROMISE_NAME,
  PROMISE_TEXT,
  SESSION_TIME_TZ,
  WORKSHOP_NAME,
} from '../_landing/offer';
import PaymentLogos from '@/components/PaymentLogos';
import SiteFooter from '@/components/SiteFooter';
import { collectSignals } from '@/lib/client-signals';
import { trackAddToCart, trackBeginCheckout, trackInitiateCheckout } from '@/lib/track';

import { SeatCount } from '../_landing/seat-count';
import { C } from '../_landing/shared';
import { ThemedSelect } from './themed-select';
import { RECAP, VALUE_TOTAL, inr } from './included';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RZP_SDK = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RZP_SDK}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const el = document.createElement('script');
    el.src = RZP_SDK;
    el.async = true;
    el.onload = () => resolve(true);
    el.onerror = () => resolve(false);
    document.body.appendChild(el);
  });
}

/* ISO-2 travels with the dial code: Meta wants the country as a hashed ISO
   code, not a dial code. */
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

/* The values travel to the webhook and drive QualifiedLead; keep them stable. */
const OCCUPATIONS = [
  { value: 'working_professional', label: 'Working professional' },
  { value: 'homemaker', label: 'Homemaker' },
];

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  country: string;
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

  /* ── THE BASKET ────────────────────────────────────────────────────────
     A Set of add-on ids, empty by default: nothing is pre-ticked. A
     pre-selected upsell is a charge the buyer did not choose, and it is the
     single fastest way to earn a chargeback on a ₹99 funnel.

     DISPLAY ONLY. The ids are posted to create-order and the server prices
     them from its own table, so every number below is a preview of what the
     server will charge, never the input to it. */
  const [addons, setAddons] = useState<Set<AddonId>>(new Set());
  const addonIds = useMemo(
    /* Read in ADDONS order, not insertion order, so the summary lines and the
       product name always read the same way round. */
    () => ADDONS.map((a) => a.id).filter((id) => addons.has(id)),
    [addons],
  );
  const addonRupees = addonsTotalRupees(addonIds);
  const totalRupees = PRICE_RUPEES + addonRupees;

  const toggleAddon = (id: AddonId) =>
    setAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* The docked bar reserves its own measured height. It gains a line when an
     add-on is ticked, so any constant is right in one of four states and
     leaves the footer's legal text under the bar in the others.
     ResizeObserver rather than a resize listener: what changes is the BAR,
     not the window. */
  const dockRef = useRef<HTMLDivElement>(null);
  const [dockHeight, setDockHeight] = useState(0);
  useEffect(() => {
    const el = dockRef.current;
    if (!el) return;
    const measure = () => setDockHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Arrival: AddToCart + begin_checkout, ref-guarded against StrictMode's
     double effect. The only Meta event a direct arrival ever produces. */
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current) return;
    arrived.current = true;
    trackBeginCheckout();
    trackAddToCart();
  }, []);

  const v = useMemo(() => {
    const digits = f.phone.replace(/\D/g, '');
    return {
      firstName: f.firstName.trim().length > 1,
      lastName: f.lastName.trim().length > 0,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()),
      city: f.city.trim().length > 1,
      phone: f.country === 'in' ? digits.length === 10 : digits.length >= 7 && digits.length <= 12,
      occupation: f.occupation !== '',
    };
  }, [f]);
  const valid = v.firstName && v.lastName && v.email && v.city && v.phone && v.occupation;

  const dial = COUNTRIES.find((c) => c.iso === f.country)?.dial ?? '+91';
  const e164 = `${dial}${f.phone}`.replace(/\D/g, '');

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setFailed('');
    if (!valid) {
      // The sticky bar submits from below the form, so bring the errors into view.
      document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (busy) return;
    setBusy(true);

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
      const sdk = await loadRazorpay();
      if (!sdk) throw new Error('sdk');

      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: f.firstName.trim(),
          lastName: f.lastName.trim(),
          email: f.email.trim(),
          phone: e164,
          /* Sent separately: +1 and +91 share a leading 1, so the code cannot
             be recovered from e164 later. */
          dialCode: dial,
          city: f.city.trim(),
          country: f.country,
          occupation: f.occupation,
          /* IDS ONLY. No amount is ever sent from here — the server looks the
             prices up, which is why a tampered request can only ever swap
             between four fixed baskets. */
          addons: addonIds,
          ...collectSignals(),
        }),
      });
      const order = await res.json();

      if (!res.ok || !order?.ok) {
        setBusy(false);
        setFailed(
          order?.reason === 'not-configured'
            ? 'Payments are not switched on yet. Nothing has been charged.'
            : 'We could not start the payment. Please try again.',
        );
        return;
      }

      const rzp = new window.Razorpay!({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Dr. Peeyush Prabhat',
        /* The SERVER's product name, so the payment sheet describes the
           basket that was actually priced. Falls back to the workshop name if
           an older response has no such field. */
        description:
          typeof order.productName === 'string' && order.productName
            ? order.productName
            : WORKSHOP_NAME,
        prefill: {
          name: `${f.firstName.trim()} ${f.lastName.trim()}`.trim(),
          email: f.email.trim(),
          contact: `+${e164}`,
        },
        /* Razorpay otherwise substitutes a remembered customer's email and
           phone for our prefill, which once sent a buyer's invite to a
           stranger. Name stays editable: it is the cardholder's. */
        readonly: { email: true, contact: true },
        theme: { color: C.dark },
        modal: { ondismiss: () => setBusy(false) },
        handler: (r: { razorpay_payment_id: string }) => {
          /* One of four real routes — /thank-you, -recording, -private,
             -complete — chosen by the SERVER from the basket it priced, not
             built here from what the browser thinks it ticked. If the two
             ever disagree, the buyer sees the page matching what they were
             actually charged for.

             `?p=` is the payment id and is OPTIONAL on every one of those
             pages: it drives the GA4 purchase ping and the receipt line and
             nothing else, so the URLs stay shareable and testable by hand.

             None of this entitles anything. These pages are a receipt and a
             set of instructions; the webhook proves the sale and triggers
             fulfilment, so opening a route directly changes only what a
             stranger reads. */
          const path =
            typeof order.thankYouPath === 'string' && order.thankYouPath.startsWith('/')
              ? order.thankYouPath
              : '/thank-you';
          window.location.href = `${path}?p=${encodeURIComponent(r.razorpay_payment_id)}`;
        },
      });
      rzp.open();
    } catch {
      setBusy(false);
      setFailed('We could not start the payment. Please try again.');
    }
  };

  return (
    <main className="min-h-screen font-body" style={{ background: C.tint }}>
      <Header />

      <section className="py-8 md:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8">
          <div className="mb-8 text-center sm:mb-10 md:mb-12">
            <span
              className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[10.5px] font-bold uppercase tracking-[0.16em]"
              style={{ background: C.accent, color: C.onAccent }}
            >
              <CheckCircle weight="fill" className="h-3 w-3 shrink-0" />
              {WORKSHOP_NAME}
            </span>

            <h1
              className="mt-4 font-display text-[22px] font-extrabold leading-tight sm:text-[28px] md:text-[34px]"
              style={{ color: C.ink, textWrap: 'balance' } as React.CSSProperties}
            >
              Add your details to confirm your seat.
            </h1>
            <p className="mt-3 text-[13px] sm:text-[13.5px]" style={{ color: C.inkSoft }}>
              {DATES} · {SESSION_TIME_TZ} · Live, doctor-led
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(320px,380px)] lg:items-start lg:gap-10">
            <form
              id="checkout-form"
              onSubmit={startPayment}
              noValidate
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <p
                className="font-display text-[10.5px] font-bold uppercase tracking-[0.2em]"
                style={{ color: C.ink }}
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
                {/* The email and number are not just for reminders now: the
                    confirmation sent to them carries every group invite and,
                    for 1-on-1 buyers, the booking link that is deliberately
                    never posted in a group. Saying so here is also why
                    someone bothers to type a real address. */}
                Your confirmation, group invites and session reminders go to
                these. Bonuses are shared in the WhatsApp Community after Day 2.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {/* Separate fields so fn and ln hash cleanly; splitting a full
                    name on a space guesses wrong for two-word surnames. */}
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

                <label className="block">
                  <span
                    className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: C.inkSoft }}
                  >
                    WhatsApp number
                  </span>
                  <div className="flex gap-2">
                    {/* Narrower than the 124px the native select needed: the
                        button now shows just the dial code, so the width goes
                        back to the number field — the one actually typed in.
                        The open list still names the country. */}
                    <ThemedSelect
                      className="w-[96px] shrink-0"
                      buttonClassName="px-3"
                      ariaLabel="Country dialling code"
                      value={f.country}
                      onChange={(country) => setF((s) => ({ ...s, country }))}
                      options={COUNTRIES.map((c) => ({
                        value: c.iso,
                        label: c.label,
                        short: c.dial,
                      }))}
                    />
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
                        background: C.page,
                        color: C.ink,
                        border: `1px solid ${touched && !v.phone ? C.error : C.line}`,
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
                  {/* The "Select one" row is a PLACEHOLDER, not an option.
                      As a disabled <option> it still appeared in the native
                      list as a greyed, unpickable row; here it is the button's
                      empty-state label and never shows up as something to
                      choose. The two real answers are unchanged. */}
                  <ThemedSelect
                    placeholder="Select one"
                    value={f.occupation}
                    onChange={(occupation) => setF((s) => ({ ...s, occupation }))}
                    invalid={touched && !v.occupation}
                    options={OCCUPATIONS.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </label>
              </div>

              {/* ══ THE TWO ADD-ONS ═══════════════════════════════════════
                  Placed AFTER the form and BEFORE the pay button, which is
                  where the reference funnel puts them and where they work:
                  the buyer has already committed effort by filling the form,
                  and the next thing they look for is the button. An upsell
                  above the form is read as an obstacle; one below the button
                  is never seen at all. */}
              <div className="mt-7 space-y-3">
                {ADDONS.map((a, i) => (
                  <AddonCard
                    key={a.id}
                    addon={a}
                    on={addons.has(a.id)}
                    onToggle={() => toggleAddon(a.id)}
                    second={i === 1}
                  />
                ))}
              </div>

              {touched && !valid && (
                <p className="mt-4 text-[12.5px]" style={{ color: C.error }}>
                  Please add your name, a working email and a valid number.
                </p>
              )}
              {failed && (
                <p className="mt-4 text-[12.5px]" style={{ color: C.error }}>
                  {failed}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="cta-pill mt-7 inline-flex min-h-[58px] w-full items-center justify-center px-6 font-display text-[16px] font-bold disabled:opacity-60"
              >
                <span>
                  {busy ? (
                    'Taking you to payment…'
                  ) : (
                    <>
                      Pay{' '}
                      {/* The struck list price is dropped once an add-on is
                          ticked. It anchors the SEAT against ₹521; beside a
                          total that now includes a ₹1,500 session it would
                          read as a discount on the whole basket, which it is
                          not. */}
                      {LIST_PRICE && !addonIds.length && (
                        <s className="mr-1 font-semibold opacity-70 decoration-2">{LIST_PRICE}</s>
                      )}
                      {inr(totalRupees)} &amp; Book My Seat
                    </>
                  )}
                </span>
              </button>

              <p
                className="mt-3 text-center text-[12.5px] font-semibold leading-snug"
                style={{ color: C.ink }}
              >
                <ShieldCheck weight="fill" aria-hidden className="pp-promise-icon" style={{ color: C.accent }} />
                {CTA_NOTE}
              </p>

              <p
                className="mt-3 text-center font-display text-[15px] font-bold leading-snug sm:text-[16px]"
                style={{ color: C.heading }}
              >
                Last{' '}
                <span className="seat-chip">
                  <SeatCount />
                </span>{' '}
                Seats Left - Booking Closes Once Full
              </p>

              <div
                className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10.5px] sm:text-[11px]"
                style={{ color: C.inkSoft }}
              >
                <span className="inline-flex items-center gap-1 whitespace-nowrap sm:gap-1.5">
                  <Lock weight="fill" className="h-3 w-3 shrink-0" style={{ color: C.ink }} />
                  Razorpay Secured
                </span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">SSL Encrypted</span>
                <span aria-hidden="true">·</span>
                <Link href="/refund-policy" className="whitespace-nowrap underline">
                  {PROMISE_NAME}
                </Link>
              </div>

              <p className="mt-5 text-center text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
                Your personal data will be used to process your order, support
                your experience, and for other purposes described in our{' '}
                <Link href="/privacy-policy" className="font-semibold underline" style={{ color: C.ink }}>
                  privacy policy
                </Link>
                .
              </p>

              <PaymentMethods />
            </form>

            {/* Phones see what they are paying for before the form. */}
            <div className="order-first lg:order-none lg:sticky lg:top-8">
              <OrderSummary addonIds={addonIds} totalRupees={totalRupees} />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* ══ PHONES: the docked bar, and the room reserved for it ═════════
          The spacer height is MEASURED, not guessed. The bar grows by a line
          when an add-on is ticked (it names what was added), so a hardcoded
          height is correct only in one of four states and the footer's legal
          text ends up under the bar in the other three. */}
      <div aria-hidden className="lg:hidden" style={{ height: dockHeight }} />
      <div
        ref={dockRef}
        className="pp-dock fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{
          background: C.surface,
          borderTop: `1px solid ${C.line}`,
          boxShadow: '0 -6px 24px rgba(6, 20, 28, 0.14)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <p
          className="px-4 pt-2.5 text-center font-display text-[13px] font-bold leading-snug"
          style={{ color: C.heading }}
        >
          Last{' '}
          <span className="seat-chip">
            <SeatCount />
          </span>{' '}
          Seats Left - Booking Closes Once Full
        </p>

        {/* ══ THE ADD-ONS, IN THE DOCK ═══════════════════════════════════
            The same two controls as the full cards, bound to the same state,
            so ticking either surface moves the other. They live here because
            on a phone the cards sit below six form fields — the upsell was
            only ever seen by someone who scrolled past the thing they came
            to do.

            These REPLACE the "Seat ₹1 + Recordings ₹500" breakdown line that
            used to sit here. The rows now say what was added and what each
            costs, so the line was the same information twice in a bar whose
            every row costs the buyer screen. */}
        <div className="mx-auto mt-2 max-w-6xl space-y-1.5 px-4">
          {ADDONS.map((a, i) => (
            <AddonMiniRow
              key={a.id}
              addon={a}
              on={addons.has(a.id)}
              onToggle={() => toggleAddon(a.id)}
              second={i === 1}
            />
          ))}
        </div>

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-3 pt-2">
          <div className="shrink-0">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: C.inkSoft }}>
              Total
            </p>
            {/* `key` on the total so the flash animation re-runs on every new
                value. This is the one thing that SHOULD re-animate per tick:
                it is the feedback that the tick registered. */}
            <p
              key={totalRupees}
              className="pp-total-flash font-display text-[20px] font-extrabold leading-tight tabular-nums"
              style={{ color: C.ink }}
            >
              {inr(totalRupees)}
            </p>
            {LIST_PRICE && !addonIds.length && (
              <s className="block text-[12px] font-semibold leading-none decoration-2" style={{ color: C.inkSoft }}>
                {LIST_PRICE}
              </s>
            )}
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={busy}
            className="cta-pill inline-flex min-h-[56px] flex-1 items-center justify-center px-3 text-center font-display text-[15px] font-bold leading-tight disabled:opacity-60"
          >
            {busy ? 'Opening…' : 'Book My Seat Now - 81% Off'}
          </button>
        </div>
      </div>
    </main>
  );
}

/* ══ One add-on ═════════════════════════════════════════════════════════
   A real <input type="checkbox"> inside a <label>, not a div with onClick.
   That is not pedantry: it gives space-to-toggle, a single tab stop, native
   announcement of the checked state, and it keeps working if the JS that
   styles it fails. The input is visually hidden so the whole card is the hit
   area; the drawn box in `.pp-addon-box` is what the eye reads. ────────── */
function AddonCard({
  addon,
  on,
  onToggle,
  second,
}: {
  addon: (typeof ADDONS)[number];
  on: boolean;
  onToggle: () => void;
  second: boolean;
}) {
  return (
    <label
      className={`pp-addon ${second ? 'pp-addon--b' : ''}`}
      data-on={on ? 'true' : 'false'}
    >
      <input
        type="checkbox"
        checked={on}
        onChange={onToggle}
        className="absolute h-px w-px opacity-0"
        style={{ clipPath: 'inset(50%)' }}
      />

      <span className="flex items-start gap-3">
        <span className="pp-addon-box" aria-hidden>
          <Check weight="bold" className="h-3.5 w-3.5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`pp-addon-flag ${second ? '' : 'pp-addon-flag--accent'}`}>
              <span className="pp-addon-dot" aria-hidden />
              {addon.flag}
            </span>
            <span className="pp-addon-delta ml-auto text-[14px]">
              + {inr(addon.rupees)}
            </span>
          </span>

          <span
            className="mt-2 block font-display text-[14.5px] font-extrabold leading-snug sm:text-[15.5px]"
            style={{ color: C.ink }}
          >
            {addon.title}
          </span>
          <span className="mt-1 block text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {addon.blurb}
          </span>

          <span className="mt-2.5 block space-y-1.5">
            {addon.bullets.map((b) => (
              <span key={b} className="flex gap-2 text-[12.5px] leading-snug">
                <CheckCircle
                  weight="fill"
                  className="mt-[2px] h-3.5 w-3.5 shrink-0"
                  style={{ color: C.accent }}
                />
                <span style={{ color: C.inkSoft }}>{b}</span>
              </span>
            ))}
          </span>

          {/* Both strings render; opacity swaps them. Mounting them
              conditionally would change the card's height on tick and shift
              the card below it under the user's thumb mid-tap. */}
          <span
            className="pp-addon-swap mt-3 font-display text-[12px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.accent }}
          >
            <span>👉 Tap to add for {inr(addon.rupees)} more</span>
            <span style={{ color: '#047857' }}>✓ Added · {inr(addon.rupees)}. Tap to remove</span>
          </span>
        </span>
      </span>
    </label>
  );
}

/* ══ One add-on, compact, for the docked bar ════════════════════════════
   A SECOND control for the same state, not a second piece of state. Ticking
   here moves the full card and vice versa, because both read and write the
   one `addons` Set on the page.

   It carries its own `aria-label` rather than inheriting the card's wording:
   a screen reader now meets two checkboxes for the same thing, and two
   controls reading "Workshop recordings, Day 1 + Day 2" with no way to tell
   them apart is worse than one. The label here names the action and the
   price, which is what this row actually offers. ────────────────────────── */
function AddonMiniRow({
  addon,
  on,
  onToggle,
  second,
}: {
  addon: (typeof ADDONS)[number];
  on: boolean;
  onToggle: () => void;
  second: boolean;
}) {
  return (
    <label
      className={`pp-addon-mini ${second ? 'pp-addon-mini--b' : ''}`}
      data-on={on ? 'true' : 'false'}
    >
      <input
        type="checkbox"
        checked={on}
        onChange={onToggle}
        aria-label={`${addon.miniLabel} for ${inr(addon.rupees)}`}
        className="absolute h-px w-px opacity-0"
        style={{ clipPath: 'inset(50%)' }}
      />

      <span className="pp-addon-box pp-addon-box--sm" aria-hidden>
        <Check weight="bold" className="h-3 w-3" />
      </span>

      <span
        className={`pp-addon-flag pp-addon-flag--sm ${second ? '' : 'pp-addon-flag--accent'}`}
        aria-hidden
      >
        <span className="pp-addon-dot" />
        {addon.flag}
      </span>

      {/* `min-w-0` + `truncate` on the label, and `shrink-0` on the price:
          when the row runs out of room at 320px it is the sentence that
          shortens, never the number. */}
      <span
        className="min-w-0 flex-1 truncate text-[12px] font-semibold"
        style={{ color: C.ink }}
      >
        {addon.miniLabel}
      </span>
      <span className="pp-addon-delta shrink-0 text-[12.5px]">
        + {inr(addon.rupees)}
      </span>
    </label>
  );
}

function Header() {
  return (
    <header className="px-4 py-4 sm:px-6" style={{ background: C.dark, color: C.onDark }}>
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

function OrderSummary({
  addonIds,
  totalRupees,
}: {
  addonIds: AddonId[];
  totalRupees: number;
}) {
  const [open, setOpen] = useState(false);

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
            className="block font-display text-[10.5px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.ink }}
          >
            Order summary
          </span>
          <span
            className="mt-2 block font-display text-[20px] font-extrabold leading-snug sm:text-[22px]"
            style={{ color: C.ink }}
          >
            Your workshop, in full
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

      <div
        className="mt-5 flex items-start gap-3 rounded-2xl p-3"
        style={{ background: C.tint, border: `1px solid ${C.line}` }}
      >
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14"
          style={{ background: C.dark }}
        >
          <span
            className="font-display text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.accent }}
          >
            Live
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold leading-snug sm:text-[14px]" style={{ color: C.ink }}>
            {WORKSHOP_NAME}
          </p>
          <p className="mt-0.5 text-[11px] sm:text-[11.5px]" style={{ color: C.inkSoft }}>
            {DATES} · {SESSION_TIME_TZ}
          </p>
        </div>
        <div
          className="shrink-0 text-right font-display text-[14px] font-extrabold tabular-nums sm:text-[15px]"
          style={{ color: C.ink }}
        >
          {LIST_PRICE && (
            <s
              className="block text-[11.5px] font-semibold decoration-2"
              style={{ color: C.inkSoft, textDecorationColor: C.error }}
            >
              {LIST_PRICE}
            </s>
          )}
          {PRICE}
        </div>
      </div>

      {/* Each ticked add-on as its own line item, mirroring the seat row
          above it. Outside the collapsible details on purpose: on a phone the
          summary is closed by default, and an add-on the buyer cannot see
          they are being charged for is the line that gets disputed. */}
      {addonIds.map((id) => (
        <div
          key={id}
          className="mt-3 flex items-start gap-3 rounded-2xl p-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: `1px solid ${C.accent}` }}
        >
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14"
            style={{ background: C.accent }}
          >
            <Check weight="bold" className="h-5 w-5" style={{ color: C.onAccent }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold leading-snug sm:text-[14px]" style={{ color: C.ink }}>
              {ADDON_BY_ID[id].title}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-[11.5px]" style={{ color: C.inkSoft }}>
              Added to your order
            </p>
          </div>
          <div
            className="shrink-0 text-right font-display text-[14px] font-extrabold tabular-nums sm:text-[15px]"
            style={{ color: C.ink }}
          >
            {inr(ADDON_BY_ID[id].rupees)}
          </div>
        </div>
      ))}

      <div id="order-summary-details" className={`${open ? 'block' : 'hidden'} lg:block`}>
        <div className="mt-4 space-y-1.5">
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.inkSoft }}
          >
            Free bonuses included
          </p>
          <ul className="space-y-1.5 text-[12px] sm:text-[12.5px]" style={{ color: C.inkSoft }}>
            {RECAP.map((r) => (
              <li key={r.title} className="flex items-start gap-2">
                <CheckCircle
                  weight="fill"
                  className="mt-[3px] h-3.5 w-3.5 shrink-0"
                  style={{ color: C.accent }}
                />
                <span className="flex-1 leading-snug">{r.title}</span>
                <span className="shrink-0 font-medium tabular-nums">{inr(r.value)}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11.5px] leading-snug" style={{ color: C.inkSoft }}>
            {BONUS_DELIVERY_NOTE}
          </p>
        </div>

        <div className="my-5 h-px" style={{ background: C.line }} />

        <div className="space-y-2 text-[13.5px]">
          {LIST_PRICE_RUPEES ? (
            <>
              <div className="flex justify-between" style={{ color: C.inkSoft }}>
                <span>Regular price</span>
                <span className="tabular-nums">{inr(LIST_PRICE_RUPEES)}</span>
              </div>
              <div className="flex justify-between font-semibold" style={{ color: C.ink }}>
                <span>Today&apos;s discount</span>
                <span className="tabular-nums">−{inr(LIST_PRICE_RUPEES - PRICE_RUPEES)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between" style={{ color: C.inkSoft }}>
              <span>Subtotal</span>
              <span className="tabular-nums">{inr(PRICE_RUPEES)}</span>
            </div>
          )}
          <div className="flex justify-between" style={{ color: C.inkSoft }}>
            <span>Total bonus value</span>
            <s
              className="decoration-[2.5px] underline-offset-2 tabular-nums"
              style={{ color: C.inkSoft, textDecorationColor: C.error }}
            >
              {inr(VALUE_TOTAL)}
            </s>
          </div>

          {/* The add-ons again, as money rather than as objects. The rows
              above say what was added; these say what it costs, in the column
              the eye is already scanning for numbers. */}
          {addonIds.map((id) => (
            <div key={id} className="flex justify-between font-semibold" style={{ color: C.ink }}>
              <span className="truncate pr-3">{ADDON_BY_ID[id].shortName}</span>
              <span className="tabular-nums">+{inr(ADDON_BY_ID[id].rupees)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="my-4 h-px" style={{ background: C.line }} />

      <div
        className="flex items-baseline justify-between gap-3 rounded-2xl px-4 py-3.5"
        style={{ background: C.dark }}
      >
        <span
          className="font-display text-[13px] font-bold uppercase tracking-[0.12em] sm:text-[14px] sm:tracking-[0.14em]"
          style={{ color: C.onDark }}
        >
          Total
        </span>
        <div
          key={totalRupees}
          className="pp-total-flash text-right font-display text-[26px] font-extrabold leading-none tabular-nums sm:text-[32px]"
          style={{ color: C.accent }}
        >
          {/* Anchor dropped once an add-on is ticked: ₹521 is the SEAT's list
              price, and beside a basket total it would claim a discount on
              the add-ons that does not exist. */}
          {LIST_PRICE && !addonIds.length && (
            <s
              className="mr-2 text-[15px] font-semibold decoration-2 sm:text-[17px]"
              style={{ color: C.onDarkMute }}
            >
              {LIST_PRICE}
            </s>
          )}
          {inr(totalRupees)}
        </div>
      </div>

      <div
        className="mt-5 flex items-start gap-3 rounded-2xl p-3"
        style={{ background: C.tint, border: `1px solid ${C.line}` }}
      >
        <CreditCard weight="duotone" className="h-5 w-5 shrink-0" style={{ color: C.ink }} />
        <div className="text-[12.5px]">
          <p className="font-semibold" style={{ color: C.ink }}>
            UPI · Cards · NetBanking
          </p>
          <p className="mt-0.5" style={{ color: C.inkSoft }}>
            Pay securely via Razorpay.
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-[12px] leading-snug" style={{ color: C.inkSoft }}>
        <ShieldCheck weight="fill" aria-hidden className="pp-promise-icon" style={{ color: C.accent }} />
        <strong style={{ color: C.ink }}>{PROMISE_NAME}:</strong> {PROMISE_TEXT}
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
  bad,
}: {
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  bad: boolean;
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
        style={{ background: C.page, color: C.ink, border: `1px solid ${bad ? C.error : C.line}` }}
      />
    </label>
  );
}

function PaymentMethods() {
  return (
    <div
      className="mt-6 rounded-2xl p-4"
      style={{ background: C.tint, border: `1px solid ${C.line}` }}
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

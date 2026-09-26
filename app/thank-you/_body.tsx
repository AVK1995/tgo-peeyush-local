'use client';

/**
 * THE SHARED THANK-YOU BODY, used by both confirmation pages.
 *
 * There are two now (26 Sep 2026, the OTO step): `/thank-you` for the standard
 * pass and `/thank-you/vip` for the upgrade. They are DELIBERATELY the same
 * page with one branch rather than two files — everything after the hero is
 * identical, and the whole point of this page is the WhatsApp join. Two copies
 * would drift, and the copy that drifts is the one nobody re-reads.
 *
 * So the routes are thin wrappers that pass a `tier`, and the ONLY thing that
 * branches is the hero: the VIP pass gets its three entitlements set out in a
 * highlighted block, because a buyer who just paid double needs to see what
 * the extra bought before they are asked to go and join a group.
 *
 * ⚠️ NEITHER PAGE PROVES ANYTHING. A buyer can open /thank-you/vip directly,
 * and the `?p=` payment id is not verified here. That is by design and is
 * already true of the single page this replaced: the webhook is what proves a
 * sale and what triggers fulfilment. This page is a receipt and a set of
 * instructions, so the worst a forged visit gets is a page telling them to
 * join a WhatsApp group. Nothing is entitled by reaching it.
 *
 * Copy and section order follow the ankita-postpartum thank-you page, which is
 * the house standard: confirmation → the WhatsApp join as the ONE next step →
 * what arrives inside → be early → the policy → prep. Skinned to this
 * project's tokens.
 *
 * The page is built around the community join, not around the receipt. That is
 * the point of the design: the Zoom links live in the group, so a buyer who
 * never joins is a refund waiting to happen. Everything else on the page is
 * subordinate to that one button.
 *
 * Wording is adapted only where ankita's is factually about a different
 * product: physiotherapist becomes doctor-led (Dr. Peeyush is an MBBS doctor
 * and his own copy says "doctor-led" throughout), and postpartum recovery
 * becomes the reset. The structure is unchanged.
 *
 * ⚠️ Two inherited promises were CORRECTED rather than carried, and both are
 * noted at the constant they belong to: the "no refunds for missed live
 * sessions" policy line (gone, it contradicted his money-back guarantee) and
 * the "Day One guarantee" wording under the policy block (gone, it was the
 * previous client's refund window). Everything on this page that is not from
 * COPY-SOURCE.md is flagged where it stands, because COPY-SOURCE.md carries
 * no thank-you page at all.
 */

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  ArrowRight,
  CalendarBlank,
  ChatCircleDots,
  Check,
  CheckCircle,
  Clock,
  Confetti,
  Heart,
  Megaphone,
  Notebook,
  Person,
  ShieldCheck,
  Sparkle,
  Warning,
  WhatsappLogo,
  X,
} from '@phosphor-icons/react/dist/ssr';

import { LEGAL } from '../_landing/legal';
import {
  SESSION_TIMES_TZ,
  START_DATE,
  WHATSAPP_INVITE,
  inr,
  type Tier,
} from '../_landing/offer';
import SiteFooter from '@/components/SiteFooter';
import { C } from '../_landing/shared';
import { trackPurchase } from '@/lib/track';

/* WhatsApp's own brand colours. These deliberately do NOT come from the page
   palette: the community button is the same green on every funnel we ship, so
   a buyer recognises what it opens before reading the label. */
const WA = { green: '#25D366', deep: '#128C7E' } as const;

/* Semantic, not brand: green means good and amber means caution on every page
   we ship. The HUE is fixed; the STEP is not. These are the steps that read on
   the LIGHT ground this page sits on: his bright 500s (#10B981, #F59E0B) are
   2.5:1 and 2.0:1 here, and are only legal inside a dark object. The amber is
   the 700 rather than the 600, because it is small text on the #FEF3C7 chip
   below (5.3:1) rather than on the page. */
const GOOD_GREEN = '#059669';
const WARN_AMBER = '#B45309';

const COMMUNITY_BENEFITS: { icon: typeof CheckCircle; text: string }[] = [
  { icon: ChatCircleDots, text: 'Daily Zoom session links' },
  { icon: Megaphone, text: 'Session reminders before class' },
  { icon: Notebook, text: 'Instructions for each day' },
  { icon: Heart, text: 'Support during the 5-day reset' },
  { icon: Person, text: 'Important updates from Dr. Peeyush' },
];

/* ⚠️ HOUSE STANDARD, NOT THIS CLIENT'S COPY. COPY-SOURCE.md carries no
   thank-you page at all, so these two lists are the ankita/Kaizen originals.
   They are plausible for a dated live challenge and they are unconfirmed.
   Have Dr. Peeyush read both before launch.

   One line was REMOVED here rather than carried over: "No refunds for missed
   live sessions". It is not his copy, and it flatly contradicts his own sales
   page, which promises a "100% Money-Back Guarantee" four times. A buyer who
   reads the promise, pays, and then reads the contradiction on the very next
   screen has a dispute the merchant loses. Whatever refund window comes back
   from the client belongs in app/refund-policy/page.tsx first; if a
   missed-session exclusion is part of it, restate it here in his words. */
const POLICY_ITEMS = [
  'No rescheduling to future batches',
  'Recordings are not guaranteed',
];

/* ⚠️ ALSO HOUSE STANDARD, NOT THIS CLIENT'S COPY, and also wants his read.
   "Keep a yoga mat or soft surface ready" was carried in with the scaffold and
   was REMOVED this pass rather than left flagged, because it contradicted two
   things on this funnel at once: the line at the bottom of this very section
   that says no equipment is required, and the sales page's own promise of
   results "without endless yoga, gym workouts, medicines or expensive
   treatments". If his sessions do need a mat or a floor, he says so and it
   goes back in here AND the "no equipment required" line comes out. */
const PREP_ITEMS = [
  'Wear comfortable clothes',
  'Be in a distraction-free space',
  'Join the community immediately',
];

export default function ThankYouBody({ tier }: { tier: Tier }) {
  return (
    <Suspense fallback={null}>
      <ThankYou tier={tier} />
    </Suspense>
  );
}

function ThankYou({ tier }: { tier: Tier }) {
  const paymentId = useSearchParams().get('p') ?? '';
  const isVip = tier.id === 'vip';

  /* GA4 purchase only. Meta's Purchase and the server-side GA4 copy both come
     from the Razorpay webhook, where the payment is proven and where buyers
     who never return to this page are still counted, which for UPI is most of
     them.

     `p` is the razorpay_payment_id, put there by the checkout page's success
     handler. It is the same string the webhook uses as the Meta event_id and
     the GA4 transaction_id, so the two sources of this sale collapse into one
     wherever they meet. */
  useEffect(() => {
    if (paymentId) trackPurchase(paymentId);
  }, [paymentId]);

  return (
    <main style={{ background: C.canvasAlt }}>
      {/* ── Confirmation ─────────────────────────────────────────────── */}
      <section className="px-5 pb-14 pt-12 text-center md:pb-20 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <span
            className="mx-auto grid h-20 w-20 place-items-center rounded-full"
            style={{ background: C.goldWash, border: `1px solid ${C.lineStrong}` }}
          >
            <Confetti weight="duotone" className="h-10 w-10" style={{ color: C.goldInk }} />
          </span>

          {/* The VIP pill is the FIRST thing that differs, and it is
              deliberately louder than the standard one: filled ink rather than
              a tint, so the upgrade is acknowledged before the headline is
              read rather than mentioned somewhere further down. */}
          <span
            className="mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={
              isVip
                ? { background: C.ink, color: C.canvas }
                : { background: C.goldWash, color: C.goldInk }
            }
          >
            <Check weight="bold" className="h-3 w-3" />
            {isVip ? 'VIP Access Confirmed' : 'Congrats!'}
          </span>

          <h1
            className="mt-5 font-display text-[30px] font-extrabold leading-[1.05] tracking-tight sm:text-[44px] lg:text-[52px]"
            style={{ color: C.ink, textWrap: 'balance' } as React.CSSProperties}
          >
            Your 5-Day Complete Health Reset is{' '}
            <span style={{ color: C.goldDeep }}>Confirmed.</span>
          </h1>

          <p
            className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed sm:text-[17px]"
            style={{ color: C.inkSoft }}
          >
            You are officially enrolled in the{' '}
            <strong style={{ color: C.ink }}>{tier.name}.</strong> Please read
            this page carefully, your access depends on the next step.
          </p>

          {/* ══ THE UPGRADE, SET OUT ═══════════════════════════════════════
              VIP only, and placed HERE — above the date cards and above the
              WhatsApp step — because it is the thing the buyer paid extra for
              and the thing they will look for first. Anywhere lower and it
              reads as a footnote to a purchase they are already doubting.

              Ink-filled rather than another pale tint: every other block on
              this page is paper on canvas, so the one card that is inverted is
              unmissable without needing a second accent colour introduced to
              the palette. */}
          {isVip ? (
            <div
              className="mx-auto mt-8 max-w-xl overflow-hidden rounded-3xl p-6 text-left sm:p-7"
              style={{
                background: `linear-gradient(140deg, ${C.ink}, ${C.navyDeep})`,
                boxShadow: '0 28px 60px -34px rgba(14,39,51,0.6)',
              }}
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ background: 'rgba(6,182,212,0.18)', color: C.goldMid }}
              >
                <Sparkle weight="fill" className="h-3 w-3" />
                Your VIP access
              </span>

              <p
                className="mt-4 font-display text-[19px] font-extrabold leading-tight sm:text-[22px]"
                style={{ color: C.onDark }}
              >
                Everything in the challenge, plus the three things you upgraded
                for.
              </p>

              <ul className="mt-5 space-y-3.5">
                {tier.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                      style={{ background: C.goldMid }}
                    >
                      <Check weight="bold" className="h-3 w-3" style={{ color: C.navyDeep }} />
                    </span>
                    <span
                      className="text-[14.5px] font-medium leading-snug"
                      style={{ color: C.onDark }}
                    >
                      {b}
                    </span>
                  </li>
                ))}
              </ul>

              <p
                className="mt-5 border-t pt-4 text-[12.5px] leading-relaxed"
                style={{ borderColor: 'rgba(242,250,252,0.18)', color: C.onDarkMute }}
              >
                Your replay library is sent to the same WhatsApp community
                below, so joining it is how the recordings reach you.
              </p>
            </div>
          ) : null}

          <div className="mx-auto mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            <DetailCard icon={CalendarBlank} label="Challenge date" value={START_DATE} />
            <DetailCard
              icon={Clock}
              label="Live session timings"
              value={SESSION_TIMES_TZ}
              footnote="Choose the batch that fits"
            />
          </div>

          {paymentId && (
            <p
              className="mt-6 text-[11.5px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.inkSoft }}
            >
              Payment ID {paymentId} · {inr(tier.rupees)} paid
            </p>
          )}
        </div>
      </section>

      {/* ── The one next step ────────────────────────────────────────── */}
      <section className="px-5 pb-4 md:px-8">
        <div
          className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-8 text-center text-white md:p-10"
          style={{ background: `linear-gradient(135deg, ${WA.deep}, ${WA.green})` }}
        >
          <span
            aria-hidden
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 2px, transparent 2px 22px)',
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em]">
              <Warning weight="fill" className="h-3 w-3" />
              Important · Step 1 of 1
            </span>

            <h2 className="mt-4 font-display text-[24px] font-extrabold leading-tight sm:text-[34px]">
              Join the WhatsApp Community now.
            </h2>

            <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-white/90">
              All updates, Zoom links, reminders and daily instructions will be
              shared inside the WhatsApp Community.{' '}
              <strong className="text-white">
                Your access to the challenge depends on joining this group.
              </strong>
            </p>

            {/* THE CTA ALWAYS RENDERS. This card IS a CTA: the challenge
                blueprint's community card is the one post-purchase action, and
                a version of it with the button swapped out is not a quieter
                card, it is a different component that asks the buyer for
                nothing.

                It used to render a line saying the invite was on its way by
                email whenever the link was missing, which is worse than a
                missing button on two counts: it changed the promise on a
                post-purchase page, and nobody has built that email. So the
                button stands in both states and the MISSING case is made loud
                for us instead of quiet for the buyer. */}
            <a
              href={WHATSAPP_INVITE || undefined}
              target={WHATSAPP_INVITE ? '_blank' : undefined}
              rel={WHATSAPP_INVITE ? 'noopener noreferrer' : undefined}
              aria-disabled={WHATSAPP_INVITE ? undefined : true}
              className={`group mt-7 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-display text-[15px] font-extrabold ${
                WHATSAPP_INVITE ? '' : 'cursor-not-allowed opacity-70'
              }`}
              style={{ color: WA.deep }}
            >
              <WhatsappLogo weight="fill" className="h-5 w-5" />
              Join the Community Here
              <ArrowRight
                weight="bold"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </a>

            {WHATSAPP_INVITE ? (
              <p className="mt-4 text-[11.5px] text-white/80">
                Opens in WhatsApp · 1-click join
              </p>
            ) : (
              /* Actionable and true, rather than a promise of automation that
                 does not exist. The address is the monitored inbox from
                 legal.ts, so it moves with the client's real support address. */
              <p className="mt-4 text-[12px] font-semibold text-white/90">
                Having trouble joining? Write to {LEGAL.email} and we will send
                your invite.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── What arrives inside ──────────────────────────────────────── */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionEyebrow text="What you'll receive inside" />
            <h2
              className="mt-3 font-display text-[24px] font-extrabold leading-tight sm:text-[32px]"
              style={{ color: C.ink }}
            >
              What you&rsquo;ll receive in the{' '}
              <span style={{ color: C.goldDeep }}>community.</span>
            </h2>
          </div>

          <ul className="mt-10 space-y-3">
            {COMMUNITY_BENEFITS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-4 rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                  style={{ background: C.goldPale }}
                >
                  <Icon weight="duotone" className="h-5 w-5" style={{ color: C.goldInk }} />
                </span>
                <span className="text-[14.5px] font-medium" style={{ color: C.inkSoft }}>
                  {text}
                </span>
                <CheckCircle
                  weight="fill"
                  className="ml-auto h-5 w-5 shrink-0"
                  style={{ color: GOOD_GREEN }}
                />
              </li>
            ))}
          </ul>

          <p
            className="mt-6 rounded-xl p-4 text-center text-[13.5px] font-medium"
            style={{ background: '#FEF3C7', color: WARN_AMBER, border: '1px solid #FDE68A' }}
          >
            <Warning weight="fill" className="mr-1.5 inline-block h-4 w-4 align-text-bottom" />
            Please do <strong>not mute</strong> or{' '}
            <strong>exit the community</strong> during these <strong>5 days</strong>.
          </p>
        </div>
      </section>

      {/* ── Be available 5 min before ────────────────────────────────── */}
      <section className="px-5 pb-4 md:px-8">
        <div
          className="mx-auto max-w-3xl rounded-3xl p-7 md:p-9"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-start gap-4">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
              style={{ background: C.goldPale, border: `1px solid ${C.line}` }}
            >
              <Clock weight="duotone" className="h-6 w-6" style={{ color: C.goldInk }} />
            </span>
            <div className="min-w-0">
              <h3
                className="font-display text-[18px] font-extrabold leading-snug sm:text-[20px]"
                style={{ color: C.ink }}
              >
                Please be available{' '}
                <span style={{ color: C.goldDeep }}>5 minutes before</span> each
                live session.
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                These are <strong>live, doctor-led sessions</strong>. Arriving
                late may result in missing important instructions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Important policy ─────────────────────────────────────────── */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionEyebrow text="Please note" />
            <h2
              className="mt-3 font-display text-[24px] font-extrabold leading-tight sm:text-[32px]"
              style={{ color: C.ink }}
            >
              Important <span style={{ color: C.goldDeep }}>policy.</span>
            </h2>
            <p className="mt-3 text-[14.5px]" style={{ color: C.inkSoft }}>
              Because this is a live, structured experience:
            </p>
          </div>

          {/* Column count tracks POLICY_ITEMS.length by hand, because Tailwind
              cannot build a class from a variable. Two items now that the
              refund line is gone; put this back to sm:grid-cols-3 if a third
              is restored. */}
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {POLICY_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl p-5 text-center"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <X weight="bold" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.coralInk }} />
                <span
                  className="text-[13.5px] font-semibold leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div
            className="mt-8 rounded-2xl p-5 text-center"
            style={{ background: C.canvasAlt, border: `1px solid ${C.line}` }}
          >
            <p className="font-display text-[15px] font-extrabold" style={{ color: C.ink }}>
              Your spot has been reserved exclusively for you.
            </p>
            {/* This read "covers the Day One guarantee in full" until this
                pass, which was the PREVIOUS funnel's refund window inherited
                with the scaffold. Dr. Peeyush has never offered a Day One
                guarantee: his own copy promises a "100% Money-Back Guarantee",
                four times, with no terms stated anywhere. The link now names
                his six words and nothing else. The refund page behind the link
                now states the promise and the process and deliberately states
                no window or exclusions, because none were ever supplied. */}
            <p className="mt-1.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              (The 100% Money-Back Guarantee you joined with is set out in our{' '}
              <Link href="/refund-policy" className="underline" style={{ color: C.goldInk }}>
                refund policy
              </Link>
              .)
            </p>
          </div>
        </div>
      </section>

      {/* ── Prep checklist ───────────────────────────────────────────── */}
      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionEyebrow text="Quick prep" />
            <h2
              className="mt-3 font-display text-[24px] font-extrabold leading-tight sm:text-[32px]"
              style={{ color: C.ink }}
            >
              What to do <span style={{ color: C.goldDeep }}>before the call.</span>
            </h2>
            <p className="mt-3 text-[14.5px]" style={{ color: C.inkSoft }}>
              To get maximum results, please:
            </p>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PREP_ITEMS.map((item, i) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-[11.5px] font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${C.goldMid}, ${C.goldDeep})`,
                    color: C.onAccent,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-[14px] font-medium leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-[13.5px]" style={{ color: C.inkSoft }}>
            <ShieldCheck
              weight="fill"
              className="mr-1.5 inline-block h-4 w-4 align-text-bottom"
              style={{ color: C.goldInk }}
            />
            <strong style={{ color: C.ink }}>No equipment required.</strong> No
            prior fitness level required.
          </p>
        </div>
      </section>

      {/* ── Final nudge ──────────────────────────────────────────────── */}
      {/* Ankita's version is near-black with a pink bloom. The equivalent dark
          stage in THIS project is the brand navy, which is what every dark
          section on the landing page uses, so a black band here would read as
          a different site. The bloom follows: brand gold, not gold on black. */}
      <section
        className="relative isolate overflow-hidden px-5 py-16 md:px-8 md:py-20"
        style={{ background: C.navyDeep }}
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background: `radial-gradient(ellipse at top, rgba(6,182,212,0.22) 0%, transparent 62%)`,
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-display text-[26px] font-extrabold leading-tight sm:text-[36px]"
            style={{ color: C.onDark }}
          >
            This is your <span style={{ color: C.gold }}>first step</span>
            <br className="hidden sm:block" /> toward feeling like yourself
            again.
          </h2>
          <p className="mt-4 text-[14.5px]" style={{ color: C.onDarkMute }}>
            Now, join the community and we&rsquo;ll see you inside.
          </p>

          {/* Same rule as the card above: the closing band asks for the action
              in both states rather than ending the page on a paragraph. */}
          <div className="mt-8">
            <a
              href={WHATSAPP_INVITE || undefined}
              target={WHATSAPP_INVITE ? '_blank' : undefined}
              rel={WHATSAPP_INVITE ? 'noopener noreferrer' : undefined}
              aria-disabled={WHATSAPP_INVITE ? undefined : true}
              className={`group inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-display text-[15px] font-extrabold shadow-2xl transition-transform duration-200 sm:w-auto sm:text-[16px] ${
                WHATSAPP_INVITE ? 'hover:-translate-y-0.5' : 'cursor-not-allowed opacity-70'
              }`}
              style={{ color: WA.deep }}
            >
              <WhatsappLogo weight="fill" className="h-5 w-5" />
              Join the Community
              <ArrowRight
                weight="bold"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* ── Mobile sticky CTA: the page anchored on one action ────────── */}
      {WHATSAPP_INVITE && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div
            className="border-t px-4 pb-3 pt-3 shadow-[0_-8px_24px_-12px_rgba(14,39,51,0.25)] backdrop-blur"
            style={{ background: 'rgba(250,253,254,0.95)', borderColor: C.line }}
          >
            <a
              href={WHATSAPP_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-[14.5px] font-extrabold text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${WA.deep}, ${WA.green})` }}
            >
              <WhatsappLogo weight="fill" className="h-5 w-5" />
              Join the WhatsApp Community
              <ArrowRight weight="bold" className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  footnote,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  footnote?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 text-left"
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{ background: C.goldPale }}
        >
          <Icon weight="duotone" className="h-5 w-5" style={{ color: C.goldInk }} />
        </span>
        <div className="min-w-0">
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.inkSoft }}
          >
            {label}
          </p>
          <p
            className="mt-0.5 font-display text-[14px] font-extrabold leading-snug"
            style={{ color: C.ink }}
          >
            {value}
          </p>
        </div>
      </div>
      {footnote && (
        <p className="mt-2 text-[11.5px]" style={{ color: C.inkSoft }}>
          {footnote}
        </p>
      )}
    </div>
  );
}

function SectionEyebrow({ text }: { text: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ background: C.goldWash, color: C.goldInk }}
    >
      <span
        aria-hidden
        className="inline-block h-1 w-1 rounded-full"
        style={{ background: C.goldInk }}
      />
      {text}
    </span>
  );
}





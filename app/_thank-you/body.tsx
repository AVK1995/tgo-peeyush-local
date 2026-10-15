'use client';

/* Confirmation -> the WhatsApp join as the one next step -> what arrives
   inside -> be early -> policy -> prep -> final nudge. House structure from
   ankita-postpartum. The copy doc carries no thank-you page, so lines not
   marked as from COPY-SOURCE.md are house standard and want the client's read. */

/**
 * THE SHARED BODY BEHIND ALL FOUR THANK-YOU PAGES.
 *
 *   /thank-you                 base
 *   /thank-you-recording       base + recordings
 *   /thank-you-private         base + 1-on-1
 *   /thank-you-all-products    base + both
 *
 * The four routes are thin wrappers that pass a `bundle`; everything that
 * differs between them is derived from it. One body, because the pages are
 * ~95% identical — the confirmation, the community card, the policy, the prep
 * list and the footer are the same on all four, and four copies of that is
 * four copies to keep in step the next time a date or a policy line changes.
 *
 * ⚠️ THE BUNDLE IS A PROP NOW, NOT A QUERY PARAM. It used to be read from
 * `?b=`, which meant every link had to be constructed and a mistyped one
 * silently showed the wrong page. The route IS the bundle, so a buyer who
 * lands on /thank-you-recording always sees the recordings card and the URL
 * is something a human can type.
 *
 * ⚠️ NOTHING HERE IS ENTITLEMENT. These pages are a receipt and a set of
 * instructions; anyone can open any of them. Fulfilment is driven by the
 * webhook, which reads the order's own notes — so the worst a stranger
 * opening /thank-you-all-products gets is a page telling them to join groups
 * they are not in. The WhatsApp links are the real gate and they are
 * invite-controlled.
 */

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  ArrowRight,
  CalendarBlank,
  ChatCircleDots,
  Envelope,
  Check,
  CheckCircle,
  Clock,
  Confetti,
  Megaphone,
  Notebook,
  Person,
  ShieldCheck,
  Warning,
  WhatsappLogo,
  X,
} from '@phosphor-icons/react/dist/ssr';

import { LEGAL } from '../_landing/legal';
import {
  BONUS_DELIVERY_NOTE,
  DATES,
  PRICE,
  PROMISE_NAME,
  SESSION_TIME_TZ,
  CALL_BOOKING_URL,
  CALL_BOOKING_NOTE,
  CALL_LINK_LOCATION_NOTE,
  LINKS_DELIVERY_NOTE,
  RECORDING_DELIVERY_NOTE,
  WHATSAPP_INVITE,
  WHATSAPP_RECORDINGS_INVITE,
  WORKSHOP_NAME,
} from '../_landing/offer';
import SiteFooter from '@/components/SiteFooter';
import { C } from '../_landing/shared';
import { trackPurchase } from '@/lib/track';

/* WhatsApp's brand colours, the same on every funnel, never the page palette. */
const WA = { green: '#25D366', deep: '#128C7E' } as const;

const GOOD_GREEN = '#10B981';
const WARN_AMBER = '#F59E0B';

const COMMUNITY_BENEFITS: { icon: typeof CheckCircle; text: string }[] = [
  { icon: ChatCircleDots, text: 'Live session links for both days' },
  { icon: Megaphone, text: 'Reminders before each session' },
  { icon: Notebook, text: 'Instructions for each day' },
  { icon: Person, text: 'Important updates from Dr. Peeyush' },
];

/* ⚠️ THE RECORDINGS LINE IS NOW CONDITIONAL (15 Oct 2026). It was a flat
   'Recordings will not be provided', which became false for anyone who ticked
   the recordings add-on at checkout — and telling a buyer on the confirmation
   page that they will not get the thing they just paid for is a refund
   request, not a policy note. */
/* One joining step. `kind` picks the skin only: WhatsApp green for the two
   groups, the page's own dark for the booking card, so a buyer can tell at a
   glance which of the three is not a WhatsApp link. */
type Step = {
  key: string;
  kind: 'whatsapp' | 'call';
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  note: string;
  cta: string;
  /** The SHORT label for the docked bar on phones. The card's `cta` is
   *  written to be read in a card ("Join the Community Here"); stacked three
   *  deep at the bottom of a 390px screen it has to name the destination in
   *  as few words as possible, because the badge and the arrow take the rest
   *  of the row. */
  stickyCta: string;
  href: string;
  hint: string;
};

const policyItems = (hasRecording: boolean) => [
  hasRecording
    ? 'Your Day 1 and Day 2 recordings are shared after the workshop'
    : 'Recordings are not included with your seat', // FAQ 5, COPY-SOURCE.md
  'No rescheduling to future batches',
];

const PREP_ITEMS = [
  'Attend both sessions live from start to finish', // FAQ 5, COPY-SOURCE.md
  'Be in a distraction-free space',
  'Wear comfortable clothes',
  'Join the community immediately',
];

export default function ThankYouBody({ bundle }: { bundle: string }) {
  return (
    <Suspense fallback={null}>
      <ThankYou bundle={bundle} />
    </Suspense>
  );
}

function ThankYou({ bundle }: { bundle: string }) {
  /* `?p=` is the razorpay payment id, appended by the checkout's success
     handler. OPTIONAL throughout: it only drives the GA4 purchase ping and
     the receipt line, so every one of these pages opens cleanly without it —
     which is what makes the four URLs shareable and testable by hand. */
  const paymentId = useSearchParams().get('p') ?? '';

  const hasRecording = bundle.includes('recording');
  const hasCall = bundle.includes('call');

  /* The docked bar reserves its own measured height. It is one button tall on
     /thank-you and three on /thank-you-complete, so a constant is correct on
     exactly one of the four routes and hides the footer's legal text on the
     others. ResizeObserver rather than a resize listener: what changes is the
     BAR, not the window. */
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
  const POLICY_ITEMS = policyItems(hasRecording);

  /* The joining steps, built from what was bought. Order is deliberate: the
     main community first because the workshop itself depends on it, then the
     extras. A buyer who reads only the first card still gets into the thing
     they primarily paid for. */
  const steps: Step[] = [
    {
      key: 'community',
      kind: 'whatsapp',
      eyebrow: 'Important',
      title: 'Join the WhatsApp Community now.',
      body: (
        <>
          Session links, reminders and updates for both days are shared inside
          the WhatsApp Community.{' '}
          <strong className="text-white">
            Your access to the workshop depends on joining this group.
          </strong>
        </>
      ),
      note: BONUS_DELIVERY_NOTE,
      cta: 'Join the Community Here',
      stickyCta: 'Join Workshop Group',
      href: WHATSAPP_INVITE,
      hint: 'Opens in WhatsApp · 1-click join',
    },
    ...(hasRecording
      ? [
          {
            key: 'recordings',
            kind: 'whatsapp' as const,
            eyebrow: 'Your add-on',
            title: 'Join the Recordings group.',
            body: (
              <>
                Your Day 1 and Day 2 recordings are posted in a{' '}
                <strong className="text-white">separate group</strong>, kept for
                people who added them.{' '}
                <strong className="text-white">{RECORDING_DELIVERY_NOTE}</strong>{' '}
                Join now so you are in the group when they land.
              </>
            ),
            note: 'This is not the same group as the one above. Join both.',
            cta: 'Join the Recordings Group',
            stickyCta: 'Join Recordings Group',
            href: WHATSAPP_RECORDINGS_INVITE,
            hint: 'Opens in WhatsApp · 1-click join',
          },
        ]
      : []),
    ...(hasCall
      ? [
          {
            key: 'call',
            kind: 'call' as const,
            eyebrow: 'Your add-on',
            title: 'Book your private 1-on-1 slot.',
            body: (
              <>
                Pick a time that suits you and Dr. Peeyush will take the session
                himself.{' '}
                {/* "Slots are limited, so book yours now" was here and is
                    gone: it contradicts the promise made at checkout that the
                    slot can be booked any time, and manufacturing urgency
                    against something a buyer has already paid for is the kind
                    of line that gets quoted back during a refund. */}
                <strong className="text-white">{CALL_BOOKING_NOTE}</strong> Keep
                somewhere quiet to sit, and be ready to practise along.
              </>
            ),
            /* Was "You will get a confirmation with the joining link once you
               pick a slot" — true, but it left the bigger question open, and
               the rest of this page trains buyers to expect everything in a
               WhatsApp group. This says where the BOOKING link lives, which
               is the one a buyer goes hunting for. */
            note: CALL_LINK_LOCATION_NOTE,
            cta: 'Pick My Slot',
            stickyCta: 'Book My 1-on-1 Slot',
            href: CALL_BOOKING_URL,
            hint: 'Opens the booking calendar in a new tab',
          },
        ]
      : []),
  ];

  /* GA4 only. Meta Purchase and the server GA4 copy come from the webhook,
     keyed on the same payment id, so the two collapse into one sale. */
  useEffect(() => {
    if (paymentId) trackPurchase(paymentId);
  }, [paymentId]);

  return (
    <main className="font-body" style={{ background: C.tint }}>
      <section className="px-5 pb-14 pt-12 text-center md:pb-20 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <span
            className="mx-auto grid h-20 w-20 place-items-center rounded-full"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <Confetti weight="duotone" className="h-10 w-10" style={{ color: C.ink }} />
          </span>

          <span
            className="mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ background: C.accent, color: C.onAccent }}
          >
            <Check weight="bold" className="h-3 w-3" />
            Congrats!
          </span>

          <h1
            className="mt-5 font-display text-[30px] font-extrabold leading-[1.08] tracking-tight sm:text-[44px] lg:text-[52px]"
            style={{ color: C.ink, textWrap: 'balance' } as React.CSSProperties}
          >
            Your seat is <span className="underline decoration-[3px] underline-offset-[6px]" style={{ textDecorationColor: C.accent }}>confirmed.</span>
          </h1>

          <p
            className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed sm:text-[17px]"
            style={{ color: C.inkSoft }}
          >
            You are officially registered for the{' '}
            <strong style={{ color: C.ink }}>{WORKSHOP_NAME}.</strong> Please read
            this page carefully, your access depends on the next step.
          </p>

          {/* ══ WHAT THE EXTRAS BOUGHT ════════════════════════════════════
              Only for buyers who added something, and placed ABOVE the dates
              because it is the part of the order they are least certain
              went through. An add-on that is never acknowledged after
              payment is the one people email to ask about. */}
          {(hasRecording || hasCall) && (
            <div
              className="mx-auto mt-8 max-w-lg rounded-2xl p-5 text-left"
              style={{ background: C.darkCard, border: `1px solid ${C.lineStrong}` }}
            >
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ background: C.accent, color: C.onAccent }}
              >
                <Check weight="bold" className="h-3 w-3" />
                Added to your order
              </span>
              <ul className="mt-4 space-y-3">
                {hasRecording && (
                  <li className="flex gap-3">
                    <CheckCircle
                      weight="fill"
                      className="mt-[2px] h-4 w-4 shrink-0"
                      style={{ color: C.accent }}
                    />
                    <span className="text-[14px] leading-snug" style={{ color: C.onDark }}>
                      <strong>Workshop recordings, Day 1 + Day 2.</strong>{' '}
                      <span style={{ color: C.onDarkMute }}>
                        {/* Said the recordings go to "the WhatsApp Community",
                            which is the MAIN group — they go to the separate
                            recordings group, and pointing a paying buyer at
                            the wrong group is how they conclude they were
                            never given what they bought. */}
                        {RECORDING_DELIVERY_NOTE} They are posted in the
                        recordings group below, yours to keep.
                      </span>
                    </span>
                  </li>
                )}
                {hasCall && (
                  <li className="flex gap-3">
                    <CheckCircle
                      weight="fill"
                      className="mt-[2px] h-4 w-4 shrink-0"
                      style={{ color: C.accent }}
                    />
                    <span className="text-[14px] leading-snug" style={{ color: C.onDark }}>
                      <strong>Private 1-on-1 session with Dr. Peeyush.</strong>{' '}
                      <span style={{ color: C.onDarkMute }}>
                        {/* Said we would send a booking link later. We do not:
                            the link is on this page, in the step card below.
                            Telling a buyer to wait for something they already
                            have is how a slot never gets booked. */}
                        {CALL_BOOKING_NOTE} Use the booking card below to pick
                        your slot.
                      </span>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mx-auto mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            <DetailCard icon={CalendarBlank} label="Workshop dates" value={DATES} />
            <DetailCard
              icon={Clock}
              label="Live session time"
              value={SESSION_TIME_TZ}
              footnote="Same time on both days"
            />
          </div>

          {paymentId && (
            <p
              className="mt-6 text-[11.5px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.inkSoft }}
            >
              Payment ID {paymentId} · {PRICE} paid
            </p>
          )}
        </div>
      </section>

      {/* ══ THE JOINING STEPS ═════════════════════════════════════════════
          One card per thing the buyer must now do, and the count depends on
          what they bought:

            seat only          1 step   the community
            + recordings       2 steps  the community, the recordings group
            + 1-on-1           2 steps  the community, book the slot
            + both             3 steps  community, recordings, slot

          ⚠️ THE RECORDINGS GROUP IS A SEPARATE GROUP ON PURPOSE. Posting the
          recordings into the main community would hand a paid extra to every
          ₹99 buyer who did not pay for it.

          Numbered "Step N of M" from the array rather than hardcoded, because
          the old card said "Step 1 of 1" and a page that asks for three
          things while calling the first one the only one is how the second
          and third get skipped. */}
      <section className="space-y-4 px-5 pb-4 md:px-8">
        {steps.map((step, i) => (
          <StepCard key={step.key} step={step} index={i} total={steps.length} />
        ))}

        {/* ── "YOU CANNOT LOSE THESE" ──────────────────────────────────────
            Directly under the cards, because the anxiety it answers is felt
            exactly there: a buyer looking at two or three things to do, on a
            page they reached through a payment redirect, wondering what
            happens if they close the tab.

            It is also the honest statement of the delivery model. The rest of
            this funnel trains "everything arrives in the WhatsApp group", and
            for the session links, the bonuses and the recordings that is
            true — but the booking link is personal and is never posted in a
            group, so without this line a 1-on-1 buyer waits in a group for
            something that is already in their inbox. */}
        <div
          className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl p-4"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Envelope
            weight="duotone"
            aria-hidden
            className="mt-[1px] h-5 w-5 shrink-0"
            style={{ color: C.ink }}
          />
          {/* ⚠️ CALL_LINK_LOCATION_NOTE is NOT repeated here, though it was at
              first. On the two routes with a booking card it renders as that
              card's note immediately above this strip, and the two sentences
              ran back to back saying the same thing twice — which reads as a
              page arguing with itself rather than reassuring. The specific
              note stays where a buyer looking for the booking link is already
              looking; this strip keeps the general promise. */}
          <p className="text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {LINKS_DELIVERY_NOTE}
          </p>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionEyebrow text="What you'll receive inside" />
            <h2
              className="mt-3 font-display text-[24px] font-extrabold leading-tight sm:text-[32px]"
              style={{ color: C.ink }}
            >
              What you&rsquo;ll receive in the community.
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
                  style={{ background: C.tint }}
                >
                  <Icon weight="duotone" className="h-5 w-5" style={{ color: C.ink }} />
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
            style={{
              background: 'rgba(245,158,11,0.12)',
              color: C.ink,
              border: '1px solid rgba(245,158,11,0.45)',
            }}
          >
            <Warning
              weight="fill"
              className="mr-1.5 inline-block h-4 w-4 align-text-bottom"
              style={{ color: WARN_AMBER }}
            />
            Please do <strong>not mute</strong> or <strong>exit the community</strong>{' '}
            until the workshop is over.
          </p>
        </div>
      </section>

      <section className="px-5 pb-4 md:px-8">
        <div
          className="mx-auto max-w-3xl rounded-3xl p-7 md:p-9"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-start gap-4">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
              style={{ background: C.tint, border: `1px solid ${C.line}` }}
            >
              <Clock weight="duotone" className="h-6 w-6" style={{ color: C.ink }} />
            </span>
            <div className="min-w-0">
              <h3
                className="font-display text-[18px] font-extrabold leading-snug sm:text-[20px]"
                style={{ color: C.ink }}
              >
                Please be available 5 minutes before each live session.
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
                These are <strong>live, doctor-led sessions</strong>, and
                practising along with Dr. Peeyush is an important part of getting
                the most from them. Arriving late may mean missing important
                instructions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionEyebrow text="Please note" />
            <h2
              className="mt-3 font-display text-[24px] font-extrabold leading-tight sm:text-[32px]"
              style={{ color: C.ink }}
            >
              Important policy.
            </h2>
            <p className="mt-3 text-[14.5px]" style={{ color: C.inkSoft }}>
              Because this is a live, guided experience:
            </p>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {POLICY_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl p-5"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <X weight="bold" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.error }} />
                <span className="text-[13.5px] font-semibold leading-snug" style={{ color: C.inkSoft }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div
            className="mt-8 rounded-2xl p-5 text-center"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <p className="font-display text-[15px] font-extrabold" style={{ color: C.ink }}>
              Your seat has been reserved exclusively for you.
            </p>
            <p className="mt-1.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              (The {PROMISE_NAME} you joined with is set out in our{' '}
              <Link href="/refund-policy" className="font-semibold underline" style={{ color: C.ink }}>
                refund policy
              </Link>
              .)
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionEyebrow text="Quick prep" />
            <h2
              className="mt-3 font-display text-[24px] font-extrabold leading-tight sm:text-[32px]"
              style={{ color: C.ink }}
            >
              What to do before the workshop.
            </h2>
            <p className="mt-3 text-[14.5px]" style={{ color: C.inkSoft }}>
              To get the most from it, please:
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
                  style={{ background: C.accent, color: C.onAccent }}
                >
                  {i + 1}
                </span>
                <span className="text-[14px] font-medium leading-snug" style={{ color: C.inkSoft }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-[13.5px]" style={{ color: C.inkSoft }}>
            <ShieldCheck
              weight="fill"
              className="mr-1.5 inline-block h-4 w-4 align-text-bottom"
              style={{ color: GOOD_GREEN }}
            />
            {/* FAQ 3, COPY-SOURCE.md */}
            Everything is taught step-by-step and is beginner-friendly.
          </p>
        </div>
      </section>

      <section
        className="relative isolate overflow-hidden px-5 py-16 md:px-8 md:py-20"
        style={{ background: C.dark }}
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(6,182,212,0.22) 0%, transparent 62%)',
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-display text-[26px] font-extrabold leading-tight sm:text-[36px]"
            style={{ color: C.onDark }}
          >
            This is your first step toward breathing easier.
          </h2>
          <p className="mt-4 text-[14.5px]" style={{ color: C.onDarkMute }}>
            {/* On the add-on routes this closing nudge is no longer the whole
                instruction — there are two or three things to do, and telling
                a buyer "now join the community" as the last line of the page
                reads as confirmation that they are finished. */}
            {steps.length > 1
              ? `Now finish all ${steps.length} steps above and we'll see you inside.`
              : "Now, join the community and we'll see you inside."}
          </p>

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
              {/* Named once there is more than one group, for the same reason
                  the docked bar is: this points at the MAIN community, and a
                  recordings buyer reading "Join the Community" at the foot of
                  the page would reasonably expect it to be the group their
                  replays are in. */}
              {steps.length > 1 ? 'Join the Workshop Group' : 'Join the Community'}
              <ArrowRight
                weight="bold"
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* ══ THE DOCKED BAR (phones) ═══════════════════════════════════════
          One button per joining step, in the same order as the cards above.

          It used to be a single hardcoded button pointing at the main
          community, which was unambiguous while that was the only group. It
          is not any more: a buyer of all three has three things to do, and a
          lone floating button reading "Join the WhatsApp Community" is
          exactly the one a recordings buyer taps expecting their replays.

          ⚠️ COLOUR CARRIES THE MEANING, and it matches the cards: WhatsApp
          green for the two groups, the page's dark navy for the booking link.
          A buyer scanning three stacked pills can tell which one is not
          WhatsApp without reading any of them.

          Rendered only when at least one step has a real link — a dock of
          three dead buttons is worse than no dock. Individual missing links
          still render dimmed, so a half-configured launch is visible. */}
      {steps.some((s) => s.href) && (
        <>
          {/* Measured, not guessed: this bar is one, two or three buttons
              tall depending on the route, so any constant is right on one
              page and buries the footer on the others. */}
          <div aria-hidden className="md:hidden" style={{ height: dockHeight }} />
          <div
            ref={dockRef}
            className="fixed inset-x-0 bottom-0 z-40 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div
              className="border-t px-4 pb-3 pt-2.5 shadow-[0_-8px_24px_-12px_rgba(6,20,28,0.25)] backdrop-blur"
              style={{ background: 'rgba(255,255,255,0.95)', borderColor: C.line }}
            >
              {steps.length > 1 && (
                <p
                  className="pb-2 text-center font-display text-[12.5px] font-extrabold"
                  style={{ color: C.ink }}
                >
                  👉{' '}
                  {steps.every((s) => s.kind === 'whatsapp')
                    ? 'Join both WhatsApp groups'
                    : `Finish your ${steps.length} steps`}
                </p>
              )}

              <div className="space-y-2">
                {steps.map((step, i) => {
                  const live = Boolean(step.href);
                  const isWa = step.kind === 'whatsapp';
                  return (
                    <a
                      key={step.key}
                      href={step.href || undefined}
                      target={live ? '_blank' : undefined}
                      rel={live ? 'noopener noreferrer' : undefined}
                      aria-disabled={live ? undefined : true}
                      className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 font-display text-[14px] font-extrabold text-white shadow-md ${
                        live ? '' : 'cursor-not-allowed opacity-60'
                      }`}
                      style={{
                        background: isWa
                          ? `linear-gradient(135deg, ${WA.deep}, ${WA.green})`
                          : `linear-gradient(135deg, ${C.band}, ${C.darkCard})`,
                      }}
                    >
                      {/* The number only appears when there IS an order to
                          follow. On the base page a "1" beside a single
                          button invites the reader to look for a step two
                          that does not exist. */}
                      {steps.length > 1 && (
                        <span
                          aria-hidden
                          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums"
                          style={{ background: 'rgba(255,255,255,0.22)' }}
                        >
                          {i + 1}
                        </span>
                      )}
                      {isWa ? (
                        <WhatsappLogo weight="fill" className="h-[18px] w-[18px] shrink-0" />
                      ) : (
                        <CalendarBlank weight="fill" className="h-[18px] w-[18px] shrink-0" />
                      )}
                      <span className="truncate">{step.stickyCta}</span>
                      <ArrowRight weight="bold" className="h-4 w-4 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

/* ══ One joining step ═══════════════════════════════════════════════════
   The card the old page hardcoded once, now rendered one to three times.

   The link ALWAYS renders, in both states. A post-purchase page that asks
   for nothing is worse than a visibly disabled button: the buyer has paid
   and is looking for what to do next, and an absent button reads as "nothing
   to do" rather than "we are not ready". When the env var is empty the
   button is dimmed, marked `aria-disabled`, and the support address replaces
   the hint — which is a failure state the client can see, not one that hides
   until someone complains. ─────────────────────────────────────────────── */
function StepCard({
  step,
  index,
  total,
}: {
  step: Step;
  index: number;
  total: number;
}) {
  const live = Boolean(step.href);
  const isWa = step.kind === 'whatsapp';

  return (
    <div
      className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-8 text-center text-white md:p-10"
      style={{
        background: isWa
          ? `linear-gradient(135deg, ${WA.deep}, ${WA.green})`
          : `linear-gradient(135deg, ${C.band}, ${C.darkCard})`,
      }}
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
          {step.eyebrow} · Step {index + 1} of {total}
        </span>

        <h2 className="mt-4 font-display text-[24px] font-extrabold leading-tight sm:text-[34px]">
          {step.title}
        </h2>

        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-white/90">
          {step.body}
        </p>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/80">
          {step.note}
        </p>

        <a
          href={step.href || undefined}
          /* New tab for both kinds. The booking calendar is a third-party
             page and this one still carries the buyer's other steps — losing
             it mid-flow is how the second group never gets joined. */
          target={live ? '_blank' : undefined}
          rel={live ? 'noopener noreferrer' : undefined}
          aria-disabled={live ? undefined : true}
          className={`group mt-7 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-display text-[15px] font-extrabold ${
            live ? '' : 'cursor-not-allowed opacity-70'
          }`}
          style={{ color: isWa ? WA.deep : C.ink }}
        >
          {isWa ? (
            <WhatsappLogo weight="fill" className="h-5 w-5" />
          ) : (
            <CalendarBlank weight="fill" className="h-5 w-5" />
          )}
          {step.cta}
          <ArrowRight
            weight="bold"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </a>

        {live ? (
          <p className="mt-4 text-[11.5px] text-white/80">{step.hint}</p>
        ) : (
          <p className="mt-4 text-[12px] font-semibold text-white/90">
            Having trouble? Write to {LEGAL.email} and we will send this to you
            directly.
          </p>
        )}
      </div>
    </div>
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
          style={{ background: C.dark }}
        >
          <Icon weight="duotone" className="h-5 w-5" style={{ color: C.accent }} />
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
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ background: C.accent, color: C.onAccent }}
    >
      {text}
    </span>
  );
}

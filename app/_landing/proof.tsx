'use client';

/**
 * The proof beats, in the order COPY-SOURCE.md sets out:
 *
 *   6  Does this sound like you?  — the self-recognition list
 *   7  The testimonial rails      — two rows, 6 clips then 7
 *
 * COPY IS VERBATIM. The emphasis inside each recognition line is TYPOGRAPHY,
 * not an edit: the words and their order are exactly as written.
 *
 * FOOTAGE IS IN. Thirteen Vimeo clips, supplied 14 Sep 2026, wired into
 * ROW_ONE and ROW_TWO with a poster frame each under
 * /public/images/testimonials. Posters, not players: the clicked card, and only
 * that one, becomes an embed. Nothing here invents a name, a quote, a city, a
 * star rating or a result.
 *
 * THEY ARE 16:9, NOT 9:16. Twelve of the thirteen were delivered on a landscape
 * canvas, and most of those are a vertical phone recording already pillarboxed
 * inside it, several carrying a burnt-in royal-blue title banner from an older
 * template. One master (Saniya) is a true vertical and rides in the same frame
 * on fit: 'contain', pillarboxed exactly as the player will show it.
 */
import { Play } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';

import { asset } from './asset-version';
import { legoDelay } from './lego-style';
import { C, MediaPlaceholder, SectionHeading } from './shared';

/* ══ 6 · Does this sound like you? ═════════════════════════════════════════
   A one-sided list: every line is meant to be recognised, so there is no second
   column and nothing to weigh against.

   The source copy marks each line with a ☑️. It renders as a clay × instead,
   and that is deliberate rather than sloppy: these six lines are the reader's
   PAIN, not features of the offer, and a green tick beside "You experience
   frequent headaches or migraines" reads as a benefit being sold. (Atul's
   correction on the Kaizen build, now a standing rule for this beat.) */
const RECOGNITION: [string, string, string][] = [
  [
    'You ',
    'wake up tired even after sleeping',
    ', struggle with low energy through the day and often feel like your body is not recovering the way it used to.',
  ],
  [
    'You deal with ',
    'recurring back, neck, knee or joint pain',
    ', stiffness or heaviness, and have slowly started accepting it as a normal part of getting older.',
  ],
  [
    'You experience ',
    'frequent headaches or migraines',
    ', sometimes with heaviness, sensitivity or discomfort that disrupts your day.',
  ],
  [
    'You feel ',
    'stressed, anxious, restless or mentally overloaded',
    ', and even when you try to relax, your mind and body don’t always seem to switch off.',
  ],
  [
    'You’re managing ',
    'more than one lifestyle health concern at the same time',
    ', such as weight gain, high BP, blood sugar issues, cholesterol or digestive problems.',
  ],
  [
    'You’ve tried walking, yoga, exercise, diet changes or different wellness routines, but ',
    'still feel like your health problems keep returning in different forms',
    '.',
  ],
];

function Recognition() {
  return (
    <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvas }}>
      <SectionHeading>
        Does this <span style={{ color: C.goldDeep }}>sound like you</span>?
      </SectionHeading>

      {/* Six quiet rows rather than six cards: the beat wants to be READ, not
          scanned, so nothing here is loud.

          But quiet is not the same as edgeless. The fill is `surface` (white) on
          this section's `canvas` ground, and those two are 1.5% apart, so on a
          LIGHT page the fill alone does not separate anything: each row takes
          the hairline and a teal-tinted seat, the same pair every card on this
          page carries. The shadow is the page's softest (-26px of spread), so
          six of them stacked read as six sheets and not as six buttons. */}
      <ul className="mx-auto mt-12 grid max-w-[820px] gap-3">
        {RECOGNITION.map(([pre, hl, post], idx) => (
          <li
            key={hl}
            data-lego=""
            className="lego-hover-sm flex items-start gap-4 rounded-2xl px-5 py-4"
            style={{
              ...legoDelay(idx),
              background: C.surface,
              border: `1px solid ${C.line}`,
              boxShadow: '0 18px 44px -26px rgba(14,39,51,0.34)',
            }}
          >
            <span
              className="lego-stud mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
              style={{ background: C.coralBed }}
              aria-hidden
            >
              {/* A drawn × rather than the XSquare glyph: at 24px a filled
                  square reads as a heavy block beside body text, and this beat
                  wants six quiet marks, not six red stamps. */}
              <svg viewBox="0 0 12 12" className="h-[11px] w-[11px]" fill="none">
                <path
                  d="M2 2 L10 10 M10 2 L2 10"
                  stroke={C.coralInk}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
              {pre}
              <strong style={{ color: C.ink, fontWeight: 700 }}>{hl}</strong>
              {post}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ══ 7 · The testimonial rails ═════════════════════════════════════════════

   THE RATIO IS ONE CONSTANT. Every frame, every poster and every reserved slot
   is sized from it, so re-cutting the clips to a different shape is a one-line
   change here rather than a hunt through two rails.

   16:9, because that is how the thirteen masters were delivered. Most are a
   vertical phone recording already pillarboxed inside a landscape canvas, so
   the bars are burnt into the file: a 9:16 card would crop the speaker to fit
   bars that are already there. The one true-vertical master rides in the same
   frame on fit: 'contain'. To re-cut them all vertical one day, this constant
   and CARD_W are the only two lines that move. */
const CLIP_RATIO = '16 / 9';
const CARD_W = 'w-[300px] sm:w-[360px]';

type Clip = {
  /** The label the clip was delivered under, used for the play button's
   *  accessible name. */
  label: string;
  /** Preferred: a Vimeo id. Client video is an embed, never a self-hosted mp4
   *  the page has to ship and buffer. */
  vimeoId?: string;
  /** Fallback: an mp4 under /public, referenced through asset(). */
  src?: string;
  /** Poster frame under /public. Required for either playback route: a rail of
   *  thirteen live players would pull the platform runtime thirteen times. */
  poster?: string;
  /** The speaker's name, shown under the frame. Only ever set from a real
   *  supplied name. */
  name?: string;
  /** How the poster sits in the frame. 'contain' for the one true-vertical
   *  master, so it pillarboxes exactly as the player will. */
  fit?: 'cover' | 'contain';
};

/* Row one · six clips, travelling right to left (the source copy's own
   direction note). */
const ROW_ONE: Clip[] = [
  { label: 'Anita', name: 'Anita', vimeoId: '1223592730', poster: '/images/testimonials/anita.jpg' },
  { label: 'Ex-colonel', name: 'Ex-Colonel', vimeoId: '1223592702', poster: '/images/testimonials/ex-colonel.jpg' },
  { label: 'Sugar balance', name: 'Sugar Balance', vimeoId: '1223592756', poster: '/images/testimonials/sugar-balance.jpg' },
  { label: 'Sleepless nights fixed', name: 'Sleepless Nights Fixed', vimeoId: '1223592686', poster: '/images/testimonials/sleepless-nights.jpg' },
  { label: 'Saniya', name: 'Saniya', vimeoId: '1223592632', poster: '/images/testimonials/saniya.jpg', fit: 'contain' },
  { label: 'Ravi', name: 'Ravi', vimeoId: '1223592619', poster: '/images/testimonials/ravi.jpg' },
];

/* Row two · seven clips, travelling left to right. Two rows running opposite
   ways read as a pair rather than as the same effect twice. */
const ROW_TWO: Clip[] = [
  { label: 'Smile returned', name: 'Smile Returned', vimeoId: '1223592635', poster: '/images/testimonials/smile-returned.jpg' },
  { label: 'Shreedhar', name: 'Shreedhar', vimeoId: '1223592623', poster: '/images/testimonials/shreedhar.jpg' },
  { label: 'Durga', name: 'Durga', vimeoId: '1223592507', poster: '/images/testimonials/durga.jpg' },
  { label: 'Neck back pain', name: 'Neck & Back Pain', vimeoId: '1223592588', poster: '/images/testimonials/neck-back-pain.jpg' },
  { label: 'Meenakshi', name: 'Meenakshi', vimeoId: '1223592506', poster: '/images/testimonials/meenakshi.jpg' },
  { label: 'Cancer survivor', name: 'Cancer Survivor', vimeoId: '1223592508', poster: '/images/testimonials/cancer-survivor.jpg' },
  { label: 'Kanak', name: 'Kanak', vimeoId: '1223592505', poster: '/images/testimonials/kanak.jpg' },
];

/**
 * One exhibit card: a poster in a mat with an inner lit ring, so it
 * reads as a case file rather than as a quote box, with an on-brand play disc
 * instead of a platform-red triangle.
 *
 * Posters, not players. Thirteen embeds duplicated for the loop would be
 * TWENTY-SIX player documents fighting for the main thread on a section most
 * readers scroll past. The clicked card, and only that one, becomes a player.
 */
function ClipCard({
  clip,
  playing,
  onPlay,
  inert,
}: {
  clip: Clip;
  playing: boolean;
  onPlay: () => void;
  inert: boolean;
}) {
  const hasVideo = Boolean(clip.vimeoId || clip.src);

  return (
    <article
      aria-hidden={inert ? true : undefined}
      className={`${CARD_W} shrink-0 rounded-3xl p-3`}
      style={{
        /* THE MAT. Every poster here is a real photograph, most of them bright,
           several carrying a burnt-in banner from an older template, and one is
           a true vertical pillarboxed in its own frame. Unmatted, thirteen of
           them travelling across the band is thirteen ragged rectangles. So each
           sits on the card step with 12px of mat, and the frame INSIDE it is the
           dark object (below), which is what gives a light band a row of
           photographs that read as exhibits rather than as debris.

           The border is the STRONG rule rather than the page's usual hairline:
           this card sits on the `canvasAlt` band where a white mat needs a real
           edge, and it is the only card on the page with a bright interior. The
           seat is teal-tinted like every other shadow here; a neutral black
           shadow under a cyan brand reads as dirt. The posters are untouched. */
        background: C.surface,
        border: `1px solid ${C.lineStrong}`,
        boxShadow: '0 18px 40px -28px rgba(14,39,51,0.38)',
      }}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-2xl"
        style={{
          aspectRatio: CLIP_RATIO,
          /* THE VIDEO BED IS THE THIRD CONTAINED DARK OBJECT on the page (with
             the live-sessions card and the Option 2 card), and it is contained
             twice over, because it sits inside a white mat on a light band. One
             value for both fits: the letterbox behind the true-vertical master
             is the deepest ink on the page, so its pillar bars read as the frame
             rather than as a lighter panel behind the picture, and the cover-fit
             posters never show their bed anyway. */
          background: C.navyDeep,
          /* A cyan ring, not a grey one: the ring's job is to hold a BRIGHT
             photograph inside the frame, and `line` at 1px disappears against
             anything lit. */
          boxShadow: hasVideo ? 'inset 0 0 0 1px rgba(6,182,212,0.32)' : undefined,
        }}
      >
        {!hasVideo ? (
          /* The reserved slot, at the real ratio and labelled with what belongs
             in it, so whoever prepares the clips knows the ask without opening
             this file. */
          <MediaPlaceholder
            ratio={CLIP_RATIO}
            label={`${clip.label} · clip`}
            className="h-full w-full"
          />
        ) : playing ? (
          clip.vimeoId ? (
            /* autoplay=1 because the reader has already asked for it by
               clicking; mounting it paused would need a second click. */
            <iframe
              src={`https://player.vimeo.com/video/${clip.vimeoId}?dnt=1&autoplay=1&title=0&byline=0&portrait=0`}
              title={`${clip.name ?? clip.label}, testimonial`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={asset(clip.src!)}
              poster={clip.poster ? asset(clip.poster) : undefined}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Play ${clip.name ?? clip.label}`}
            tabIndex={inert ? -1 : undefined}
          >
            {clip.poster && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={asset(clip.poster)}
                alt=""
                loading="lazy"
                className={`absolute inset-0 h-full w-full ${
                  clip.fit === 'contain' ? 'object-contain' : 'object-cover'
                }`}
              />
            )}
            {/* A scrim so the play disc holds against a bright frame and the
                foot of the picture settles into the card rather than ending on
                a hard bright edge. Tinted with the page's deepest ink, so it
                darkens towards the page instead of towards a colour the palette
                no longer contains. */}
            <span
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(4,16,22,0.10) 0%, rgba(4,16,22,0.12) 55%, rgba(4,16,22,0.62) 100%)',
              }}
            />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-transform duration-300 group-hover:scale-105"
              style={{
                /* The card step, with a lit ring: a disc filled with the page
                   ground reads as a hole punched in the photograph. */
                background: C.surface,
                boxShadow:
                  'inset 0 0 0 1px rgba(103,232,249,0.45), 0 10px 26px -10px rgba(0,0,0,0.7)',
              }}
            >
              <Play weight="fill" className="h-5 w-5 translate-x-[1px]" style={{ color: C.ink }} />
            </span>
          </button>
        )}
      </div>

      {clip.name && (
        <p
          className="px-2 pb-1 pt-3 text-center text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color: C.inkSoft }}
        >
          {clip.name}
        </p>
      )}
    </article>
  );
}

/**
 * A self-scrolling row.
 *
 * The track holds the clips TWICE and travels exactly -50%, which is what makes
 * the loop seamless: at the reset the second copy sits precisely where the first
 * began. The duplicate is aria-hidden, so a screen reader hears six
 * testimonials rather than twelve.
 *
 * `playingKey` carries the COPY INDEX as well as the clip index. Both copies of
 * a card are clickable (the duplicate is on screen half the time, so making it
 * inert would feel broken), but keying on the pair means only the instance
 * actually clicked becomes a player. Keying on the clip alone would open two
 * players of the same clip and you would hear it twice.
 */
function ClipRail({
  clips,
  reverse = false,
  label,
}: {
  clips: Clip[];
  reverse?: boolean;
  label: string;
}) {
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  return (
    <div
      className="kz-rail"
      data-playing={playingKey ? 'true' : 'false'}
      /* A labelled region rather than a list, because it scrolls itself: a list
         implies the reader controls the order. */
      role="region"
      aria-label={label}
    >
      <div className={`kz-rail-track${reverse ? ' kz-rail-track--reverse' : ''}`}>
        {[0, 1].map((copy) =>
          clips.map((clip, idx) => {
            const key = `${copy}-${idx}`;
            return (
              <ClipCard
                key={key}
                clip={clip}
                inert={copy === 1}
                playing={playingKey === key}
                onPlay={() => setPlayingKey(key)}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

export default function Proof() {
  return (
    <>
      <Recognition />

      <section className="px-4 py-12 sm:py-20 lg:py-24" style={{ background: C.canvasAlt }}>
        {/* The headline is three quoted fragments followed by the claim they
            support. Set in two tiers so the quotes read as voices and the line
            under them reads as the page speaking — every word and the original
            order intact, only the size and the face step. The curly quotes are
            typography; the source's straight ones say the same thing. */}
        <SectionHeading sub="Hear directly from people who came struggling with pain, fatigue, anxiety, poor sleep and long-standing health concerns and experienced meaningful changes in how they felt.">
          {/* BODY italic, not display italic. Poppins has no italic file loaded
              (600/700/800 roman only), so `font-display italic` is a face the
              browser synthesises by shearing the roman — at 46px beside a real
              800 headline that reads as a rendering fault. DM Sans ships a true
              italic and it is loaded, so the quoted voices are set in it. */}
          <span
            className="block font-body text-[clamp(24px,3.6vw,40px)] font-bold italic leading-[1.22]"
            style={{ color: C.goldDeep }}
          >
            &ldquo;Pain-Free.&rdquo; &ldquo;Sleeping Again.&rdquo; &ldquo;30 Years
            Younger.&rdquo;
          </span>
          <span className="mt-3 block text-[clamp(22px,3.2vw,34px)] font-extrabold">
            These Are Their Words, Not Ours.
          </span>
        </SectionHeading>

        {/* Two rails, running opposite ways, exactly as the source copy sets
            them out: six clips right to left, then seven left to right. */}
        <div className="mt-14">
          <ClipRail clips={ROW_ONE} label="Video testimonials, first row" />
        </div>
        <div className="mt-5">
          <ClipRail clips={ROW_TWO} reverse label="Video testimonials, second row" />
        </div>
      </section>
    </>
  );
}

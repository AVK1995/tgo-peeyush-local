/* Page copy, verbatim from COPY-SOURCE.md. Price, dates, times and CTA strings
   live in offer.ts and are imported from there, never repeated here. */

export type Clip = {
  name: string;
  vimeoId: string;
  poster: string;
  portrait?: boolean;
};

const clip = (name: string, vimeoId: string, file: string, portrait = false): Clip => ({
  name,
  vimeoId,
  poster: `/images/testimonials/${file}`,
  portrait,
});

export const CLIPS: Clip[] = [
  clip('Anita', '1223592730', 'anita.jpg'),
  clip('Ex-Colonel', '1223592702', 'ex-colonel.jpg'),
  clip('Sugar Balance', '1223592756', 'sugar-balance.jpg'),
  clip('Sleepless Nights Fixed', '1223592686', 'sleepless-nights.jpg'),
  clip('Saniya', '1223592632', 'saniya.jpg', true),
  clip('Ravi', '1223592619', 'ravi.jpg'),
  clip('Smile Returned', '1223592635', 'smile-returned.jpg'),
  clip('Shreedhar', '1223592623', 'shreedhar.jpg'),
  clip('Durga', '1223592507', 'durga.jpg'),
  clip('Neck & Back Pain', '1223592588', 'neck-back-pain.jpg'),
  clip('Meenakshi', '1223592506', 'meenakshi.jpg'),
  clip('Cancer Survivor', '1223592508', 'cancer-survivor.jpg'),
  clip('Kanak', '1223592505', 'kanak.jpg'),
];

export const CLIPS_FIRST = CLIPS.slice(0, 6);
export const CLIPS_SECOND = CLIPS.slice(6);

export type ChangeKey =
  | 'breathe'
  | 'relieve'
  | 'sleep'
  | 'energize'
  | 'focus'
  | 'digest'
  | 'destress'
  | 'recover';

export const CHANGES: { key: ChangeKey; heading: string; tagline: string }[] = [
  {
    key: 'breathe',
    heading: 'BREATHE',
    tagline: 'Breathe easier with stronger respiratory function and better oxygen intake.',
  },
  {
    key: 'relieve',
    heading: 'RELIEVE',
    tagline: 'Get relief from asthma symptoms, sinus issues, migraines and breathing discomfort.',
  },
  {
    key: 'sleep',
    heading: 'SLEEP',
    tagline: 'Sleep deeper, reduce snoring and wake up feeling more refreshed.',
  },
  {
    key: 'energize',
    heading: 'ENERGIZE',
    tagline: 'Fight fatigue, improve stamina and feel more energetic through the day.',
  },
  {
    key: 'focus',
    heading: 'FOCUS',
    tagline: 'Reduce brain fog and improve concentration, clarity and mental sharpness.',
  },
  {
    key: 'digest',
    heading: 'DIGEST',
    tagline: 'Support better digestion and improve gut comfort through healthier breathing.',
  },
  {
    key: 'destress',
    heading: 'DE-STRESS',
    tagline: 'Release stress, anxiety and body tension by calming your nervous system.',
  },
  {
    key: 'recover',
    heading: 'RECOVER',
    tagline:
      "Build better resilience and support your body's natural recovery from recurring health issues.",
  },
];

export const CHALLENGES: { title: string; symptoms: string }[] = [
  {
    title: 'Respiratory Issues',
    symptoms:
      'Breathlessness, Wheezing, Chest Tightness, Frequent Coughing, Trouble Breathing During Daily Activities',
  },
  {
    title: 'Sinus Issues',
    symptoms: 'Blocked Nose, Sinus Pressure, Facial Pain, Postnasal Drip, Frequent Congestion',
  },
  {
    title: 'Migraines',
    symptoms: 'Throbbing Headaches, Light/Sound Sensitivity, Nausea, Recurring Head Pain',
  },
  {
    title: 'Poor Sleep',
    symptoms: 'Snoring, Restless Sleep, Breathing Pauses, Waking Up Tired, Poor Sleep Quality',
  },
  {
    title: 'Chronic Fatigue',
    symptoms: 'Low Energy, Daytime Tiredness, Poor Stamina, Feeling Drained, Low Productivity',
  },
  {
    title: 'Stress & Anxiety',
    symptoms:
      'Constant Worry, Racing Thoughts, Restlessness, Feeling Overwhelmed, Difficulty Relaxing',
  },
];

export const MODULES: { title: string; items: string[] }[] = [
  {
    title: 'Heal Your Body',
    items: [
      'Understand Why Your Health Problems Keep Coming Back',
      'Get Relief From Migraines, Sinus & Recurring Headaches',
      'Improve Oxygen Intake & Increase Your Energy Levels',
      'Sleep Better & Reduce Snoring / Restless Sleep',
      'Support Better Digestion & Overall Body Recovery',
    ],
  },
  {
    title: 'Fix Your Breathing',
    items: [
      'Identify Your Current Breathing Pattern',
      'Correct The Breathing Mistakes You Make Every Day',
      'Learn 6 Powerful Breath Healing Techniques',
      'Strengthen Your Lungs & Respiratory Muscles',
      'Build Your Own Simple 10-Min Daily Breath Routine',
    ],
  },
  {
    title: 'Calm Your Mind',
    items: [
      'Reduce Stress, Anxiety & Constant Overthinking',
      'Calm Your Nervous System Using Your Breath',
      'Release Fear, Tension & Emotional Overwhelm',
      'Improve Focus, Mental Clarity & Concentration',
      'Learn A Daily Routine To Feel Calm, Balanced & In Control',
    ],
  },
];

export const FAQS: { q: string; a: string[] }[] = [
  {
    q: '1. Is this workshop only for people with serious health issues?',
    a: [
      'No. The workshop is for anyone struggling with recurring concerns like respiratory issues, migraines, sinus problems, poor sleep, fatigue, stress or anxiety, or simply anyone who wants to improve their breathing and overall health.',
    ],
  },
  {
    q: "2. I've already tried Yoga, Pranayama or breathing exercises. How is this different?",
    a: [
      'This is not just another set of breathing exercises.',
      'Dr. Peeyush will help you understand your breathing pattern, identify common breathing mistakes and learn which techniques to use for different health concerns.',
      "You'll then build a simple 10-Min Breath Healing Routine™ you can practise every day.",
    ],
  },
  {
    q: '3. What exactly will I learn in the 2-Day Workshop?',
    a: [
      "Across the 2 live sessions, you'll learn how to:",
      'Correct your breathing patterns, practise powerful breath-healing techniques, improve respiratory health, sleep and energy, manage stress and build your own 10-minute daily routine.',
      'Everything is taught step-by-step and is beginner-friendly.',
    ],
  },
  {
    q: "4. I'm taking medicines or undergoing treatment. Can I still attend?",
    a: [
      'Yes.',
      'The techniques taught in the workshop are designed to support your breathing and overall well-being alongside your existing healthcare routine.',
      'You should continue any prescribed medicines or treatments unless your doctor advises otherwise.',
    ],
  },
  {
    /* ⚠️ REWRITTEN 15 Oct 2026, and it HAD to be. This answer read
       "Recordings will not be provided", which was true until the checkout
       started selling them as a paid add-on. Leaving it would have had the
       FAQ deny, on the page that makes the sale, the exact thing being sold
       one click later — a refund request with the site's own words attached.

       The live-first framing is kept deliberately: the recordings are an
       extra, not a substitute for attending, and the answer should not start
       reading as permission to skip the workshop. Flagged for Atul as a copy
       change rather than a silent edit. */
    q: '5. Will I get recordings if I miss the live workshop?',
    a: [
      'The workshop is designed as a live, guided experience, because practising along with Dr. Peeyush is an important part of getting the most from it.',
      'Recordings are not included with your seat by default, so we strongly recommend attending both sessions live from start to finish. If you would like to keep them, you can add the Day 1 and Day 2 recordings at checkout.',
      /* The WHEN, not just the whether. Asked here because this is where the
         question is asked before anyone pays, and "recordings" without a
         delivery time is read as "instantly". */
      'If you add them, the recordings are shared right after the final session on Day 2, once the workshop ends. They are posted in a separate WhatsApp group for people who added them, and they are yours to keep.',
    ],
  },
  {
    q: "6. What if I attend but don't find the workshop helpful?",
    a: [
      "You're protected by our Get-Relief Promise.",
      'Attend both sessions, practise the techniques as taught and experience the method for yourself.',
      "If you're not satisfied with the workshop, you can request a 100% refund.",
    ],
  },
];

export const PRESS_ROW_1 = [1, 2, 3, 4, 5].map((n) => `/images/press/press-0${n}.webp`);
export const PRESS_ROW_2 = [6, 7, 8, 9, 10].map(
  (n) => `/images/press/press-${String(n).padStart(2, '0')}.webp`,
);

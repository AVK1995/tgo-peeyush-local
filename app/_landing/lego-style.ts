/**
 * The lego system's style helpers.
 *
 * Deliberately in their OWN module with no 'use client' directive. A plain
 * function exported from a 'use client' module arrives in a Server Component as
 * a client-reference proxy, not as a function, so calling it at render time
 * fails during prerender. The hero is a Server Component, so the helpers cannot
 * live beside the observer in ./lego.tsx.
 *
 * See app/globals.css for the keyframes these variables feed.
 */

/** Per-item stagger. Capped so a long grid never waits a full second. */
export function legoDelay(index: number, step = 65, max = 8): React.CSSProperties {
  return { ['--lego-d' as string]: `${Math.min(index, max) * step}ms` };
}

/**
 * Stagger plus an alternating tilt. Bricks that all arrive dead level read as a
 * fade; a degree and a half of opposing rotation is what makes a row look like
 * separate pieces being placed rather than one block appearing.
 */
export function legoBrick(index: number, step = 65, max = 8): React.CSSProperties {
  return {
    ...legoDelay(index, step, max),
    ['--lego-tilt' as string]: index % 2 === 0 ? '-1.5deg' : '1.5deg',
  };
}

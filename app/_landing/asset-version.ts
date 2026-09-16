/**
 * Cache-buster for artwork under /public.
 *
 * Replacing an image while keeping its filename does NOT get the new artwork
 * in front of anyone. The path is the cache key in three separate places: the
 * visitor's browser, the CDN edge, and Next's image optimizer, which stores the
 * resized and re-encoded copies against the source URL. All three keep serving
 * the old bytes, and the stale copy usually looks correct to whoever replaced
 * the file, because their own browser fetched it fresh.
 *
 * So every replaced asset gets a new URL instead. Bump this ONE value in the
 * same pass as any artwork swap and every reference below moves together.
 *
 * v1: 13 Sep 2026, project start.
 *     14 Sep 2026: the thirteen testimonial POSTER frames landed under
 *     /public/images/testimonials and are referenced through asset(). No bump:
 *     those paths had never been served, so there is nothing cached to beat.
 *     Still missing, and still reserved as MediaPlaceholders at the real aspect
 *     ratios: the logo, the Dr. Peeyush portrait and two stage stills (./close),
 *     the four toolkit covers (./toolkit) and the hero offer stack (./hero).
 *     Bump this to '2' the first time a file already on the site is REPLACED
 *     under its existing name.
 */
export const ASSET_V = '1';

/** Appends the version to a /public path. */
export const asset = (path: string) => `${path}?v=${ASSET_V}`;

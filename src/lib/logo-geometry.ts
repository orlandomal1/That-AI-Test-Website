/**
 * The That AI symbol, rebuilt as vector from brand_guidelines.md §2.2.
 *
 * This file and src/styles/tokens.css are the only two places in src/ allowed to contain hex
 * literals — the brand colours here are fixed by guidelines §7 ("Re-colour the cyan elements —
 * Bridge Cyan #00E5FF is fixed") and must not be themeable.
 *
 * Verified against brand/set1-dark__symbol.png: the spec below reproduces the approved artwork
 * exactly (ink bounding box measures 948×948 px at 8.172 px/unit; left terminal dot's outer edge
 * lands at −52.8 units against a predicted −53).
 *
 * Where the guidelines prose disagrees with the artwork, the artwork wins. See
 * brand/brand_guidelines_v2.1_changes.md for the three amendments and their measurements.
 */

// ── Geometry, in reference units (§2.2) ──────────────────────────────────────
export const ARC_RADIUS = 54;
export const ARC_STROKE = 8;
export const BAR_STROKE = 6;
export const BAR_HALF_LENGTH = 46; // bar runs x = −46 → +46, length 92
export const DOT_RADIUS = 7;

/** Arc centre-line height. The 1.5× lockup ratio is measured against THIS, not the ink height. */
export const SYMBOL_DRAWN_HEIGHT = ARC_RADIUS * 2; // 108

/** Ink height including the round stroke caps. The symbol's ink box is a perfect square. */
export const SYMBOL_INK_SIZE = SYMBOL_DRAWN_HEIGHT + ARC_STROKE; // 116

// ── Lockup proportions (§2.4, as amended by the artwork) ─────────────────────

/** Amendment 1: the ratio applies to the drawn height, not the ink height. */
export const SYMBOL_TO_CAP_RATIO = 1.5;

/**
 * Amendment 2: measured ≈40 reference units in both lockups, not the specified 54.
 * Re-expressed as a ratio of cap height so it is scale-independent.
 */
export const CLEARSPACE_TO_CAP_RATIO = 0.547;

/**
 * Amendment 3: the artwork is wide-tracked. Measured +57/1000 em — neither §4's "+80" nor §4.1's
 * "−2" is correct, though §4 is far closer. Verified by rendering DM Sans Bold at cap height 170px
 * and matching the ink box to the artwork's: 899×179 px against 898×180 px.
 */
export const WORDMARK_TRACKING_EM = 0.057;

/**
 * DM Sans vertical metrics, read from the font binary rather than assumed.
 * cap 700/1000, hhea ascent 992/1000, descent −310/1000.
 */
export const DM_SANS_CAP_RATIO = 0.7;
const DM_SANS_ASCENT = 0.992;
const DM_SANS_DESCENT = 0.31;

/**
 * Left side bearing of "T" (27/1000 em). The flex gap sits between the SVG box and the text box, but
 * §2.4's clearspace is measured to the wordmark's leftmost *glyph* — so the side bearing has to come
 * out of the gap or the lockup renders ~7% too loose.
 */
const DM_SANS_T_LSB = 0.027;

/**
 * Vertical offset needed to sit the symbol on the wordmark's cap-height midpoint rather than the
 * centre of its line box (§2.4: "the wordmark's optical centre … sits on this axis, not the
 * baseline"). In a `line-height: 1` box the cap centre lands 0.009em above the box centre.
 *
 * Negative moves the symbol up. Expressed in em of the wordmark font-size.
 */
export const SYMBOL_OPTICAL_OFFSET_EM =
  (1 - (DM_SANS_ASCENT + DM_SANS_DESCENT)) / 2 + DM_SANS_ASCENT - DM_SANS_CAP_RATIO / 2 - 0.5;

/** Flex gap in em of font-size, once the "T" side bearing is discounted. */
export const CLEARSPACE_EM =
  DM_SANS_CAP_RATIO * CLEARSPACE_TO_CAP_RATIO - DM_SANS_T_LSB;

// ── Colours (§2.5, Set 1 — dark surface, the web default) ────────────────────
export const LOGO_COLOURS = {
  human: '#FFFFFF',
  system: '#00E5FF',
  bridge: '#00E5FF',
} as const;

export type LogoVariant = 'symbol' | 'short' | 'long';

export const WORDMARK: Record<Exclude<LogoVariant, 'symbol'>, string> = {
  short: 'That AI',
  long: 'That AI Consultancy',
};

/**
 * viewBox for the symbol, centred on the origin and padded by the stroke cap so nothing clips.
 * §2.4 also asks for terminal-dot-radius padding on all sides; that is applied by the caller as
 * layout margin rather than baked into the viewBox, so the arcs align optically with text.
 */
const HALF = SYMBOL_INK_SIZE / 2; // 58
export const SYMBOL_VIEWBOX = `${-HALF} ${-HALF} ${SYMBOL_INK_SIZE} ${SYMBOL_INK_SIZE}`;

/**
 * Left arc: human side. Circle centred at (−54, 0), so the arc bulges right and passes through the
 * origin. Right arc is the same mirrored about the y-axis. Both share the origin touch point (§6).
 */
export const ARC_PATH = {
  /** From (−54,−54) up over the origin to (−54,+54), sweeping clockwise. */
  human: `M ${-ARC_RADIUS} ${-ARC_RADIUS} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${-ARC_RADIUS} ${ARC_RADIUS}`,
  /** Mirror image: from (54,−54) to (54,54), sweeping anticlockwise. */
  system: `M ${ARC_RADIUS} ${-ARC_RADIUS} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 0 ${ARC_RADIUS} ${ARC_RADIUS}`,
} as const;

export interface SymbolSvgOptions {
  /** Rendered size in px. Omit to let CSS size it. */
  size?: number;
  /** Emitted as a background rect. Only for contexts that need an opaque ground, e.g. a favicon. */
  background?: string;
  title?: string;
}

/**
 * Standalone SVG markup for the symbol, as a string.
 *
 * Used for the favicon and for embedding into OG images via satori, both of which need real markup
 * rather than an Astro component. Logo.astro renders the same geometry inline.
 */
export function symbolSvg({ size, background, title }: SymbolSvgOptions = {}): string {
  const dims = size ? ` width="${size}" height="${size}"` : '';
  const ground = background
    ? `<rect x="${-HALF}" y="${-HALF}" width="${SYMBOL_INK_SIZE}" height="${SYMBOL_INK_SIZE}" fill="${background}"/>`
    : '';
  const label = title ? `<title>${title}</title>` : '';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SYMBOL_VIEWBOX}"${dims}`,
    ` fill="none" role="img">`,
    label,
    ground,
    `<g stroke-linecap="round" fill="none">`,
    `<path d="${ARC_PATH.human}" stroke="${LOGO_COLOURS.human}" stroke-width="${ARC_STROKE}"/>`,
    `<path d="${ARC_PATH.system}" stroke="${LOGO_COLOURS.system}" stroke-width="${ARC_STROKE}"/>`,
    `</g>`,
    // Bar drawn with butt caps so its length is exactly 92 units; the dots finish the ends.
    `<path d="M ${-BAR_HALF_LENGTH} 0 H ${BAR_HALF_LENGTH}" stroke="${LOGO_COLOURS.bridge}"`,
    ` stroke-width="${BAR_STROKE}" stroke-linecap="butt"/>`,
    `<circle cx="${-BAR_HALF_LENGTH}" cy="0" r="${DOT_RADIUS}" fill="${LOGO_COLOURS.bridge}"/>`,
    `<circle cx="${BAR_HALF_LENGTH}" cy="0" r="${DOT_RADIUS}" fill="${LOGO_COLOURS.bridge}"/>`,
    `</svg>`,
  ].join('');
}

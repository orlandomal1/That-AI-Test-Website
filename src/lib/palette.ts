/**
 * The brand palette as TypeScript values, for the one context that cannot use CSS custom
 * properties: satori, which rasterises the OG images and understands no `var()`.
 *
 * These MUST match src/styles/tokens.css. `npm run lint:tokens` cross-checks every value here
 * against that file and fails if they drift, so this is a second copy but not a second source of
 * truth. Values come from brand/brand_guidelines.md §3.
 */
export const PALETTE = {
  surface: '#0A0A0A',
  surface2: '#1A1A1A',
  accent: '#00E5FF',
  accentDeep: '#00B8CC',
  ink: '#FFFFFF',
  muted: '#888888',
} as const;

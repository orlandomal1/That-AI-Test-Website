/**
 * OG image template and the page list it renders.
 *
 * Brief §2: "OG image: dark surface, long lockup, tagline. One template, generated per page with
 * the page title."
 *
 * Deliberate safety choice: OG images never carry a client name, approved or not. The case-study
 * ogTitle fields hold the engagement hook ("Every trip quote was built twice"), which is confirmed
 * and publishable in either state. An image is the one surface a grep cannot audit, so it holds
 * nothing that could ever need retracting.
 */
import { getCollection } from 'astro:content';
import { interpolate, type TokenContext } from './approvals';
import { writeFile, mkdir } from 'node:fs/promises';
import {
  DM_SANS_CAP_RATIO,
  SYMBOL_DRAWN_HEIGHT,
  SYMBOL_INK_SIZE,
  SYMBOL_TO_CAP_RATIO,
  symbolSvg,
  WORDMARK,
} from './logo-geometry';
import { PALETTE } from './palette';
import { site } from '../site.config';

/** Wordmark size on the OG canvas; everything in the lockup derives from it, as in Logo.astro. */
const OG_WORDMARK_PX = 34;
const OG_SYMBOL_PX =
  (OG_WORDMARK_PX * DM_SANS_CAP_RATIO * SYMBOL_TO_CAP_RATIO * SYMBOL_INK_SIZE) /
  SYMBOL_DRAWN_HEIGHT;
/** §2.4 clearspace: 0.547 x cap height. */
const OG_GAP_PX = OG_WORDMARK_PX * DM_SANS_CAP_RATIO * 0.547;

/** satori understands no var(); PALETTE is the TS mirror of tokens.css, cross-checked by lint. */
const C = PALETTE;

export interface OgPage {
  /** Path segment under /og/, e.g. "index" or "work/halcyon". */
  route: string;
  title: string;
}

/** Every page that gets an OG image. Titles resolve through the same interpolate() as <title>. */
export async function ogPages(): Promise<OgPage[]> {
  const studies = await getCollection('work');

  const staticPages: OgPage[] = [
    // Not the tagline — that already sits at the foot of every card, and repeating it wastes the
    // one line of the image that can say something specific.
    {
      route: 'index',
      title: 'Working AI systems for operators with no tech team.',
    },
    { route: 'work', title: 'Work' },
    { route: 'services', title: 'Services' },
    { route: 'about', title: 'About' },
    { route: 'contact', title: 'Contact' },
  ];

  const casePages: OgPage[] = studies.map((entry) => {
    const ctx: TokenContext = { client: entry.data.clientKey, ...entry.data.tokens };
    return { route: `work/${entry.id}`, title: interpolate(entry.data.seo.ogTitle, ctx) };
  });

  const pages = [...staticPages, ...casePages];

  // Sidecar manifest so the leak test can audit what was baked into the PNGs — an image is the one
  // surface a grep cannot read. Written outside dist/ so it is never served.
  await mkdir('.astro', { recursive: true });
  await writeFile('.astro/og-titles.json', JSON.stringify(pages, null, 2));

  return pages;
}

const lockupDataUri = () =>
  `data:image/svg+xml;base64,${Buffer.from(symbolSvg()).toString('base64')}`;

/**
 * satori accepts React-element-shaped objects. Written as plain objects so no JSX runtime or
 * transform is needed in a build-time endpoint.
 */
const el = (type: string, props: Record<string, unknown>) => ({ type, props, key: null });

export function ogTemplate({ title }: OgPage) {
  return el('div', {
    style: {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: C.surface,
      // The bridge bar, as a rule down the leading edge.
      borderLeft: `8px solid ${C.accent}`,
      padding: '64px 72px',
      fontFamily: 'Inter',
    },
    children: [
      // Long lockup, top left.
      el('div', {
        style: { display: 'flex', alignItems: 'center', gap: `${OG_GAP_PX}px` },
        children: [
          el('img', { src: lockupDataUri(), width: OG_SYMBOL_PX, height: OG_SYMBOL_PX }),
          el('div', {
            style: {
              fontFamily: 'DM Sans',
              fontWeight: 700,
              fontSize: `${OG_WORDMARK_PX}px`,
              letterSpacing: '0.057em',
              color: C.ink,
            },
            children: WORDMARK.long,
          }),
        ],
      }),

      // Page title.
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'DM Sans',
          fontWeight: 700,
          fontSize: '64px',
          lineHeight: 1.12,
          letterSpacing: '-0.03em',
          color: C.ink,
          maxWidth: '900px',
        },
        children: title,
      }),

      // Tagline.
      el('div', {
        style: {
          display: 'flex',
          fontFamily: 'IBM Plex Mono',
          fontSize: '22px',
          letterSpacing: '0.06em',
          color: C.muted,
        },
        children: site.tagline,
      }),
    ],
  });
}

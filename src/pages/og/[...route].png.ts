import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { ogPages, ogTemplate, type OgPage } from '../../lib/og';
import { assertNoForbidden, assertPublicSafe } from '../../lib/approvals';

export const prerender = true;

export async function getStaticPaths() {
  const pages = await ogPages();
  return pages.map((page) => ({ params: { route: page.route }, props: page }));
}

/** satori cannot read woff2. TTFs live in src/assets so they are never served. */
const FONTS = [
  { name: 'DM Sans', weight: 700 as const, file: 'src/assets/og-fonts/DMSans-Bold.ttf' },
  { name: 'Inter', weight: 400 as const, file: 'src/assets/og-fonts/Inter-Regular.ttf' },
  {
    name: 'IBM Plex Mono',
    weight: 400 as const,
    file: 'src/assets/og-fonts/IBMPlexMono-Regular.ttf',
  },
];

export const GET: APIRoute = async ({ props }) => {
  const page = props as OgPage;

  // An image is the one surface the leak test cannot grep, so guard it here at build time.
  assertPublicSafe(page.title, `OG image /og/${page.route}.png`);
  assertNoForbidden(page.title, `OG image /og/${page.route}.png`);

  const fonts = await Promise.all(
    FONTS.map(async (font) => ({
      name: font.name,
      weight: font.weight,
      style: 'normal' as const,
      data: await readFile(font.file),
    })),
  );

  const svg = await satori(ogTemplate(page), { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};

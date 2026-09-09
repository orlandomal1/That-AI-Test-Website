import type { APIRoute } from 'astro';
import { noindexedRoutes } from '../lib/seo';
import { site } from '../site.config';

/**
 * Generated rather than static, so it can never drift from the noindex meta tag and the sitemap
 * filter. All three read the same shouldNoindex() predicate.
 */
export const GET: APIRoute = () => {
  const disallow = noindexedRoutes()
    .map((route) => `Disallow: ${route}`)
    .join('\n');

  const body = [
    'User-agent: *',
    disallow,
    'Allow: /',
    '',
    `Sitemap: ${site.url}/sitemap-index.xml`,
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

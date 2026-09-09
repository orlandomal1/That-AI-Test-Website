import { routeGates, site } from '../site.config';
import { isApproved } from './approvals';

/** Strip trailing/duplicate slashes so '/work/halcyon/' and '/work/halcyon' gate identically. */
const normalise = (pathname: string): string => {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '/';
};

/**
 * Build harnesses and dashboards. Never indexed, never in the sitemap, and removed before launch
 * (see the handover README). Kept during the build so the logo overlay check is repeatable.
 */
export const DEV_ROUTES: readonly string[] = ['/logo-check', '/approvals'];

/**
 * The one predicate behind all three noindex surfaces: the robots meta tag (defaulted in
 * BaseLayout so a page cannot forget it), the sitemap filter, and robots.txt.
 */
export function shouldNoindex(pathname: string): boolean {
  const route = normalise(pathname);
  if (DEV_ROUTES.includes(route)) return true;
  const gate = routeGates[route];
  return gate ? !isApproved(gate) : false;
}

export const noindexedRoutes = (): string[] =>
  [...Object.keys(routeGates), ...DEV_ROUTES].filter((route) => shouldNoindex(route));

export const canonical = (pathname: string): string =>
  new URL(normalise(pathname), site.url).href;

/** "Page title — That AI Consultancy", but never doubled up on the home page. */
export const buildTitle = (title: string): string =>
  title === site.name ? title : `${title} — ${site.name}`;

/** Route → the OG image emitted for it by src/pages/og/[...route].png.ts */
export const ogPath = (pathname: string): string => {
  const route = normalise(pathname);
  return route === '/' ? '/og/index.png' : `/og${route}.png`;
};

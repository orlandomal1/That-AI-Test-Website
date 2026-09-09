import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { shouldNoindex } from './src/lib/seo.ts';

export default defineConfig({
  site: 'https://thataiconsultancy.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // Port 3000 keeps every existing screenshot instruction in CLAUDE.md working verbatim.
  server: { port: 3000, host: true },
  prefetch: false,
  integrations: [sitemap({ filter: (page) => !shouldNoindex(new URL(page).pathname) })],
});

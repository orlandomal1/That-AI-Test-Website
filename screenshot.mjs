import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Per CLAUDE.md: always use system Chrome, never the bundled Chromium.
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const ROUTES = [
  ['/', 'home'],
  ['/work', 'work'],
  ['/work/halcyon', 'work-halcyon'],
  ['/work/purepadel', 'work-purepadel'],
  ['/services', 'services'],
  ['/about', 'about'],
  ['/contact', 'contact'],
];

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));

const base = (positional[0] || 'http://localhost:3000').replace(/\/$/, '');
const label = positional[1] || '';

const all = flags.has('--all');
const mobile = flags.has('--mobile');
const full = flags.has('--full');

const viewport = mobile
  ? { width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
  : { width: 1440, height: 900, deviceScaleFactor: 2 };

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

/** Next free screenshot index. Never overwrites an existing file. */
function nextIndex() {
  const nums = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .map((f) => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? '0', 10))
    .filter(Boolean);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

if (!fs.existsSync(CHROME)) {
  console.error(`System Chrome not found at ${CHROME}`);
  process.exit(1);
}

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
  args: ['--no-sandbox'],
});

const targets = all ? ROUTES : [[new URL(base).pathname || '/', label]];
const origin = all ? base : new URL(base).origin;

for (const [route, routeLabel] of targets) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  const url = all ? `${origin}${route}` : base;
  const response = await page.goto(url, { waitUntil: 'networkidle2' });

  if (response && !response.ok()) {
    console.warn(`  ! ${url} returned ${response.status()}`);
  }

  // Let fonts settle so we never capture a fallback-face render.
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));

  const parts = ['screenshot', nextIndex()];
  if (routeLabel) parts.push(routeLabel);
  if (mobile) parts.push('375');
  const filename = `${parts.join('-')}.png`;

  await page.screenshot({ path: path.join(dir, filename), fullPage: full });
  await page.close();

  console.log(`Saved: temporary screenshots/${filename}  (${url})`);
}

await browser.close();

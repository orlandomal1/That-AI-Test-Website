/**
 * Proves the one-switch guarantee: flipping a single boolean in site.config.ts must change every
 * surface that mentions the client, and must leave no anonymised placeholder behind.
 *
 * Builds three times (baseline → flipped → restored) and diffs the surfaces. Always restores
 * site.config.ts, including on failure.
 *
 * Run: node scripts/flip-test.mjs [key]     default key: client_halcyon
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONFIG = path.join(ROOT, 'src', 'site.config.ts');
const DIST = path.join(ROOT, 'dist');

const key = process.argv[2] || 'client_halcyon';
const slug = key.replace('client_', '');

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');

/** The six surfaces the client name has to reach. */
function surfaces() {
  const page = read(path.join(DIST, 'work', slug, 'index.html'));
  const title = page.match(/<title>(.*?)<\/title>/)?.[1] ?? '(none)';
  const desc = page.match(/name="description" content="(.*?)"/)?.[1] ?? '(none)';
  const robots = page.match(/name="robots" content="(.*?)"/)?.[1] ?? '(absent — indexable)';
  const h1 = page.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] ?? '(none)';
  const sitemap = read(path.join(DIST, 'sitemap-0.xml')).includes(`/work/${slug}`);
  const robotsTxt = read(path.join(DIST, 'robots.txt')).includes(`Disallow: /work/${slug}`);

  return {
    '1 prose (h1)': h1,
    '2 title': title,
    '3 meta description': desc.slice(0, 60) + '…',
    '4 robots meta': robots,
    '5 in sitemap': sitemap,
    '6 robots.txt disallow': robotsTxt,
  };
}

const original = fs.readFileSync(CONFIG, 'utf8');

function build() {
  execSync('npx astro build', { cwd: ROOT, stdio: 'pipe' });
}

/** Flip `approved` to `value` for the given key only. */
function setApproved(value) {
  const re = new RegExp(`(${key}:\\s*\\{[\\s\\S]*?approved:\\s*)(true|false)`, 'm');
  const next = original.replace(re, `$1${value}`);
  if (next === original && value === true) throw new Error(`Could not find ${key} in site.config.ts`);
  fs.writeFileSync(CONFIG, next);
}

let failed = false;

try {
  console.log(`flip-test — ${key}\n`);

  build();
  const before = surfaces();

  setApproved(true);
  build();
  const after = surfaces();

  const width = Math.max(...Object.keys(before).map((k) => k.length));
  console.log(`${'surface'.padEnd(width)}  ${'unapproved'.padEnd(46)}  approved`);
  console.log('-'.repeat(width + 96));

  let changed = 0;
  for (const k of Object.keys(before)) {
    const a = String(before[k]);
    const b = String(after[k]);
    const moved = a !== b;
    if (moved) changed++;
    console.log(`${k.padEnd(width)}  ${a.slice(0, 46).padEnd(46)}  ${b.slice(0, 46)}  ${moved ? '✓' : '—'}`);
  }

  console.log(`\n${changed}/6 surfaces changed.`);
  if (changed !== 6) {
    console.error('FAIL: every surface should change when the key flips.');
    failed = true;
  }

  // Inverse leak test — the anonymised default must be gone once approved.
  const { approvals } = await import(`${CONFIG}?t=${Date.now()}`);
  const placeholder = approvals[key].default;
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.(html|xml|txt)$/.test(e.name)) files.push(f);
    }
  })(DIST);

  const stale = files.filter((f) => read(f).toLowerCase().includes(placeholder.toLowerCase()));
  console.log(`\ninverse leak test — placeholder "${placeholder}"`);
  if (stale.length === 0) {
    console.log('  clean: no stale placeholder anywhere in dist/.');
  } else {
    console.error(`  FAIL: still present in ${stale.map((f) => path.relative(DIST, f)).join(', ')}`);
    failed = true;
  }
} finally {
  fs.writeFileSync(CONFIG, original);
  build();
  console.log('\nsite.config.ts restored and rebuilt.');
}

process.exit(failed ? 1 : 0);

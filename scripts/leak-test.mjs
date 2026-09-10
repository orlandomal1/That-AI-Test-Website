/**
 * The leak test. Runs against the BUILT output in dist/, never against src/ — src legitimately
 * contains every unapproved value, because that is where they are stored.
 *
 * Three checks:
 *
 *   1. Forward   — no unapproved approvedValue appears anywhere in dist/.
 *   2. Forbidden — no term from site.config's forbiddenStrings appears anywhere in dist/.
 *   3. Inverse   — for each APPROVED client key, its anonymised default must NOT still appear.
 *                  A stale "A UK luxury golf travel operator" sitting next to an approved
 *                  "Halcyon Golf Travel" is as much a defect as the leak in the other direction.
 *
 * Run: npm run leaktest   (after npm run build)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { approvals, forbiddenStrings } from '../src/site.config.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');

/** Text formats a grep can actually read. PNGs are checked by eye — see the QA notes. */
const TEXT_EXT = new Set(['.html', '.xml', '.txt', '.json', '.css', '.js', '.svg']);

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (TEXT_EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const files = walk(DIST);
const failures = [];

/** Report every file containing `needle`, with a little context. */
function scan(needle, label) {
  if (!needle || needle.length < 3) return;
  const lower = needle.toLowerCase();

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const at = text.toLowerCase().indexOf(lower);
    if (at === -1) continue;

    failures.push({
      label,
      needle,
      file: path.relative(DIST, file),
      context: text.slice(Math.max(0, at - 60), at + needle.length + 60).replace(/\s+/g, ' '),
    });
  }
}

// ── 1. Forward: unapproved real values must not appear ────────────────────
for (const [key, entry] of Object.entries(approvals)) {
  if (entry.approved) continue;
  scan(entry.approvedValue, `unapproved value (${key})`);
}

// ── 2. Forbidden terms ────────────────────────────────────────────────────
for (const term of forbiddenStrings) {
  scan(term, 'forbidden term');
}

// ── 3. Inverse: approved keys must not leave their placeholder behind ─────
for (const [key, entry] of Object.entries(approvals)) {
  if (!entry.approved) continue;
  if (!entry.default) continue;
  scan(entry.default, `stale placeholder for approved ${key}`);
}

// ── 4. OG images ──────────────────────────────────────────────────────────
// A PNG cannot be grepped, so audit the manifest the build writes of exactly what text was
// rasterised into each image, and confirm every image actually exists.
const MANIFEST = path.join(__dirname, '..', '.astro', 'og-titles.json');
let ogChecked = 0;
let ogMissing = [];

if (!fs.existsSync(MANIFEST)) {
  failures.push({
    label: 'og manifest',
    needle: '.astro/og-titles.json',
    file: '(missing)',
    context: 'Run `npm run build` first — the OG audit needs the manifest the build writes.',
  });
} else {
  const ogPages = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  ogChecked = ogPages.length;

  for (const page of ogPages) {
    const png = path.join(DIST, 'og', `${page.route}.png`);
    if (!fs.existsSync(png)) ogMissing.push(`og/${page.route}.png`);

    const title = page.title.toLowerCase();

    for (const [key, entry] of Object.entries(approvals)) {
      if (entry.approved) continue;
      const secret = entry.approvedValue;
      if (secret.length > 2 && title.includes(secret.toLowerCase())) {
        failures.push({
          label: `unapproved value rasterised into OG image (${key})`,
          needle: secret,
          file: `og/${page.route}.png`,
          context: page.title,
        });
      }
    }

    for (const term of forbiddenStrings) {
      if (title.includes(term.toLowerCase())) {
        failures.push({
          label: 'forbidden term rasterised into OG image',
          needle: term,
          file: `og/${page.route}.png`,
          context: page.title,
        });
      }
    }
  }

  for (const missing of ogMissing) {
    failures.push({
      label: 'OG image missing',
      needle: missing,
      file: missing,
      context: 'Declared in the manifest but not present in dist/.',
    });
  }
}

// ── Report ────────────────────────────────────────────────────────────────
const approvedCount = Object.values(approvals).filter((e) => e.approved).length;
const total = Object.keys(approvals).length;

console.log(`leaktest — ${files.length} files in dist/, ${approvedCount}/${total} keys approved`);

console.log(`leaktest — ${ogChecked} OG image(s) audited via the build manifest`);

if (failures.length === 0) {
  console.log('leaktest — clean. No unapproved value, forbidden term or stale placeholder in dist/.');
  process.exit(0);
}

console.error(`\nleaktest — ${failures.length} leak(s):\n`);
for (const f of failures) {
  console.error(`  [${f.label}] "${f.needle}"`);
  console.error(`    ${f.file}`);
  console.error(`    …${f.context}…\n`);
}
process.exit(1);

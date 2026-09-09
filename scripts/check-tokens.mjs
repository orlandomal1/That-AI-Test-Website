/**
 * Fails the build if a colour literal appears anywhere in src/ outside the two files allowed to
 * hold one. The brief requires all tokens to come from the token layer with "nothing hard-coded
 * elsewhere"; this is what makes that checkable rather than aspirational.
 *
 * Run: npm run lint:tokens
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'src');

/** The only two files permitted to name a colour directly. */
const ALLOWED = new Set([
  path.join(SRC, 'styles', 'tokens.css'),
  path.join(SRC, 'lib', 'logo-geometry.ts'),
]);

const EXTENSIONS = new Set(['.astro', '.css', '.ts', '.tsx', '.js', '.mjs']);

const PATTERNS = [
  { name: 'hex colour', re: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'rgb()/rgba()', re: /\brgba?\s*\(/g },
  { name: 'hsl()/hsla()', re: /\bhsla?\s*\(/g },
];

/** Named CSS colours that slip past the patterns above. */
const NAMED = /(?<![\w-])(?:white|black|red|blue|green|grey|gray|silver|navy|teal|aqua|fuchsia|lime|maroon|olive|purple|yellow|orange)(?![\w-])\s*(?=[;,)}]|$)/gm;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walk(SRC)) {
  if (ALLOWED.has(file)) continue;

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // Skip comment lines — prose mentioning a hex value is documentation, not a hard-coded token.
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    for (const { name, re } of PATTERNS) {
      re.lastIndex = 0;
      const match = re.exec(line);
      if (match) {
        violations.push({ file, line: i + 1, name, text: match[0], src: trimmed });
      }
    }

    NAMED.lastIndex = 0;
    const named = NAMED.exec(line);
    if (named && /(?:color|background|fill|stroke|border)/i.test(line)) {
      violations.push({ file, line: i + 1, name: 'named colour', text: named[0], src: trimmed });
    }
  });
}

if (violations.length === 0) {
  console.log('lint:tokens — clean. No colour literals outside tokens.css and logo-geometry.ts.');
  process.exit(0);
}

console.error(`lint:tokens — ${violations.length} violation(s):\n`);
for (const v of violations) {
  const rel = path.relative(path.join(__dirname, '..'), v.file);
  console.error(`  ${rel}:${v.line}  ${v.name} "${v.text}"`);
  console.error(`      ${v.src.slice(0, 100)}`);
}
console.error('\nUse a var(--token) from src/styles/tokens.css instead.');
process.exit(1);

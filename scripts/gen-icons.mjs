/**
 * Generates the favicon and apple-touch-icon from the symbol geometry, so the icons can never
 * drift from the logo component. Run: node scripts/gen-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';
import { symbolSvg } from '../src/lib/logo-geometry.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

// Favicon: transparent, scales in the tab strip.
fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), symbolSvg({ title: 'That AI' }));

// Apple touch icon: needs an opaque ground; Set 1 surface per guidelines §2.5.
const png = new Resvg(symbolSvg({ background: '#0A0A0A' }), {
  fitTo: { mode: 'width', value: 180 },
}).render().asPng();
fs.writeFileSync(path.join(PUBLIC, 'apple-touch-icon.png'), png);

console.log('Wrote public/favicon.svg and public/apple-touch-icon.png');

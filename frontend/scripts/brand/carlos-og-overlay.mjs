#!/usr/bin/env node
/**
 * Composite the Carlos Council wordmark onto the raw OG illustration.
 *
 *   cd frontend
 *   node scripts/brand/carlos-og-overlay.mjs
 *
 * Reads public/carlos-og-raw.png (1200x630 — Carlos illustrated on the right,
 * the left side intentionally empty), overlays a serif wordmark + tagline on
 * the left ~55%, and writes public/carlos-og.png. Mirrors the look of
 * scripts/brand/og-card.svg.
 *
 * Requires `sharp` (already a frontend dependency).
 */
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const FRONTEND_ROOT = resolve(__dirname, '..', '..');
const PUBLIC_DIR = join(FRONTEND_ROOT, 'public');
const BASE = join(PUBLIC_DIR, 'carlos-og-raw.png');
const OUT = join(PUBLIC_DIR, 'carlos-og.png');

const WIDTH = 1200;
const HEIGHT = 630;

// Wordmark lives in the empty left ~55% of the raw card. Colours and type
// mirror scripts/brand/og-card.svg for a consistent brand look.
const overlaySvg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="80" y="268" font-family="Georgia, 'Times New Roman', serif" font-size="84" font-weight="700" fill="#1C1917">Carlos Council</text>
  <text x="82" y="326" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="400" fill="#57534E">More than one AI opinion.</text>
  <line x1="82" y1="358" x2="234" y2="358" stroke="#B45309" stroke-width="4" stroke-linecap="round"/>
  <text x="82" y="410" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="400" fill="#78716C">A six-agent, four-phase strategy</text>
  <text x="82" y="446" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="400" fill="#78716C">council you can self-host.</text>
</svg>`;

async function main() {
  const meta = await sharp(BASE).metadata();
  if (meta.width !== WIDTH || meta.height !== HEIGHT) {
    console.warn(
      `Base image is ${meta.width}x${meta.height}; expected ${WIDTH}x${HEIGHT}. Resizing to fit.`,
    );
  }

  await sharp(BASE)
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .png()
    .toFile(OUT);

  const out = await sharp(OUT).metadata();
  console.log(`Wrote ${OUT} (${out.width}x${out.height})`);
}

main().catch((err) => {
  console.error('OG overlay failed:', err.message);
  process.exit(1);
});

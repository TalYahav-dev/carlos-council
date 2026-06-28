// Regenerate raster brand assets from the vector sources.
//
//   cd frontend && node scripts/brand/generate-brand-assets.js
//
// Sources:
//   public/carlos-mark.svg     -> apple-touch-icon.png, favicon-32.png
//   scripts/brand/og-card.svg  -> og-card.png (1200x630 OpenGraph card)
//
// Requires `sharp` (already a frontend dependency).
/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS node script */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC = path.resolve(__dirname, '..', '..', 'public');
const BRAND = __dirname;

async function main() {
  // OpenGraph / social card — pinned to exactly 1200x630.
  const ogSvg = fs.readFileSync(path.join(BRAND, 'og-card.svg'));
  await sharp(ogSvg, { density: 144 })
    .resize(1200, 630)
    .png()
    .toFile(path.join(PUBLIC, 'og-card.png'));

  // Icons derived from the mark.
  const mark = fs.readFileSync(path.join(PUBLIC, 'carlos-mark.svg'));
  await sharp(mark, { density: 384 })
    .resize(180, 180)
    .flatten({ background: '#FFFBEB' }) // iOS home-screen icons are opaque
    .png()
    .toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  await sharp(mark, { density: 384 })
    .resize(32, 32)
    .png()
    .toFile(path.join(PUBLIC, 'favicon-32.png'));

  for (const f of ['og-card.png', 'apple-touch-icon.png', 'favicon-32.png']) {
    const meta = await sharp(path.join(PUBLIC, f)).metadata();
    console.log(`${f}: ${meta.width}x${meta.height} ${meta.format}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

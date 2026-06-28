#!/usr/bin/env node
/**
 * Generate the Carlos brand-asset set from the OpenAI Images API.
 *
 *   cd frontend
 *   node scripts/brand/generate-carlos-assets.mjs              # generate everything
 *   node scripts/brand/generate-carlos-assets.mjs --only carlos-hero
 *   node scripts/brand/generate-carlos-assets.mjs --dry-run    # print prompts, no API calls, no spend
 *   node scripts/brand/generate-carlos-assets.mjs --no-references
 *
 * Each asset's prompt = characterSheet + scene + negative (one source of truth in
 * carlos-assets.manifest.json). When reference photos exist in referenceDir, the
 * script uses the /images/edits endpoint with them so the output keeps Carlos's
 * real likeness; otherwise it falls back to /images/generations (text only).
 *
 * Requirements: OPENAI_API_KEY (read from env or the repo .env), and `sharp`
 * (already a frontend dependency) for resizing/format conversion.
 *
 * NOTE: this spends real money on image generation, and gpt-image-1 may require a
 * verified OpenAI organization. Run --dry-run first.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const FRONTEND_ROOT = resolve(__dirname, '..', '..');
const REPO_ROOT = resolve(FRONTEND_ROOT, '..');
const API_URL = 'https://api.openai.com/v1';

// ---- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NO_REFS = args.includes('--no-references');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

// ---- api key --------------------------------------------------------------
function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const envFile of [join(REPO_ROOT, '.env'), join(FRONTEND_ROOT, '.env.local')]) {
    if (!existsSync(envFile)) continue;
    const m = readFileSync(envFile, 'utf8').match(/^OPENAI_API_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

// ---- prompt assembly ------------------------------------------------------
function buildPrompt(manifest, asset) {
  return `${manifest.characterSheet}\n\nScene: ${asset.scene}\n\n${manifest.negative}`;
}

function referenceFiles(manifest) {
  const dir = join(FRONTEND_ROOT, manifest.referenceDir);
  if (NO_REFS || !existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => join(dir, f));
}

// ---- OpenAI calls ---------------------------------------------------------
async function generateImage({ apiKey, model, prompt, size, background, refs }) {
  const useEdit = refs.length > 0;
  const url = `${API_URL}/images/${useEdit ? 'edits' : 'generations'}`;
  let res;
  if (useEdit) {
    const form = new FormData();
    form.set('model', model);
    form.set('prompt', prompt);
    form.set('size', size);
    form.set('n', '1');
    if (background) form.set('background', background);
    for (const file of refs) {
      const buf = readFileSync(file);
      form.append('image[]', new Blob([buf], { type: 'image/jpeg' }), file.split('/').pop());
    }
    res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form });
  } else {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, size, n: 1, ...(background ? { background } : {}) }),
    });
  }
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }
  const json = await res.json();
  return Buffer.from(json.data[0].b64_json, 'base64');
}

// ---- post-processing ------------------------------------------------------
async function writeOutputs(rawPng, asset, outDir) {
  for (const out of asset.outputs) {
    let pipeline = sharp(rawPng).resize(out.width, out.height, { fit: 'cover' });
    if (asset.background === 'opaque') {
      pipeline = pipeline.flatten({ background: asset.backgroundColor || '#FFFBEB' });
    }
    pipeline = out.format === 'webp' ? pipeline.webp({ quality: 90 }) : pipeline.png();
    const target = join(outDir, out.file);
    await pipeline.toFile(target);
    console.log(`  → ${out.file} (${out.width}x${out.height} ${out.format})`);
  }
}

// ---- main -----------------------------------------------------------------
async function main() {
  const manifest = JSON.parse(
    readFileSync(join(__dirname, 'carlos-assets.manifest.json'), 'utf8'),
  );
  const outDir = join(FRONTEND_ROOT, manifest.outputDir);
  let assets = manifest.assets;
  if (ONLY) assets = assets.filter((a) => a.name === ONLY);
  if (assets.length === 0) {
    console.error(`No asset named "${ONLY}". Available: ${manifest.assets.map((a) => a.name).join(', ')}`);
    process.exit(1);
  }

  const refs = referenceFiles(manifest);
  console.log(`Carlos asset generation — ${assets.length} asset(s), ${refs.length} reference photo(s)${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  if (DRY_RUN) {
    for (const asset of assets) {
      console.log(`### ${asset.name}  (gen ${asset.genSize}, bg ${asset.background})`);
      console.log(buildPrompt(manifest, asset));
      console.log(`outputs: ${asset.outputs.map((o) => o.file).join(', ')}\n`);
    }
    console.log('Dry run only — no API calls made, no money spent.');
    return;
  }

  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error('OPENAI_API_KEY not found (env or repo .env). Aborting.');
    process.exit(1);
  }

  for (const asset of assets) {
    console.log(`• ${asset.name} …`);
    const rawPng = await generateImage({
      apiKey,
      model: manifest.model,
      prompt: buildPrompt(manifest, asset),
      size: asset.genSize,
      // gpt-image-2 does not support transparent backgrounds, so we always
      // request opaque; the cream-palette prompt keeps backgrounds on-brand.
      background: 'opaque',
      refs: asset.useReferences ? refs : [],
    });
    await writeOutputs(rawPng, asset, outDir);
  }
  console.log('\nDone. Review the files in public/ before wiring them into components.');
}

main().catch((err) => {
  console.error('\nGeneration failed:', err.message);
  process.exit(1);
});

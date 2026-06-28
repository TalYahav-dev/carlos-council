# Asset Generation Plan — Carlos Council

A production-ready brief for the Carlos Council visual system. **No copyrighted characters
or styles.** Carlos is an **original** character: a wise, grounded, loyal dog — a calm
companion, not a cartoon mascot.

> **Automated pipeline:** the Carlos illustrations are now generated from the real Carlos's
> photos via a reproducible script. See **[`CARLOS_ASSET_PROMPTS.md`](CARLOS_ASSET_PROMPTS.md)**
> (character sheet + per-asset prompts + `frontend/scripts/brand/generate-carlos-assets.mjs`).
> The scene prompts below are the human-readable source for that pipeline.

## What already exists in the repo

| Asset | File | Status |
|-------|------|--------|
| Carlos mark (paw + compass) | `frontend/public/carlos-mark.svg` | ✅ Real, original, in use (favicon + hero badge) |
| Social / OpenGraph card | `frontend/public/og-card.png` | ✅ Real, generated from `scripts/brand/og-card.svg` (mark + wordmark + tagline) |
| Apple touch icon + 32px favicon | `frontend/public/apple-touch-icon.png`, `favicon-32.png` | ✅ Real, derived from the mark |

The Carlos *illustrations* (hero, avatar, empty state, listening, 3× onboarding, OG portrait)
have been **generated** (gpt-image-2, from the real Carlos's photos) via the pipeline above and
**embedded** across the app. No fake/placeholder images are committed — only real assets ship.
To regenerate or restyle, edit the manifest and re-run the script.

## Character direction: who Carlos is

- **Breed feel:** a sturdy, intelligent working dog — think a calm shepherd/mixed-breed
  with warm eyes. Not breed-specific; emotionally legible.
- **Personality in one line:** the one you trust with anything — steady, perceptive, loyal.
- **Mood:** warm, grounded, quietly powerful. Present, never silly.
- **Palette:** warm amber/gold (`#B45309`), cream (`#FFFBEB`), stone neutrals
  (`#1C1917` ink, `#57534E` secondary). Soft, natural light.
- **Style:** modern editorial illustration — clean line, soft shading, a little warmth.
  Flat-ish, not hyper-real, not childish 3D.

## Asset list

### 1. Hero image — "Carlos at the head of the table"
- **Concept:** Carlos sitting calmly, attentive, as if presiding over a quiet council.
  Subtle compass/round-table motif echoing the mark.
- **Where used:** landing hero (replaces/augments the SVG badge when present).
- **Filename:** `frontend/public/carlos-hero.webp` (+ `@2x`).
- **Dimensions:** 1200×900 (4:3), transparent or cream background.
- **Alt text:** "Carlos, a calm shepherd dog, sitting attentively at the head of a round
  council table."
- **Prompt:**
  > Modern editorial illustration of a calm, wise shepherd-mix dog with warm amber eyes,
  > sitting attentively and upright at the head of a round wooden council table, soft natural
  > light, warm amber-and-cream palette, clean lines with soft shading, dignified and
  > grounded mood, lots of negative space, no text. Original character, not based on any
  > existing brand.

### 2. Onboarding illustrations (3) — "how the council works"
- **Concept:** three small scenes for the four phases: (a) five specialists around Carlos
  analyzing; (b) Carlos raising a thoughtful question (clarification); (c) Carlos presenting
  the final plan.
- **Where used:** a first-run onboarding overlay/explainer.
- **Filenames:** `onboarding-analyze.webp`, `onboarding-clarify.webp`, `onboarding-plan.webp`.
- **Dimensions:** 800×600 each.
- **Alt text:** describe each scene plainly.
- **Prompt (template):**
  > Small warm editorial illustration, amber-and-cream palette, of [scene]. Clean lines,
  > soft shading, friendly and calm, no text, generous negative space. Original style.
  - scene a: "a wise dog and five abstract advisor figures studying a document together"
  - scene b: "the same wise dog tilting its head, raising a thoughtful question, a single
    glowing question mark nearby"
  - scene c: "the wise dog presenting a tidy ten-point plan on a board to a viewer"

### 3. Empty-state illustration — "nothing here yet"
- **Concept:** Carlos resting with a chew toy / waiting patiently.
- **Where used:** empty session history, pre-first-run main area.
- **Filename:** `empty-carlos.webp`.
- **Dimensions:** 480×480, transparent background.
- **Alt text:** "Carlos resting, waiting for a brief."
- **Prompt:**
  > Minimal warm illustration of a calm dog lying down, relaxed and patient, amber-and-cream
  > palette, lots of empty space, soft lines, no text. Conveys 'waiting, ready when you are.'

### 4. Loading / deliberation moment
- **Concept:** Carlos in profile, ears up, listening — for the clarification pause and
  synthesis beats.
- **Where used:** clarification waiting state, final-synthesis reveal.
- **Filename:** `carlos-listening.svg` (vector, animatable) or `.webp`.
- **Dimensions:** 200×200.
- **Alt text:** "Carlos listening attentively while the council deliberates."

### 5. Social / OpenGraph card
- **Concept:** the mark + wordmark "Carlos Council" + tagline "More than one AI opinion."
- **Where used:** `og:image`, README hero, launch posts.
- **Filename:** `frontend/public/og-card.png`.
- **Dimensions:** 1200×630.
- **Alt text:** "Carlos Council — more than one AI opinion."

### 6. Favicon set
- Already covered by `carlos-mark.svg`. For broad device support, also export
  `favicon.ico` (32×32) and `apple-touch-icon.png` (180×180) from the mark.

## Generation options

- **Image models:** any text-to-image tool (the prompts above are model-agnostic). Keep the
  palette and "warm editorial, original character" direction consistent across all assets.
- **Vector:** the mark and listening pose can be drawn/refined in Figma/Illustrator for
  crisp scaling and animation.
- **Consistency tip:** generate the hero first, then use it as a style reference for the
  rest so Carlos looks like the same dog everywhere.

## Usage map

| Asset | Component / location |
|-------|----------------------|
| `carlos-mark.svg` | favicon (`layout.tsx`), hero badge (`BriefForm` default layout) |
| `carlos-hero.webp` | landing hero |
| `onboarding-*.webp` | first-run onboarding overlay (to build) |
| `empty-carlos.webp` | `SessionHistory` empty state, pre-run main area |
| `carlos-listening.*` | `ClarificationForm`, `FinalSynthesis` |
| `og-card.png` | `metadata.openGraph`, README, social posts |

## Guardrails

- Original character only — **no** copyrighted breeds-as-brands, mascots, or art styles.
- Don't use real photos of any specific dog unless the owner has cleared them for public use.
- Keep Carlos dignified: wise companion, never a gimmick.

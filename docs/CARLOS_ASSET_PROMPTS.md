# Carlos Asset Prompts & Generation Pipeline

A reproducible way to generate Carlos Council's brand illustrations from the **real
Carlos** — a senior yellow Labrador — so every asset looks like the same dog.

- **Prompts (single source of truth):** [`frontend/scripts/brand/carlos-assets.manifest.json`](../frontend/scripts/brand/carlos-assets.manifest.json)
- **Generator:** [`frontend/scripts/brand/generate-carlos-assets.mjs`](../frontend/scripts/brand/generate-carlos-assets.mjs)
- **Reference photos:** `frontend/scripts/brand/reference/` (gitignored — private source photos, do **not** ship)

Each prompt is assembled as `characterSheet + scene + negative`, so the look stays
consistent and you only edit one place to restyle everything.

## Character sheet (who Carlos is)

> Carlos is a real, specific **senior yellow Labrador** (a lab mix). Coat: pale
> butter-cream / light yellow, warming to soft tan along the back, ears and the bridge of
> the muzzle; near-white on the chest, blaze and lower legs. A soft **white blaze** runs up
> the muzzle and forehead. **Rosy-brown (liver) nose** with darker edges and a dark
> upper-lip line. **Warm dark-brown eyes**, gentle and a touch soft/droopy — a calm, wise,
> senior expression. **Floppy tan-amber ears**, set high. Lean, slightly houndy, deep-chested
> build — a dignified older dog. Signature accent: a **burnt-orange collar** that echoes the
> brand amber. Temperament: calm, grounded, loyal, perceptive — a wise companion, never a
> gimmick. Palette: amber `#B45309`, cream `#FFFBEB`, ink `#1C1917`, stone `#57534E`. Style:
> modern editorial illustration — clean linework, soft flat shading, generous negative space.

## Assets

| Name | Gen size | Outputs | Used for |
|------|----------|---------|----------|
| `carlos-hero` | 1024×1536 | `carlos-hero.{png,webp}` 1000×1250 | Landing hero |
| `carlos-avatar` | 1024×1024 | `carlos-avatar.{png,webp}` 256×256 | Carlos's seat on the council (AgentCard) |
| `empty-carlos` | 1024×1024 | `empty-carlos.{png,webp}` 480×480 | Empty session history / pre-run state |
| `carlos-listening` | 1024×1024 | `carlos-listening.{png,webp}` 240×240 | Clarification + final-synthesis moments |
| `onboarding-analyze` | 1024×1024 | `onboarding-analyze.webp` 800×600 | First-run onboarding (phase 1) |
| `onboarding-clarify` | 1024×1024 | `onboarding-clarify.webp` 800×600 | First-run onboarding (phase 2) |
| `onboarding-plan` | 1024×1024 | `onboarding-plan.webp` 800×600 | First-run onboarding (phase 4) |
| `carlos-og` | 1536×1024 | `carlos-og-raw.png` 1200×630 | OpenGraph card variant (wordmark added after) |

The exact scene prompt and alt text for each live in the manifest.

## How it works

When reference photos are present in `reference/`, the generator calls the OpenAI
**`/images/edits`** endpoint with them so the output keeps Carlos's real likeness. With
`--no-references` (or no photos) it falls back to **`/images/generations`** (text only).
Generated PNGs are resized/converted with `sharp` and written to `frontend/public/`.

```bash
cd frontend
node scripts/brand/generate-carlos-assets.mjs --dry-run          # print prompts, no spend
node scripts/brand/generate-carlos-assets.mjs --only carlos-hero # one asset
node scripts/brand/generate-carlos-assets.mjs                    # the whole set
```

Requirements: `OPENAI_API_KEY` (read from env or the repo `.env`) and `sharp`
(already a frontend dependency). **This spends real money**, and `gpt-image-1` may require a
**verified OpenAI organization** — run `--dry-run` first.

## Generate with Codex

Paste this to Codex (it has shell access in this repo):

> Generate the Carlos brand assets. From `frontend/`, first run
> `node scripts/brand/generate-carlos-assets.mjs --dry-run` and confirm the prompts look
> right. Then run `node scripts/brand/generate-carlos-assets.mjs --only carlos-hero` and
> open `frontend/public/carlos-hero.png` to check Carlos's likeness against the photos in
> `scripts/brand/reference/`. If the breed/coat/expression drifts, tighten the `scene` (or
> `characterSheet`) in `scripts/brand/carlos-assets.manifest.json` and regenerate that one
> asset until it reads as the same dog. Once the hero is right, generate the rest:
> `node scripts/brand/generate-carlos-assets.mjs`. Report any asset whose likeness is weak.
> Do **not** wire the assets into components — that is a separate, reviewed step.

## Guardrails

- Carlos is the owner's real dog; the photos are provided for this project. The raw photos
  stay **gitignored** — only the stylized, generated assets ship.
- Original illustration only — no copyrighted styles, breeds-as-brands, or mascots.
- After generation, **review every file** before embedding. Wiring assets into the UI
  (hero, empty state, onboarding, avatar, OG card) is a separate reviewed step.

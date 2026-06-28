# Changelog

All notable changes to Carlos Council are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project aims to follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — Open-source readiness pass

### Security
- Removed a real private business dossier from the repository and replaced it with a
  fully fictional example (`examples/business-dossier.example.md`).
- Restricted CORS to a configurable `ALLOWED_ORIGINS` allow-list (was `*` with
  credentials enabled).
- Added fail-fast validation: the backend now exits with a clear message if
  `OPENAI_API_KEY` is missing.
- Added input length limits on the brief and clarification answers.
- Added network `timeout` and `max_retries` to LLM API calls.
- Hardened `.gitignore` and both `.dockerignore` files (databases, env files, local
  artifacts, git metadata).

### Added
- Backend test suite (`backend/tests/`, 26 tests): request-model validation, business-dossier
  parsing, orchestrator four-phase flow + error path, and HTTP health/profile/validation/404.
  The LLM is mocked, so tests need no API key or network.
- Social/OpenGraph card (`og-card.png`), apple-touch-icon, and 32px favicon, plus a
  reproducible `sharp` generator (`frontend/scripts/brand/`). Wired `openGraph`/`twitter`/icon
  metadata in `layout.tsx`.
- Carlos asset-generation pipeline: a character sheet + per-asset prompts
  (`carlos-assets.manifest.json`) and a script (`generate-carlos-assets.mjs`) that renders the
  Carlos illustration set from his real photos via the OpenAI Images API (gpt-image-2).
  Documented in `docs/CARLOS_ASSET_PROMPTS.md`. Private reference photos are gitignored.
- The generated Carlos illustrations are embedded across the UI: hero portrait on the landing,
  Carlos's avatar on his council seat and the final-synthesis header, a resting-Carlos empty
  state, a listening-Carlos clarification header, and a Carlos OpenGraph card (`carlos-og.png`).
- First-run onboarding overlay (`OnboardingOverlay.tsx`): a 3-step illustrated walkthrough
  (convene → clarify → plan) that appears the first time a user opens the app **with no
  business dossier set up yet** (profile `updated_at === null`), and whose final action sends
  them into dossier setup at `/profile`. Dismissal is remembered via `carlos-onboarding-seen`;
  includes Back/Next, "Skip for now", and dialog accessibility.
- Accessibility: aria-labels on the brief textarea and icon-only history buttons, and
  proper `label`/`input` association in the clarification form.
- Carlos visual mark (`frontend/public/carlos-mark.svg`) used as the favicon and hero badge.
- Example-brief starters and a warm "guide" line on the landing page for first-run users.
- `backend/requirements.txt` as a single source of truth for dependencies.
- Open-source documentation: `SECURITY.md`, `CONTRIBUTING.md`, this changelog, an MIT
  `LICENSE` draft, and a full `docs/` set (state of repo, implementation plan, security
  audit, UX/UI review, asset plan, release checklist, Codex review prompt, launch posts).

### Changed
- Rewrote the root `README.md` into full public documentation, including the story of Carlos.
- Replaced the boilerplate `frontend/README.md`.
- Backend `Dockerfile` now installs from `requirements.txt`; modernized FastAPI startup to
  use `lifespan` instead of the deprecated `on_event`.
- Phase 1 of the council now gathers all specialists with `asyncio.gather` so a failure in
  one agent no longer orphans its siblings' tasks.
- Documented all backend env vars in `.env.example` (`ALLOWED_ORIGINS`, `LLM_TIMEOUT`,
  `LLM_MAX_RETRIES`) and removed unused Next.js boilerplate SVGs from `frontend/public/`.

### Notes
- The removed private dossier still exists in **git history** (initial commit). History
  must be rewritten (or the repo re-initialized) before publishing. See
  [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md).

## [0.1.0] — Initial build
- Six-agent, four-phase strategy council with real-time SSE streaming.
- Business Dossier profile, session history & replay, cross-session memory.
- Docker Compose setup; Railway config for the backend.

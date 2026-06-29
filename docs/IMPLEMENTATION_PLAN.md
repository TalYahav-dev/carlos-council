# Implementation Plan — Open-Source Readiness

Goal: take Carlos Council from "working internal repo" to "polished, publishable
open-source product" **without rewriting the app**. Prioritize practical completion.

## Guiding principles

- Keep the architecture. It works and is well-structured.
- Fix real risks (privacy, secrets, security defaults) first.
- Make Carlos a tasteful emotional centerpiece — wise companion, not a cartoon.
- Improve docs and onboarding so a stranger can run it.
- Be honest about what passes and what doesn't.

## What stays

- Backend orchestration, agents, prompts, SSE design, DB layer.
- Frontend component structure, design system, streaming UX.
- Docker Compose topology and Railway config.

## What changes

### A. Privacy & secrets (highest priority) — DONE in this pass
- [x] Remove the real `business-dossier/business-dossier.md` from the working tree and
      git index; preserve a backup outside the repo.
- [x] Replace it with `examples/business-dossier.example.md` (fully fictional).
- [x] Harden `.gitignore` (`.vercel`, `.claude/`, `goal.md`, `spline-plan.md`,
      `graphify-out/`, `business-dossier/`, all `*.db`).
- [x] History cleaned — original repo deleted; project re-published with a fresh history.
      Verified 2026-06-29 by fresh-clone scan: 4 commits, dossier absent, old commit gone.
- [ ] **Manual (optional):** rotate the OpenAI API key from the local `.env` — never
      committed (verified); only needed if that `.env` left your machine.

### B. Backend security hardening — DONE
- [x] Restrict CORS to configurable `ALLOWED_ORIGINS`; drop `allow_credentials`.
- [x] `config.validate()` fails fast with a clear message if `OPENAI_API_KEY` is missing.
- [x] Input length caps on brief and clarification answers (`models.py`).
- [x] LLM client `timeout` + `max_retries` (`agents/base.py`).
- [x] Modern FastAPI `lifespan` instead of deprecated `on_event`.
- [x] Consolidate dependencies into `backend/requirements.txt`; Dockerfile uses it.
- [x] Harden `.dockerignore` files (no DB, no `.env`, no `.git`).

### C. Carlos identity & assets
- [x] Create a scalable, original **paw/compass SVG mark** (logo) — no external tools, no
      copyrighted art — usable as favicon/hero/README badge.
- [x] Add a warm **"Why Carlos" story** to the README (tasteful tribute, no private data).
- [x] `docs/ASSET_GENERATION_PLAN.md` with production-ready prompts for the full visual
      system (hero, onboarding, empty states) for later generation.

### D. UX / onboarding polish
- [x] Improve the landing/empty-state copy so Carlos feels like a guide.
- [x] `docs/UX_UI_REVIEW.md` documenting weaknesses, improvements, and future work.

### E. Documentation & OSS files
- [x] Rewrite root `README.md` to the full public spec (what/why/features/setup/security/
      contributing/license/roadmap/Carlos story).
- [x] Improve `.env.example` with comments and provider examples.
- [x] Add `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE` (MIT).
- [x] Replace boilerplate `frontend/README.md`.
- [x] Add `docs/`: STATE_OF_REPO, IMPLEMENTATION_PLAN, SECURITY_AUDIT, UX_UI_REVIEW,
      ASSET_GENERATION_PLAN, RELEASE_CHECKLIST, CODEX_REVIEW_PROMPT, LAUNCH_POSTS.

### F. Verification
- [x] Frontend `npm install`, `lint`, `build`.
- [x] Backend dependency install + import/smoke check.
- [x] `docker compose build` (and document runtime startup).
- [x] Record honest pass/fail in `docs/RELEASE_CHECKLIST.md`.

## What should be removed / excluded from the public repo

- `business-dossier/business-dossier.md` (real data) — removed.
- `goal.md`, `spline-plan.md` — internal planning, gitignored.
- `graphify-out/`, `.vercel/`, `.claude/` — local artifacts, gitignored.

## Likely files edited (actual)

- Security: `backend/config.py`, `backend/main.py`, `backend/models.py`,
  `backend/agents/base.py`, `backend/Dockerfile`, `backend/.dockerignore`,
  `frontend/.dockerignore`, `.gitignore`, `.env.example`.
- Identity/UX: `frontend/public/carlos-mark.svg`, landing copy, README.
- Docs: everything under `docs/`, plus `SECURITY.md`, `CONTRIBUTING.md`,
  `CHANGELOG.md`, `LICENSE`, `frontend/README.md`, `examples/`.

## Explicit non-goals (avoid over-engineering)

- No authentication system (the tool is local/self-hosted by design; documented instead).
- No database migration framework or Postgres swap.
- No rewrite of the orchestrator or frontend.
- No paid services introduced.

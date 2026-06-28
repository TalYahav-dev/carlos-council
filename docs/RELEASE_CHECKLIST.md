# Release Checklist — Carlos Council

Honest status of build/lint/test/Docker checks and the steps required before publishing
publicly. Checks were run against the working tree on `master` (changes not yet committed).

## Verification status (what actually ran)

| Check | Command | Result |
|-------|---------|--------|
| Frontend install | `cd frontend && npm install` | ✅ Pass (exit 0) |
| Frontend lint | `cd frontend && npm run lint` | ✅ Pass — clean (after fixing a real ref-during-render error in `useTypewriter.ts`) |
| Frontend build | `cd frontend && npm run build` | ✅ Pass — compiled, 4 routes generated |
| Backend install | `pip install -r backend/requirements.txt` | ✅ Pass |
| Backend import smoke | `python -c "import main"` | ✅ Pass |
| Backend validators | manual Pydantic checks | ✅ Pass — brief cap, empty-brief reject, answer cap, `config.validate()` all behave |
| Docker build (both) | `docker compose build` | ✅ Pass — `carlos-council-backend` (179 MB) + `carlos-council-frontend` (1.01 GB) |
| Docker Compose up | `docker compose up -d --build` | ✅ Pass — both containers start; backend `/health` returns ok, frontend serves 200, frontend→backend proxy (`/api/profile`) returns data. A full LLM council run (paid) was not exercised |
| Automated tests | `cd backend && pytest` | ✅ Pass — 26 tests (models validation, dossier parsing, orchestrator phase flow + error path, API health/profile/validation/404). LLM is mocked; no network. Install: `pip install pytest pytest-asyncio httpx` |

**Nothing here is claimed to pass that wasn't run.** The two items not fully verified are
called out explicitly above.

## Must-do before publishing (manual, required)

- [ ] **Rewrite git history or re-init the repo** to purge the real business dossier from
      the initial commit. See [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) for exact commands.
      _(Not done automatically, by design.)_
- [ ] **Rotate the OpenAI API key** that was in the local `.env` (never committed, but
      rotate to be safe).
- [ ] **Confirm the LICENSE** copyright holder name and that MIT is intended (remove the
      note at the top of `LICENSE`).
- [ ] **Skim for any other private notes** before the first public push (the gitignored
      `goal.md`, `spline-plan.md`, `graphify-out/` should remain local).
- [ ] **Run the stack once end-to-end** with a real key and complete a full council to
      confirm streaming, clarification, and final plan all work in your environment.

## Recommended before publishing (not blocking)

- [x] Add a few backend tests (orchestrator phase transitions, API happy-path). — done: `backend/tests/`, 26 tests.
- [x] Generate the real Carlos hero/onboarding assets (see asset plan). — done: full set generated
      from the real Carlos's photos via `frontend/scripts/brand/generate-carlos-assets.mjs`
      (gpt-image-2) and embedded (hero, avatar, empty state, listening, OG card, first-run onboarding).
- [ ] Pin backend dependencies (exact versions or a lockfile).
- [ ] Add screenshots/GIF to the README.
- [ ] Accessibility pass (labels, focus, contrast).
- [ ] Decide on `ALLOWED_ORIGINS` for any hosted deployment.

## Nice-to-have (post-launch)

- [ ] CI workflow (lint + build on PRs).
- [ ] Session export (Markdown/PDF).
- [ ] Optional auth for shared deployments.
- [ ] Dark mode.

## Definition of done (from the brief) — status

| Criterion | Status |
|-----------|--------|
| App installs locally | ✅ |
| App runs with Docker | ✅ (containers up, health + proxy verified; one full LLM council run still recommended) |
| README clear for a stranger | ✅ |
| No obvious secrets exposed | ✅ (key never committed; private dossier removed from tree) |
| No private API keys in frontend | ✅ |
| Backend handles private services | ✅ |
| UX improved | ✅ (Carlos mark, hero copy, example briefs) |
| Onboarding exists/scaffolded | ✅ (first-run onboarding overlay with 3 illustrated steps + example briefs) |
| Carlos has a clear identity | ✅ (mark + story + voice + full generated illustration set, embedded across the app) |
| Required docs exist | ✅ |
| Build/test/lint status documented honestly | ✅ (this file) |
| Launch posts ready | ✅ |
| Codex review prompt ready | ✅ |
| **Publishable right now?** | ⚠️ **After** the git-history rewrite + key rotation above |

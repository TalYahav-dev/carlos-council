# Security Audit — Carlos Council

_Performed during the open-source readiness pass. Scope: secrets, frontend/backend
separation, input handling, CORS, dependencies, Docker, committed artifacts, git history._

## Summary

| Severity | Finding | Status |
|----------|---------|--------|
| 🔴 Critical | Real private business dossier committed to the repo | **Fixed in tree** — file removed & replaced with fictional example. ⚠️ Still in **git history** — manual history rewrite required before publish |
| 🔴 Critical | Live OpenAI API key present in local `.env` | **Not exposed** (`.env` is gitignored and was **never committed** — verified). ⚠️ **Rotate the key** as a precaution |
| 🟠 High | CORS `allow_origins=["*"]` + `allow_credentials=True` | **Fixed** — restricted to configurable `ALLOWED_ORIGINS`, credentials disabled |
| 🟠 High | No input length limits (brief / answers) | **Fixed** — length caps in `models.py` |
| 🟠 High | LLM calls had no timeout/retry | **Fixed** — `timeout` + `max_retries` on the client |
| 🟡 Medium | No authentication on any endpoint | **Documented** as by-design (local/trusted-network); see SECURITY.md |
| 🟡 Medium | No rate limiting | **Documented** — recommend reverse-proxy limiting for public deploys |
| 🟡 Medium | `.gitignore` / `.dockerignore` gaps | **Fixed** — hardened all three |
| 🟡 Medium | Dependencies duplicated & unpinned | **Improved** — single `requirements.txt`; pinning recommended (see below) |
| 🟢 Low | Boilerplate / planning files in tree | **Fixed** — gitignored (`goal.md`, `spline-plan.md`, `graphify-out/`, `.vercel`, `.claude/`) |

## What was checked

- **Secrets scan** of the working tree and the **entire git history** for `sk-proj`,
  `sk-or-`, `sk-ant`, and `OPENAI_API_KEY` values. Result: the key lives only in the
  local gitignored `.env`; it does **not** appear in any commit.
- **Frontend key exposure**: searched `frontend/src` for `NEXT_PUBLIC_`, `sk-`, and
  `api_key`. Result: no secret. The only public env var is `NEXT_PUBLIC_SPLINE_SCENE_URL`
  (a non-secret scene URL) and `NEXT_PUBLIC_API_URL` (unset → same-origin proxy).
- **Frontend/backend separation**: confirmed the browser calls a **same-origin Next.js
  proxy** (`frontend/src/app/api/[...path]/route.ts`) that forwards server-side to the
  backend. The LLM key is read only in `backend/config.py`. ✅ Clean separation.
- **CORS**: was wildcard + credentials (invalid and over-permissive).
- **Input validation**: `BriefRequest`/`ClarificationAnswer` had no bounds.
- **Committed artifacts**: found `business-dossier/business-dossier.md` (real data) and a
  `.vercel/project.json` (project/org IDs — untracked, now gitignored).
- **Dependencies**: `pyproject.toml` + `Dockerfile` listed deps twice, all `>=`.
- **Docker**: base images are official slim images; `.dockerignore` files were thin.

## What was fixed (in this pass)

1. **Private data removed.** `business-dossier/business-dossier.md` deleted from the tree
   and unstaged from the index; a fictional `examples/business-dossier.example.md` added so
   the import feature still works. A backup of the original was kept **outside** the repo.
2. **CORS locked down.** `ALLOWED_ORIGINS` env-driven allow-list; `allow_credentials=False`.
3. **Fail-fast config.** `config.validate()` raises a clear error if `OPENAI_API_KEY` is
   unset; called from the FastAPI `lifespan` startup.
4. **Input bounds.** Brief ≤ 20,000 chars (non-empty); each clarification answer ≤ 5,000
   chars; ≤ 20 answers.
5. **Network resilience.** LLM client `timeout` (120s) and `max_retries` (2), both env-tunable.
6. **Ignore hardening.** `.gitignore` + both `.dockerignore` files now exclude databases,
   env files, git metadata, and local tool artifacts.
7. **Dependency consolidation.** Single `backend/requirements.txt`; Dockerfile installs
   from it.

## What still needs human attention (action required before publishing)

1. **🔴 Rewrite git history or re-initialize the repo.** The real dossier is in the initial
   commit (`6415645`). Removing the file now does **not** remove it from history. Options:
   - Simplest for a brand-new public repo: start a fresh history
     (`rm -rf .git && git init && git add . && git commit`), **after** confirming no other
     private data remains, **or**
   - Targeted removal with `git filter-repo --path business-dossier/business-dossier.md --invert-paths`
     (then force-push to a clean remote).
   - Per the brief, this is **not** done automatically — you decide and run it.
2. **🔴 Rotate the OpenAI API key** that was in the local `.env`. It was never committed,
   but rotating costs nothing and removes all doubt.
3. **🟡 Confirm no other private notes** before publishing (the gitignored `goal.md`,
   `spline-plan.md`, and `graphify-out/` should stay out of the public repo).
4. **🟡 Consider pinning dependencies** (exact versions or a lockfile) for reproducible
   builds and supply-chain safety.
5. **🟡 If deploying publicly**, add an authenticating reverse proxy and set
   `ALLOWED_ORIGINS` to your real origin.

## Residual risks (acceptable for the stated use case, documented)

- **No app-layer auth / rate limiting / encryption at rest** — intended for local or
  trusted-network single-user use. Stated plainly in `SECURITY.md` and the README.
- **Prompt-injection surface** — user input is, by design, fed to the LLM. Length is now
  bounded; treat model output as untrusted and never execute it.
- **In-memory session growth** — `active_sessions` and per-session event history are not
  evicted; fine for local use, would need bounds for sustained multi-user load.

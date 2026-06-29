# State of the Repo — Carlos Council

_A candid analysis of the repository as found, before the open-source preparation pass._
_Written for maintainers and reviewers. Honest about what works and what does not._

## 1. What this product currently does

Carlos Council is a **multi-agent AI strategy tool**. You submit a business brief and six
AI "strategists" analyze it through a structured, four-phase debate that streams to your
browser in real time:

1. **Initial Analysis** — five specialist agents (Storyteller, Product Architect, Revenue
   Strategist, Growth Hunter, Field Operator) analyze the brief in parallel.
2. **Synthesis & Clarification** — a sixth agent, **Carlos** (the "Chief Strategy
   Conductor"), synthesizes the five takes, surfaces tensions, and asks you 2–3
   clarification questions.
3. **Debate** — Carlos runs two rounds of moderated debate among the specialists.
4. **Final Plan** — Carlos delivers a 10-point strategic plan.

A persistent **Business Dossier** (a structured company profile) can be attached so every
session is grounded in the same context. Past sessions are saved and replayable, and the
system extracts "lessons" from each session to inform future ones.

The product is **functional and surprisingly complete** for its stage. The core loop works.

## 2. Main technologies

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, OpenAI SDK (`AsyncOpenAI`), aiosqlite, sse-starlette, python-dotenv |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, react-markdown |
| Streaming | Server-Sent Events (SSE) with a polling fallback |
| Storage | SQLite (WAL mode) |
| Packaging | Docker + Docker Compose; Railway config for the backend |
| Optional | Spline (`@splinetool/react-spline`) for an optional 3D hero scene |

The backend uses the **OpenAI SDK against a configurable base URL**, so it works with any
OpenAI-compatible provider (OpenAI, OpenRouter, Ollama, vLLM, …).

## 3. Frontend structure

```
frontend/src/
├── app/
│   ├── layout.tsx            # Root layout, fonts, metadata
│   ├── page.tsx              # Main flow: idle → running → replay
│   ├── globals.css           # Design system (CSS variables, animations)
│   ├── profile/page.tsx      # Business Dossier editor page
│   └── api/[...path]/route.ts# Server-side proxy to the backend
├── components/               # ~15 components (AgentCard, CouncilView, …)
├── hooks/                    # useCouncilStream (SSE+polling), useAutoScroll, useTypewriter
├── stores/councilStore.ts    # Zustand state
└── lib/                      # api.ts (fetch helpers), agents.ts (metadata), types.ts
```

The frontend is **well-organized and fairly polished**: a coherent design system (warm
neutral palette, gold accent, Instrument Serif + DM Sans), per-agent colors, streaming
typewriter output, phase progress UI, session history sidebar, error toasts, and a
reduced-motion accessibility path. Light mode only.

**Key architectural strength:** the browser never holds an API key. `lib/api.ts` calls
same-origin `/api/...`, which the Next.js route handler (`app/api/[...path]/route.ts`)
proxies server-side to the backend. The LLM key stays on the backend.

## 4. Backend structure

```
backend/
├── main.py            # FastAPI app, endpoints, SSE, CORS, lifespan
├── config.py          # Env loading + (new) validation
├── orchestrator.py    # The 4-phase state machine — core logic
├── session.py         # In-memory session state, event history buffer
├── streaming.py       # SSE event formatting
├── agents/            # BaseAgent + Carlos + 5 specialists
├── prompts/           # Markdown system prompts + phase templates
├── database.py        # aiosqlite schema + queries
├── memory.py          # Cross-session lesson extraction/injection
├── dossier.py         # Business-profile parser + prompt rendering
├── models.py          # Pydantic request/response models
└── scripts/import_business_dossier.py
```

The orchestration is **thoughtfully designed**: Phase 1 fans out with `asyncio.create_task`
and a shared queue; the clarification pause uses an `asyncio.Event` with keep-alive pings;
SSE events are buffered in an `event_history` list so late-connecting clients can replay.

## 5. API routes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check |
| POST | `/api/council/start` | Start a session |
| GET | `/api/council/{id}/stream` | SSE event stream |
| POST | `/api/council/{id}/clarify` | Submit clarification answers |
| GET | `/api/council/{id}/status` | Phase/status |
| GET | `/api/council/{id}/snapshot` | Full current state (polling fallback) |
| GET | `/api/sessions` / `/api/sessions/{id}` | List / fetch sessions |
| GET/PUT | `/api/profile` | Read/update the Business Dossier |
| GET/POST | `/api/profile/sources` | Profile import audit trail |

## 6. Database / storage

SQLite (`backend/data/council.db`), created on startup. Tables: `sessions` (brief +
full transcript JSON), `lessons`, `organization_profiles` (singleton dossier),
`profile_sources`, `session_context_snapshots`. No encryption at rest; intended for
local/self-hosted single-tenant use. The DB file is gitignored.

## 7. Docker / build / deploy

- `docker-compose.yml` — backend (`8006→8000`) + frontend (`3006→3000`). Backend reads
  `.env`; frontend gets `COUNCIL_BACKEND_URL` to reach the backend service.
- `backend/Dockerfile`, `frontend/Dockerfile` — both build cleanly.
- `railway.toml` — deploys the backend on Railway.
- The compose setup is the intended "clone and run" path.

## 8. Authentication / security model

**There is no authentication.** Every endpoint is open. This is acceptable for the
intended use (local or trusted-network, single user) but must be stated clearly. See the
[Security Audit](SECURITY_AUDIT.md) for the full list. The most important findings as
found were:

- A **live OpenAI API key** sat in the local `.env` (gitignored, **never committed** —
  verified against full git history). Rotation is optional. _(Resolved status below.)_
- A **real, private business dossier** (`business-dossier/business-dossier.md`) was
  committed in the original repo's initial commit. **Resolved:** that repo was deleted and
  the project re-published with **clean history** — verified 2026-06-29 that the dossier is
  absent from the tree and all commits.
- CORS was `allow_origins=["*"]` with credentials enabled.
- No input length limits; LLM calls had no timeout/retry; no rate limiting.

## 9. UX / UI state

Strong for an early product. Present: landing/brief form, live streaming with per-agent
cards, phase indicator, clarification form, final synthesis, session history + replay,
error toasts, dossier editor, reduced-motion support, responsive layout. Weak/missing:
**Carlos has almost no visual presence** (a gold "C" letter badge, a small star, and a
paw-print icon in one loading state — no actual character/illustration); no real onboarding
or first-run guidance; limited ARIA/keyboard a11y; light mode only.

## 10. What works

- The full four-phase council loop, end to end.
- Real-time SSE streaming with a graceful polling fallback.
- Parallel Phase 1 execution.
- Clarification pause/resume.
- Session persistence and replay.
- Business Dossier editor with JSON validation.
- Docker Compose bring-up.

## 11. What is incomplete or rough

- **Carlos as a character/mascot** is barely realized visually (see UX review).
- **Onboarding / empty states** are thin — a first-time user gets little guidance.
- **Error resilience** in LLM calls was missing (now improved: timeout + retries).
- **Input validation** was absent (now added: length caps).
- **No tests** of substance; `pyproject` lists pytest but there are no test files.
- The Spline 3D hero requires a user-supplied scene URL to show anything.
- `frontend/README.md` is still the default `create-next-app` boilerplate.

## 12. Risks, missing pieces, unclear parts

- **Privacy:** ✅ resolved — repo re-created with clean history; dossier absent from tree
  and history (verified 2026-06-29).
- **Secret hygiene:** API key never committed (verified); rotation optional.
- **No auth + open CORS (now restricted):** fine for local use, dangerous if exposed to
  the internet without a reverse-proxy auth layer.
- **In-memory `active_sessions`** grows without eviction — fine for local use, a memory
  leak under sustained multi-user load.
- **Unbounded event history** per session — same caveat.
- **Prompt-injection surface:** user brief/answers flow into prompts (inherent to the
  product; bounded now by length limits, but worth documenting).

## 13. Suggested product direction

Keep the architecture — it's sound and does not need a rewrite. For a credible public
release, the priorities are: (1) **remove all private data and rotate secrets**, (2)
**give Carlos a real, tasteful visual identity** (the emotional hook the product is named
for), (3) **polish onboarding/empty states and the README**, and (4) **add the standard
open-source files** plus an honest security note. The product's pitch — "more than one AI
opinion; perspectives that collide and get stress-tested" — is genuinely differentiated and
worth leaning into.

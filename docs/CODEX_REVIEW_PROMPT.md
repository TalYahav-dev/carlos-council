# Codex Review Prompt

Paste the prompt below into Codex (or any capable code-review agent) with the repository
attached/open. It is written to produce a prioritized, file-referenced, publish/no-publish
review.

---

## Prompt to paste

> You are a senior security engineer and open-source release reviewer. Review the
> **Carlos Council** repository as if it is about to be published publicly on GitHub for
> the first time. The owner is a first-time open-source author and wants nothing
> embarrassing or dangerous to ship.
>
> **Context:** Carlos Council is a multi-agent AI strategy tool. Backend = FastAPI +
> Python + OpenAI SDK + SQLite; frontend = Next.js 16 + React 19 + TypeScript. The browser
> calls a same-origin Next.js proxy (`frontend/src/app/api/[...path]/route.ts`) that
> forwards server-side to the backend; the LLM API key is meant to live only on the
> backend. The app is intended for local/trusted-network single-user use and has no auth by
> design. A prior pass removed a private business dossier from the working tree (it may
> still be in git history) and hardened CORS, input validation, and ignore files.
>
> **Review and report on:**
> 1. **Secrets & private data** — scan the working tree **and git history** for API keys,
>    tokens, passwords, private URLs, personal/business data, and committed build
>    artifacts. Flag anything that must not be public.
> 2. **Frontend/backend separation & API-key exposure** — confirm no secret reaches the
>    browser; verify the proxy boundary; check for any `NEXT_PUBLIC_` leak.
> 3. **Security vulnerabilities** — CORS, input validation, prompt-injection handling,
>    SSRF via the proxy (can a client make the proxy fetch arbitrary internal URLs?),
>    unsafe logging of PII/secrets, error messages leaking internals, path traversal in the
>    dossier import or `[...path]` proxy, and the unauthenticated endpoints.
> 4. **Auth/session handling** — is the "no auth, local-only" stance safe and clearly
>    documented? Any way data leaks across sessions?
> 5. **Dependency risks** — unpinned or vulnerable dependencies (Python and npm); supply
>    chain concerns.
> 6. **Docker** — image hygiene, build context leakage (`.dockerignore`), secrets in
>    layers, root user, exposed ports.
> 7. **Build/runtime correctness** — anything that breaks `npm run build`, `docker compose
>    up`, or backend startup; broken env handling; the in-memory session growth.
> 8. **README & onboarding** — are the instructions correct and runnable by a stranger?
>    Any wrong commands, ports, or env var names?
> 9. **UX edge cases & accessibility** — error/empty/loading states, keyboard/ARIA,
>    contrast, mobile.
> 10. **Performance** — obvious bottlenecks (unbounded buffers, re-renders, blocking calls).
> 11. **Open-source readiness** — license clarity, missing files, files that should not be
>     public, anything that would embarrass the owner if published today.
>
> **Output format:**
> - A **prioritized bug/issue list**, each with: severity (Critical / High / Medium / Low),
>   exact **file path and line numbers**, a one-line description, and a concrete suggested
>   fix.
> - A separate **security-risk table** with severity ratings.
> - A list of **files that should not be made public**.
> - A final **PUBLISH / DO-NOT-PUBLISH recommendation** with the top 3 blocking items (if
>   any) and the top 5 nice-to-haves.
>
> Be specific and skeptical. Prefer false positives you flag for review over silent misses.
> If you cannot verify git history from the provided context, say so and list what you would
> check.

---

### Suggested attachments / context to give Codex
- The full repo (including `.git` if possible, so history can be scanned).
- These docs: `docs/SECURITY_AUDIT.md`, `docs/STATE_OF_REPO.md`, `SECURITY.md`.
- The note that the private dossier was removed from the tree but **may remain in git
  history** (initial commit) — ask Codex to confirm and recommend the cleanup.

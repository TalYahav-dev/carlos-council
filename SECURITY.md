# Security Policy

## Supported versions

Carlos Council is an early-stage open-source project. Security fixes are applied to the
`main` branch. There are no long-term support branches yet.

## Threat model (read this first)

Carlos Council is designed for **local or trusted-network, single-user** use. By default:

- **There is no authentication.** Anyone who can reach the backend can start sessions,
  submit clarifications, and read every saved transcript and the Business Dossier.
- **CORS** is restricted to local development origins by default (`ALLOWED_ORIGINS`).
- The **LLM API key lives only on the backend** and is never exposed to the browser. The
  frontend calls a same-origin proxy route that forwards to the backend server-side.

If you expose Carlos Council to the public internet, you **must** add your own protection:

1. Put it behind an **authenticating reverse proxy** (e.g. Caddy/nginx basic-auth, OAuth2
   proxy, Cloudflare Access).
2. Set `ALLOWED_ORIGINS` to only your real frontend origin(s).
3. Consider rate limiting at the proxy layer.
4. Treat the SQLite database as sensitive — it stores full transcripts and your dossier.

## Secrets

- Never commit `.env`. It is gitignored. Use `.env.example` as the template.
- The API key is read from the backend environment only.
- If a key is ever committed or shared, **rotate it immediately** — git history preserves
  secrets even after deletion.

## Reporting a vulnerability

If you find a security issue, please **do not open a public GitHub issue**. Instead:

- Open a **GitHub Security Advisory** (the "Report a vulnerability" button under the
  repository's **Security** tab), **or**
- Contact the maintainer privately.

Please include: a description, reproduction steps, affected files/endpoints, and the
potential impact. We aim to acknowledge reports within a few days. Responsible disclosure
is appreciated — give us a reasonable window to fix before public disclosure.

## Known limitations (by design, documented honestly)

| Area | Status |
|------|--------|
| Authentication | None — add a reverse proxy for public deployments |
| Rate limiting | None at the app layer |
| Encryption at rest | None — SQLite file is plaintext |
| Prompt injection | User input flows into prompts (inherent to the product); input length is capped |
| Multi-tenancy | Not supported — single shared dossier and session store |

See [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md) for the full audit performed during
open-source preparation.

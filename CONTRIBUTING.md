# Contributing to Carlos Council

Thanks for your interest — this is a young open-source project and contributions are
genuinely welcome, from typo fixes to new features.

## Ground rules

- Be kind. Assume good intent.
- Keep changes focused. Smaller PRs get reviewed faster.
- Match the existing style — clear, boring, maintainable code over cleverness.
- Don't commit secrets, real business data, or large generated artifacts. Check
  `git status` before committing.

## Getting set up

See the [README](README.md) for full setup. The short version:

```bash
cp .env.example .env          # add your OPENAI_API_KEY
docker compose up -d --build  # full stack, or run backend/frontend separately
```

For local dev without Docker:

```bash
# Backend
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Before you open a PR

Run the checks that exist today:

```bash
cd frontend && npm run lint && npm run build
# Backend: make sure it imports and starts
cd backend && python -c "import main"
```

If you add backend logic, please add a `pytest` test if you can — the test suite is thin
and we'd love to grow it (`pip install -e ".[dev]"`).

## Where help is most valuable

- ✅ **Tests** — backend orchestration and API endpoints have no coverage yet.
- ♿ **Accessibility** — ARIA labels, keyboard navigation, focus states.
- ✨ **Onboarding & empty states** — make the first run feel guided.
- 🎨 **Carlos visual assets** — see [`docs/ASSET_GENERATION_PLAN.md`](docs/ASSET_GENERATION_PLAN.md).
- 📝 **Docs** — clarity for first-time users.

## Commit & PR conventions

- Write clear commit messages (a short imperative subject line is great).
- Reference any related issue in the PR description.
- Describe what you changed and how you verified it.
- Note any known limitations or follow-ups.

## Code of conduct

Be respectful and constructive. Harassment or discrimination of any kind isn't welcome
here. If something feels off, contact the maintainer.

## License

By contributing, you agree your contributions are licensed under the project's
[MIT License](LICENSE).

# Carlos Council — Frontend

The Next.js (App Router) frontend for [Carlos Council](../README.md). See the root README
for the full project overview, the story of Carlos, and Docker instructions.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Zustand · react-markdown.
Real-time updates use Server-Sent Events with an automatic polling fallback.

## Local development

```bash
npm install
echo "COUNCIL_BACKEND_URL=http://127.0.0.1:8000" > .env.local
npm run dev
```

Open http://localhost:3000. The backend must be running (see the root README).

## How it talks to the backend

The browser never holds an API key. `src/lib/api.ts` calls **same-origin** `/api/...`,
which the route handler at `src/app/api/[...path]/route.ts` proxies **server-side** to the
backend at `COUNCIL_BACKEND_URL`. The LLM key stays on the backend.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Environment variables

| Variable | Description |
|----------|-------------|
| `COUNCIL_BACKEND_URL` | Backend address the proxy forwards to (server-side only) |
| `NEXT_PUBLIC_SPLINE_SCENE_URL` | Optional 3D hero scene URL (public; safe in the browser) |

## Project layout

```
src/
├── app/          # routes, layout, global styles, API proxy
├── components/   # UI components
├── hooks/        # SSE stream, auto-scroll, typewriter
├── stores/       # Zustand store
└── lib/          # api client, agent metadata, types
```

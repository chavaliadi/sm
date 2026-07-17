# Sagarmala 2.0 Portal — Frontend

Vite + React + TypeScript frontend for the MVP. Scaffold only — `HomePage`
just proves the frontend can reach the backend; replace it with the real
Dashboard once modules start landing.

## Stack

React 19 - TypeScript - Vite - Tailwind CSS v4 - shadcn/ui (config ready,
components added on demand) - React Router - Axios - React Hook Form + Zod

## Structure

```
src/
├── api/          → axios client + one function per backend endpoint
├── components/
│   └── ui/       → shadcn/ui components land here via `npx shadcn add <name>`
├── features/     → one folder per module once built (e.g. features/dpr/)
├── hooks/        → shared React hooks
├── layouts/      → page shells (AppLayout = sidebar + topbar + content)
├── lib/          → utils.ts (the shadcn cn() helper)
├── pages/        → route-level page components
├── routes/       → route table (src/routes/index.tsx)
├── types/        → shared TypeScript types mirroring backend schemas
└── utils/        → general helpers (empty for now)
```

## Setup

```bash
npm install
cp .env.example .env    # VITE_API_BASE_URL, defaults to localhost:8000
```

## Run

```bash
npm run dev
```

Open http://localhost:5173 — it should show "Project scaffold running" with
a green "connected" health-check result if the backend is also running.

## Build

```bash
npm run build      # runs tsc typecheck + vite build
```

## Adding shadcn/ui components

components.json is already configured (new-york style, @/ aliases, CSS
variables in src/index.css). From a machine with normal internet access:

```bash
npx shadcn@latest add button
npx shadcn@latest add table
npx shadcn@latest add form
```

(This couldn't be verified from the sandboxed environment this scaffold was
built in — ui.shadcn.com wasn't reachable there. Config is correct; it
should just work.)

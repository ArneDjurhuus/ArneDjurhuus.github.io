# SquadSpace — Coding Agent Instructions (short)

## Mission & Scope
Build SquadSpace: Spaces, realtime Notes, lightweight Tasks, and a daily AI Digest. Optimize for working software; defer auth/SSO/billing.

## Architecture (dirs → purpose)
- apps/web (Next.js 14, TS): UI, server routes proxy to API, TipTap+Yjs editor
- apps/api (NestJS + Prisma): Spaces, Tasks, EventLog, Digest; PrismaService wrapper
- apps/yjs-server (y-websocket): realtime doc sync (ydocId)
- apps/ai (FastAPI): POST /digest summarizer
- packages/db/prisma/schema.prisma: shared schema (API also has a copy under apps/api/prisma)

## Conventions that matter
- API always returns `{ ok, data | error }`. Validate DTOs (class-validator). Use `PrismaService`.
- Web server routes under `apps/web/src/app/api/**` proxy to API and normalize responses to JSON (see `app/api/digests/route.ts`).
- Subdomain middleware maps `demo.localhost` → `/spaces/demo` and must NOT rewrite `/api/**` (see `src/middleware.ts`).
- Server components must fetch via absolute URL built from `headers()` (proto + host).
- TipTap pinned to 2.6.6; webpack aliases map `@tiptap/pm/*` → prosemirror packages (see `next.config.js`).

## Key flows & files
- Spaces: `apps/api/src/spaces/*`; Web pages `apps/web/src/app/spaces/[slug]/*`
- Notes: Yjs via `apps/yjs-server`; Web editor `src/components/RealtimeEditor.tsx`
- Tasks: `apps/api/src/tasks/*` (logs `EventLog` on create/update)
- Digests: API `apps/api/src/digests/*`
  - POST `/digests` → compose last 24h events → call AI `/digest` → persist Digest
  - GET `/digests/latest?spaceId=...` → latest summary
  - Web UI: proxy `app/api/digests` (POST+GET), button in `spaces/[slug]/page.tsx`

## Contracts (v0)
- GET `/spaces`, GET `/spaces/:slug`
- POST `/tasks`, PATCH `/tasks/:id`
- POST `/digests` { spaceId } → { id, summary }
- GET `/digests/latest?spaceId=...` → { id, summary, createdAt }

## Data Model (slice)
User, Space(slug), Membership, Note(ydocId), Task(status), EventLog(type,payload,createdAt), Digest(id,spaceId,summary,createdAt)

## Dev runbook (Docker)
- `docker compose up --build -d`
- Ports: web 3000, api host 4001→container 4000, yjs 1234, ai 8000
- API container runs `prisma generate/migrate/seed` on start (demo space slug `demo`).
- Web env in container: `NEXT_PUBLIC_API_URL=http://api:4000`; local host dev (outside Docker): `http://localhost:4001`.

## Gotchas
- If digest button shows HTML/404: ensure middleware excludes `/api/**` and web calls `/api/digests` (proxy) not API directly.
- If server fetch fails with “parse URL”: build absolute URL from `headers()`.
- TipTap build errors: keep @tiptap packages pinned to 2.6.6 and keep webpack aliases.
- Schema lives in `packages/db/prisma/schema.prisma` (API also has schema dir). Run migrations from API.

## Tests (API)
Jest + supertest for Tasks & Digests under `apps/api/test/**`. Keep response shape `{ ok, ... }` in tests.

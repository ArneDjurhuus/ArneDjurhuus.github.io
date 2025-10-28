# SquadSpace – Technical Overview

This document explains how the entire codebase works end-to-end: architecture, data model, service boundaries, key flows (Spaces, Tasks, Realtime Notes, AI Digest, and Signup/Profile), runtime, and testing. It references paths from this repository.

## Repository structure at a glance

- apps/
  - api/ – NestJS HTTP API with Prisma/PostgreSQL
  - web/ – Next.js 14 frontend (App Router)
  - yjs-server/ – y-websocket server for realtime notes
  - ai/ – FastAPI microservice for daily digest summaries
- packages/
  - db/ – Shared Prisma schema (kept in sync with apps/api)
- docker-compose.yml – Brings up db, api, web, yjs-server, and ai

## Data model (Prisma)

Files: `apps/api/prisma/schema.prisma` and `packages/db/prisma/schema.prisma`

Models (MVP):

- User
  - id (cuid), email (unique), name?, passwordHash (required)
  - Relations: memberships, tasks (as assignee)
- Space
  - id, name, slug (unique), plan
  - Relations: memberships, notes, tasks, eventLogs
- Membership
  - userId + spaceId composite key, role (string)
  - Relations: user, space
- Note
  - id, spaceId, title, ydocId (unique)
  - Relation: space
- Task
  - id, spaceId, title, status (string), description?, assigneeId?, dueAt?
  - Relations: space, assignee (User)
EventLog
  - id, spaceId, type (string), payload (Json), createdAt (default now)
  - Relation: space

Migrations:

- `apps/api/prisma/migrations/**` – SQL migrations generated/applied by Prisma
- Includes an additive migration to add `User.passwordHash` for signup auth.

Seeding:

- `apps/api/prisma/seed.ts` – Creates a demo user, demo space (slug: demo, id: 1), demo note, and demo task. The demo user gets a bcrypt-hashed password for local/dev usage.

## Backend API (NestJS + Prisma)

Entrypoint:

- `apps/api/src/main.ts` – Bootstraps Nest app, global ValidationPipe, and CORS policy; listens on port 4000 in the container. Compose maps it to 4001 on the host by default.

Core wiring:

- `apps/api/src/app.module.ts` – Registers feature modules (SpacesModule, TasksModule, AuthModule), controllers, and `PrismaService`.
- `apps/api/src/prisma.service.ts` – Thin wrapper over `@prisma/client` managing lifecycle connect/disconnect.

Health:

- `GET /health -> { ok: true }` via `AppController`/`AppService`.

Spaces:

- Module: `apps/api/src/spaces/*`
- Endpoints (minimal MVP):
  - `GET /spaces -> Space[]`
  - `GET /spaces/:slug -> Space`
- Implementation details: `SpacesService` queries Prisma for Space(s) and shapes direct results; responses follow `{ ok, data | error }` convention at controllers.

Tasks:

- Module: `apps/api/src/tasks/*`
- Endpoints:
  - `POST /tasks` – Create a task (DTO-validated)
  - `PATCH /tasks/:id` – Update a task’s fields (DTO-validated)
- DTOs: `create-task.dto.ts`, `update-task.dto.ts` with `class-validator`
- E2E tests: `apps/api/test/tasks.e2e-spec.ts`
  - Stubs Prisma access in-memory to validate controller/service behavior.

Auth (Signup & Profile creation):

- Module: `apps/api/src/auth/*`
- DTO: `dto/signup.dto.ts` – `email`, `password` (min 8), optional `name`
- Endpoint:
  - `POST /auth/signup`
    - Validates input, checks unique email, hashes password with `bcryptjs`, creates user, returns profile: `{ id, email, name }`.
    - Response shape: `{ ok: true, data }` or `{ ok: false, error }`.
- Service: `auth.service.ts` encapsulates the signup logic.
- E2E tests: `apps/api/test/auth.e2e-spec.ts` – Ensures user profile is created and duplicates are rejected. Uses a PrismaService stub, not the real DB.
- Note: Login/JWT issuing is deferred in MVP; `JWT_SECRET` is provisioned for future work.

Validation & Errors:

- Global `ValidationPipe` enforces DTO contracts and strips unknown fields.
- Controllers consistently return `{ ok, data | error }`.

CORS:

- Allows localhost and `*.squadspace.me` with credentials and standard headers/methods.

Prisma Client:

- Generated in Docker build/compose command. Apply migrations before runtime (`migrate deploy`) and seed database.

## Frontend (Next.js 14, App Router)

Paths: `apps/web/src/app/*`

Key routes/pages:

- `/` – Home page (simple entry)
- `/spaces` and `/spaces/[slug]` – Spaces list and detail pages
- `/spaces/[slug]/notes` and `/spaces/[slug]/notes/[ydocId]` – Realtime editor route structure
- `/spaces/[slug]/todo` – Tasks/Kanban view (MVP lite)
- `/signup` – Client-side signup form that posts to the API’s `/auth/signup` endpoint

API Route Handlers (web-only mocks):

- `apps/web/src/app/api/*` – Next.js route handlers used for local/mock flows (e.g., composing digests, or mock tasks/spaces when not hitting the real API). In Docker, the frontend is configured to talk to the API service via `NEXT_PUBLIC_API_URL`, so these may be bypassed by direct API usage in production-like flows.

Components:

- `components/RealtimeEditor.tsx` – Tiptap/ProseMirror bound to Yjs for collaborative editing. The editor connects to the Yjs server via a provider using the note’s `ydocId`.

Environment (web):

- `apps/web/.env`
  - `NEXT_PUBLIC_API_URL=http://api:4000` (service name in compose network)
  - `NEXT_PUBLIC_YJS_WS_URL=ws://127.0.0.1:1234` (adjust as needed for local vs docker)

## Realtime (Yjs)

Service: `apps/yjs-server`

- A y-websocket server exposing a WebSocket endpoint (port 1234) to sync Yjs documents.
- Notes have a `ydocId`; multiple clients connecting to the same id share edits in realtime with multi-cursor presence.
- Persistence is initially in-memory; durable snapshots can be added later via providers or API snapshots.

Client flow:

- The Web app binds the editor state to a `Y.Doc` and connects via WebSocket to `YJS_WS_URL`.
- Presence uses initials/first letters; multiple cursors shown across clients.

## AI Digest (FastAPI microservice)

Service: `apps/ai`

- Exposes a simple `/digest` endpoint that receives recent `events[]` and returns a summarized text.
- The API composes `events[]` for the last 24 hours (from `EventLog`) and POSTs to AI, then persists the digest result.
- The Web renders the returned summary on the Space page.

Note: In MVP, this flow can be triggered by a web action or route handler; details are intentionally simple to keep the loop tight.

## Event logging

- The API writes `EventLog` records on key changes (e.g., task create/update, note title updates). The digest is derived from these.
- JSON payload is flexible; evolve as needed.

## Docker Runtime

Compose file: `docker-compose.yml`

- Services: `db` (Postgres), `api` (Nest), `web` (Next.js), `yjs-server`, `ai`.
- Ports:
  - DB: 5432
  - API: container 4000 → host 4001 (published)
  - Web: 3000
  - YJS: 1234
  - AI: 8000
- API command: `npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run start:dev` – Ensures schema is generated/applied, DB seeded, and server started with hot-reload.

## Local Development (non-Docker)

- Prereqs: Node 20+, Postgres 15+
- Configure `apps/api/.env`:
  - `DATABASE_URL=postgresql://squad:squad@localhost:5432/squadspace`
  - `JWT_SECRET=devsecret`
- Install deps at repo root (workspaces): `npm install`
- API: `npm --workspace api exec prisma generate` → `npm --workspace api run db:migrate:deploy` → `npm --workspace api run db:seed` → `npm --workspace api run start:dev`
- Web: `npm --workspace web run dev`
- Adjust `apps/web/.env` to use `NEXT_PUBLIC_API_URL=http://localhost:4000` if calling API directly outside docker.

## Request/Response contracts (MVP)

- `GET /health` → `{ ok: true }`
- `GET /spaces` → `Space[]`
- `GET /spaces/:slug` → `Space`
- `POST /tasks` body `{ title, spaceId, assigneeId?, dueAt? }` → `{ ok, data: Task }`
- `PATCH /tasks/:id` body `Partial<Task>` → `{ ok, data: Task }`
- `POST /auth/signup` body `{ email, password (min 8), name? }` → `{ ok, data: { id, email, name? } }` or `{ ok, error }`
- `POST /digests` body `{ spaceId }` → `{ ok, data: { id, summary } }` (API composes events and calls AI)

All controllers return `{ ok, data | error }` consistently.

## Security considerations (MVP)

- No secrets in code; use `.env` (compose mounts them for containers).
- Passwords never stored in plaintext; `bcryptjs` is used to hash.
- CORS restricted to web origin in dev; credentials allowed.
- Authentication beyond signup (login/JWT/session cookies) is planned but not in MVP.
- Always validate and sanitize inputs; DTOs and ValidationPipe enforce this in API.

## Testing

- API has Jest E2E tests in `apps/api/test/*`:
  - `tasks.e2e-spec.ts`: Validates create/update flows using an in-memory Prisma stub.
  - `auth.e2e-spec.ts`: Validates signup and duplicate email handling using an in-memory Prisma stub.
- Run E2E in Docker: `docker compose exec api npm run test:e2e`
- Web E2E (Playwright) is suggested for smoke flows but not required in MVP.

## Notable files & flows

- Signup
  - `apps/api/src/auth/dto/signup.dto.ts` – input contract
  - `apps/api/src/auth/auth.service.ts` – email uniqueness, hashing, profile creation, output shape
  - `apps/api/src/auth/auth.controller.ts` – `POST /auth/signup`
  - `apps/web/src/app/signup/page.tsx` – client form → calls API
- Tasks
  - `apps/api/src/tasks/*` – DTOs, controller, service
  - Web Kanban-lite at `apps/web/src/spaces/[slug]/todo/page.tsx`
- Realtime Notes
  - `apps/web/src/components/RealtimeEditor.tsx` – Tiptap + Yjs bindings
  - `apps/yjs-server` – WebSocket server
- AI Digest
  - Web route: `apps/web/src/app/api/digests/route.ts` (client-side orchestration)
  - API orchestration: `POST /digests` builds events and uses the AI service

## Operational notes

- Performance: Realtime operations should stay under 200ms local round-trip; avoid N+1 queries—prefer relation includes where appropriate.
- DX: Keep TypeScript strict; use DTOs/zod for validation; return `{ ok, data | error }` consistently.
- Git hygiene: Use Conventional Commits; small PRs.

## Future enhancements (post-MVP)

- Login + JWT issuance; httpOnly session cookies on web; socket auth for Yjs.
- S3 object storage flow for file uploads via API-signed URLs.
- Role-based permissions per Membership.role.
- Webhooks, calendar sync, and more robust presence indicators.
- Persist Yjs documents or add periodic snapshotting.

---

This document is intentionally detailed so new contributors can understand and work on the system quickly. If anything drifts, update this file alongside the code changes and migrations.

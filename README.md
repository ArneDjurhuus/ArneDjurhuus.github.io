# SquadSpace – Dev Hot Reload

Quick start

```powershell
docker compose up --build -d
```

What starts automatically

- API runs Prisma migrate deploy and seeds demo data on start. The demo Space has id `1` and slug `demo`.
- Web and API both run in watch mode with hot reload when using the dev override.

Hot reload (dev override)

- Web mounts `apps/web/src`, `apps/web/public`, and `apps/web/next.config.js` (ro).
- API mounts `apps/api/src` and `apps/api/prisma`.

Commands

```powershell
# Start with override
docker compose up -d

# Restart only web
docker compose up -d web

# Restart web+api (e.g., after editing next.config.js)
docker compose up -d web api
```

When rebuild is needed: deps (package.json/lock), Dockerfiles/base images, TS/ESLint config. Next config changes don’t need an image rebuild but do need a dev restart.

## Developer setup notes

### Web (Next.js)

- TipTap versions are pinned to avoid bundling/export issues. Keep these in sync in `apps/web/package.json`:
  - `@tiptap/core@2.6.6`, `@tiptap/pm@2.6.6`, `@tiptap/react@2.6.6`, `@tiptap/starter-kit@2.6.6`, `@tiptap/extension-collaboration@2.6.6`, `@tiptap/extension-collaboration-cursor@2.6.6`.
- `apps/web/next.config.js` contains webpack aliases for TipTap PM subpaths → ProseMirror packages to stabilize builds.
- Subdomain routing middleware excludes `/api/**` so API routes aren’t rewritten on `demo.localhost`. If you add new API routes, no change needed; the exclusion covers all `/api`.
- If running web outside Docker, set `apps/web/.env`:
  - `NEXT_PUBLIC_API_URL=http://localhost:4001` (compose maps 4001→4000)
  - `NEXT_PUBLIC_YJS_WS_URL=ws://127.0.0.1:1234`

### API (NestJS)

- `apps/api/tsconfig.json` sets `"moduleResolution": "node"` so editors resolve local module imports consistently.
- API is wired to run `prisma generate`, `migrate deploy`, and `db seed` on container start. Demo space slug is `demo`.

### AI service (FastAPI)

- Editor-friendly venv: workspace is configured to use `.venv` via `.vscode/settings.json`.
- To recreate locally (Windows/PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r apps/ai/requirements.txt
```

- Optional local run outside Docker:

```powershell
uvicorn apps.ai.main:app --reload --port 8000
```

## Troubleshooting

- Digest button shows HTML/404: ensure middleware excludes `/api/**` (already committed), and that web calls the local proxy `/api/digests`.
- “Failed to parse URL from /api/…” in server components: use absolute URLs (protocol+host from `headers()`), not relative, when fetching server-side.
- TipTap build errors like “Attempted import error from @tiptap/pm/*”: keep TipTap packages pinned (above) and leave the webpack aliases in place.

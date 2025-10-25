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

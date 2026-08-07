# Deployment Guide

Production runs on a self-hosted **Oracle Cloud** VM managed by
[**Dokploy**](https://dokploy.com) — an open-source PaaS that builds Docker images straight
from the Git repo and puts them behind a Traefik reverse proxy with automatic Let's Encrypt
TLS.

| Service | Domain | Container |
| ------- | ------ | --------- |
| Frontend | https://expenses.abishekrajavelu.in | `frontend/Dockerfile` → nginx on port **80** |
| Backend | https://api.abishekrajavelu.in | `backend/Dockerfile` → Spring Boot on port **8080** |
| Database | internal only | PostgreSQL |

```
                    ┌────────── Oracle Cloud VM (Dokploy) ──────────┐
Browser ──TLS──▶ Traefik ──▶ nginx  (static React build)            │
        └─XHR──▶ Traefik ──▶ Spring Boot ──▶ PostgreSQL             │
                    └───────────────────────────────────────────────┘
```

Deploy the backend first — the frontend needs its URL baked in at build time (see the
[build-arg gotcha](#the-one-real-gotcha-vite_api_base_url-is-a-build-arg)).

> **Oracle Ampere VMs are `arm64`.** Every base image used here (`eclipse-temurin:21-jre-alpine`,
> `node:20-alpine`, `nginx:alpine`, `postgres`) publishes multi-arch manifests, so builds work
> unmodified. If you swap in an `amd64`-only image, the container will fail to start with an
> `exec format error`.

## 1. Database

Create a **PostgreSQL** service in Dokploy and note its internal hostname, database name,
user, and password. Because it talks to the backend over Dokploy's internal network, it
never needs a public port.

## 2. Backend

Create an **Application** in Dokploy pointing at this repo:

- **Build type:** Dockerfile
- **Docker context / build path:** `backend`
- **Container port:** `8080`
- **Domain:** `api.abishekrajavelu.in` (enable HTTPS / Let's Encrypt)

Environment variables:

| Key | Value |
| --- | ----- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | `jdbc:postgresql://<internal-host>:5432/<database>` — note the **`jdbc:`** prefix; a bare `postgresql://…` URL will not parse |
| `DB_USER` | database username |
| `DB_PASSWORD` | database password |
| `FRONTEND_ORIGIN` | `https://expenses.abishekrajavelu.in` — must match exactly, or the browser blocks every API call with a CORS error |
| `JWT_SECRET` | random string, **min 32 chars** (`openssl rand -base64 48`). The app refuses to start without it in `prod` |
| `JWT_EXPIRATION_MINUTES` | optional, defaults to `1440` (24h) |
| `DEMO_ENABLED` | optional, `true` (default) seeds the demo account on startup; `false` disables it |
| `LOG_LEVEL` | optional, defaults to `INFO`; set `DEBUG` while debugging |

Verify: `https://api.abishekrajavelu.in/actuator/health` → `{"status":"UP"}`.

Flyway runs `V1`–`V4` automatically on first boot and creates the whole schema — you never
create tables by hand.

## 3. Frontend

Create a second **Application**:

- **Build type:** Dockerfile
- **Docker context / build path:** `frontend`
- **Container port:** `80`
- **Domain:** `expenses.abishekrajavelu.in` (enable HTTPS / Let's Encrypt)

### The one real gotcha: `VITE_API_BASE_URL` is a *build* arg

Vite **inlines** `import.meta.env.*` values into the JS bundle at build time. Setting
`VITE_API_BASE_URL` as a runtime environment variable does nothing at all — nginx just
serves already-compiled files, and the app silently falls back to `http://localhost:8080`.

Set it as a **build argument** in Dokploy:

```
VITE_API_BASE_URL=https://api.abishekrajavelu.in
```

The Dockerfile declares `ARG VITE_API_BASE_URL` before `npm run build` for exactly this
reason. **Changing the API URL requires a rebuild, not a restart.**

`nginx.conf` handles the rest: SPA fallback so deep links like `/expenses` don't 404,
`immutable` year-long caching for content-hashed `/assets/`, and `no-cache` on `index.html`
so users never get a stale entry point pointing at deleted bundles.

## 4. DNS

Point both subdomains at the VM's public IP and let Traefik issue certificates:

```
expenses.abishekrajavelu.in   A   <vm-public-ip>
api.abishekrajavelu.in        A   <vm-public-ip>
```

Make sure ports **80** and **443** are open in both the Oracle Cloud *security list* and the
VM's own firewall (`iptables`/`firewalld`) — Oracle images ship with restrictive local rules,
which is the classic reason a correctly-configured Dokploy app is still unreachable.

## Running the production images locally

```bash
# backend
docker build -t expense-tracker-api ./backend
docker run -p 8080:8080 --env-file backend/.env expense-tracker-api

# frontend — API URL must be a build arg, see above
docker build -t expense-tracker-web \
  --build-arg VITE_API_BASE_URL=http://localhost:8080 ./frontend
docker run -p 3000:80 expense-tracker-web
```

## Monitoring & logs

**Backend** — open the application in Dokploy and use its **Logs** tab (or
`docker logs -f <container>` over SSH). Every request is logged as one line,
`METHOD path -> status (Xms)`, at a level matching its outcome: `INFO` for success, `WARN`
for 4xx, `ERROR` for 5xx, so failures are easy to filter for. Unhandled exceptions add a full
stack trace, and each controller logs what it's doing (`Creating expense (category=FOOD…)`).
For more detail, set `LOG_LEVEL=DEBUG` and redeploy — no code change needed.

**Frontend** — nginx access/error logs are in the same Dokploy Logs tab. Client-side
JavaScript errors (React render crashes, unhandled rejections, failed API calls) are always
written to the **browser console** with full context, so DevTools is the fastest path while
reproducing an issue.

> ⚠️ **`/api/log-client-error` only works on Vercel.** That endpoint is a Vercel *serverless
> function* (`frontend/api/log-client-error.ts`). Under nginx there is no serverless runtime,
> so the POST falls through to the SPA rewrite and returns `index.html`. The reporter
> swallows the result by design, so nothing breaks — but those reports go nowhere on the
> Dokploy deployment. Browser-console logging is unaffected. To restore server-side capture
> here, add a matching endpoint to the Spring Boot API and point
> `frontend/src/lib/logger.ts` at it.

---

## Appendix: deploying to Render + Vercel instead

The project's original (and still perfectly valid) managed-hosting path, useful if you want
a zero-server-maintenance option.

**Backend on Render:** New → Web Service → this repo, **Root Directory** `backend`,
**Runtime** `Docker`, **Health Check Path** `/actuator/health`. Add the same environment
variables as above (`DATABASE_URL` pointing at a Render PostgreSQL instance). Render injects
`PORT` and `backend/Dockerfile` honors it via `-Dserver.port=${PORT:-8080}`.

**Frontend on Vercel:** Import the repo, **Root Directory** `frontend`, framework preset
**Vite**. Set `VITE_API_BASE_URL` to the Render URL. `vercel.json` supplies the SPA rewrite,
and `frontend/Dockerfile` is simply ignored — Vercel builds with its own pipeline.

Then set `FRONTEND_ORIGIN` on Render to the final Vercel URL so CORS passes.

> **Free-tier cold starts:** Render free services spin down after ~15 minutes of inactivity;
> the next request takes 30–60s while the container restarts. Free PostgreSQL instances are
> also **deleted after 30 days**. Self-hosting on Oracle Cloud avoids both.

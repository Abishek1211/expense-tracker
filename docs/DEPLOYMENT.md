# Deployment Guide

The backend runs as a Docker container on **Render**; the frontend is a static Vite build
on **Vercel** (Vercel cannot run JVM apps). Deploy the backend first — the frontend needs
its URL.

## 1. Backend on Render

### Create the database

1. In the [Render dashboard](https://dashboard.render.com), click **New → PostgreSQL**.
2. Pick a name (e.g. `expense-tracker-db`), the free plan, and the region closest to you.
3. After it provisions, note the **Internal Database URL** components (host, port, database,
   username, password) from the database's *Info* page.

### Create the web service

1. **New → Web Service**, connect your GitHub account, and select the
   `expense-tracker` repository.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` (Render auto-detects `backend/Dockerfile`)
   - **Instance type:** Free
   - **Health Check Path:** `/actuator/health`
3. Environment variables:

   | Key                      | Value                                                        |
   | ------------------------ | ------------------------------------------------------------ |
   | `SPRING_PROFILES_ACTIVE` | `prod`                                                       |
   | `DATABASE_URL`           | `jdbc:postgresql://<host>:5432/<database>` (from the DB page — note the **`jdbc:`** prefix; don't paste Render's `postgresql://…` URL as-is) |
   | `DB_USER`                | database username                                            |
   | `DB_PASSWORD`            | database password                                            |
   | `FRONTEND_ORIGIN`        | your Vercel URL, e.g. `https://expense-tracker-abc.vercel.app` (set a placeholder now, update after step 2) |
   | `JWT_SECRET`             | random string, min 32 chars — generate with `openssl rand -base64 48` (never reuse the dev default) |
   | `DEMO_ENABLED`           | optional — `true` (default) seeds the demo account with sample data on startup; set `false` to disable |

   Render also injects `PORT` automatically; the Dockerfile honors it.
4. Deploy. First build takes a few minutes (Gradle build inside Docker). Verify:
   - `https://<your-service>.onrender.com/actuator/health` → `{"status":"UP"}`
   - `https://<your-service>.onrender.com/swagger-ui.html` → interactive API docs

> **Free-tier cold starts:** Render free services spin down after ~15 minutes of
> inactivity. The first request afterwards can take 30–60 seconds while the container
> restarts. That's normal — mention it in your portfolio README, or keep the service warm
> with an external uptime pinger if it bothers you.

## 2. Frontend on Vercel

1. In [Vercel](https://vercel.com/new), **Import** the `expense-tracker` repository.
2. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected; build `npm run build`, output `dist`)
3. Environment variable:

   | Key                 | Value                                            |
   | ------------------- | ------------------------------------------------ |
   | `VITE_API_BASE_URL` | `https://<your-service>.onrender.com` (no trailing slash) |

4. Deploy. `vercel.json` already contains the SPA rewrite so deep links like `/expenses`
   don't 404.

## 3. Connect the two

1. Copy the final Vercel URL and set it as `FRONTEND_ORIGIN` on the Render service
   (Environment tab), then let Render redeploy — otherwise browsers will hit CORS errors.
2. Open the Vercel URL, add an expense, and check the dashboard chart updates.

## Local production-like run (optional)

```bash
cd backend
docker build -t expense-tracker-api .
docker run -p 8080:8080 --env-file .env expense-tracker-api   # copy .env.example → .env first
```

## Monitoring & logs during a failure

**Backend (Render):** open your web service → **Logs** tab. Every request is logged as one
line — `METHOD path -> status (Xms)` — at a level matching its outcome: `INFO` for success,
`WARN` for 4xx, `ERROR` for 5xx, so failures are easy to spot or filter for. Unhandled
exceptions additionally log a full stack trace. To get more detail temporarily (e.g. while
chasing a bug), set the `LOG_LEVEL` env var to `DEBUG` and let Render redeploy — no code
change needed, just flip it back to `INFO` (or unset it) afterward.

**Frontend (Vercel):** a static SPA has no server process, so Vercel's dashboard normally
shows nothing about client-side failures — only build logs. To close that gap, the app posts
uncaught errors (React render crashes, unhandled promise rejections, and failed API calls
with no response or a 5xx/429 status) to `/api/log-client-error`, a small Vercel serverless
function that exists solely to `console.error` them. Check your Vercel project → the relevant
deployment → **Functions**/**Runtime Logs** tab. Everything is also logged to the browser
console regardless of environment, so DevTools is the fastest path while reproducing something
yourself. Expected 4xx errors (wrong password, validation failures) are deliberately **not**
forwarded there — only genuine operational failures are, to keep the log signal-to-noise
useful.

# Deploying Spark on Render

Use **2 separate services** on Render:

1. **Backend** – Go API (Web Service)
2. **Frontend** – Landing site (Static Site)

The Expo mobile app is not deployed to Render; you build and publish it via EAS/App Store/Play Store.

---

## 1. Backend (Go Web Service)

- **New** → **Web Service**
- Connect repo: **nhockcuncon77/spark**
- Branch: **main**

### Settings

| Field | Value |
|-------|--------|
| **Name** | `spark` (or `spark-api`) |
| **Region** | Oregon (US West) or your choice |
| **Root Directory** | `services` |
| **Language** | Go |
| **Build Command** | See below — use exactly one command and replace any default. |
| **Start Command** | `./spark` |

**Build Command (use this only, replace Render’s default):**
```bash
go build -ldflags '-w -s -X main.Version=$RENDER_GIT_COMMIT' -o spark .
```
If that fails, use the simpler: `go build -o spark .`

### Environment variables (required)

Add in Render dashboard → **Environment**:

- `DATABASE_URL` – PostgreSQL connection string (e.g. from Render PostgreSQL or Neon)
- `REDIS_URL` – Redis connection string (e.g. Render Redis or Upstash)
- `JWT_SECRET` – long random string for auth
- `PORT` – leave empty; Render sets it automatically

Optional (for full features):

- `WORKOS_API_KEY`, `WORKOS_CLIENT_ID` – if using WorkOS auth
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` – for S3/file uploads
- `MAILER_ADDRESS` – sender email for notifications
- `POSTHOG_API_KEY` – analytics
- `SPARK_AUTH_SERVICE` – e.g. `workos` or `password`

### After first deploy

- Copy the backend URL (e.g. `https://spark-xxxx.onrender.com`).
- Use it as the API URL in the Expo app and in the frontend env (see below).

---

## 2. Frontend – Landing (Static Site)

- **New** → **Static Site**
- Connect repo: **nhockcuncon77/spark**
- Branch: **main**

### Settings

| Field | Value |
|-------|--------|
| **Name** | `spark-landing` (or `spark`) |
| **Root Directory** | `landing` |
| **Build Command** | `npm install && npm run build:with-app` |
| **Publish Directory** | `dist` |

**Important:** Use `build:with-app` to include the web app at `/app/`; use `build` for landing only. Clear any default (e.g. “bun install”) so Render does not merge it; otherwise you may get `npm run buildbun` and the build will fail.

### Environment variables (optional)

For the **landing** (and when using `build:with-app`, for the **Expo web app** baked into `/app/`):

- **`EXPO_PUBLIC_SPARK_API_URL`** (or **`EXPO_PUBLIC_API_URL`**) – Backend API URL, e.g. `https://spark-xxxx.onrender.com`. The Expo web app reads this at build time; set it in the Render static site’s **Environment** so the built app points to your API.
- **`VITE_SPARK_APP_URL`** – Only if you host the web app elsewhere; otherwise the landing uses `/app/` by default.
- **`EXPO_PUBLIC_POSTHOG_API_KEY`** / **`EXPO_PUBLIC_POSTHOG_HOST_URL`** – Optional; if unset, PostHog is skipped.

---

## 3. Database and Redis on Render

- **New** → **PostgreSQL** – create a database, then copy the **Internal Database URL** into `DATABASE_URL` for the backend.
- **New** → **Redis** – create Redis, copy URL into `REDIS_URL` for the backend.

Use **Internal** URLs so traffic stays on Render’s network (faster and free of egress).

---

## 4. Custom domain (optional)

- In each service → **Settings** → **Custom Domains**, add your domain.
- In your DNS (e.g. where you bought the domain), add the CNAME record Render shows (e.g. `spark.example.com` → `spark-xxxx.onrender.com`).

---

## 5. Summary

| Service | Type | Root Dir | Build | Start / Publish |
|--------|------|----------|--------|------------------|
| Backend | Web Service | `services` | `go build ... -o spark .` | `./spark` |
| Landing | Static Site | `landing` | `npm install && npm run build:with-app` | `dist` |

The backend now reads `PORT` from the environment so Render can inject it automatically.

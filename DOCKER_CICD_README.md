# Business Inc — Docker & CI/CD Setup

## What's in this folder

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage Docker image (Node 20 Alpine, non-root user) |
| `docker-compose.yml` | Local dev: app + MongoDB in one command |
| `.dockerignore` | Keeps the image lean (no secrets, no node_modules) |
| `render.yaml` | Render Infrastructure-as-Code (Blueprint) |
| `.github/workflows/ci-cd.yml` | GitHub Actions: lint → build → push → deploy |

---

## Quick Start (Local Docker)

```bash
# 1. Copy env file and fill in your values
cp server/.env.example server/.env

# 2. Start everything
docker compose up --build

# 3. Open http://localhost:5000
```

To seed the database:
```bash
docker compose exec app node server/scripts/seed.js
```

To create an admin user:
```bash
docker compose exec app node server/scripts/createAdmin.js
```

---

## Render Deployment (Two options)

### Option A — Blueprint (recommended, one-time setup)
1. Push `render.yaml` to your repo root.
2. Render Dashboard → **New → Blueprint** → connect your repo.
3. Render creates the web service automatically.
4. Go to the service **Environment** tab and set the secret values:
   - `MONGODB_URI` (your MongoDB Atlas connection string)
   - `JWT_SECRET` (long random string)
   - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

### Option B — Manual Docker service
1. Render Dashboard → **New → Web Service** → **Deploy an existing image**.
2. Image URL: `ghcr.io/<your-github-username>/business-inc:latest`
3. Set environment variables manually (same list as above).
4. Copy the **Deploy Hook URL** from the service settings.

---

## GitHub Actions CI/CD Setup

The workflow runs on every push to `main`:
1. **Lint** — installs deps, runs `npm audit`
2. **Docker** — builds the image, pushes to GitHub Container Registry (GHCR)
3. **Deploy** — fires your Render deploy hook, then smoke-tests `/api/health`

### Required GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | From Render dashboard → your service → Settings → Deploy Hook |

> `GITHUB_TOKEN` is provided automatically by GitHub Actions — no action needed.

### How to get the Render Deploy Hook URL
1. Open your service on [render.com](https://render.com).
2. Go to **Settings → Deploy Hook**.
3. Copy the URL and save it as the `RENDER_DEPLOY_HOOK_URL` secret.

---

## Image Registry

Images are pushed to **GitHub Container Registry (GHCR)**:
```
ghcr.io/<your-github-username>/business-inc:latest
ghcr.io/<your-github-username>/business-inc:sha-<commit>
```

To pull locally:
```bash
docker pull ghcr.io/<your-github-username>/business-inc:latest
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `production` | Runtime mode |
| `PORT` | No | `5000` | HTTP port |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas or self-hosted URI |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs |
| `JWT_EXPIRE` | No | `7d` | JWT expiry |
| `RESET_PASSWORD_EXPIRE_MINUTES` | No | `15` | Password-reset OTP TTL |
| `CLIENT_ORIGIN` | No | `*` | Comma-separated allowed CORS origins |
| `ADMIN_NAME` | No | — | Seed admin display name |
| `ADMIN_EMAIL` | No | — | Seed admin email |
| `ADMIN_PASSWORD` | No | — | Seed admin password |

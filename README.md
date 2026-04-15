# DevFleet

**DevFleet** is a self-hosted job orchestration and remote execution platform. It lets you register machines as *agents*, schedule shell scripts against those machines, stream real-time logs back to a web dashboard, and track execution history — all from a single, lightweight control plane.

---

## Table of Contents

1. [What Is DevFleet?](#what-is-devfleet)
2. [Architecture Overview](#architecture-overview)
3. [Repository Structure](#repository-structure)
4. [Prerequisites](#prerequisites)
5. [Quick Start with Docker Compose](#quick-start-with-docker-compose)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Local Development (without Docker)](#local-development-without-docker)
8. [Connecting an Agent](#connecting-an-agent)
9. [GitHub OAuth Setup](#github-oauth-setup)
10. [Useful URLs](#useful-urls)

---

## What Is DevFleet?

DevFleet solves the problem of running scripts on remote machines without provisioning a full CI/CD system. You:

- Deploy the **backend** (API + worker) and **frontend** once.
- Install the lightweight **Go agent** on any machine you want to control.
- Create *job definitions* (shell scripts) in the dashboard.
- Trigger or schedule those jobs — they run on the agent machine, and logs stream back live.

Key features:

| Feature | Description |
|---|---|
| Agent registration | Machines identify via an API key and machine fingerprint |
| Heartbeat health | CPU / memory / disk metrics recorded every minute |
| Job scheduling | One-time, delayed, and cron-based recurring jobs via BullMQ |
| Live log streaming | Chunked log upload with SSE fan-out to the browser |
| GitHub OAuth | Optional social login alongside email+OTP auth |
| Offline detection | Agents marked offline after 2 missed heartbeats |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  Vue 3 SPA → nginx :80  ──────────────────────────────────▶ │
│                        HTTP / REST / SSE → backend :3000     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Backend (Node.js / Express)                                 │
│  - REST API (auth, agents, jobs, logs)                       │
│  - Long-poll endpoint for agents (/api/v1/agent/jobs/pull)   │
│  - Prisma ORM → PostgreSQL                                   │
│  - BullMQ scheduler → Redis                                  │
└────────────────┬────────────────────────────────────────────┘
                 │ (same Redis)
┌────────────────▼────────────────────────────────────────────┐
│  Worker (Node.js / BullMQ)                                   │
│  - Consumes scheduled jobs from Redis queue                  │
│  - Creates JobExecution rows in Postgres                     │
│  - Signals waiting agents via JobDispatcher                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DevFleet Agent (Go binary – on your target machine)         │
│  - Registers machine identity with the backend               │
│  - Sends heartbeat every 1 min                               │
│  - Long-polls backend for job assignments                    │
│  - Executes shell scripts locally                            │
│  - Streams logs back in chunks                               │
└─────────────────────────────────────────────────────────────┘

Infrastructure: PostgreSQL · Redis
```

---

## Repository Structure

This mono-repo contains four sub-projects:

### `Devfleet-backend/`
> **Node.js · TypeScript · Express · Prisma · BullMQ**

The control-plane API server + background worker. Two separate runtime processes share the same codebase and build artifact:

| Process | Entry point | Role |
|---|---|---|
| API server | `src/api/index.ts` | REST API, auth, job dispatch, SSE log streaming |
| Worker | `src/worker.ts` | BullMQ consumer — picks up scheduled jobs and creates `JobExecution` rows |

Packages: Express 5, Prisma 6, BullMQ 5, ioredis, jsonwebtoken, nodemailer, ws.

---

### `Devfleet-frontend/`
> **Vue 3 · TypeScript · Vite · Tailwind CSS v4 · shadcn-vue**

Single-page dashboard served by nginx in production. Connects to the backend via `VITE_API_BASE_URL` (baked in at build time).

Pages: Dashboard · Agents · Agent Details · Jobs · Job Details · Profile · Auth.

---

### `Devfleet-agent/`
> **Go · Cobra CLI**

Lightweight binary installed on any managed machine. Has two CLI commands:

| Command | Purpose |
|---|---|
| `devfleet-agent login` | Register the machine with the backend using an API key |
| `devfleet-agent start` | Verify identity, then begin heartbeat + job-polling loops |

The agent stores credentials at `~/.devfleet/config.json`.

---

### `devfleet-landing page/`
> **Vite · React · Tailwind CSS**

A standalone static marketing/landing page. It is independent of the rest of the stack and is **not included** in the docker-compose setup. Run it separately with `npm run dev` inside that directory if needed.

---

## Prerequisites

### For Docker Compose (recommended)

| Tool | Minimum version |
|---|---|
| Docker | 24.x |
| Docker Compose | v2.x (bundled with Docker Desktop / Docker Engine ≥ 24) |

### For local development

| Tool | Minimum version |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| Go | 1.24 |
| PostgreSQL | 15 |
| Redis | 7 |

---

## Quick Start with Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/eviltwin7648/devfleet.git
cd devfleet
```

### 2. (Optional) Create a `.env` file for secrets

The compose file has sensible defaults for local development. If you want GitHub OAuth or email features, create a `.env` file next to `docker-compose.yml`:

```bash
# .env  (place in the project root, next to docker-compose.yml)

# GitHub OAuth (get from https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email (Gmail app password or SMTP relay)
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password

# Override the JWT secret in production!
JWT_SECRET=use-a-long-random-string-here
```

> **Note:** GitHub OAuth won't work out of the box with Docker because the callback URL must match what you register in your GitHub app. Set the callback URL to `http://localhost:3000/api/v1/auth/github/callback` in your GitHub OAuth app settings.

### 3. Build and start all services

```bash
docker compose up --build
```

This brings up:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **Backend API** on `localhost:3000` — runs `prisma migrate deploy` then starts Express
- **Worker** on  no exposed port — BullMQ consumer
- **Frontend** on `localhost:80` (open [http://localhost](http://localhost) in your browser)

> The backend runs `npx prisma migrate deploy` automatically on startup. No manual migration step is needed.

### 4. Open the app

Navigate to **[http://localhost](http://localhost)** and create your first account.

### 5. Stopping

```bash
docker compose down
```

To also delete all persisted data (Postgres, Redis volumes):

```bash
docker compose down -v
```

---

## Environment Variables Reference

All env vars are injected by `docker-compose.yml`. For local development set them in `Devfleet-backend/.env`.

### Backend (`Devfleet-backend`)

| Variable | Default (Docker) | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://devfleet:password123@postgres:5432/devfleet?schema=public` | Prisma connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis for BullMQ |
| `PORT` | `3000` | Express listen port |
| `API_URL` | `http://localhost:3000` | Public API base (used by backend internally) |
| `FRONTEND_URL` | `http://localhost` | CORS allowed origin |
| `JWT_SECRET` | `change-me-in-production` | **Change this in production** |
| `GITHUB_CLIENT_ID` | *(blank)* | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | *(blank)* | GitHub OAuth app client secret |
| `EMAIL_USER` | *(blank)* | SMTP sender address |
| `EMAIL_PASS` | *(blank)* | SMTP password / app password |

### Frontend (`Devfleet-frontend`)

| Variable | Default (Docker) | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend URL baked into the static bundle at build time |

---

## Local Development (without Docker)

### Backend

```bash
cd Devfleet-backend

# 1. Install dependencies
npm install

# 2. Create .env (copy the example variables from the table above and fill in your local values)
cp .env.example .env   # or create manually

# 3. Generate Prisma client and apply migrations
npx prisma generate
npx prisma migrate dev

# 4. Start the API server (hot-reload)
npm run dev

# 5. In a second terminal — start the worker (hot-reload)
npm run worker:dev
```

The API listens on `http://localhost:8080` by default (set `PORT` in `.env` to change).

### Frontend

```bash
cd Devfleet-frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend listens on `http://localhost:5173` and reads `VITE_API_BASE_URL` from `Devfleet-frontend/.env`.

Make sure `Devfleet-frontend/.env` contains:

```env
VITE_API_BASE_URL=http://localhost:8080
```

And your backend `.env` has:

```env
FRONTEND_URL=http://localhost:5173
```

---

## Connecting an Agent

After your backend is running, follow these steps from the machine you want to manage:

### 1. Install the agent binary

**Download a pre-built binary** from the GitHub releases page, or **build from source**:

```bash
cd Devfleet-agent
go build -o devfleet-agent main.go

# Move to PATH
sudo mv devfleet-agent /usr/local/bin/
```

Or use the Docker image:

```bash
docker build -t devfleet-agent ./Devfleet-agent
```

### 2. Get an API key

1. Log into the DevFleet dashboard.
2. Go to **Profile → Agent API Key**.
3. Copy the key (format: `df_...`).

### 3. Register the machine

```bash
devfleet-agent login
```

You will be prompted for:
- **DevFleet API URL**: e.g. `http://localhost:3000` (or your public server address)
- **Agent API Key**: the key you copied above

This creates `~/.devfleet/config.json`.

### 4. Start the agent

```bash
devfleet-agent start
```

The agent will appear as **Online** in the dashboard within a few seconds.

For non-interactive / headless startup:

```bash
devfleet-agent start --token 'df_...' --api-url 'http://your-server:3000'
```

---

## GitHub OAuth Setup

1. Go to **[GitHub → Settings → Developer Settings → OAuth Apps](https://github.com/settings/developers)** and create a new app.
2. Set **Homepage URL** to `http://localhost` (or your domain).
3. Set **Authorization callback URL** to `http://localhost:3000/api/v1/auth/github/callback`.
4. Copy the **Client ID** and **Client Secret** and add them to your `.env` (or root `.env` for Docker).

---

## Useful URLs

| URL | Service |
|---|---|
| [http://localhost](http://localhost) | Frontend dashboard |
| [http://localhost:3000](http://localhost:3000) | Backend REST API |
| [http://localhost:5432](http://localhost:5432) | PostgreSQL (connect with any PG client) |
| [http://localhost:6379](http://localhost:6379) | Redis |

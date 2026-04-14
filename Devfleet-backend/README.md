# DevFleet Backend

Backend service for DevFleet. It exposes the user-facing API, authenticates browser sessions and agents, stores jobs and heartbeat data in Postgres via Prisma, and coordinates dispatch through BullMQ and Redis.

## What It Does

- Auth for users: OTP, password login, GitHub OAuth, session validation.
- Agent lifecycle: API key creation, agent registration, agent verification, heartbeat ingestion, shutdown handling.
- Job management: create jobs, schedule recurring jobs, list executions, rerun executions.
- Log streaming: ingest execution logs and stream them to the frontend.
- Health tracking: persist 1-minute heartbeat samples in `AgentHealth` and expose latest health plus filtered history to the UI.
- Offline detection: any agent that misses heartbeats for more than 2 minutes is marked offline.

## Current Architecture

The backend now has two main runtime processes:

1. API server
   - Entry: `src/api/index.ts`
   - Runs Express
   - Handles auth, jobs, agents, and log stream endpoints
   - Emits job-created events to wake waiting agents
   - Runs periodic offline detection

2. Worker
   - Entry: `src/worker.ts`
   - Runs BullMQ scheduled and recurring job work
   - Creates `JobExecution` rows when scheduled jobs become runnable

Supporting infrastructure:

- PostgreSQL for persistent data
- Redis for BullMQ
- Prisma ORM for schema and queries

## Important Flows

### Agent onboarding

1. A logged-in user creates an agent API key through `GET /api/v1/agent/api-key`.
2. The agent calls `POST /api/v1/agent/register` with machine info and that API key.
3. The backend creates or updates the `Agent` row and binds the key to that machine.
4. The agent later calls `POST /api/v1/agent/verify` to exchange the API key plus machine identity for a JWT.

### Agent runtime

After verification, the agent:

1. Sends `POST /api/v1/agent/heartbeat` every minute.
2. Long-polls `GET /api/v1/agent/jobs/pull` for work.
3. Streams logs to `POST /api/v1/agent/execution/:executionId/logs`.
4. Reports final state to `POST /api/v1/agent/execution/:executionId/result`.
5. Optionally calls `POST /api/v1/agent/shutdown` on graceful exit.

### Heartbeat and health

Each heartbeat updates:

- `Agent.lastSeen`
- `Agent.isOnline`
- a new `AgentHealth` row with:
  - `cpuUsage`
  - `memUsage`
  - `diskUsage`
  - `timestamp`

The frontend now uses:

- `GET /api/v1/agent/my-agents` for the agent list with `latestHealth`
- `GET /api/v1/agent/:id` for agent details
- `GET /api/v1/agent/:id/health?range=24h|7d|30d` for heartbeat history graphs

## Project Structure

```text
src/
  api/
    index.ts        # boots Express server + offline detection
    routes.ts       # mounts route modules
    server.ts       # Express app factory
  db/
    db.ts
    prisma/
      schema.prisma
  lib/
    jobDispatcher.ts
    queue.ts
    redis.ts
  middleware/
    userAuth.ts
    agentAuth.ts
  modules/
    auth/
    agents/
    jobs/
    logs/
  worker.ts
```

## Main Routes

### Auth

- `POST /api/v1/auth/send-otp`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/github`
- `GET /api/v1/auth/github/callback`
- `GET /api/v1/auth/me`

### Agents

- `POST /api/v1/agent/register`
- `POST /api/v1/agent/verify`
- `POST /api/v1/agent/heartbeat`
- `GET /api/v1/agent/jobs/pull`
- `POST /api/v1/agent/execution/:executionId/logs`
- `POST /api/v1/agent/execution/:executionId/result`
- `POST /api/v1/agent/shutdown`
- `GET /api/v1/agent/api-key`
- `GET /api/v1/agent/my-agents`
- `GET /api/v1/agent/:id`
- `GET /api/v1/agent/:id/health`

### Jobs

- `POST /api/v1/jobs/create`
- `GET /api/v1/jobs/all`
- `GET /api/v1/jobs/get/:jobId`
- `GET /api/v1/jobs/definition/:jobDefinitionId/executions`
- `POST /api/v1/jobs/execution/:executionId/rerun`
- `PUT /api/v1/jobs/update/:jobId`
- `DELETE /api/v1/jobs/delete/:jobId`

### Logs

- `GET /api/v1/logs/stream/:executionId`

## Database Notes

The core models are:

- `User`
- `Agent`
- `AgentAPIKey`
- `AgentHealth`
- `JobDefinition`
- `JobExecution`
- `LogChunk`

Notable relationships:

- One user owns many agents and job definitions.
- An agent has many executions and many health snapshots.
- A job definition has many executions.
- A job execution has many log chunks.

See [schema.prisma](./src/db/prisma/schema.prisma) for the source of truth.

## Local Development

### Prerequisites

- Node.js
- PostgreSQL
- Redis
- npm

### Install

```bash
npm install
```

### Environment

Create a `.env` file in `Devfleet-backend/` with the values required by your local setup.

Typical variables:

```env
PORT=8000
DATABASE_URL=postgresql://...
JWT_SECRET=change-me
REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
FRONTEND_URL=http://localhost:5173
```

Note:

- the current CORS configuration in `src/api/server.ts` allows `http://localhost:5173`
- the Go agent currently calls `http://localhost:8080` directly, so backend and agent port assumptions need to match your local setup

### Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

### Run the API

```bash
npm run dev
```

### Run the worker

In a second terminal:

```bash
npm run worker:dev
```

### Production build

```bash
npm run build
npm start
```

## Operational Notes

- Heartbeats are expected every 1 minute.
- Agents are marked offline after roughly 2 minutes without a heartbeat.
- `GET /api/v1/agent/jobs/pull` behaves like long-polling with an approximately 30-second hold.
- Scheduled and recurring jobs depend on Redis and the worker process being up.

## Known Gaps

- Jobs which were stuck in a Stage(Running/Dispatched) are stuck in that state if there is some issue during the time of reporting the job-status
- there is one hole in the system (if the request fails i lose logs) - Logbatcher
- agent quits on terminal close, no auto-startup for agent.
- The API server default port in `src/api/index.ts` is `8000`, while the current agent code targets `http://localhost:8080`.
- CORS origin is currently hardcoded in `src/api/server.ts`.
- Some route naming is still legacy-shaped (`/get/:jobId`, `/all`, etc.).

These are worth normalizing if you want deployment and local onboarding to be less brittle.

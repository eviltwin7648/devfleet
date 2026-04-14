# DevFleet Agent

Go-based execution agent for DevFleet. It registers a machine, verifies that machine against a previously issued API key, sends periodic health heartbeats, long-polls for jobs, executes scripts locally, streams logs, and reports final results back to the backend.

## What It Does

- Registers a machine with DevFleet using an agent API key
- Verifies the registered machine and obtains a JWT for runtime calls
- Sends a heartbeat every 1 minute
- Long-polls the backend for runnable jobs
- Executes received scripts locally
- Batches and uploads logs
- Reports execution status and exit code

## Commands

The CLI entrypoint is `devfleet-agent`.

### Login

Registers the current machine and stores the API key and assigned agent id locally.

```bash
devfleet-agent login
```

You will be prompted for:

- DevFleet API URL
- Agent API key

This command sends machine info to:

- `POST /api/v1/agent/register`

### Start

Loads the saved API key, verifies the machine, then starts runtime loops:

- heartbeat loop
- job polling loop

```bash
devfleet-agent start
```

For non-interactive bootstrap, the installer can pass an API key directly:

```bash
devfleet-agent start --token '<agent-api-key>'
```

For unattended bootstrap with a known self-hosted API URL:

```bash
devfleet-agent start --token '<agent-api-key>' --api-url 'https://your-devfleet.example.com'
```

That registers the machine, saves `~/devfleet/config.json`, verifies the agent, and then starts the runtime loops.

This command calls:

- `POST /api/v1/agent/verify`
- `POST /api/v1/agent/heartbeat`
- `GET /api/v1/agent/jobs/pull`
- `POST /api/v1/agent/execution/:executionId/logs`
- `POST /api/v1/agent/execution/:executionId/result`

## Runtime Flow

### 1. Registration

`devfleet-agent login` collects:

- DevFleet API URL
- hostname
- OS
- architecture
- total memory

and posts them with the API key to the backend. The backend returns an `agent_id`, which the agent stores locally.

### 2. Verification

`devfleet-agent start` re-collects machine info and verifies that the current machine matches the registered machine for the saved API key.

If that check passes, the backend returns a JWT used for runtime requests.

### 3. Heartbeats

The heartbeat loop:

- runs immediately on start
- then repeats every 1 minute

Each heartbeat includes:

- machine info
- health info
  - CPU usage
  - memory usage
  - disk usage

The backend stores those snapshots in `AgentHealth`.

### 4. Job polling

The agent continuously calls:

```text
GET /api/v1/agent/jobs/pull
```

This is long-polling. The backend may keep the request open for about 30 seconds while waiting for work.

If a job arrives, the agent:

1. executes the script locally
2. uploads logs
3. reports the final result

## Local Config

The agent stores credentials at:

```text
~/devfleet/config.json
```

Current shape:

```json
{
  "api_key": "df_...",
  "agent_id": "uuid",
  "api_url": "https://your-devfleet.example.com"
}
```

This file is created by `devfleet-agent login`.

## Build

### Local Go build

```bash
go build -o devfleet-agent main.go
```

### Multi-platform build script

```bash
./build.sh
```

Or with a version:

```bash
./build.sh v0.1.0
```

Build artifacts are written to:

```text
./dist
```

### Docker build

```bash
docker build -t devfleet-agent .
```

## Install Script

There is an install helper at:

- [install.sh](./install.sh)

Intended usage from the backend-generated onboarding command is:

```bash
curl -fsSL <install-script-url> | bash -s -- '<agent-api-key>'
```

What it does:

1. downloads a release binary for the current OS/arch
2. installs it to `/usr/local/bin/devfleet-agent`
3. asks for the DevFleet API URL
4. starts the agent

## Project Structure

```text
cmd/
  root.go
  login.go
  start.go
internal/
  auth/
  config/
  heartbeat/
  jobs/
  utils/
main.go
```

Important files:

- [cmd/login.go](./cmd/login.go): registration flow
- [cmd/start.go](./cmd/start.go): verification and runtime loops
- [internal/config/config.go](./internal/config/config.go): local config storage
- [internal/heartbeat/heartbeat.go](./internal/heartbeat/heartbeat.go): 1-minute heartbeat loop
- [internal/jobs/jobs.go](./internal/jobs/jobs.go): long-polling and result reporting

## Development Notes

- The agent is currently designed around one registered machine per saved config.
- Verification is machine-bound: hostname, OS, and arch must match what was registered.
- The runtime loop blocks forever after startup.
- The polling client uses a 35-second timeout to support the backend’s 30-second long-poll window.

## Known Gaps

- The backend-generated API key is still stored locally after login; the runtime obtains a JWT only during `start`.

If you want smoother deployment, the next step is to centralize the backend base URL in config or environment and align the install flow with the CLI.

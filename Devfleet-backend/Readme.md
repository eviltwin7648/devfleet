# 🛰️ DevFleet — Remote Server & Job Runner as a Service

**DevFleet** is a self-hosted, developer-focused **job orchestration platform**.  
Think of it as a hybrid between **GitHub Actions**, **Elastic Beanstalk**, and **Node-based cron job runners** — except it runs entirely on your infrastructure and is fully extensible.

> **Run and monitor scripts on any remote machine you control — securely, reliably, and with full observability.**

---

## 🔧 Use Cases

-   Run shell commands across remote dev servers, edge devices, or cloud VMs
-   Replace fragile SSH scripts with token-authenticated job agents
-   Schedule cron jobs via a UI, with real-time logs and retry handling
-   Self-hosted alternative to GitHub Actions, tailored to your infra

---

## ⚙️ System Overview

        User → Web App → REST → Backend → PostgreSQL + Redis
        ↓
        Scheduler / Runner
        ↓
        Agent (via WebSocket)
        ↓
        Logs → Backend ← Job Status
        ↓
        Web UI

---

## 🏗️ Architecture

### Core Components

| Component     | Tech Stack           | Role                                   |
| ------------- | -------------------- | -------------------------------------- |
| Backend API   | Node.js + Express    | Manages jobs, agents, auth             |
| Scheduler     | Node + Cron + BullMQ | Schedules future jobs                  |
| Agent CLI     | Golang + WebSocket   | Executes scripts on remote servers     |
| Database      | PostgreSQL           | Stores jobs, runs, agents, logs        |
| Queue         | Redis + BullMQ       | Dispatches jobs to runners             |
| Frontend      | Vue                  | Dashboard to manage jobs and view logs |
| Network Layer | Tailscale / Ngrok    | NAT-safe agent connectivity            |

### High-Level Diagram

                +----------------------------+
                |     Web Dashboard (UI)     |
                +-------------+--------------+
                              |
                              v
                +-------------+--------------+
                |         Backend API        |
               +-------------+--------------+
                              |
              +---------------+-------------------------------+
              |               |                               |
              v               v                               v
        +----------+   +----------------+           +---------------------+
        |PostgreSQL|   |Redis + BullMQ  |<--------->|   Cron Scheduler    |
        |(jobs/logs)|   |(Queue system) |           |(Node + TTL Watchers)|
        +----------+   +----------------+           +---------------------+
                              |
                              v
                  +-----------+-----------+
                  |     Job Runner Service |
                  +-----------+-----------+
                              |
                              v
                +-------------+--------------+
                |      Remote Agent (CLI)    |
                | - WebSocket listener       |
                | - Push logs & status       |
                +-------------+--------------+
                              |
                +-------------+--------------+
                | Tailscale / Ngrok (Optional)|
                +-----------------------------+

---

<!-- ## 🧪 Current Features

-   🔐 JWT + Mail OTP Auth
-   🔐 GitHub OAuth
-   🧠 Agent Auth & Registration
-   🧠 Job Queueing (BullMQ)
-   🧠 Cron-based Scheduling
-   📡 WebSocket Job Streaming
-   📥 Agent CLI: `npx devfleet-agent@latest connect`
-   📈 PostgreSQL Logging + Job Status Tracking

---

## 🚧 Roadmap & TODOs

### ✅ Auth

-   [x] Mail OTP Login
-   [x] JWT + Refresh
-   [x] GitHub OAuth Integration

### 🖥️ Dashboard UI

-   [ ] Job List (with live status)
-   [ ] Job Detail View (logs, exit code)
-   [ ] Agent Overview (RAM, CPU, status)
-   [ ] Job History & Filtering

### ⚙️ Job Management

-   [ ] Create Job (shell command, env, schedule)
-   [ ] Edit/Delete/Run Job
-   [ ] View job run history
-   [ ] Cancel running jobs

### 🛰️ Agent CLI

-   [x] Connect via WebSocket
-   [x] Token Auth & Registration
-   [ ] Tag-based Routing (`gpu`, `region:us`)
-   [ ] Push heartbeat, logs, status
-   [ ] Secure spawn of `child_process`
-   [ ] Retry + Timeout + Kill Handling

### 📜 Job Logs & Monitoring

-   [ ] Real-time log streaming
-   [ ] Log persistence (per job run)
-   [ ] Status updates (queued, running, success, fail)

### 🧯 Retry & Timeout

-   [ ] BullMQ retry policies
-   [ ] Kill long-running jobs (timeout handler)
-   [ ] Track failures with error messages

---

## 🔐 Agent Connectivity

### Option 1: Tailscale

Use Tailscale for secure, NAT-safe, VPN-style connectivity.

### Option 2: Ngrok Reverse Tunnel

If you can't install Tailscale, use ngrok or Cloudflare tunnels to expose the WebSocket endpoint.

---

## 🧑‍💻 Getting Started (WIP) -->

<!-- ```bash
# Clone the repo
git clone https://github.com/<your-org>/devfleet.git && cd devfleet

# Start the backend
pnpm install && pnpm dev

# Start the PostgreSQL + Redis
docker-compose up -d

# Connect your agent
npx devfleet-agent@latest connect --token <your-token> -->

import { api } from "./http";
import { createSSE } from "./sse";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Auth API endpoints
export const authAPI = {
  sendOTP: (email: string) => api.post("/api/v1/auth/send-otp", { email }),
  verifyOTP: (email: string, otp: string) =>
    api.post("/api/v1/auth/verify-otp", { email, otp }),
  register: (
    email: string,
    name: string,
    password: string,
    confirmPassword: string
  ) =>
    api.post("/api/v1/auth/register", {
      email,
      name,
      password,
      confirmPassword,
    }),
  login: (email: string, password: string) =>
    api.post("/api/v1/auth/login", { email, password }),
  logout: () => api.post("/api/v1/auth/logout"),
  // Validate current authentication status
  validateAuth: () => api.get("/api/v1/auth/me"),
  githubAuth: () => {
    // Redirect to GitHub OAuth - backend handles everything and redirects to dashboard
    window.location.href = `${API_BASE_URL}/api/v1/auth/github`;
  },
};

// Agent types
export interface Agent {
  id: string;
  hostname: string;
  os: string;
  arch?: string;
  totalmem?: string | number;
  status: "online" | "offline";
  lastSeen: Date;
  concurrency: number;
  tags: string[];
  isOnline?: boolean;
  latestHealth?: AgentHealthSnapshot | null;
}

export interface AgentHealthSnapshot {
  cpuUsage: number;
  memUsage: number;
  diskUsage?: number | null;
  timestamp: string;
}

export interface AgentDetail extends Agent {
  totalExecutions?: number;
}

export interface AgentHealthHistoryPoint extends AgentHealthSnapshot {
  id: string;
}

// Job types
export interface Job {
  id: string;
  title: string;
  description?: string;
  script: string;
  status: "pending" | "running" | "completed" | "failed";
  agentId: string;
  env?: Record<string, string>;
  tags: string[];
  cron?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobRequest {
  title: string;
  description?: string;
  script: string;
  agentId?: string;
  env?: Record<string, string>;
  tags?: string[];
  scheduleAt?: string; // ISO 8601 datetime for one-time scheduling
  repeatCron?: string; // Cron pattern for recurring jobs
  isRecurring?: boolean; // Flag to indicate recurring job
  maxRetries?: number; // Max retry attempts (default: 3)
  timeoutSec?: number; // Timeout in seconds
}

// Agent API endpoints
export const agentAPI = {
  // Get all connected agents
  getAgents: () => api.get<Agent[]>("/api/v1/agent/my-agents"),

  // Get specific agent
  getAgent: (id: string) => api.get<AgentDetail>(`/api/v1/agent/${id}`),

  getAgentHealthHistory: (id: string, range: string) =>
    api.get<{ history: AgentHealthHistoryPoint[] }>(`/api/v1/agent/${id}/health`, {
      params: { range },
    }),

  // Tag an agent
  tagAgent: (id: string, tags: string[]) =>
    api.patch(`/api/v1/agent/${id}/tags`, { tags }),

  // Disconnect an agent
  disconnectAgent: (id: string) => api.delete(`/api/v1/agent/${id}`),

  getApiKey: (expiry?: string, keyName?: string) =>
    api.get(`api/v1/agent/api-key?expires=${expiry}&&keyName=${keyName}`),
};

// Job API endpoints
export const jobAPI = {
  // Get all jobs
  getJobs: (limit?: number, offset?: number) =>
    api.get<{ message: string; data: Job[] }>("/api/v1/jobs/all", {
      params: { limit, offset },
    }),

  // Get specific job execution
  getJob: (id: string) => api.get<Job>(`/api/v1/jobs/get/${id}`),

  // Get all executions for a job definition
  getJobExecutions: (jobDefinitionId: string) =>
    api.get<{ message: string; data: any[] }>(
      `/api/v1/jobs/definition/${jobDefinitionId}/executions`
    ),

  // Create new job
  createJob: (jobData: CreateJobRequest) =>
    api.post<Job>("/api/v1/jobs/create", jobData),

  // Re-run a completed/failed execution
  reRunJob: (executionId: string) =>
    api.post(`/api/v1/jobs/execution/${executionId}/rerun`),

  // Cancel job
  cancelJob: (id: string) => api.post(`/api/v1/jobs/execution/${id}/cancel`),

  // Get job logs
  getJobLogs: (id: string) => api.get<string>(`/api/v1/jobs/${id}/logs`),

  //Job log stream
  streamLogs: (executionId: string, onMessage: (data: any) => void) => {
    return createSSE({
      url: `${API_BASE_URL}/api/v1/logs/stream/${executionId}`,
      onMessage,
    });
  },
  // Delete job
  deleteJob: (id: string) => api.delete(`/api/v1/jobs/${id}`),
};


// Dashboard API endpoints
export const dashboardAPI = {
  // Get user's agent token
  getAgentToken: () =>
    api.get<{ token: string }>("/api/v1/dashboard/agent-token"),

  // Regenerate agent token
  regenerateAgentToken: () =>
    api.post<{ token: string }>("/api/v1/dashboard/agent-token/regenerate"),
};

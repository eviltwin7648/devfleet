import { Router } from "express";
import { agentRoutes } from "../modules/agents/agent.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { jobRoutes } from "../modules/jobs/jobs.routes";
import { logRoutes } from "../modules/logs/logs.routes";

export const registerRoutes = (app: Router) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/agent", agentRoutes);
  app.use("/api/v1/jobs", jobRoutes);
  app.use("/api/v1/logs", logRoutes);
};

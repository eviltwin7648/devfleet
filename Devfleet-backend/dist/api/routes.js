"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const agent_routes_1 = require("../modules/agents/agent.routes");
const auth_routes_1 = require("../modules/auth/auth.routes");
const jobs_routes_1 = require("../modules/jobs/jobs.routes");
const logs_routes_1 = require("../modules/logs/logs.routes");
const registerRoutes = (app) => {
    app.use("/api/v1/auth", auth_routes_1.authRoutes);
    app.use("/api/v1/agent", agent_routes_1.agentRoutes);
    app.use("/api/v1/jobs", jobs_routes_1.jobRoutes);
    app.use("/api/v1/logs", logs_routes_1.logRoutes);
};
exports.registerRoutes = registerRoutes;

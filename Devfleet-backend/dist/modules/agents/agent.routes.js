"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRoutes = void 0;
const express_1 = require("express");
const userAuth_1 = require("../../middleware/userAuth");
const agentAuth_1 = require("../../middleware/agentAuth");
const agent_controller_1 = require("./agent.controller");
const router = (0, express_1.Router)();
router.post("/register", agent_controller_1.agentController.register);
router.post("/verify", agent_controller_1.agentController.verifyAgent);
router.post("/heartbeat", agentAuth_1.agentAuth, agent_controller_1.agentController.heartbeat);
router.get("/jobs/pull", agentAuth_1.agentAuth, agent_controller_1.agentController.pullJobs);
router.post("/execution/:executionId/logs", agentAuth_1.agentAuth, agent_controller_1.agentController.jobLogs);
router.post("/execution/:executionId/result", agentAuth_1.agentAuth, agent_controller_1.agentController.jobResult);
router.post("/shutdown", agentAuth_1.agentAuth, agent_controller_1.agentController.shutdown);
//api key
router.get("/api-key", userAuth_1.userAuth, agent_controller_1.agentController.createApiKey);
//dashboard
router.get("/my-agents", userAuth_1.userAuth, agent_controller_1.agentController.getUserAgents);
router.get("/:id/health", userAuth_1.userAuth, agent_controller_1.agentController.getAgentHealthHistory);
router.get("/:id", userAuth_1.userAuth, agent_controller_1.agentController.getAgent);
exports.agentRoutes = router;

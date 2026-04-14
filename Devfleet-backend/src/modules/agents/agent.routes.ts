import { Router } from "express";
import { userAuth } from "../../middleware/userAuth";
import { agentAuth } from "../../middleware/agentAuth";
import { agentController } from "./agent.controller";

const router = Router();

router.post("/register", agentController.register);
router.post("/verify", agentController.verifyAgent);
router.post("/heartbeat", agentAuth, agentController.heartbeat);
router.get("/jobs/pull", agentAuth, agentController.pullJobs); 
router.post("/execution/:executionId/logs", agentAuth, agentController.jobLogs);
router.post("/execution/:executionId/result", agentAuth, agentController.jobResult);
router.post("/shutdown", agentAuth, agentController.shutdown);
//api key
router.get("/api-key", userAuth, agentController.createApiKey);

//dashboard
router.get("/my-agents", userAuth, agentController.getUserAgents);
router.get("/:id/health", userAuth, agentController.getAgentHealthHistory);
router.get("/:id", userAuth, agentController.getAgent);



export const agentRoutes = router;

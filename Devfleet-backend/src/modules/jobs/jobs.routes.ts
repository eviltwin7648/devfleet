import { Router } from "express";
import { jobController } from "./jobs.controller";
import { userAuth } from "../../middleware/userAuth";

const router = Router();

router.post("/create", userAuth, jobController.createJob);
router.get("/all", userAuth, jobController.getJobs);
router.get("/get/:jobId", userAuth, jobController.getJob);
router.get(
  "/definition/:jobDefinitionId/executions",
  userAuth,
  jobController.getJobExecutions,
);
router.post("/execution/:executionId/rerun", userAuth, jobController.reRunJob);
router.post("/execution/:executionId/cancel", userAuth, jobController.cancelJob);
router.put("/update/:jobId", userAuth, jobController.updateJob);

router.delete("/delete/:jobId", userAuth, jobController.deleteJob);

export const jobRoutes = router;

import { Router } from "express";
import { userAuth } from "../../middleware/userAuth";
import { logController } from "./logs.controller";

const router = Router();

router.get("/stream/:executionId", userAuth, logController.streamLogs);

export const logRoutes = router;

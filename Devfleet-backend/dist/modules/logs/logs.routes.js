"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRoutes = void 0;
const express_1 = require("express");
const userAuth_1 = require("../../middleware/userAuth");
const logs_controller_1 = require("./logs.controller");
const router = (0, express_1.Router)();
router.get("/stream/:executionId", userAuth_1.userAuth, logs_controller_1.logController.streamLogs);
exports.logRoutes = router;

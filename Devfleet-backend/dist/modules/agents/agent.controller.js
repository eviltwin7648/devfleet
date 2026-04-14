"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../db/db");
const agentSelect = {
    id: true,
    hostname: true,
    os: true,
    arch: true,
    totalmem: true,
    isOnline: true,
    lastSeen: true,
};
const latestHealthSelect = {
    cpuUsage: true,
    memUsage: true,
    diskUsage: true,
    timestamp: true,
};
const parseRangeHours = (range) => {
    switch (range) {
        case "24h":
            return 24;
        case "7d":
            return 24 * 7;
        case "30d":
            return 24 * 30;
        default:
            return 24;
    }
};
// Register a new agent or update existing
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hostname, os, arch, totalmem, apiKey } = req.body;
        console.log("Regestring agent:", req.body);
        const normalizedHost = hostname.trim().toLowerCase();
        if (!hostname || !os || !arch || !totalmem || !apiKey) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const apiKeyRecord = yield db_1.db.agentAPIKey.findUnique({
            where: {
                apiKey,
            },
            include: { user: true },
        });
        if (!apiKeyRecord) {
            res.status(403).json({
                message: "API key is Invalid",
            });
            return;
        }
        if (apiKeyRecord.revokedAt) {
            res.status(403).json({ message: "API key has been revoked" });
            return;
        }
        if (apiKeyRecord.usedAt) {
            res.status(403).json({ message: "API key has already been used" });
            return;
        }
        // Upsert agent by hostname (or other unique field)
        const agent = yield db_1.db.agent.upsert({
            where: { hostname: normalizedHost },
            update: {
                os,
                arch,
                totalmem,
                lastSeen: new Date(),
                apiKeyId: apiKeyRecord.id,
            },
            create: {
                hostname: normalizedHost,
                os,
                arch,
                totalmem,
                lastSeen: new Date(),
                apiKeyId: apiKeyRecord.id,
                userId: apiKeyRecord.userId,
            },
        });
        yield db_1.db.agentAPIKey.update({
            where: { id: apiKeyRecord.id },
            data: { usedAt: new Date(), isUsed: true, agentId: agent.id },
        });
        res.status(200).json({
            agent_id: agent.id,
            status: agent.lastSeen ? "updated" : "new",
            username: apiKeyRecord.user.name,
        });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Failed to register agent", error: String(err) });
        console.error(err);
    }
});
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Heartbeat: update agent's lastSeen and record health
const heartbeat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const agentId = (_a = req.agent) === null || _a === void 0 ? void 0 : _a.id;
        if (!agentId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { health } = req.body;
        yield db_1.db.agent.update({
            where: { id: agentId },
            data: { lastSeen: new Date(), isOnline: true },
        });
        if (health) {
            yield db_1.db.agentHealth.create({
                data: {
                    agentId,
                    cpuUsage: health.cpuUsage || 0,
                    memUsage: health.memUsage || 0,
                    diskUsage: health.diskUsage || 0,
                },
            });
        }
        console.log("HEARTBEAT RECEIVED from agent", agentId);
        res.status(200).json({ message: "Heartbeat received" });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Failed to update heartbeat", error: String(err) });
        console.error(err);
    }
});
// Poll for jobs assigned to this agent (with long-polling)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pullJobs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const agentId = (_a = req.agent) === null || _a === void 0 ? void 0 : _a.id;
        if (!agentId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const findAndClaimJob = () => __awaiter(void 0, void 0, void 0, function* () {
            return db_1.db.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
                const execution = yield tx.$queryRaw `
          SELECT *
          FROM "JobExecution"
          WHERE status = 'READY'
          AND (
            "agentId" = ${agentId}
            OR "agentId" IS NULL
          )
          ORDER BY
            CASE WHEN "agentId" = ${agentId} THEN 0 ELSE 1 END,
            "scheduledAt"
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `;
                if (!execution.length)
                    return null;
                return tx.jobExecution.update({
                    where: { id: execution[0].id },
                    data: {
                        status: "DISPATCHED",
                        agentId: agentId,
                    },
                    include: { job: true },
                });
            }));
        });
        const timeout = 30000;
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (req.destroyed)
                return;
            const execution = yield findAndClaimJob();
            if (execution) {
                res.status(200).json({ job: execution });
                return;
            }
            yield sleep(800 + Math.random() * 400);
        }
        res.status(200).json({ job: null });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to pull jobs",
            error: String(err),
        });
    }
});
const logIngestion_Service_1 = require("../logs/logIngestion.Service");
// Receive job logs from agent (batch support)
const jobLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { executionId } = req.params;
        const logBatch = req.body;
        logIngestion_Service_1.LogIngestor.storeLogChunk(logBatch, executionId);
        // Support either single log { type, message } or batch { logs: [{type, message}] }
        // LOGingestion service will handle it.
        res.status(200).json({ message: "Logs received" });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Failed to save logs", error: String(err) });
        console.error(err);
    }
});
// Receive job result from agent
const jobResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { executionId } = req.params;
        const { status, exit_code, stdout, stderr } = req.body;
        console.log("JOB RESULT RECEIVED", executionId, req.body);
        // Update JobExecution with result
        const execution = yield db_1.db.jobExecution.update({
            where: { id: executionId },
            data: {
                status: status.toUpperCase(), // Ensure uppercase to match enum
                exitCode: exit_code,
                finishedAt: new Date(),
            },
            include: { job: true },
        });
        // Handle Retries
        if (execution.status === "FAILED" || execution.status === "TIMEOUT") {
            console.log("JOB FAILED");
            // if (execution.attempt < execution.job.maxRetries) {
            //   console.log(
            //     `🔄 Retrying job ${execution.jobId} (Attempt ${execution.attempt + 1}/${execution.job.maxRetries})`,
            //   );
            //   const delayMs = 2000 * Math.pow(2, execution.attempt - 1);
            //   const { JobScheduler } = await import("../jobs/job.scheduler");
            //   await JobScheduler.scheduleJob({
            //     jobDefinitionId: execution.jobId,
            //     agentId: execution.agentId || undefined,
            //     attempt: execution.attempt + 1,
            //     delayMs: delayMs,
            //   });
            // }
        }
        // if (stdout) {
        //   await db.log.create({
        //     data: {
        //       executionId: executionId,
        //       type: "STDOUT",
        //       message: stdout,
        //     },
        //   });
        // }
        // if (stderr) {
        //   await db.log.create({
        //     data: {
        //       executionId: executionId,
        //       type: "STDERR",
        //       message: stderr,
        //     },
        //   });
        // }
        res.status(200).json({ message: "Job result received" });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Failed to save job result", error: String(err) });
        console.error(err);
    }
});
// Shutdown: mark agent as offline
const shutdown = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const agentId = (_a = req.agent) === null || _a === void 0 ? void 0 : _a.id;
        if (!agentId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        yield db_1.db.agent.update({
            where: { id: agentId },
            data: { isOnline: false, lastSeen: new Date() },
        });
        res.status(200).json({ message: "Agent shutdown successfully" });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Failed to shutdown agent", error: String(err) });
        console.error(err);
    }
});
const generateApiKey = () => {
    const bytes = crypto_1.default.randomBytes(32);
    return "df_" + bytes.toString("hex");
};
const createApiKey = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(400).json({ message: "Missing user Id" });
            return;
        }
        const expiryQuery = req.query.expires;
        const keyName = req.query.keyName;
        let expiryDate; // This will now always be a Date object
        // Check if the user provided a custom expiry date
        if (typeof expiryQuery === "string") {
            const parsedDate = new Date(expiryQuery);
            if (isNaN(parsedDate.getTime())) {
                res.status(400).json({ message: "Invalid date format for expiry." });
                return;
            }
            expiryDate = parsedDate;
        }
        else {
            expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        const newApiKey = generateApiKey();
        const apikey = yield db_1.db.agentAPIKey.create({
            data: {
                userId,
                apiKey: newApiKey,
                keyName: keyName,
                expiresAt: expiryDate.toISOString(),
            },
        });
        res.status(200).json({
            message: `API key successfully generated`,
            apiKey: apikey.apiKey,
        });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Failed to Generate API Key", error: String(err) });
        console.error(err);
    }
});
const getUserAgents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(400).json({ message: "Missing user Id" });
            return;
        }
        const agents = yield db_1.db.agent.findMany({
            where: {
                userId,
            },
            select: Object.assign(Object.assign({}, agentSelect), { agentHealth: {
                    orderBy: { timestamp: "desc" },
                    take: 1,
                    select: latestHealthSelect,
                } }),
            orderBy: [{ isOnline: "desc" }, { lastSeen: "desc" }],
        });
        res.json({
            message: "Agents Found Successfully",
            agents: agents.map((agent) => (Object.assign(Object.assign({}, agent), { latestHealth: agent.agentHealth[0] || null, agentHealth: undefined }))),
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to Fetch Agents", error: String(error) });
        console.error(error);
    }
});
const getAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id } = req.params;
        if (!userId) {
            res.status(400).json({ message: "Missing user Id" });
            return;
        }
        const agent = yield db_1.db.agent.findFirst({
            where: {
                id,
                userId,
            },
            select: Object.assign(Object.assign({}, agentSelect), { jobExecutions: {
                    select: {
                        id: true,
                    },
                }, agentHealth: {
                    orderBy: { timestamp: "desc" },
                    take: 1,
                    select: latestHealthSelect,
                } }),
        });
        if (!agent) {
            res.status(404).json({ message: "Agent not found" });
            return;
        }
        res.json({
            message: "Agent Found Successfully",
            agent: Object.assign(Object.assign({}, agent), { totalExecutions: agent.jobExecutions.length, latestHealth: agent.agentHealth[0] || null, agentHealth: undefined, jobExecutions: undefined }),
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to Fetch Agent", error: String(error) });
        console.error(error);
    }
});
const getAgentHealthHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { id } = req.params;
        const range = typeof req.query.range === "string" ? req.query.range : "24h";
        if (!userId) {
            res.status(400).json({ message: "Missing user Id" });
            return;
        }
        const agent = yield db_1.db.agent.findFirst({
            where: {
                id,
                userId,
            },
            select: {
                id: true,
            },
        });
        if (!agent) {
            res.status(404).json({ message: "Agent not found" });
            return;
        }
        const from = new Date(Date.now() - parseRangeHours(range) * 60 * 60 * 1000);
        const history = yield db_1.db.agentHealth.findMany({
            where: {
                agentId: id,
                timestamp: {
                    gte: from,
                },
            },
            orderBy: {
                timestamp: "asc",
            },
            select: {
                id: true,
                cpuUsage: true,
                memUsage: true,
                diskUsage: true,
                timestamp: true,
            },
        });
        res.json({
            message: "Agent health history fetched successfully",
            range,
            from,
            to: new Date(),
            history,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to Fetch Agent Health History",
            error: String(error),
        });
        console.error(error);
    }
});
const verifyAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("VERIFY REQUEST RECEIVED", req.body);
        const { apiKey, hostname, os, arch } = req.body;
        if (!apiKey) {
            res.status(400).json({ message: "Missing API Key" });
            return;
        }
        // Find the API key record
        const apiKeyRecord = yield db_1.db.agentAPIKey.findFirst({
            where: { apiKey: apiKey },
            include: { agent: true },
        });
        if (!apiKeyRecord) {
            res.status(400).json({ message: "Invalid API Key" });
            return;
        }
        if (!apiKeyRecord.agent) {
            res.status(400).json({ message: "Agent not found" });
            return;
        }
        // Existing agent linked to key
        const agent = apiKeyRecord.agent;
        // Validate match
        if (agent.hostname !== hostname || agent.os !== os || agent.arch !== arch) {
            res
                .status(400)
                .json({ message: "Machine details mismatch with registered agent" });
            console.error("Machine details mismatch during verify", {
                registered: agent,
                received: req.body,
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: agent.id, hostname: agent.hostname }, process.env.JWT_SECRET || "default_secret", { expiresIn: "10d" });
        res.status(200).json({ message: "Verified", token });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to Verify API Key", error: String(error) });
        console.error(error);
    }
});
exports.agentController = {
    register,
    heartbeat,
    pullJobs,
    jobLogs,
    jobResult,
    shutdown,
    createApiKey,
    getUserAgents,
    getAgent,
    getAgentHealthHistory,
    verifyAgent,
    // pollJobs
};

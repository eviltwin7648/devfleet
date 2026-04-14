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
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobController = void 0;
const db_1 = require("../../db/db");
const job_scheduler_1 = require("./job.scheduler");
const createJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Logic to create a job definition and execution
        const { agentId, script, env, title, description, scheduleAt, repeatCron, tags, isRecurring, maxRetries, timeoutSec, } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!script || !title) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        if (!userId) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }
        console.log("Creating job with data:", req.body);
        // Create JobDefinition
        const jobDefinition = yield db_1.db.jobDefinition.create({
            data: {
                title,
                description: description || "",
                script,
                env: env || {},
                userId: userId,
                scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
                repeatCron: repeatCron || null,
                isRecurring: isRecurring || false,
                tags: tags || {},
                maxRetries: maxRetries || 3,
                timeoutSec: timeoutSec || null,
            },
        });
        if (!jobDefinition) {
            res.status(500).json({ message: "Failed to create job definition" });
            return;
        }
        // Schedule the job using BullMQ if scheduled or recurring
        if (scheduleAt || repeatCron || isRecurring) {
            const queueJobId = yield job_scheduler_1.JobScheduler.scheduleJob({
                jobDefinitionId: jobDefinition.id,
                agentId: agentId || undefined,
                scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
                repeatCron: repeatCron || null,
                isRecurring: isRecurring || false,
            });
        }
        else {
            // Create a new JobExecution record
            const execution = yield db_1.db.jobExecution.create({
                data: {
                    jobId: jobDefinition.id,
                    agentId: agentId || null,
                    attempt: 1,
                    status: "READY",
                    scheduledAt: new Date(),
                },
            });
        }
        res.status(201).json({
            message: "Job created and scheduled successfully",
            jobId: jobDefinition.id,
        });
    }
    catch (error) {
        console.error("Error creating job:", error);
        res.status(500).json({ message: "Failed to create job" });
    }
});
const getJobs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }
        // Query JobExecutions with related JobDefinition and Agent
        const executions = yield db_1.db.jobExecution.findMany({
            where: {
                job: {
                    userId,
                },
            },
            include: {
                job: true,
                agent: {
                    select: {
                        id: true,
                        hostname: true,
                        os: true,
                        arch: true,
                        isOnline: true,
                        lastSeen: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({ message: "Jobs Found", data: executions });
    }
    catch (error) {
        console.error("Error listing jobs:", error);
        res.status(500).json({ error: "Failed to list jobs" });
    }
});
const getJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const executionId = req.params.jobId;
        // Fetch JobExecution with related data
        const execution = yield db_1.db.jobExecution.findUnique({
            where: { id: executionId },
            include: {
                job: true,
                agent: {
                    select: {
                        id: true,
                        hostname: true,
                        os: true,
                    },
                },
                logs: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });
        if (!execution) {
            res.status(404).json({ message: "Job execution not found" });
            return;
        }
        res.status(200).json(execution);
    }
    catch (error) {
        console.error("Error getting job:", error);
        res.status(500).json({ error: "Failed to get job" });
    }
});
const updateJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobId = req.params.jobId;
        const updateData = req.body;
        // Update JobDefinition
        yield db_1.db.jobDefinition.update({
            where: { id: jobId },
            data: updateData,
        });
        res.status(200).json({ message: `Job ${jobId} updated successfully` });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update job" });
    }
});
const deleteJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobId = req.params.jobId;
        // Delete JobDefinition (will cascade to JobExecutions and Logs)
        yield db_1.db.jobDefinition.delete({
            where: { id: jobId },
        });
        res.status(200).json({ message: `Job ${jobId} deleted successfully` });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete job" });
    }
});
const getJobExecutions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const jobDefinitionId = req.params.jobDefinitionId;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const executions = yield db_1.db.jobExecution.findMany({
            where: {
                jobId: jobDefinitionId,
                job: { userId },
            },
            include: {
                agent: {
                    select: { id: true, hostname: true, os: true, arch: true, isOnline: true, lastSeen: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ message: "Executions found", data: executions });
    }
    catch (error) {
        console.error("Error listing executions:", error);
        res.status(500).json({ error: "Failed to list executions" });
    }
});
const reRunJob = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { executionId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        // Look up the original execution to get the job definition
        const originalExecution = yield db_1.db.jobExecution.findUnique({
            where: { id: executionId },
            include: { job: true },
        });
        if (!originalExecution) {
            res.status(404).json({ message: "Execution not found" });
            return;
        }
        if (originalExecution.job.userId !== userId) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        // Count existing executions to determine next attempt number
        const attemptCount = yield db_1.db.jobExecution.count({
            where: { jobId: originalExecution.jobId },
        });
        const newExecution = yield db_1.db.jobExecution.create({
            data: {
                jobId: originalExecution.jobId,
                agentId: originalExecution.agentId || null,
                attempt: attemptCount + 1,
                status: "READY",
                scheduledAt: new Date(),
            },
        });
        res.status(201).json({
            message: "Job re-queued successfully",
            data: newExecution,
        });
    }
    catch (error) {
        console.error("Error re-running job:", error);
        res.status(500).json({ error: "Failed to re-run job" });
    }
});
exports.jobController = {
    createJob,
    getJobs,
    getJob,
    updateJob,
    deleteJob,
    getJobExecutions,
    reRunJob,
};

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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bullmq_1 = require("bullmq");
const queue_1 = require("./lib/queue");
const db_1 = require("./db/db");
const jobDispatcher_1 = require("./lib/jobDispatcher");
// Initialize JobDispatcher
jobDispatcher_1.JobDispatcher.initialize();
// Create the worker
const worker = new bullmq_1.Worker("devfleet-jobs", (job) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`🔄 Processing job: ${job.id}`, job.data);
    const { jobDefinitionId, agentId, attempt } = job.data;
    try {
        // // Create a new JobExecution record
        const execution = yield db_1.db.jobExecution.create({
            data: {
                jobId: jobDefinitionId,
                agentId: agentId || null,
                attempt: attempt || 1,
                status: "READY",
                scheduledAt: new Date(),
            },
        });
        console.log(`✅ Created JobExecution ${execution.id} for JobDefinition ${jobDefinitionId}`);
        // Publish job:created event for waiting agents
        // await JobDispatcher.publish(JobEvent.CREATED, {
        //   executionId: execution.id,
        //   jobDefinitionId: jobDefinitionId,
        //   agentId: agentId,
        //   status: execution.status,
        // });
        return { executionId: execution.id, status: "success" };
    }
    catch (error) {
        console.error(`❌ Error processing job:`, error);
        throw error; // BullMQ will retry based on job config
    }
}), {
    connection: queue_1.connection,
    concurrency: 10, // Process up to 10 jobs concurrently
});
// Worker event listeners
worker.on("completed", (job) => {
    console.log(`✅ Worker completed job ${job.id}`);
});
worker.on("failed", (job, err) => {
    console.error(`❌ Worker failed job ${job === null || job === void 0 ? void 0 : job.id}:`, err);
});
worker.on("error", (err) => {
    console.error("Worker error:", err);
});
// Graceful shutdown
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Shutting down worker...");
    yield worker.close();
    yield queue_1.connection.quit();
    process.exit(0);
}));
console.log("🚀 DevFleet Worker started and listening for jobs...");

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
exports.connection = exports.queueEvents = exports.jobQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log("REDIS URL", REDIS_URL);
// Create Redis connection
const connection = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: null,
});
exports.connection = connection;
// Create BullMQ Queue for job scheduling
exports.jobQueue = new bullmq_1.Queue("devfleet-jobs", {
    connection,
    defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
            type: "exponential",
            delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: {
            age: 3600 * 24 * 7, // Keep completed jobs for 7 days
            count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
            age: 3600 * 24 * 30, // Keep failed jobs for 30 days
        },
    },
});
// Queue events for monitoring
exports.queueEvents = new bullmq_1.QueueEvents("devfleet-jobs", {
    connection: connection.duplicate(),
});
// Event listeners for debugging
exports.queueEvents.on("completed", ({ jobId }) => {
    console.log(`✅ Job ${jobId} completed`);
});
exports.queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`❌ Job ${jobId} failed: ${failedReason}`);
});
// Graceful shutdown
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Closing BullMQ connections...");
    yield exports.jobQueue.close();
    yield exports.queueEvents.close();
    yield connection.quit();
}));

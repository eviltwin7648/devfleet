import { Queue, QueueEvents } from "bullmq";
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log("REDIS URL", REDIS_URL);
// Create Redis connection
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Create BullMQ Queue for job scheduling
export const jobQueue = new Queue("devfleet-jobs", {
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
export const queueEvents = new QueueEvents("devfleet-jobs", {
  connection: connection.duplicate(),
});

// Event listeners for debugging
queueEvents.on("completed", ({ jobId }) => {
  console.log(`✅ Job ${jobId} completed`);
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
  console.error(`❌ Job ${jobId} failed: ${failedReason}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Closing BullMQ connections...");
  await jobQueue.close();
  await queueEvents.close();
  await connection.quit();
});

export { connection };

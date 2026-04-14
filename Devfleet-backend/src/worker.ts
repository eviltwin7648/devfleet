import dotenv from "dotenv";
dotenv.config();
import { Worker, Job } from "bullmq";
import { connection } from "./lib/queue";
import { db } from "./db/db";
import { JobDispatcher, JobEvent } from "./lib/jobDispatcher";

// Initialize JobDispatcher
JobDispatcher.initialize();

// Define the job data structure
interface JobData {
  jobDefinitionId: string;
  agentId?: string;
  attempt?: number;
}

// Create the worker
const worker = new Worker<JobData>(
  "devfleet-jobs",
  async (job: Job<JobData>) => {
    console.log(`🔄 Processing job: ${job.id}`, job.data);

    const { jobDefinitionId, agentId, attempt } = job.data;

    try {
      // // Create a new JobExecution record
      const execution = await db.jobExecution.create({
        data: {
          jobId: jobDefinitionId,
          agentId: agentId || null,
          attempt: attempt || 1,
          status: "READY",
          scheduledAt: new Date(),
        },
      });

      console.log(
        `✅ Created JobExecution ${execution.id} for JobDefinition ${jobDefinitionId}`,
      );

      // Publish job:created event for waiting agents
      // await JobDispatcher.publish(JobEvent.CREATED, {
      //   executionId: execution.id,
      //   jobDefinitionId: jobDefinitionId,
      //   agentId: agentId,
      //   status: execution.status,
      // });

      return { executionId: execution.id, status: "success" };
    } catch (error) {
      console.error(`❌ Error processing job:`, error);
      throw error; // BullMQ will retry based on job config
    }
  },
  {
    connection,
    concurrency: 10, // Process up to 10 jobs concurrently
  },
);

// Worker event listeners
worker.on("completed", (job) => {
  console.log(`✅ Worker completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Worker failed job ${job?.id}:`, err);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});

console.log("🚀 DevFleet Worker started and listening for jobs...");

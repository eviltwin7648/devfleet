import { jobQueue } from "../../lib/queue";

interface ScheduleJobOptions {
  jobDefinitionId: string;
  agentId?: string;
  scheduleAt?: Date;
  repeatCron?: string | null;
  isRecurring?: boolean;
  attempt?: number;
  delayMs?: number;
}

export class JobScheduler {
  /**
   * Schedule a job to be executed
   * - Immediate: Add to queue immediately
   * - Scheduled: Add with delay
   * - Recurring: Add with cron pattern
   */
  static async scheduleJob(options: ScheduleJobOptions): Promise<string> {
    const {
      jobDefinitionId,
      agentId,
      scheduleAt,
      repeatCron,
      isRecurring,
      attempt,
      delayMs,
    } = options;

    const jobData = {
      jobDefinitionId,
      agentId,
      attempt,
    };

    // Recurring job with cron pattern
    if (isRecurring && repeatCron) {
      await jobQueue.add(`job-${jobDefinitionId}`, jobData, {
        repeat: {
          pattern: repeatCron,
        },
        jobId: `recurring-${jobDefinitionId}`, // Unique ID for recurring jobs
      });
      console.log(`📅 Recurring job scheduled with cron: ${repeatCron}`);
      return `recurring-${jobDefinitionId}`;
    }

    // Scheduled job or delayed retry
    if ((scheduleAt && scheduleAt > new Date()) || delayMs) {
      const delay =
        delayMs || (scheduleAt ? scheduleAt.getTime() - Date.now() : 0);
      const job = await jobQueue.add(`job-${jobDefinitionId}`, jobData, {
        delay,
        jobId: `scheduled-${jobDefinitionId}-${Date.now()}`,
      });
      console.log(`⏰ Job scheduled for execution with delay: ${delay}ms`);
      return job.id || `scheduled-${jobDefinitionId}`;
    }

    // Immediate execution
    const job = await jobQueue.add(`job-${jobDefinitionId}`, jobData, {
      jobId: `immediate-${jobDefinitionId}-${Date.now()}`,
    });
    console.log(`🚀 Job added for immediate execution`);
    return job.id || `immediate-${jobDefinitionId}`;
  }

  /**
   * Cancel a scheduled or recurring job
   */
  static async cancelJob(jobId: string): Promise<void> {
    const job = await jobQueue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`🗑️ Job ${jobId} cancelled`);
    }
  }

  /**
   * Remove a recurring job pattern
   */
  static async removeRecurringJob(jobDefinitionId: string): Promise<void> {
    const repeatableJobs = await jobQueue.getRepeatableJobs();
    for (const repeatableJob of repeatableJobs) {
      if (repeatableJob.id === `recurring-${jobDefinitionId}`) {
        await jobQueue.removeRepeatableByKey(repeatableJob.key);
        console.log(`🗑️ Recurring job ${jobDefinitionId} removed`);
      }
    }
  }
}

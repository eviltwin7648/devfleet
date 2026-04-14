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
exports.JobScheduler = void 0;
const queue_1 = require("../../lib/queue");
class JobScheduler {
    /**
     * Schedule a job to be executed
     * - Immediate: Add to queue immediately
     * - Scheduled: Add with delay
     * - Recurring: Add with cron pattern
     */
    static scheduleJob(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { jobDefinitionId, agentId, scheduleAt, repeatCron, isRecurring, attempt, delayMs, } = options;
            const jobData = {
                jobDefinitionId,
                agentId,
                attempt,
            };
            // Recurring job with cron pattern
            if (isRecurring && repeatCron) {
                yield queue_1.jobQueue.add(`job-${jobDefinitionId}`, jobData, {
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
                const delay = delayMs || (scheduleAt ? scheduleAt.getTime() - Date.now() : 0);
                const job = yield queue_1.jobQueue.add(`job-${jobDefinitionId}`, jobData, {
                    delay,
                    jobId: `scheduled-${jobDefinitionId}-${Date.now()}`,
                });
                console.log(`⏰ Job scheduled for execution with delay: ${delay}ms`);
                return job.id || `scheduled-${jobDefinitionId}`;
            }
            // Immediate execution
            const job = yield queue_1.jobQueue.add(`job-${jobDefinitionId}`, jobData, {
                jobId: `immediate-${jobDefinitionId}-${Date.now()}`,
            });
            console.log(`🚀 Job added for immediate execution`);
            return job.id || `immediate-${jobDefinitionId}`;
        });
    }
    /**
     * Cancel a scheduled or recurring job
     */
    static cancelJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            const job = yield queue_1.jobQueue.getJob(jobId);
            if (job) {
                yield job.remove();
                console.log(`🗑️ Job ${jobId} cancelled`);
            }
        });
    }
    /**
     * Remove a recurring job pattern
     */
    static removeRecurringJob(jobDefinitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const repeatableJobs = yield queue_1.jobQueue.getRepeatableJobs();
            for (const repeatableJob of repeatableJobs) {
                if (repeatableJob.id === `recurring-${jobDefinitionId}`) {
                    yield queue_1.jobQueue.removeRepeatableByKey(repeatableJob.key);
                    console.log(`🗑️ Recurring job ${jobDefinitionId} removed`);
                }
            }
        });
    }
}
exports.JobScheduler = JobScheduler;

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
exports.LongPollManager = void 0;
/**
 * Long Poll Manager - Manages waiting agent connections
 */
class LongPollManager {
    /**
     * Start a long poll for an agent
     * Returns a promise that resolves when a job is available or timeout occurs
     */
    static waitForJob(agentId_1) {
        return __awaiter(this, arguments, void 0, function* (agentId, timeoutMs = 30000) {
            // Cancel any existing long-poll for this agent
            this.cancelRequest(agentId);
            return new Promise((resolve) => {
                // Set timeout
                const timeout = setTimeout(() => {
                    this.activeRequests.delete(agentId);
                    resolve(null); // Timeout - no job available
                }, timeoutMs);
                // Store the request
                this.activeRequests.set(agentId, {
                    agentId,
                    resolve,
                    timeout,
                });
                console.log(`⏳ Agent ${agentId} started long-polling (${timeoutMs}ms)`);
            });
        });
    }
    /**
     * Notify a specific agent about a job
     * Used when a job is assigned to a specific agent
     */
    static notifyAgent(agentId, job) {
        const request = this.activeRequests.get(agentId);
        if (request) {
            clearTimeout(request.timeout);
            this.activeRequests.delete(agentId);
            request.resolve(job);
            console.log(`✅ Notified agent ${agentId} about job ${job.id}`);
            return true;
        }
        return false;
    }
    /**
     * Notify all waiting agents about a new job
     * First agent to claim it wins (handled in pullJobs controller)
     */
    static notifyAll(job) {
        const waitingCount = this.activeRequests.size;
        if (waitingCount === 0) {
            console.log(`ℹ️ Job ${job.id} created, but no agents waiting`);
            return;
        }
        console.log(`📢 Broadcasting job ${job.id} to ${waitingCount} waiting agents`);
        // Wake up all waiting agents
        // They will race to claim the job in the database
        this.activeRequests.forEach((request) => {
            clearTimeout(request.timeout);
            request.resolve({ newJobAvailable: true });
        });
        this.activeRequests.clear();
    }
    /**
     * Cancel a long-poll request for an agent
     */
    static cancelRequest(agentId) {
        const request = this.activeRequests.get(agentId);
        if (request) {
            clearTimeout(request.timeout);
            this.activeRequests.delete(agentId);
            console.log(`🚫 Cancelled long-poll for agent ${agentId}`);
        }
    }
    /**
     * Get count of waiting agents
     */
    static getWaitingCount() {
        return this.activeRequests.size;
    }
    /**
     * Clean up all active requests (for shutdown)
     */
    static cleanup() {
        this.activeRequests.forEach((request) => {
            clearTimeout(request.timeout);
            request.resolve(null);
        });
        this.activeRequests.clear();
        console.log("🧹 Cleaned up all long-poll connections");
    }
}
exports.LongPollManager = LongPollManager;
// Track active long-poll requests per agent
LongPollManager.activeRequests = new Map();
// Graceful shutdown
process.on("SIGTERM", () => {
    LongPollManager.cleanup();
});

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
exports.subscriber = exports.JobDispatcher = exports.JobEvent = void 0;
const queue_1 = require("./queue");
// Create separate subscriber connection (Redis requirement)
const subscriber = queue_1.connection.duplicate();
exports.subscriber = subscriber;
// Job event types
var JobEvent;
(function (JobEvent) {
    JobEvent["CREATED"] = "job:created";
    JobEvent["DISPATCHED"] = "job:dispatched";
    JobEvent["COMPLETED"] = "job:completed";
    JobEvent["FAILED"] = "job:failed";
})(JobEvent || (exports.JobEvent = JobEvent = {}));
/**
 * Job Dispatcher - Redis Pub/Sub for real-time job notifications
 */
class JobDispatcher {
    /**
     * Initialize the subscriber (call once at startup)
     */
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isInitialized)
                return;
            // Subscribe to all job events
            yield subscriber.subscribe(JobEvent.CREATED, JobEvent.DISPATCHED, JobEvent.COMPLETED, JobEvent.FAILED);
            // Handle incoming messages
            subscriber.on("message", (channel, message) => {
                try {
                    const payload = JSON.parse(message);
                    const listeners = this.listeners.get(channel);
                    if (listeners) {
                        listeners.forEach((callback) => callback(payload));
                    }
                }
                catch (error) {
                    console.error("Error processing job event:", error);
                }
            });
            this.isInitialized = true;
            console.log("📡 JobDispatcher initialized and listening for events");
        });
    }
    /**
     * Publish a job event
     */
    static publish(event, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = JSON.stringify(payload);
            yield queue_1.connection.publish(event, message);
            console.log(`📤 Published ${event}:`, payload.executionId);
        });
    }
    /**
     * Subscribe to a job event
     * Returns an unsubscribe function
     */
    static on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        // Return unsubscribe function
        return () => {
            var _a;
            (_a = this.listeners.get(event)) === null || _a === void 0 ? void 0 : _a.delete(callback);
        };
    }
    /**
     * Wait for a specific job event with timeout
     * Used for long polling
     */
    static waitForEvent(event_1) {
        return __awaiter(this, arguments, void 0, function* (event, timeout = 30000, filter) {
            return new Promise((resolve) => {
                let timeoutId;
                const unsubscribe = this.on(event, (payload) => {
                    // Apply filter if provided
                    if (filter && !filter(payload))
                        return;
                    // Event matched, clean up and resolve
                    clearTimeout(timeoutId);
                    unsubscribe();
                    resolve(payload);
                });
                // Timeout after specified duration
                timeoutId = setTimeout(() => {
                    unsubscribe();
                    resolve(null);
                }, timeout);
            });
        });
    }
}
exports.JobDispatcher = JobDispatcher;
JobDispatcher.listeners = new Map();
JobDispatcher.isInitialized = false;
// Graceful shutdown
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    yield subscriber.quit();
}));

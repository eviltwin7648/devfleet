import { connection } from "./queue";
import Redis from "ioredis";

// Create separate subscriber connection (Redis requirement)
const subscriber = connection.duplicate();

// Job event types
export enum JobEvent {
  CREATED = "job:created",
  DISPATCHED = "job:dispatched",
  COMPLETED = "job:completed",
  FAILED = "job:failed",
}

interface JobEventPayload {
  executionId: string;
  jobDefinitionId: string;
  agentId?: string;
  status: string;
}

/**
 * Job Dispatcher - Redis Pub/Sub for real-time job notifications
 */
export class JobDispatcher {
  private static listeners: Map<string, Set<(payload: JobEventPayload) => void>> = new Map();
  private static isInitialized = false;

  /**
   * Initialize the subscriber (call once at startup)
   */
  static async initialize() {
    if (this.isInitialized) return;

    // Subscribe to all job events
    await subscriber.subscribe(
      JobEvent.CREATED,
      JobEvent.DISPATCHED,
      JobEvent.COMPLETED,
      JobEvent.FAILED
    );

    // Handle incoming messages
    subscriber.on("message", (channel, message) => {
      try {
        const payload: JobEventPayload = JSON.parse(message);
        const listeners = this.listeners.get(channel);
        
        if (listeners) {
          listeners.forEach((callback) => callback(payload));
        }
      } catch (error) {
        console.error("Error processing job event:", error);
      }
    });

    this.isInitialized = true;
    console.log("📡 JobDispatcher initialized and listening for events");
  }

  /**
   * Publish a job event
   */
  static async publish(event: JobEvent, payload: JobEventPayload): Promise<void> {
    const message = JSON.stringify(payload);
    await connection.publish(event, message);
    console.log(`📤 Published ${event}:`, payload.executionId);
  }

  /**
   * Subscribe to a job event
   * Returns an unsubscribe function
   */
  static on(
    event: JobEvent,
    callback: (payload: JobEventPayload) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Wait for a specific job event with timeout
   * Used for long polling
   */
  static async waitForEvent(
    event: JobEvent,
    timeout: number = 30000,
    filter?: (payload: JobEventPayload) => boolean
  ): Promise<JobEventPayload | null> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      
      const unsubscribe = this.on(event, (payload) => {
        // Apply filter if provided
        if (filter && !filter(payload)) return;

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
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await subscriber.quit();
});

export { subscriber };

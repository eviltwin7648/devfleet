import { Response } from "express";
import { LogBatch } from "./logIngestion.Service";

type SSEClient = Response;

export class LogStreamManager {
  private static streams = new Map<string, Set<SSEClient>>();
  static subscribe(executionId: string, client: SSEClient) {
    if (!this.streams.has(executionId)) {
      this.streams.set(executionId, new Set());
    }
    // '!' here means non-null assertion.
    this.streams.get(executionId)!.add(client);
  }
  static unsubscribe(executionId: string, client: SSEClient) {
    this.streams.get(executionId)?.delete(client);
  }
  static publish(executionId: string, logs: LogBatch) {
    const clients = this.streams.get(executionId);
    if (!clients) return;
    for (const client of clients) {
      client.write(`data: ${JSON.stringify(logs)}\n\n`);
    }
  }
}

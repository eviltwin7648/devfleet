//get Log chunk from the agent and
// 1. save to the database
// 2. Send to the Client using SSE.

import { db } from "../../db/db";
import { LogStreamManager } from "./LogStreamManager.Service";

type LogType = "STDOUT" | "STDERR" | "SYSTEM";

interface LogEntry {
  type: LogType;
  content: string;
  timestamp: number;
  sequence: number;
}

export interface LogBatch {
  logs: LogEntry[];
  sequence: number;
}

export class LogIngestor {
  static async storeLogChunk(logBatch: LogBatch, executionId: string) {
    const { logs, sequence: batchSeq } = logBatch;
    if (!logs.length) return;

    const rows = logs.map((log) => {
      if (!isLogType(log.type)) {
        throw new Error("Invalid Log Type");
      }
      return {
        executionId,
        batchSeq,
        seq: log.sequence,
        type: log.type,
        content: log.content,
        timestamp: new Date(log.timestamp),
      };
    });
    console.log("ingesting logs");
    await db.logChunk.createMany({ data: rows });
    //publish to the log stream manager. it will send the current batch
    //  of logs to the required client.

    LogStreamManager.publish(executionId, logBatch);
  }
}

function isLogType(type: string): type is LogType {
  return type === "STDOUT" || type === "STDERR" || type === "SYSTEM";
}

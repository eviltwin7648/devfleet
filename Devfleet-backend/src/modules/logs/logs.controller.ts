import { Request, Response } from "express";
import { LogStreamManager } from "./LogStreamManager.Service";
import { db } from "../../db/db";

const streamLogs = async (req: Request, res: Response) => {
  const { executionId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  LogStreamManager.subscribe(executionId, res);

  const logs = await db.logChunk.findMany({
    where: { executionId },
    orderBy: [{ batchSeq: "asc" }, { seq: "asc" }],
  });

  console.log("LOGS TYPE:", typeof logs);
  console.log("LOGS VALUE:", logs);
  res.write(`data: ${JSON.stringify(logs)}\n\n`);
  req.on("close", () => {
    LogStreamManager.unsubscribe(executionId, res);
  });
};

export const logController = {
  streamLogs,
};

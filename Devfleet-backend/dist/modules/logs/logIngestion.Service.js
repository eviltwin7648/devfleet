"use strict";
//get Log chunk from the agent and
// 1. save to the database
// 2. Send to the Client using SSE.
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
exports.LogIngestor = void 0;
const db_1 = require("../../db/db");
const LogStreamManager_Service_1 = require("./LogStreamManager.Service");
class LogIngestor {
    static storeLogChunk(logBatch, executionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { logs, sequence: batchSeq } = logBatch;
            if (!logs.length)
                return;
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
            yield db_1.db.logChunk.createMany({ data: rows });
            //publish to the log stream manager. it will send the current batch
            //  of logs to the required client.
            LogStreamManager_Service_1.LogStreamManager.publish(executionId, logBatch);
        });
    }
}
exports.LogIngestor = LogIngestor;
function isLogType(type) {
    return type === "STDOUT" || type === "STDERR" || type === "SYSTEM";
}

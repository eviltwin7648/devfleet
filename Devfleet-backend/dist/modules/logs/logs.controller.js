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
exports.logController = void 0;
const LogStreamManager_Service_1 = require("./LogStreamManager.Service");
const db_1 = require("../../db/db");
const streamLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { executionId } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    LogStreamManager_Service_1.LogStreamManager.subscribe(executionId, res);
    const logs = yield db_1.db.logChunk.findMany({
        where: { executionId },
        orderBy: [{ batchSeq: "asc" }, { seq: "asc" }],
    });
    console.log("LOGS TYPE:", typeof logs);
    console.log("LOGS VALUE:", logs);
    res.write(`data: ${JSON.stringify(logs)}\n\n`);
    req.on("close", () => {
        LogStreamManager_Service_1.LogStreamManager.unsubscribe(executionId, res);
    });
});
exports.logController = {
    streamLogs,
};

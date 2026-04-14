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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const server_1 = require("./server");
const jobDispatcher_1 = require("../lib/jobDispatcher");
const longPollManager_1 = require("../modules/agents/longPollManager");
dotenv_1.default.config();
const PORT = process.env.PORT || 8000;
const app = (0, server_1.createServer)();
// Initialize JobDispatcher for real-time events
jobDispatcher_1.JobDispatcher.initialize();
// Connect JobDispatcher to LongPollManager
// When a job is created, notify all waiting agents
jobDispatcher_1.JobDispatcher.on(jobDispatcher_1.JobEvent.CREATED, (payload) => {
    console.log(`📢 Job created: ${payload.executionId}, notifying waiting agents`);
    longPollManager_1.LongPollManager.notifyAll(Object.assign({ id: payload.executionId }, payload));
});
const db_1 = require("../db/db");
// Agent Disconnect Detection (every minute)
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    try {
        const result = yield db_1.db.agent.updateMany({
            where: { isOnline: true, lastSeen: { lt: twoMinutesAgo } },
            data: { isOnline: false }
        });
        if (result.count > 0) {
            console.log(`🔌 Marked ${result.count} agents as offline due to missed heartbeats.`);
        }
    }
    catch (e) {
        console.error("Disconnect detection error:", e);
    }
}), 60 * 1000);
app.listen(PORT, () => {
    console.log(`DevFleet Server is Up and running on port ${PORT}`);
});

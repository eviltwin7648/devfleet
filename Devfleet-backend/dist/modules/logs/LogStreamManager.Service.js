"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogStreamManager = void 0;
class LogStreamManager {
    static subscribe(executionId, client) {
        if (!this.streams.has(executionId)) {
            this.streams.set(executionId, new Set());
        }
        // '!' here means non-null assertion.
        this.streams.get(executionId).add(client);
    }
    static unsubscribe(executionId, client) {
        var _a;
        (_a = this.streams.get(executionId)) === null || _a === void 0 ? void 0 : _a.delete(client);
    }
    static publish(executionId, logs) {
        const clients = this.streams.get(executionId);
        if (!clients)
            return;
        for (const client of clients) {
            client.write(`data: ${JSON.stringify(logs)}\n\n`);
        }
    }
}
exports.LogStreamManager = LogStreamManager;
LogStreamManager.streams = new Map();

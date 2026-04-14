"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const agentAuth = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default_secret");
        if (!decoded.id || !decoded.hostname) {
            res.status(403).json({ message: "Invalid Token Payload" });
            return;
        }
        req.agent = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({ message: "Invalid or expired token" });
        return;
    }
};
exports.agentAuth = agentAuth;

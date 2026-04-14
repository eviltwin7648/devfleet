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
exports.userAuth = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db/db");
dotenv_1.default.config();
const userAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
            res.status(401).json({ message: "Access Denied: No token provided." });
            return;
        }
        const decodedPayload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield db_1.db.user.findUnique({
            where: {
                id: decodedPayload.userId,
            },
            select: { id: true, email: true },
        });
        if (!user) {
            res.status(401).json({
                message: "Unauthorized: User Not Found",
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.json({ message: "Error While Authorization", error: String(error) });
        throw new Error(String(error));
    }
});
exports.userAuth = userAuth;

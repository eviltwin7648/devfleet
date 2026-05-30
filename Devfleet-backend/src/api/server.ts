import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./routes";

export const createServer = () => {
    const app = express();
    let frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    try {
        const url = new URL(frontendUrl);
        frontendUrl = url.origin;
    } catch (e) {
        // Fallback if URL parsing fails
    }

    const allowedOrigins = [
        frontendUrl,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost"
    ];

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        credentials: true
    }));

    registerRoutes(app);

    return app;
};

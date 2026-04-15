import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./routes";

export const createServer = () => {
    const app = express();
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(cors({ origin: frontendUrl, credentials: true }));

    registerRoutes(app);

    return app;
};

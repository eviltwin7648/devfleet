import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./routes";

export const createServer = () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(cors({ origin: "http://localhost:5173", credentials: true }));

    registerRoutes(app);

    return app;
};

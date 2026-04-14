import dotenv from "dotenv";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/db";
dotenv.config();

export const userAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      res.status(401).json({ message: "Access Denied: No token provided." });
      return;
    }
    const decodedPayload = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as {
      userId: string;
      email: string;
    };
    const user = await db.user.findUnique({
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
  } catch (error) {
    res.json({ message: "Error While Authorization", error: String(error) });
    throw new Error(String(error));
  }
};

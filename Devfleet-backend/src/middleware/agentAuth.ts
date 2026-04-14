import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AgentPayload {
  id: string;
  hostname: string;
}

declare global {
  namespace Express {
    interface Request {
      agent?: AgentPayload;
    }
  }
}

export const agentAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return; 
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as AgentPayload;
    if (!decoded.id || !decoded.hostname) {
        res.status(403).json({ message: "Invalid Token Payload" });   
        return
    }
    req.agent = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
    return
  }
};

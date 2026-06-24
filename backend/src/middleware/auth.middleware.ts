import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import config from "../lib/config";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    avatarUrl: string;
    githubToken: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Malformed Bearer token" });
  }

  const jwtSecret = config.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Dynamically retrieve the user from the database
    const user = await db.collections.users.findOne({ githubId: String(decoded.userId) });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found in database" });
    }

    req.user = {
      userId: String(user._id),
      username: decoded.username,
      avatarUrl: decoded.avatarUrl,
      githubToken: user.githubToken || "",
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";

export type JwtUser = {
  id: string;
  role: Role;
};

export type AuthenticatedRequest = Request & {
  user?: JwtUser;
};

type AuthTokenPayload = jwt.JwtPayload & {
  sub: string;
  role: Role;
};

export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Authentication token required" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

    if (!decoded.sub) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
}

export function allowRoles(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}

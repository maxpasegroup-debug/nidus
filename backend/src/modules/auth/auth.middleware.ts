import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";
import { readAuthToken } from "./auth.cookies.js";

export type JwtUser = {
  id: string;
  role: Role;
  sessionId?: string;
};

export type AuthenticatedRequest = Request & {
  user?: JwtUser;
};

type AuthTokenPayload = jwt.JwtPayload & {
  sub: string;
  role: Role;
  sid?: string;
};

export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = readAuthToken(req);
    if (!token) {
      res.status(401).json({ message: "Authentication token required" });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

    if (!decoded.sub) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true, isDisabled: true }
    });

    if (!user || user.isDisabled) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    if (decoded.sid) {
      const session = await prisma.authSession.findUnique({ where: { id: decoded.sid } });
      const idleExpiry = new Date(Date.now() - env.AUTH_IDLE_TIMEOUT_MINUTES * 60 * 1000);
      if (!session || session.userId !== user.id || session.revokedAt || session.expiresAt <= new Date() || session.lastActivityAt <= idleExpiry) {
        res.status(401).json({ message: "Session expired" });
        return;
      }

      await prisma.authSession.update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() }
      });
    }

    req.user = { id: user.id, role: user.role, sessionId: decoded.sid };
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

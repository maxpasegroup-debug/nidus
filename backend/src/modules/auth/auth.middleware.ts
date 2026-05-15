import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";

export type JwtUser = {
  id: string;
  email?: string;
  role: Role;
  instituteId?: string | null;
  branchId?: string | null;
};

export type AuthenticatedRequest = Request & {
  user?: JwtUser;
};

type AuthTokenPayload = jwt.JwtPayload & {
  id?: string;
  sub?: string;
  email?: string;
  role: Role;
};

function readBearerToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return undefined;
  return authHeader.slice("Bearer ".length).trim();
}

export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = readBearerToken(req);
    if (!token) {
      res.status(401).json({ message: "Authentication token required" });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    const userId = decoded.id ?? decoded.sub;
    if (!userId) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isDisabled: true, instituteId: true, branchId: true }
    });

    if (!user || user.isDisabled) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role, instituteId: user.instituteId, branchId: user.branchId };
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired authentication token" });
  }
}

export function requireInstituteScope() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (req.user.role === "ADMIN") {
      next();
      return;
    }

    const instituteId = typeof req.params.instituteId === "string" ? req.params.instituteId : req.query.instituteId;
    const branchId = typeof req.params.branchId === "string" ? req.params.branchId : req.query.branchId;

    if (typeof instituteId === "string" && req.user.instituteId && instituteId !== req.user.instituteId) {
      res.status(403).json({ message: "Institute access denied" });
      return;
    }

    if (typeof branchId === "string" && req.user.branchId && branchId !== req.user.branchId) {
      res.status(403).json({ message: "Branch access denied" });
      return;
    }

    next();
  };
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

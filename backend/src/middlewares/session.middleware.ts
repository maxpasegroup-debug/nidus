import type { NextFunction, Request, Response } from "express";
import { Role } from "../generated/prisma/client.js";
import { AuthServiceV2 } from "../modules/auth/auth.v2.service.js";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    emailVerified: boolean;
    instituteId: string | null;
    branchId: string | null;
  };
};

function parseCookies(header?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const rawPart of (header ?? "").split(";")) {
    const part = rawPart.trim();
    if (!part) continue;
    const [rawKey, ...rawValue] = part.split("=");
    if (!rawKey) continue;
    cookies[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
  }
  return cookies;
}

export function sessionIdFromRequest(req: Request) {
  const cookieSession = (req as Request & { cookies?: Record<string, string> }).cookies?.session;
  if (typeof cookieSession === "string") return cookieSession;
  return parseCookies(req.headers.cookie).session;
}

export async function sessionAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sessionId = sessionIdFromRequest(req);
    if (!sessionId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    req.user = await AuthServiceV2.verify(sessionId);
    next();
  } catch (_error) {
    res.clearCookie("session", { path: "/" });
    res.status(401).json({ success: false, message: "Session invalid or expired" });
  }
}

export const protect = sessionAuth;

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    next();
  };
}

export const allowRoles = requireRole;

export function requireInstituteScope() {
  return (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => next();
}

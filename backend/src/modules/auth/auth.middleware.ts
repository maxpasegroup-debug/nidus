import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";
import { AuthErrorCode, type AccessTokenPayload } from "../../types/auth.types.js";
import { authService } from "./auth.service.js";

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

function readBearerToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return undefined;
  return authHeader.slice("Bearer ".length).trim();
}

function rejectAuth(res: Response, statusCode: number, code: AuthErrorCode, message: string) {
  res.status(statusCode).json({ success: false, code, message });
}

export async function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) {
    rejectAuth(res, 401, AuthErrorCode.MISSING_TOKEN, "Authentication token required");
    return;
  }

  try {
    if (await authService.isAccessTokenBlacklisted(token)) {
      rejectAuth(res, 401, AuthErrorCode.INVALID_TOKEN, "Authentication token has been revoked");
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    if (decoded.type !== "access" || !decoded.id) {
      rejectAuth(res, 401, AuthErrorCode.INVALID_TOKEN, "Invalid authentication token");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isDisabled: true, instituteId: true, branchId: true, tokenVersion: true }
    });

    if (!user) {
      rejectAuth(res, 401, AuthErrorCode.USER_NOT_FOUND, "User not found");
      return;
    }

    if (user.isDisabled) {
      rejectAuth(res, 403, AuthErrorCode.USER_DISABLED, "Account disabled");
      return;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      rejectAuth(res, 401, AuthErrorCode.INVALID_TOKEN, "Authentication token has been revoked");
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role, instituteId: user.instituteId, branchId: user.branchId };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      rejectAuth(res, 401, AuthErrorCode.EXPIRED_TOKEN, "Authentication token expired");
      return;
    }
    rejectAuth(res, 401, AuthErrorCode.INVALID_TOKEN, "Invalid authentication token");
  }
}

export function requireInstituteScope() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      rejectAuth(res, 401, AuthErrorCode.MISSING_TOKEN, "Unauthorized");
      return;
    }

    if (req.user.role === "ADMIN") {
      next();
      return;
    }

    const instituteId = typeof req.params.instituteId === "string" ? req.params.instituteId : req.query.instituteId;
    const branchId = typeof req.params.branchId === "string" ? req.params.branchId : req.query.branchId;

    if (typeof instituteId === "string" && req.user.instituteId && instituteId !== req.user.instituteId) {
      res.status(403).json({ success: false, code: "INSTITUTE_ACCESS_DENIED", message: "Institute access denied" });
      return;
    }

    if (typeof branchId === "string" && req.user.branchId && branchId !== req.user.branchId) {
      res.status(403).json({ success: false, code: "BRANCH_ACCESS_DENIED", message: "Branch access denied" });
      return;
    }

    next();
  };
}

export function allowRoles(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      rejectAuth(res, 401, AuthErrorCode.MISSING_TOKEN, "Unauthorized");
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, code: "FORBIDDEN", message: "Forbidden" });
      return;
    }

    next();
  };
}

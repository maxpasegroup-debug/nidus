import type { NextFunction, Response } from "express";
import { TopRankRole } from "../../generated/prisma/client.js";
import { topRankAuthService } from "./toprank-auth.service.js";
import type { TopRankAuthenticatedRequest } from "./toprank.types.js";

export const TOPRANK_SESSION_COOKIE = "toprank_session";

function parseCookies(header?: string) {
  return Object.fromEntries((header ?? "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return index === -1 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function topRankSessionFromRequest(req: TopRankAuthenticatedRequest) {
  const cookieBag = (req as TopRankAuthenticatedRequest & { cookies?: Record<string, string> }).cookies;
  return cookieBag?.[TOPRANK_SESSION_COOKIE] ?? parseCookies(req.headers.cookie)[TOPRANK_SESSION_COOKIE];
}

export async function topRankProtect(req: TopRankAuthenticatedRequest, res: Response, next: NextFunction) {
  const user = await topRankAuthService.verify(topRankSessionFromRequest(req));
  if (!user) {
    res.status(401).json({ success: false, message: "TopRank login required" });
    return;
  }
  req.topRankUser = user;
  next();
}

export function topRankAllowRoles(...roles: TopRankRole[]) {
  return (req: TopRankAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.topRankUser || !roles.includes(req.topRankUser.role)) {
      res.status(403).json({ success: false, message: "TopRank role access denied" });
      return;
    }
    next();
  };
}


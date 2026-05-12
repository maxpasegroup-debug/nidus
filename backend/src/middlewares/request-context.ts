import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers["x-request-id"] as string | undefined) || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

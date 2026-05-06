import type { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Response {
    ok: (data?: unknown, meta?: Record<string, unknown>) => Response;
  }
}

export function responseFormatter(_req: Request, res: Response, next: NextFunction) {
  res.ok = (data?: unknown, meta?: Record<string, unknown>) =>
    res.json({
      success: true,
      data: data ?? null,
      meta
    });

  next();
}

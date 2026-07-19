import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { reportsOsService } from "./reports-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

function period(value: unknown): "DAILY" | "WEEKLY" | "MONTHLY" {
  const normalized = String(value || "").toUpperCase();
  if (["DAILY", "WEEKLY", "MONTHLY"].includes(normalized)) return normalized as "DAILY" | "WEEKLY" | "MONTHLY";
  return "DAILY";
}

export const reportsOsController = {
  framework(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(reportsOsService.framework());
    } catch (error) {
      next(error);
    }
  },

  async current(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await reportsOsService.generate(actor(req), period(req.query.period)));
    } catch (error) {
      next(error);
    }
  },

  async pdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await reportsOsService.queuePdf(actor(req), period(req.query.period)));
    } catch (error) {
      next(error);
    }
  }
};

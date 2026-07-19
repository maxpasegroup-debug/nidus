import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { communicationOsService } from "./communication-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

function period(value: unknown): "DAILY" | "WEEKLY" | "MONTHLY" | undefined {
  const normalized = String(value || "").toUpperCase();
  if (["DAILY", "WEEKLY", "MONTHLY"].includes(normalized)) return normalized as "DAILY" | "WEEKLY" | "MONTHLY";
  return undefined;
}

function stringValue(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const communicationOsController = {
  framework(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(communicationOsService.framework());
    } catch (error) {
      next(error);
    }
  },

  async dispatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(202).json(await communicationOsService.dispatch(actor(req), req.body));
    } catch (error) {
      next(error);
    }
  },

  async bundle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await communicationOsService.bundle(actor(req), {
        targetRole: stringValue(req.query.targetRole),
        targetUserId: stringValue(req.query.targetUserId),
        period: period(req.query.period)
      }));
    } catch (error) {
      next(error);
    }
  },

  async health(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await communicationOsService.health(actor(req)));
    } catch (error) {
      next(error);
    }
  }
};

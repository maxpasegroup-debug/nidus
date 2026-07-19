import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { classRatingOsService } from "./class-rating-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

function stringValue(value: unknown) {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const classRatingOsController = {
  framework(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(classRatingOsService.framework());
    } catch (error) {
      next(error);
    }
  },

  async pending(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await classRatingOsService.pendingForStudent(actor(req)));
    } catch (error) {
      next(error);
    }
  },

  async submit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await classRatingOsService.submit(actor(req), req.body));
    } catch (error) {
      next(error);
    }
  },

  async summary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await classRatingOsService.summary(actor(req), {
        calendarId: stringValue(req.query.calendarId),
        teacherId: stringValue(req.query.teacherId),
        batchId: stringValue(req.query.batchId)
      }));
    } catch (error) {
      next(error);
    }
  }
};

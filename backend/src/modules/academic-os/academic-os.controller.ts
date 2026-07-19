import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { academicOsService } from "./academic-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

export const academicOsController = {
  flow(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(academicOsService.flow());
    } catch (error) {
      next(error);
    }
  },

  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await academicOsService.dashboard(actor(req)));
    } catch (error) {
      next(error);
    }
  },

  async batch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rawBatchId = req.params.batchId;
      const batchId = Array.isArray(rawBatchId) ? rawBatchId[0] : rawBatchId;
      if (!batchId) throw Object.assign(new Error("Batch id is required"), { statusCode: 400 });
      res.json(await academicOsService.batch(actor(req), batchId));
    } catch (error) {
      next(error);
    }
  }
};

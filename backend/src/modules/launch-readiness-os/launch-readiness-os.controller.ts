import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { launchReadinessOsService } from "./launch-readiness-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

export const launchReadinessOsController = {
  framework(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(launchReadinessOsService.framework());
    } catch (error) {
      next(error);
    }
  },

  async checklist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await launchReadinessOsService.checklist(actor(req)));
    } catch (error) {
      next(error);
    }
  }
};

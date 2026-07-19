import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { pilotLaunchOsService } from "./pilot-launch-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

export const pilotLaunchOsController = {
  framework(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(pilotLaunchOsService.framework());
    } catch (error) {
      next(error);
    }
  },

  async readiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await pilotLaunchOsService.readiness(actor(req)));
    } catch (error) {
      next(error);
    }
  }
};

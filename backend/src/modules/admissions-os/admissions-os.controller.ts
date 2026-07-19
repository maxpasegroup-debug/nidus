import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { admissionsOsService } from "./admissions-os.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

export const admissionsOsController = {
  journey(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(admissionsOsService.journey());
    } catch (error) {
      next(error);
    }
  },

  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await admissionsOsService.dashboard(actor(req)));
    } catch (error) {
      next(error);
    }
  },

  async leadJourney(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rawLeadId = req.params.leadId;
      const leadId = Array.isArray(rawLeadId) ? rawLeadId[0] : rawLeadId;
      if (!leadId) throw Object.assign(new Error("Lead id is required"), { statusCode: 400 });
      res.json(await admissionsOsService.leadJourney(actor(req), leadId));
    } catch (error) {
      next(error);
    }
  }
};

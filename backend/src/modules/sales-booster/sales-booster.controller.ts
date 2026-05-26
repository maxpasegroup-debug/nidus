import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { salesBoosterService } from "./sales-booster.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

function requester(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}

export const salesBoosterController = {
  async campaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ campaigns: await salesBoosterService.campaigns(requester(req)) });
    } catch (error) {
      next(error);
    }
  },

  async summary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ summary: await salesBoosterService.summary(requester(req)) });
    } catch (error) {
      next(error);
    }
  },

  async analytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ analytics: await salesBoosterService.analytics(requester(req)) });
    } catch (error) {
      next(error);
    }
  },

  async createCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ campaign: await salesBoosterService.createCampaign(requester(req), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async updateCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ campaign: await salesBoosterService.updateCampaign(requester(req), param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ campaign: await salesBoosterService.updateStatus(requester(req), param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async deleteCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await salesBoosterService.deleteCampaign(requester(req), param(req, "id")));
    } catch (error) {
      next(error);
    }
  },

  async connectorStatus(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ connectors: await salesBoosterService.connectorStatus() });
    } catch (error) {
      next(error);
    }
  },

  async runCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ campaign: await salesBoosterService.runCampaign(requester(req), param(req, "id")) });
    } catch (error) {
      next(error);
    }
  },

  async addMetricSnapshot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ snapshot: await salesBoosterService.addMetricSnapshot(requester(req), param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async campaignReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ report: await salesBoosterService.report(requester(req), param(req, "id")) });
    } catch (error) {
      next(error);
    }
  }
};

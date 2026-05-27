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

  async uploadCreative(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new Error("Creative file is required");
      res.status(201).json({ creative: await salesBoosterService.uploadCreative(requester(req), req.file) });
    } catch (error) {
      next(error);
    }
  },

  async attachCreative(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ campaign: await salesBoosterService.attachCreative(requester(req), param(req, "id"), req.body) });
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

  async audience(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ audience: await salesBoosterService.audience(requester(req)) });
    } catch (error) {
      next(error);
    }
  },

  async addAudienceContact(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json({ contact: await salesBoosterService.addAudienceContact(requester(req), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async importLeadsToAudience(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await salesBoosterService.importLeadsToAudience(requester(req), typeof req.body?.segment === "string" ? req.body.segment : "CRM Leads"));
    } catch (error) {
      next(error);
    }
  },

  async broadcastWhatsApp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json(await salesBoosterService.broadcastWhatsApp(requester(req), req.body));
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

  async scheduleCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json({ campaign: await salesBoosterService.scheduleCampaign(requester(req), param(req, "id"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async scheduledCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ campaigns: await salesBoosterService.scheduledCampaigns(requester(req)) });
    } catch (error) {
      next(error);
    }
  },

  async runDueCampaigns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await salesBoosterService.runDueCampaigns(requester(req)));
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

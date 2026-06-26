import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { crmService } from "./crm.service.js";
import type { LeadStatus } from "../../generated/prisma/client.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

function userId(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user.id;
}

function requester(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}

export const crmController = {
  async leads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ leads: await crmService.leads({ status: typeof req.query.status === "string" ? req.query.status as LeadStatus : undefined, search: typeof req.query.search === "string" ? req.query.search : undefined }, requester(req)) });
    } catch (error) { next(error); }
  },
  async createLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ lead: await crmService.createLead(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async createGuestApplicant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json(await crmService.createGuestApplicant(requester(req), req.body)); } catch (error) { next(error); }
  },
  async createPublicLead(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ lead: await crmService.createPublicLead(req.body) }); } catch (error) { next(error); }
  },
  async updateLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.json({ lead: await crmService.updateLead(requester(req), param(req, "id"), req.body) }); } catch (error) { next(error); }
  },
  async deleteLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json(await crmService.deleteLead(requester(req), param(req, "id"))); } catch (error) { next(error); }
  },
  async createFollowUp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); userId(req); res.status(201).json({ followUp: await crmService.createFollowUp(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async followUps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ followUps: await crmService.followUps(requester(req)) }); } catch (error) { next(error); }
  },
  async createAdmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ admission: await crmService.createAdmission(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async admissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ admissions: await crmService.admissions(requester(req)) }); } catch (error) { next(error); }
  },
  async approveAdmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.json({ admission: await crmService.approveAdmission(requester(req), param(req, "id"), req.body) }); } catch (error) { next(error); }
  },
  async approvals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ approvals: await crmService.approvals(requester(req)) }); } catch (error) { next(error); }
  },
  async createScholarship(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ scholarship: await crmService.createScholarship(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async reviewScholarship(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.json({ scholarship: await crmService.reviewScholarship(requester(req), param(req, "id"), req.body) }); } catch (error) { next(error); }
  },
  async createCounselling(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ booking: await crmService.createCounselling(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async counselling(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ bookings: await crmService.counselling(requester(req)) }); } catch (error) { next(error); }
  },
  async referrals(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ referrals: await crmService.referrals() }); } catch (error) { next(error); }
  },
  async createReferral(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ referral: await crmService.createReferral(req.body) }); } catch (error) { next(error); }
  }
};

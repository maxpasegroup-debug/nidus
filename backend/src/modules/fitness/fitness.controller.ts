import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { fitnessService } from "./fitness.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function requester(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

export const fitnessController = {
  async profile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ profile: await fitnessService.profile(requester(req)) }); } catch (error) { next(error); }
  },
  async upsertProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); const profile = await fitnessService.upsertProfile(requester(req), req.body); res.status(201).json({ profile, suggestions: fitnessService.suggestionsForProfile(profile) }); } catch (error) { next(error); }
  },
  async ptSchedules(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ schedules: await fitnessService.ptSchedules() }); } catch (error) { next(error); }
  },
  async createPTSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ schedule: await fitnessService.createPTSchedule(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async markAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ attendance: await fitnessService.markAttendance(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async attendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ attendance: await fitnessService.attendance(param(req, "studentId"), requester(req)) }); } catch (error) { next(error); }
  },
  async eligibility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ eligibility: await fitnessService.eligibility(requester(req)) }); } catch (error) { next(error); }
  },
  async checkEligibility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ eligibility: await fitnessService.checkEligibility(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async createLog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ log: await fitnessService.createLog(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async logs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ logs: await fitnessService.logs(requester(req)) }); } catch (error) { next(error); }
  }
};

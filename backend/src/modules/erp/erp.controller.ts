import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { erpService } from "./erp.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

function markerId(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user.id;
}

export const erpController = {
  async markAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ attendance: await erpService.markAttendance(markerId(req), req.body) }); } catch (error) { next(error); }
  },
  async studentAttendance(req: Request, res: Response, next: NextFunction) {
    try { res.json({ attendance: await erpService.studentAttendance(param(req, "id")) }); } catch (error) { next(error); }
  },
  async classAttendance(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ attendance: await erpService.classAttendance() }); } catch (error) { next(error); }
  },
  async timetable(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ timetable: await erpService.timetable() }); } catch (error) { next(error); }
  },
  async createTimetable(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ timetable: await erpService.createTimetable(req.body) }); } catch (error) { next(error); }
  },
  async updateTimetable(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.json({ timetable: await erpService.updateTimetable(param(req, "id"), req.body) }); } catch (error) { next(error); }
  },
  async deleteTimetable(req: Request, res: Response, next: NextFunction) {
    try { res.json(await erpService.deleteTimetable(param(req, "id"))); } catch (error) { next(error); }
  },
  async faculty(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ faculty: await erpService.faculty() }); } catch (error) { next(error); }
  },
  async createFaculty(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ faculty: await erpService.createFaculty(req.body) }); } catch (error) { next(error); }
  },
  async payroll(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ payroll: await erpService.payroll() }); } catch (error) { next(error); }
  },
  async createPayroll(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ payroll: await erpService.createPayroll(req.body) }); } catch (error) { next(error); }
  },
  async announcements(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ announcements: await erpService.announcements() }); } catch (error) { next(error); }
  },
  async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ announcement: await erpService.createAnnouncement(req.body) }); } catch (error) { next(error); }
  }
};

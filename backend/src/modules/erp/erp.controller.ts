import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
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

function scope(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return { id: req.user.id, instituteId: req.user.instituteId };
}

export const erpController = {
  async markAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ attendance: await erpService.markAttendance(scope(req), req.body) }); } catch (error) { next(error); }
  },
  async studentAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requester = scope(req);
      const targetId = param(req, "id");
      if (req.user?.role === "STUDENT" && req.user.id !== targetId) {
        res.status(403).json({ message: "Students may only view their own attendance" });
        return;
      }
      res.json({ attendance: await erpService.studentAttendance(requester, targetId) });
    } catch (error) { next(error); }
  },
  async classAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ attendance: await erpService.classAttendance(scope(req)) }); } catch (error) { next(error); }
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
  async faculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ faculty: await erpService.faculty(scope(req)) }); } catch (error) { next(error); }
  },
  async createFaculty(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ faculty: await erpService.createFaculty(req.body) }); } catch (error) { next(error); }
  },
  async payroll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ payroll: await erpService.payroll(scope(req)) }); } catch (error) { next(error); }
  },
  async operationsShell(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ operations: await erpService.operationsShell() }); } catch (error) { next(error); }
  },
  async createPayroll(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ payroll: await erpService.createPayroll(req.body) }); } catch (error) { next(error); }
  },
  async announcements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ announcements: await erpService.announcements(scope(req)) }); } catch (error) { next(error); }
  },
  async createAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ announcement: await erpService.createAnnouncement(scope(req), req.body) }); } catch (error) { next(error); }
  }
};

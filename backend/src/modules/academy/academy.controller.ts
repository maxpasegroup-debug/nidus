import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { academyService } from "./academy.service.js";

function requester(req: AuthenticatedRequest) {
  if (!req.user) {
    throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  }
  return req.user;
}

function param(req: AuthenticatedRequest, key: string) {
  const value = req.params[key];
  if (!value) {
    throw Object.assign(new Error(`${key} is required`), { statusCode: 400 });
  }
  return value;
}

export const academyController = {
  batches: async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.batches());
    } catch (error) {
      next(error);
    }
  },
  createBatch: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.createBatch(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  updateBatch: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.updateBatch(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  addStudent: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.addStudent(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  assignTeacher: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.assignTeacher(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  teacherAssignments: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.teacherAssignments(requester(req)));
    } catch (error) {
      next(error);
    }
  },
  myAcademicPlan: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.myAcademicPlan(requester(req)));
    } catch (error) {
      next(error);
    }
  },
  teachers: async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.teachers());
    } catch (error) {
      next(error);
    }
  },
  academicCalendar: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.academicCalendar(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  createAcademicCalendarItem: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.createAcademicCalendarItem(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  updateAcademicCalendarItem: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.updateAcademicCalendarItem(param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  approveAdmissionToBatch: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.approveAdmissionToBatch(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  employees: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.employees(requester(req), req.query.includeArchived === "true"));
    } catch (error) {
      next(error);
    }
  },
  createEmployee: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.createEmployee(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  updateEmployee: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.updateEmployee(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  archiveEmployee: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.archiveEmployee(requester(req), param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
  resetEmployeePassword: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.resetEmployeePassword(requester(req), param(req, "id"), req.body?.password));
    } catch (error) {
      next(error);
    }
  },
};

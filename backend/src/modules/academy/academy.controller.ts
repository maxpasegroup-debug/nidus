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
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    throw Object.assign(new Error(`${key} is required`), { statusCode: 400 });
  }
  return normalized;
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
  teacherTeachingPlan: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.teacherTeachingPlan(requester(req)));
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
      res.json(await academyService.updateAcademicCalendarItem(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  saveAttendance: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.saveAttendance(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  attendanceHistory: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.attendanceHistory(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  attendanceSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.attendanceSummary(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  createAssignment: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.createAssignment(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  assignments: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.assignments(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  assignmentSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.assignmentSummary(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  submitAssignment: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.submitAssignment(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  reviewAssignmentSubmission: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.reviewAssignmentSubmission(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  publishStudyMaterial: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.publishStudyMaterial(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  studyMaterials: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.studyMaterials(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  materialSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.materialSummary(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  updateStudyMaterial: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.updateStudyMaterial(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  archiveStudyMaterial: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.archiveStudyMaterial(requester(req), param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
  reviewStudyMaterial: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.reviewStudyMaterial(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  createExamDraft: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.createExamDraft(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  publishExam: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.publishExam(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  exams: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.exams(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  examSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.examSummary(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  syllabusProgress: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.syllabusProgress(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  syllabusSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.syllabusSummary(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  academicAuditTrail: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.academicAuditTrail(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  directorExpenses: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.directorExpenses(requester(req)));
    } catch (error) {
      next(error);
    }
  },
  createDirectorExpense: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.createDirectorExpense(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  archiveDirectorExpense: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.archiveDirectorExpense(requester(req), param(req, "id")));
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

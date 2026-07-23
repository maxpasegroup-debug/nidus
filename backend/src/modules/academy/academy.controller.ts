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
  batches: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.batches(requester(req), req.query));
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
  updateStudent: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.updateStudent(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  resetStudentPin: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.resetStudentPin(requester(req), param(req, "id"), req.body?.pin || req.body?.password));
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
  batchAnnouncements: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.batchAnnouncements(requester(req), param(req, "batchId")));
    } catch (error) {
      next(error);
    }
  },
  createBatchAnnouncement: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.createBatchAnnouncement(requester(req), param(req, "batchId"), req.body));
    } catch (error) {
      next(error);
    }
  },
  today: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.today(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  todayAction: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.todayAction(requester(req), req.body));
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
  generateAcademicCalendarPlan: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.generateAcademicCalendarPlan(requester(req), req.body));
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
  markStudentAttendance: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.markStudentAttendance(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  updateAttendance: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.updateAttendance(requester(req), param(req, "id"), req.body));
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
  createLeaveRequest: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.createLeaveRequest(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  leaveRequests: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.leaveRequests(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  reviewLeaveRequest: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.reviewLeaveRequest(requester(req), param(req, "id"), req.body));
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
  updateAssignment: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.updateAssignment(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  archiveAssignment: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.archiveAssignment(requester(req), param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
  publishAssignmentChanges: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.publishAssignmentChanges(requester(req), param(req, "id")));
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
  restoreStudyMaterial: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.restoreStudyMaterial(requester(req), param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
  deleteStudyMaterial: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.deleteStudyMaterial(requester(req), param(req, "id")));
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
  updateExam: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.updateExam(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },
  archiveExam: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.archiveExam(requester(req), param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
  publishExamChanges: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.publishExamChanges(requester(req), param(req, "id")));
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
  examResults: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.examResults(requester(req), param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
  releaseExamResults: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.releaseExamResults(requester(req), param(req, "id")));
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
  teacherPerformanceSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.teacherPerformanceSummary(requester(req)));
    } catch (error) {
      next(error);
    }
  },
  academicCalendarMonitor: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.academicCalendarMonitor(requester(req)));
    } catch (error) {
      next(error);
    }
  },
  studentProgressSummary: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.studentProgressSummary(requester(req)));
    } catch (error) {
      next(error);
    }
  },
  academicAssessmentEcosystem: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.academicAssessmentEcosystem(requester(req)));
    } catch (error) {
      next(error);
    }
  },
  ndpStudents: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.ndpStudents(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  ndpReviews: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.ndpReviews(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  ndpReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.ndpReview(requester(req), req.query));
    } catch (error) {
      next(error);
    }
  },
  saveNdpReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.saveNdpReview(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  submitNdpReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.submitNdpReview(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },
  approveNdpReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.transitionNdpReview(requester(req), param(req, "id"), "APPROVE", req.body));
    } catch (error) {
      next(error);
    }
  },
  returnNdpReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.transitionNdpReview(requester(req), param(req, "id"), "RETURN", req.body));
    } catch (error) {
      next(error);
    }
  },
  publishNdpReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.transitionNdpReview(requester(req), param(req, "id"), "PUBLISH", req.body));
    } catch (error) {
      next(error);
    }
  },
  myNdpReviews: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.myNdpReviews(requester(req)));
    } catch (error) {
      next(error);
    }
  },
  ndpMonitor: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.ndpMonitor(requester(req)));
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
  expenseClaims: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.expenseClaims(requester(req)));
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
  createExpenseClaim: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await academyService.createExpenseClaim(requester(req), req.body));
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
      res.json(await academyService.resetEmployeePassword(requester(req), param(req, "id"), req.body?.pin || req.body?.password));
    } catch (error) {
      next(error);
    }
  },
  unlockEmployeeAccount: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await academyService.unlockEmployeeAccount(requester(req), param(req, "id")));
    } catch (error) {
      next(error);
    }
  },
};

import { Router, type NextFunction, type Response } from "express";

import { Role } from "../../generated/prisma/client.js";
import { protect, type AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { upload } from "../media/media.middleware.js";
import { academyController } from "./academy.controller.js";

const router = Router();

function requireAcademyRoles(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    const metadata = req.user.roleMetadata && typeof req.user.roleMetadata === "object" ? req.user.roleMetadata : {};
    const template = typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
    if (template === "VIDEO_EDITOR") {
      const allowed =
        (req.method === "GET" && ["/batches", "/teachers", "/study-materials", "/material-summary"].includes(req.path)) ||
        (req.method === "POST" && req.path === "/study-materials");
      if (!allowed) {
        res.status(403).json({ message: "Video Editor access is limited to lesson library operations" });
        return;
      }
      next();
      return;
    }
    const restrictedAdmin = req.user.role === Role.ADMIN && ["ADMISSION_CELL", "MARKETING", "SALES_BOOSTER"].includes(template);
    const admissionAllowed = (template === "ADMISSION_CELL" || req.user.role === Role.ADMINISTRATIVE_OFFICER) && (
      (req.method === "GET" && ["/batches", "/student-progress-summary"].includes(req.path)) ||
      (req.method === "POST" && (req.path === "/batches" || req.path === "/admissions/approve" || /^\/batches\/[^/]+\/students$/.test(req.path)))
    );
    if (restrictedAdmin && !admissionAllowed) {
      res.status(403).json({ message: "Access denied for assigned dashboard scope" });
      return;
    }
    const templateAcademicAccess = template === "ACADEMIC_HEAD" && (roles.includes(Role.TEACHER) || roles.includes(Role.ACADEMIC_HEAD));
    if (!templateAcademicAccess && !admissionAllowed && !roles.includes(req.user.role as Role)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }
    next();
  };
}

const academicRoles = [Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER];
const studentAcademicRoles = [Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER, Role.STUDENT];
const ndpAudienceRoles = [Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER, Role.STUDENT, Role.PARENT];
const managementRoles = [Role.ADMIN, Role.DIRECTOR];
const academicManagementRoles = [Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD];

router.use(protect);

router.get("/batches", requireAcademyRoles(academicRoles), academyController.batches);
router.get("/employees", requireAcademyRoles(academicManagementRoles), academyController.employees);
router.get("/teachers", requireAcademyRoles(academicRoles), academyController.teachers);
router.get("/teacher-assignments", requireAcademyRoles(academicRoles), academyController.teacherAssignments);
router.get("/my-teaching-plan", requireAcademyRoles(academicRoles), academyController.teacherTeachingPlan);
router.get("/batches/:batchId/announcements", requireAcademyRoles(academicRoles), academyController.batchAnnouncements);
router.get("/today", requireAcademyRoles(academicRoles), academyController.today);
router.post("/today/actions", requireAcademyRoles(academicRoles), academyController.todayAction);
router.get("/my-plan", academyController.myAcademicPlan);
router.get("/academic-calendar", requireAcademyRoles(academicRoles), academyController.academicCalendar);
router.get("/attendance", requireAcademyRoles(academicRoles), academyController.attendanceHistory);
router.get("/attendance-summary", requireAcademyRoles(academicRoles), academyController.attendanceSummary);
router.get("/leave-requests", requireAcademyRoles(studentAcademicRoles), academyController.leaveRequests);
router.get("/assignments", requireAcademyRoles(academicRoles), academyController.assignments);
router.get("/assignment-summary", requireAcademyRoles(academicRoles), academyController.assignmentSummary);
router.get("/study-materials", requireAcademyRoles(studentAcademicRoles), academyController.studyMaterials);
router.get("/material-summary", requireAcademyRoles(academicRoles), academyController.materialSummary);
router.get("/exams", requireAcademyRoles(academicRoles), academyController.exams);
router.get("/exam-summary", requireAcademyRoles(academicRoles), academyController.examSummary);
router.get("/exams/:id/results", requireAcademyRoles(academicRoles), academyController.examResults);
router.get("/exams/:id/uploads", requireAcademyRoles(academicRoles), academyController.examUploads);
router.get("/syllabus-progress", requireAcademyRoles(academicRoles), academyController.syllabusProgress);
router.get("/syllabus-summary", requireAcademyRoles(academicRoles), academyController.syllabusSummary);
router.get("/teacher-performance-summary", requireAcademyRoles(academicRoles), academyController.teacherPerformanceSummary);
router.get("/academic-calendar-monitor", requireAcademyRoles(academicRoles), academyController.academicCalendarMonitor);
router.get("/student-progress-summary", requireAcademyRoles(academicRoles), academyController.studentProgressSummary);
router.get("/assessment-ecosystem", requireAcademyRoles(academicRoles), academyController.academicAssessmentEcosystem);
router.get("/ndp/students", requireAcademyRoles(academicRoles), academyController.ndpStudents);
router.get("/ndp/reviews", requireAcademyRoles(academicRoles), academyController.ndpReviews);
router.get("/ndp/review", requireAcademyRoles(academicRoles), academyController.ndpReview);
router.get("/ndp/my-reviews", requireAcademyRoles(ndpAudienceRoles), academyController.myNdpReviews);
router.get("/ndp/monitor", requireAcademyRoles(academicManagementRoles), academyController.ndpMonitor);
router.get("/academic-audit", requireAcademyRoles(managementRoles), academyController.academicAuditTrail);
router.get("/director-expenses", requireAcademyRoles(managementRoles), academyController.directorExpenses);
router.get("/expense-claims", requireAcademyRoles([...academicRoles, ...managementRoles]), academyController.expenseClaims);

router.post("/academic-calendar", requireAcademyRoles(academicRoles), academyController.createAcademicCalendarItem);
router.post("/batches/:batchId/announcements", requireAcademyRoles(academicRoles), academyController.createBatchAnnouncement);
router.post("/academic-calendar/generate", requireAcademyRoles(academicManagementRoles), academyController.generateAcademicCalendarPlan);
router.patch("/academic-calendar/:id", requireAcademyRoles(academicRoles), academyController.updateAcademicCalendarItem);
router.post("/attendance", requireAcademyRoles(academicRoles), academyController.saveAttendance);
router.patch("/attendance/student", requireAcademyRoles(academicRoles), academyController.markStudentAttendance);
router.patch("/attendance/:id", requireAcademyRoles(academicRoles), academyController.updateAttendance);
router.post("/leave-requests", requireAcademyRoles(studentAcademicRoles), academyController.createLeaveRequest);
router.patch("/leave-requests/:id", requireAcademyRoles(academicManagementRoles), academyController.reviewLeaveRequest);
router.post("/assignments", requireAcademyRoles(academicRoles), academyController.createAssignment);
router.patch("/assignments/:id", requireAcademyRoles(academicRoles), academyController.updateAssignment);
router.post("/assignments/:id/archive", requireAcademyRoles(academicRoles), academyController.archiveAssignment);
router.post("/assignments/:id/publish", requireAcademyRoles(academicRoles), academyController.publishAssignmentChanges);
router.post("/assignments/:id/submit", requireAcademyRoles(studentAcademicRoles), academyController.submitAssignment);
router.patch("/assignment-submissions/:id", requireAcademyRoles(academicRoles), academyController.reviewAssignmentSubmission);
router.post("/study-materials", requireAcademyRoles(academicRoles), academyController.publishStudyMaterial);
router.patch("/study-materials/:id", requireAcademyRoles(academicRoles), academyController.updateStudyMaterial);
router.post("/study-materials/:id/archive", requireAcademyRoles(academicRoles), academyController.archiveStudyMaterial);
router.post("/study-materials/:id/restore", requireAcademyRoles(academicRoles), academyController.restoreStudyMaterial);
router.delete("/study-materials/:id", requireAcademyRoles(academicRoles), academyController.deleteStudyMaterial);
router.patch("/study-materials/:id/review", requireAcademyRoles(academicRoles), academyController.reviewStudyMaterial);
router.post("/exams/ai-draft", requireAcademyRoles(academicRoles), academyController.createExamDraft);
router.post("/exams/uploads", requireAcademyRoles(academicRoles), upload.single("file"), academyController.uploadExamSource);
router.post("/exams/import/validate", requireAcademyRoles(academicRoles), academyController.validateExamImport);
router.post("/exams/import/reconstruct", requireAcademyRoles(academicRoles), academyController.reconstructExamImport);
router.get("/exams/import/analytics", requireAcademyRoles(academicRoles), academyController.examImportAnalytics);
router.post("/exams", requireAcademyRoles(academicRoles), academyController.publishExam);
router.patch("/exams/:id", requireAcademyRoles(academicRoles), academyController.updateExam);
router.post("/exams/:id/archive", requireAcademyRoles(academicRoles), academyController.archiveExam);
router.post("/exams/:id/publish", requireAcademyRoles(academicRoles), academyController.publishExamChanges);
router.post("/exams/:id/release-results", requireAcademyRoles(academicRoles), academyController.releaseExamResults);
router.post("/ndp/review", requireAcademyRoles(academicRoles), academyController.saveNdpReview);
router.post("/ndp/review/submit", requireAcademyRoles(academicRoles), academyController.submitNdpReview);
router.post("/ndp/reviews/:id/approve", requireAcademyRoles(academicManagementRoles), academyController.approveNdpReview);
router.post("/ndp/reviews/:id/return", requireAcademyRoles(academicManagementRoles), academyController.returnNdpReview);
router.post("/ndp/reviews/:id/publish", requireAcademyRoles(academicManagementRoles), academyController.publishNdpReview);

router.post("/batches", requireAcademyRoles(academicManagementRoles), academyController.createBatch);
router.post("/director-expenses", requireAcademyRoles(managementRoles), academyController.createDirectorExpense);
router.post("/director-expenses/:id/archive", requireAcademyRoles(managementRoles), academyController.archiveDirectorExpense);
router.post("/expense-claims", requireAcademyRoles([...academicRoles, ...managementRoles]), academyController.createExpenseClaim);
router.post("/employees", requireAcademyRoles(academicManagementRoles), academyController.createEmployee);
router.patch("/batches/:id", requireAcademyRoles(academicManagementRoles), academyController.updateBatch);
router.patch("/employees/:id", requireAcademyRoles(academicManagementRoles), academyController.updateEmployee);
router.post("/employees/:id/archive", requireAcademyRoles(academicManagementRoles), academyController.archiveEmployee);
router.post("/employees/:id/reset-password", requireAcademyRoles(academicManagementRoles), academyController.resetEmployeePassword);
router.post("/employees/:id/unlock", requireAcademyRoles(academicManagementRoles), academyController.unlockEmployeeAccount);
router.post("/batches/:id/students", requireAcademyRoles(academicManagementRoles), academyController.addStudent);
router.patch("/students/:id", requireAcademyRoles(academicManagementRoles), academyController.updateStudent);
router.post("/students/:id/reset-pin", requireAcademyRoles(academicManagementRoles), academyController.resetStudentPin);
router.post("/students/:id/transfer", requireAcademyRoles(academicManagementRoles), academyController.transferStudent);
router.post("/batches/:id/teachers", requireAcademyRoles(academicManagementRoles), academyController.assignTeacher);
router.post("/admissions/approve", requireAcademyRoles(managementRoles), academyController.approveAdmissionToBatch);

export { router as academyRouter, router as academyRoutes };

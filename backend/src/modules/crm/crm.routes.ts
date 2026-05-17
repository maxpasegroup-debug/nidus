import { Router } from "express";
import { body, query } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { crmController } from "./crm.controller.js";

export const crmRouter = Router();

const crmRoles = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.TELECALLER, Role.MARKETING_COORDINATOR)];
const approvalRoles = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR)];
const leadStatuses = ["NEW", "CONTACTED", "COUNSELLING", "ENROLLED", "LOST"];

crmRouter.get("/leads", ...crmRoles, [query("status").optional().isIn(leadStatuses), query("search").optional().trim()], crmController.leads);
crmRouter.post("/leads", ...crmRoles, [body("fullName").trim().notEmpty(), body("mobile").trim().isLength({ min: 7 }), body("email").isEmail().normalizeEmail(), body("targetExam").trim().notEmpty(), body("source").trim().notEmpty(), body("status").optional().isIn(leadStatuses), body("assignedTo").optional({ nullable: true }).trim(), body("notes").optional().trim()], crmController.createLead);
crmRouter.put("/leads/:id", ...crmRoles, [body("fullName").optional().trim().notEmpty(), body("mobile").optional().trim().isLength({ min: 7 }), body("email").optional().isEmail().normalizeEmail(), body("targetExam").optional().trim().notEmpty(), body("source").optional().trim().notEmpty(), body("status").optional().isIn(leadStatuses), body("assignedTo").optional({ nullable: true }).trim(), body("notes").optional().trim()], crmController.updateLead);
crmRouter.delete("/leads/:id", ...crmRoles, crmController.deleteLead);

crmRouter.post("/followup", ...crmRoles, [body("leadId").notEmpty(), body("followUpDate").isISO8601(), body("remarks").trim().notEmpty(), body("status").trim().notEmpty()], crmController.createFollowUp);
crmRouter.get("/followups", ...crmRoles, crmController.followUps);

crmRouter.post("/admission", ...crmRoles, [body("leadId").optional().trim(), body("studentId").notEmpty(), body("courseId").notEmpty(), body("instituteId").optional().trim(), body("branchId").optional().trim(), body("admissionDate").isISO8601(), body("paymentStatus").optional().trim(), body("batch").trim().notEmpty(), body("admissionMode").optional().isIn(["ONLINE", "MANUAL"]), body("totalFee").optional().isFloat({ min: 0 }), body("remarks").optional().trim()], crmController.createAdmission);
crmRouter.get("/admissions", ...crmRoles, crmController.admissions);
crmRouter.post("/admissions/:id/approval", ...approvalRoles, [body("approved").isBoolean(), body("remarks").optional().trim(), body("batch").optional().trim(), body("instituteId").optional().trim(), body("branchId").optional().trim()], crmController.approveAdmission);
crmRouter.get("/approvals", ...approvalRoles, crmController.approvals);
crmRouter.post("/scholarships", ...crmRoles, [body("studentId").notEmpty(), body("admissionId").optional().trim(), body("type").isIn(["SCHOLARSHIP", "DISCOUNT", "FEE_WAIVER"]), body("title").trim().notEmpty(), body("amount").isFloat({ min: 0 }), body("reason").optional().trim()], crmController.createScholarship);
crmRouter.post("/scholarships/:id/review", ...approvalRoles, [body("approved").isBoolean(), body("remarks").optional().trim()], crmController.reviewScholarship);

crmRouter.post("/counselling", ...crmRoles, [body("leadId").notEmpty(), body("counsellorName").trim().notEmpty(), body("bookingDate").isISO8601(), body("mode").isIn(["ONLINE", "OFFLINE"]), body("status").trim().notEmpty()], crmController.createCounselling);
crmRouter.get("/counselling", ...crmRoles, crmController.counselling);

crmRouter.get("/referrals", ...crmRoles, crmController.referrals);
crmRouter.post("/referrals", ...crmRoles, [body("referrerUserId").notEmpty(), body("referredUserId").notEmpty(), body("rewardStatus").trim().notEmpty()], crmController.createReferral);

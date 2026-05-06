import { Router } from "express";
import { body, query } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { crmController } from "./crm.controller.js";

export const crmRouter = Router();

const crmRoles = [protect, allowRoles(Role.ADMIN, Role.COUNSELLOR, Role.STAFF)];
const leadStatuses = ["NEW", "CONTACTED", "COUNSELLING", "ENROLLED", "LOST"];

crmRouter.get("/leads", ...crmRoles, [query("status").optional().isIn(leadStatuses), query("search").optional().trim()], crmController.leads);
crmRouter.post("/leads", ...crmRoles, [body("fullName").trim().notEmpty(), body("mobile").trim().isLength({ min: 7 }), body("email").isEmail().normalizeEmail(), body("targetExam").trim().notEmpty(), body("source").trim().notEmpty(), body("status").optional().isIn(leadStatuses), body("assignedTo").optional({ nullable: true }).trim(), body("notes").optional().trim()], crmController.createLead);
crmRouter.put("/leads/:id", ...crmRoles, [body("fullName").optional().trim().notEmpty(), body("mobile").optional().trim().isLength({ min: 7 }), body("email").optional().isEmail().normalizeEmail(), body("targetExam").optional().trim().notEmpty(), body("source").optional().trim().notEmpty(), body("status").optional().isIn(leadStatuses), body("assignedTo").optional({ nullable: true }).trim(), body("notes").optional().trim()], crmController.updateLead);
crmRouter.delete("/leads/:id", ...crmRoles, crmController.deleteLead);

crmRouter.post("/followup", ...crmRoles, [body("leadId").notEmpty(), body("followUpDate").isISO8601(), body("remarks").trim().notEmpty(), body("status").trim().notEmpty()], crmController.createFollowUp);
crmRouter.get("/followups", ...crmRoles, crmController.followUps);

crmRouter.post("/admission", ...crmRoles, [body("studentId").notEmpty(), body("courseId").notEmpty(), body("admissionDate").isISO8601(), body("paymentStatus").trim().notEmpty(), body("batch").trim().notEmpty()], crmController.createAdmission);
crmRouter.get("/admissions", ...crmRoles, crmController.admissions);

crmRouter.post("/counselling", ...crmRoles, [body("leadId").notEmpty(), body("counsellorName").trim().notEmpty(), body("bookingDate").isISO8601(), body("mode").isIn(["ONLINE", "OFFLINE"]), body("status").trim().notEmpty()], crmController.createCounselling);
crmRouter.get("/counselling", ...crmRoles, crmController.counselling);

crmRouter.get("/referrals", ...crmRoles, crmController.referrals);
crmRouter.post("/referrals", ...crmRoles, [body("referrerUserId").notEmpty(), body("referredUserId").notEmpty(), body("rewardStatus").trim().notEmpty()], crmController.createReferral);

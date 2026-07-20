import { Router } from "express";
import { TopRankRole } from "../../generated/prisma/client.js";
import { topRankController } from "./toprank.controller.js";
import { topRankAllowRoles, topRankProtect } from "./toprank.middleware.js";

export const topRankRouter = Router();

topRankRouter.post("/auth/register", topRankController.register);
topRankRouter.post("/auth/login", topRankController.login);
topRankRouter.post("/auth/forgot-password", topRankController.forgotPassword);
topRankRouter.post("/auth/logout", topRankProtect, topRankController.logout);
topRankRouter.get("/auth/me", topRankProtect, topRankController.me);
topRankRouter.post("/auth/change-password", topRankProtect, topRankController.changePassword);
topRankRouter.patch("/auth/contact", topRankProtect, topRankController.updateContact);

topRankRouter.get("/batches", topRankController.batches);
topRankRouter.get("/onboarding", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_STUDENT), topRankController.onboarding);
topRankRouter.post("/onboarding/profile", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_STUDENT), topRankController.saveProfile);
topRankRouter.post("/onboarding/batch", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_STUDENT), topRankController.selectBatch);
topRankRouter.post("/onboarding/agreement", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_STUDENT), topRankController.acceptAgreement);
topRankRouter.post("/onboarding/complete", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_STUDENT), topRankController.completeEnrollment);
topRankRouter.get("/assessment", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_STUDENT), topRankController.assessmentStatus);
topRankRouter.post("/assessment", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_STUDENT), topRankController.submitAssessment);

topRankRouter.get("/admin/students", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_ADMIN, TopRankRole.TOPRANK_SUPER_ADMIN), topRankController.students);
topRankRouter.get("/mentor/batches", topRankProtect, topRankAllowRoles(TopRankRole.TOPRANK_MENTOR), topRankController.mentorBatches);

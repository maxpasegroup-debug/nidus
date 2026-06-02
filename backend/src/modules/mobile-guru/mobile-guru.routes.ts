import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { upload } from "../media/media.middleware.js";
import { mobileGuruController } from "./mobile-guru.controller.js";

export const mobileGuruRouter = Router();

const adminRoles = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR)];

mobileGuruRouter.get("/quests", protect, mobileGuruController.quests);
mobileGuruRouter.get("/quests/:questId", protect, mobileGuruController.quest);
mobileGuruRouter.post("/lessons/:lessonId/complete", protect, mobileGuruController.completeLesson);
mobileGuruRouter.post(
  "/quests/:questId/reflections",
  protect,
  [body("answers").isObject()],
  mobileGuruController.submitReflections
);
mobileGuruRouter.post("/challenges/:challengeId/complete", protect, mobileGuruController.completeChallenge);
mobileGuruRouter.post("/evidence", protect, upload.single("file"), mobileGuruController.uploadEvidence);
mobileGuruRouter.get("/progress", protect, mobileGuruController.progress);
mobileGuruRouter.get("/certificates", protect, mobileGuruController.certificates);
mobileGuruRouter.get("/growth", protect, mobileGuruController.growth);
mobileGuruRouter.post("/daily-missions/:missionId/complete", protect, mobileGuruController.completeDailyMission);

mobileGuruRouter.get("/admin/summary", ...adminRoles, mobileGuruController.adminSummary);
mobileGuruRouter.get("/admin/quests", ...adminRoles, mobileGuruController.adminQuests);
mobileGuruRouter.post("/admin/quests", ...adminRoles, mobileGuruController.adminCreateQuest);
mobileGuruRouter.put("/admin/quests/:id", ...adminRoles, mobileGuruController.adminUpdateQuest);
mobileGuruRouter.post("/admin/quests/:questId/lessons", ...adminRoles, mobileGuruController.adminAddLesson);
mobileGuruRouter.post("/admin/quests/:questId/reflections", ...adminRoles, mobileGuruController.adminAddReflection);
mobileGuruRouter.post("/admin/quests/:questId/challenges", ...adminRoles, mobileGuruController.adminAddChallenge);
mobileGuruRouter.get("/admin/progress", ...adminRoles, mobileGuruController.adminProgress);

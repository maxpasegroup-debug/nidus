import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../auth/auth.middleware.js";
import { communicationController } from "./communication.controller.js";

export const notificationsRouter = Router();
export const messagesRouter = Router();
export const communicationAnnouncementsRouter = Router();
export const emailsRouter = Router();
export const pushRouter = Router();

const authenticated = [protect];
const publishers = [protect, allowRoles(Role.ADMIN, Role.STAFF, Role.COUNSELLOR, Role.WARDEN)];

notificationsRouter.get("/", ...authenticated, communicationController.notifications);
notificationsRouter.put("/read/:id", ...authenticated, communicationController.markNotificationRead);

messagesRouter.get("/", ...authenticated, communicationController.messages);
messagesRouter.post("/thread", ...authenticated, [body("subject").trim().notEmpty()], communicationController.createThread);
messagesRouter.post("/send", ...authenticated, [body("threadId").notEmpty(), body("receiverId").notEmpty(), body("message").trim().notEmpty(), body("attachmentUrl").optional().isURL()], communicationController.sendMessage);
messagesRouter.get("/thread/:id", ...authenticated, communicationController.thread);

communicationAnnouncementsRouter.get("/", ...authenticated, communicationController.announcements);
communicationAnnouncementsRouter.post("/", ...publishers, [body("title").trim().notEmpty(), body("description").trim().notEmpty(), body("audience").optional().trim(), body("targetAudience").optional().trim()], communicationController.createAnnouncement);

emailsRouter.get("/logs", ...publishers, communicationController.emailLogs);
emailsRouter.post("/send", ...publishers, [body("recipient").isEmail(), body("subject").trim().notEmpty(), body("body").trim().notEmpty(), body("actionLabel").optional().trim(), body("actionUrl").optional().isURL()], communicationController.sendEmail);

pushRouter.post("/send", ...publishers, [body("title").trim().notEmpty(), body("body").trim().notEmpty(), body("targetAudience").trim().notEmpty()], communicationController.sendPush);

import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { upload } from "../media/media.middleware.js";
import { salesBoosterController } from "./sales-booster.controller.js";

export const salesBoosterRouter = Router();

const salesBoosterRoles = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.MARKETING_COORDINATOR)];
const approvalStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "NEEDS_REVISION", "REJECTED", "RUN_READY"];

salesBoosterRouter.get("/campaigns", ...salesBoosterRoles, salesBoosterController.campaigns);
salesBoosterRouter.get("/summary", ...salesBoosterRoles, salesBoosterController.summary);
salesBoosterRouter.get("/analytics", ...salesBoosterRoles, salesBoosterController.analytics);
salesBoosterRouter.get("/connectors", ...salesBoosterRoles, salesBoosterController.connectorStatus);
salesBoosterRouter.get("/whatsapp/templates", ...salesBoosterRoles, salesBoosterController.whatsappTemplates);
salesBoosterRouter.get("/scheduled", ...salesBoosterRoles, salesBoosterController.scheduledCampaigns);
salesBoosterRouter.get("/audience", ...salesBoosterRoles, salesBoosterController.audience);
salesBoosterRouter.post(
  "/ai-generate",
  ...salesBoosterRoles,
  [
    body("track").trim().notEmpty(),
    body("goal").trim().isLength({ min: 5 }),
    body("audience").optional({ nullable: true }).trim(),
    body("budget").optional({ nullable: true }).trim(),
    body("creativeName").optional({ nullable: true }).trim(),
    body("creativeType").optional({ nullable: true }).trim(),
    body("channels").optional().isArray()
  ],
  salesBoosterController.generateCampaignDraft
);
salesBoosterRouter.post("/creatives/upload", ...salesBoosterRoles, upload.single("file"), salesBoosterController.uploadCreative);
salesBoosterRouter.post(
  "/audience",
  ...salesBoosterRoles,
  [
    body("fullName").trim().notEmpty(),
    body("phone").trim().notEmpty(),
    body("email").optional({ nullable: true }).trim().isEmail(),
    body("segment").optional({ nullable: true }).trim(),
    body("source").optional({ nullable: true }).trim(),
    body("interest").optional({ nullable: true }).trim(),
    body("optIn").optional().isBoolean(),
    body("notes").optional({ nullable: true }).trim()
  ],
  salesBoosterController.addAudienceContact
);
salesBoosterRouter.post(
  "/audience/import-leads",
  ...salesBoosterRoles,
  [body("segment").optional({ nullable: true }).trim()],
  salesBoosterController.importLeadsToAudience
);
salesBoosterRouter.post(
  "/whatsapp/broadcast",
  ...salesBoosterRoles,
  [
    body("segment").optional({ nullable: true }).trim(),
    body("templateName").optional({ nullable: true }).trim(),
    body("createFollowUps").optional().isBoolean(),
    body("followUpDate").optional({ nullable: true }).isISO8601(),
    body("counselorName").optional({ nullable: true }).trim(),
    body("source").optional({ nullable: true }).trim()
  ],
  salesBoosterController.broadcastWhatsApp
);
salesBoosterRouter.post(
  "/campaigns",
  ...salesBoosterRoles,
  [
    body("title").trim().notEmpty(),
    body("track").trim().notEmpty(),
    body("goal").trim().notEmpty(),
    body("creativeName").optional({ nullable: true }).trim(),
    body("creativeType").optional({ nullable: true }).trim(),
    body("channels").optional().isArray(),
    body("aiDraft").isObject()
  ],
  salesBoosterController.createCampaign
);
salesBoosterRouter.put(
  "/campaigns/:id",
  ...salesBoosterRoles,
  [
    body("title").optional().trim().notEmpty(),
    body("track").optional().trim().notEmpty(),
    body("goal").optional().trim().notEmpty(),
    body("creativeName").optional({ nullable: true }).trim(),
    body("creativeType").optional({ nullable: true }).trim(),
    body("channels").optional().isArray(),
    body("aiDraft").optional().isObject()
  ],
  salesBoosterController.updateCampaign
);
salesBoosterRouter.patch(
  "/campaigns/:id/status",
  ...salesBoosterRoles,
  [
    body("approvalStatus").isIn(approvalStatuses),
    body("reviewNote").optional({ nullable: true }).trim()
  ],
  salesBoosterController.updateStatus
);
salesBoosterRouter.patch(
  "/campaigns/:id/creative",
  ...salesBoosterRoles,
  [
    body("creativeName").optional({ nullable: true }).trim(),
    body("creativeType").optional({ nullable: true }).trim(),
    body("creativeUrl").optional({ nullable: true }).isURL(),
    body("creativeMediaId").optional({ nullable: true }).trim(),
    body("creativeSize").optional({ nullable: true }).isInt({ min: 0 })
  ],
  salesBoosterController.attachCreative
);
salesBoosterRouter.delete("/campaigns/:id", ...salesBoosterRoles, salesBoosterController.deleteCampaign);
salesBoosterRouter.post("/campaigns/:id/run", ...salesBoosterRoles, salesBoosterController.runCampaign);
salesBoosterRouter.post("/scheduled/run-due", ...salesBoosterRoles, salesBoosterController.runDueCampaigns);
salesBoosterRouter.patch(
  "/campaigns/:id/schedule",
  ...salesBoosterRoles,
  [
    body("scheduledAt").isISO8601(),
    body("scheduleNote").optional({ nullable: true }).trim()
  ],
  salesBoosterController.scheduleCampaign
);
salesBoosterRouter.get("/campaigns/:id/report", ...salesBoosterRoles, salesBoosterController.campaignReport);
salesBoosterRouter.post(
  "/campaigns/:id/metrics",
  ...salesBoosterRoles,
  [
    body("platform").trim().notEmpty(),
    body("reach").optional().isInt({ min: 0 }),
    body("impressions").optional().isInt({ min: 0 }),
    body("clicks").optional().isInt({ min: 0 }),
    body("leads").optional().isInt({ min: 0 }),
    body("admissions").optional().isInt({ min: 0 }),
    body("spend").optional().isFloat({ min: 0 }),
    body("revenue").optional().isFloat({ min: 0 }),
    body("notes").optional({ nullable: true }).trim(),
    body("capturedAt").optional().isISO8601()
  ],
  salesBoosterController.addMetricSnapshot
);

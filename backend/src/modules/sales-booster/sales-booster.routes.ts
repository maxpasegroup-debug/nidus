import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { salesBoosterController } from "./sales-booster.controller.js";

export const salesBoosterRouter = Router();

const salesBoosterRoles = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.MARKETING_COORDINATOR)];
const approvalStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "NEEDS_REVISION", "REJECTED", "RUN_READY"];

salesBoosterRouter.get("/campaigns", ...salesBoosterRoles, salesBoosterController.campaigns);
salesBoosterRouter.get("/summary", ...salesBoosterRoles, salesBoosterController.summary);
salesBoosterRouter.get("/analytics", ...salesBoosterRoles, salesBoosterController.analytics);
salesBoosterRouter.get("/connectors", ...salesBoosterRoles, salesBoosterController.connectorStatus);
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
salesBoosterRouter.delete("/campaigns/:id", ...salesBoosterRoles, salesBoosterController.deleteCampaign);
salesBoosterRouter.post("/campaigns/:id/run", ...salesBoosterRoles, salesBoosterController.runCampaign);
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

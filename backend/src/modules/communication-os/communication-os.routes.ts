import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { validateExpressRequest } from "../../middlewares/validate.js";
import { communicationOsController } from "./communication-os.controller.js";

export const communicationOsRouter = Router();

communicationOsRouter.use(protect);
communicationOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.ADMINISTRATIVE_OFFICER, Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.TELECALLER, Role.MARKETING_COORDINATOR));

communicationOsRouter.get("/framework", communicationOsController.framework);
communicationOsRouter.get("/bundle", communicationOsController.bundle);
communicationOsRouter.get("/health", communicationOsController.health);
communicationOsRouter.post(
  "/dispatch",
  body("title").isString().trim().notEmpty(),
  body("body").isString().trim().notEmpty(),
  body("channels").optional().isArray(),
  body("priority").optional().isIn(["LOW", "NORMAL", "HIGH", "URGENT"]),
  body("targetUserId").optional().isString().trim(),
  body("targetRole").optional().isString().trim(),
  body("phone").optional().isString().trim(),
  body("email").optional().isEmail(),
  body("templateKey").optional().isString().trim(),
  body("context").optional().isObject(),
  validateExpressRequest,
  communicationOsController.dispatch
);

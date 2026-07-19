import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { validateExpressRequest } from "../../middlewares/validate.js";
import { aiDirectorController } from "./ai-director.controller.js";

export const aiDirectorRouter = Router();

aiDirectorRouter.use(protect);
aiDirectorRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.ADMINISTRATIVE_OFFICER, Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.TELECALLER));

aiDirectorRouter.get("/guardrails", aiDirectorController.guardrails);
aiDirectorRouter.get("/summary", aiDirectorController.summary);
aiDirectorRouter.post("/ask", [body("question").trim().notEmpty().withMessage("Question is required")], validateExpressRequest, aiDirectorController.ask);
aiDirectorRouter.post(
  "/approve",
  [
    body("actionId").trim().notEmpty().withMessage("Action id is required"),
    body("approvalText").trim().notEmpty().withMessage("Approval text is required")
  ],
  validateExpressRequest,
  aiDirectorController.approve
);

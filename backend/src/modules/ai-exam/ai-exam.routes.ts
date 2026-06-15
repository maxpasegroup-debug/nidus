import { Router, type NextFunction, type Response } from "express";
import { Role } from "../../generated/prisma/client.js";
import { protect, type AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { aiExamController } from "./ai-exam.controller.js";

const router = Router();

function requireExamAgentAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const metadata = req.user.roleMetadata && typeof req.user.roleMetadata === "object" ? req.user.roleMetadata : {};
  const template = typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
  const restrictedAdmin = req.user.role === Role.ADMIN && ["ADMISSION_CELL", "MARKETING", "SALES_BOOSTER"].includes(template);

  const allowedRole = req.user.role === Role.ADMIN || req.user.role === Role.DIRECTOR || req.user.role === Role.ACADEMIC_HEAD || req.user.role === Role.TEACHER || req.user.role === Role.PHYSICAL_TRAINER;
  if (restrictedAdmin || !allowedRole) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  next();
}

router.use(protect, requireExamAgentAccess);

router.post("/create", aiExamController.create);
router.post("/review", aiExamController.review);
router.post("/approve", aiExamController.approve);
router.post("/publish", aiExamController.publish);

export { router as aiExamRouter };

import { Router, type NextFunction, type Response } from "express";
import { Role } from "../../generated/prisma/client.js";
import { protect, type AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { nidusGuruController } from "./nidus-guru.controller.js";

const router = Router();

function requireGuruAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const allowed: Role[] = [Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER, Role.STUDENT, Role.PARENT];
  if (!allowed.includes(req.user.role as Role)) {
    res.status(403).json({ message: "NIDUS GURU intelligence is not available for this role" });
    return;
  }

  next();
}

router.use(protect, requireGuruAccess);
router.get("/academic-head", nidusGuruController.academicHead);

export { router as nidusGuruRouter };

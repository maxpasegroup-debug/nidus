import { Router, type NextFunction, type Response } from "express";
import { Role } from "../../generated/prisma/client.js";
import { protect, type AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { aiWorkflowController } from "./ai-workflow.controller.js";

const router = Router();

function requireAcademicAiAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const metadata = req.user.roleMetadata && typeof req.user.roleMetadata === "object" ? req.user.roleMetadata : {};
  const template = typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
  const restrictedAdmin = req.user.role === Role.ADMIN && ["ADMISSION_CELL", "MARKETING", "SALES_BOOSTER"].includes(template);

  if (restrictedAdmin) {
    res.status(403).json({ message: "Access denied for assigned dashboard scope" });
    return;
  }

  const academicHead = template === "ACADEMIC_HEAD";
  const academicRoles: Role[] = [Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER];
  const allowedRole = academicRoles.includes(req.user.role as Role);
  if (!academicHead && !allowedRole) {
    res.status(403).json({ message: "Access denied" });
    return;
  }

  next();
}

router.use(protect, requireAcademicAiAccess);

router.post("/requests", aiWorkflowController.createRequest);
router.get("/requests/:id", aiWorkflowController.getRequest);
router.post("/requests/:id/context", aiWorkflowController.addContext);
router.post("/requests/:id/drafts", aiWorkflowController.createDraft);
router.post("/requests/:id/feedback", aiWorkflowController.createFeedback);
router.post("/requests/:id/publications", aiWorkflowController.createPublication);

router.post("/drafts/:draftId/versions", aiWorkflowController.createDraftVersion);
router.post("/drafts/:draftId/reviews", aiWorkflowController.createReview);
router.post("/drafts/:draftId/approvals", aiWorkflowController.approveDraft);

router.post("/publications/:publicationId/approve", aiWorkflowController.approvePublication);
router.post("/publications/:publicationId/mark-published", aiWorkflowController.markPublished);

export { router as aiWorkflowRouter };

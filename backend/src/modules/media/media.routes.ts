import { Router, type NextFunction, type Response } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect, type AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { documentsController, mediaController } from "./media.controller.js";
import { upload } from "./media.middleware.js";

function mediaRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const metadata = req.user?.roleMetadata && typeof req.user.roleMetadata === "object" ? req.user.roleMetadata : {};
  const template = typeof metadata.dashboardTemplate === "string" ? metadata.dashboardTemplate.toUpperCase() : "";
  if (template === "VIDEO_EDITOR") {
    next();
    return;
  }
  return allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER, Role.MARKETING_COORDINATOR)(req, res, next);
}
const documentRoles = allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.PHYSICAL_TRAINER, Role.MARKETING_COORDINATOR, Role.ADMINISTRATIVE_OFFICER);

export const mediaRouter = Router();
export const documentsRouter = Router();

mediaRouter.use(protect, mediaRoles);

mediaRouter.get("/folders", mediaController.listFolders);
mediaRouter.post(
  "/folders",
  [
    body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Folder name must be 2-80 characters"),
    body("parentId").optional().isString().withMessage("Parent folder id must be valid")
  ],
  mediaController.createFolder
);

mediaRouter.post("/upload", upload.single("file"), mediaController.uploadFile);
mediaRouter.get("/files", mediaController.listFiles);
mediaRouter.delete("/files/:id", mediaController.deleteFile);

documentsRouter.use(protect, documentRoles);
documentsRouter.get("/", documentsController.list);
documentsRouter.post(
  "/",
  upload.single("file"),
  [
    body("title").trim().isLength({ min: 3, max: 120 }).withMessage("Title must be 3-120 characters"),
    body("category").trim().isLength({ min: 2, max: 80 }).withMessage("Category is required"),
    body("description").optional().isString().withMessage("Description must be text"),
    body("fileUrl").optional().isURL().withMessage("File URL must be valid")
  ],
  documentsController.create
);

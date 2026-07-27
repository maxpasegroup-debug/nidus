import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { coursesController } from "./courses.controller.js";

export const coursesRouter = Router();

function courseValidators(optional = false) {
  const maybeOptional = (chain: ReturnType<typeof body>) => (optional ? chain.optional() : chain);

  return [
    maybeOptional(body("title")).trim().isLength({ min: 3 }).withMessage("Title must be at least 3 characters"),
    maybeOptional(body("slug")).trim().isLength({ min: 3 }).withMessage("Slug must be at least 3 characters"),
    maybeOptional(body("description")).trim().isLength({ min: 10 }).withMessage("Description must be at least 10 characters"),
    maybeOptional(body("thumbnail")).trim().notEmpty().withMessage("Thumbnail path is required"),
    maybeOptional(body("category")).trim().notEmpty().withMessage("Category is required"),
    maybeOptional(body("examType")).trim().notEmpty().withMessage("Exam type is required"),
    maybeOptional(body("duration")).trim().notEmpty().withMessage("Duration is required"),
    maybeOptional(body("price")).isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    body("isPremium").optional().isBoolean().withMessage("isPremium must be boolean")
  ];
}

coursesRouter.get("/", coursesController.list);
coursesRouter.get("/:slug", coursesController.details);

coursesRouter.post("/", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD), courseValidators(), coursesController.create);
coursesRouter.put("/:id", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD), courseValidators(true), coursesController.update);
coursesRouter.delete("/:id", protect, allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD), coursesController.remove);

coursesRouter.post(
  "/enroll",
  protect,
  allowRoles(Role.STUDENT, Role.ADMIN),
  [body("courseId").trim().notEmpty().withMessage("Course id is required")],
  coursesController.enroll
);

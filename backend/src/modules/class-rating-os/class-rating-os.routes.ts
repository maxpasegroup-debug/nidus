import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { validateExpressRequest } from "../../middlewares/validate.js";
import { classRatingOsController } from "./class-rating-os.controller.js";

export const classRatingOsRouter = Router();

classRatingOsRouter.use(protect);
classRatingOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.STUDENT, Role.PARENT));

classRatingOsRouter.get("/framework", classRatingOsController.framework);
classRatingOsRouter.get("/pending", classRatingOsController.pending);
classRatingOsRouter.get("/summary", classRatingOsController.summary);
classRatingOsRouter.post(
  "/feedback",
  body("calendarId").isString().trim().notEmpty(),
  body("starRating").isInt({ min: 1, max: 5 }),
  body("liked").optional().isArray(),
  body("unclear").optional().isArray(),
  body("teacherExplanation").isInt({ min: 1, max: 10 }),
  body("doubtClearing").isInt({ min: 1, max: 10 }),
  body("pace").isInt({ min: 1, max: 10 }),
  body("materialQuality").isInt({ min: 1, max: 10 }),
  body("comment").optional().isString().trim().isLength({ max: 500 }),
  validateExpressRequest,
  classRatingOsController.submit
);

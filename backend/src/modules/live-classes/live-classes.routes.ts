import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { liveClassesController } from "./live-classes.controller.js";

export const liveClassesRouter = Router();
export const recordedLecturesRouter = Router();
export const lectureProgressRouter = Router();

function liveValidators(optional = false) {
  const maybe = (chain: ReturnType<typeof body>) => (optional ? chain.optional() : chain);
  return [
    maybe(body("title")).isLength({ min: 3 }),
    maybe(body("description")).isLength({ min: 10 }),
    maybe(body("examType")).notEmpty(),
    maybe(body("instructorName")).notEmpty(),
    maybe(body("scheduledAt")).isISO8601(),
    maybe(body("duration")).isInt({ min: 1 }),
    maybe(body("meetingLink")).isURL(),
    maybe(body("thumbnail")).isURL(),
    body("isLive").optional().isBoolean()
  ];
}

liveClassesRouter.get("/", liveClassesController.listLiveClasses);
liveClassesRouter.post("/", protect, allowRoles(Role.ADMIN), liveValidators(), liveClassesController.createLiveClass);
liveClassesRouter.put("/:id", protect, allowRoles(Role.ADMIN), liveValidators(true), liveClassesController.updateLiveClass);
liveClassesRouter.delete("/:id", protect, allowRoles(Role.ADMIN), liveClassesController.deleteLiveClass);

recordedLecturesRouter.get("/", liveClassesController.listLectures);
recordedLecturesRouter.get("/:id", liveClassesController.lectureDetails);

lectureProgressRouter.post(
  "/update",
  protect,
  [body("lectureId").notEmpty(), body("watchedDuration").isInt({ min: 0 }), body("completed").optional().isBoolean(), body("eventType").optional().trim(), body("position").optional().isInt({ min: 0 }), body("duration").optional().isInt({ min: 0 })],
  liveClassesController.updateProgress
);
lectureProgressRouter.get("/:lectureId", protect, liveClassesController.progress);

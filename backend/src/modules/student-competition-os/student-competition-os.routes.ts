import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { studentCompetitionOsController } from "./student-competition-os.controller.js";

export const studentCompetitionOsRouter = Router();

studentCompetitionOsRouter.use(protect);
studentCompetitionOsRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.STUDENT, Role.PARENT));

studentCompetitionOsRouter.get("/framework", studentCompetitionOsController.framework);
studentCompetitionOsRouter.get("/leaderboard", studentCompetitionOsController.leaderboard);
studentCompetitionOsRouter.get("/students/:userId", studentCompetitionOsController.student);

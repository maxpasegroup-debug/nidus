import { Router } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { coursesRouter } from "./courses/courses.routes.js";
import { dashboardRouter } from "./dashboard/dashboard.routes.js";
import { testsRouter } from "./tests/tests.routes.js";
import { psychometricRouter } from "./psychometric/psychometric.routes.js";
import { usersRouter } from "./users/users.routes.js";
import { protect, allowRoles } from "./auth/auth.middleware.js";
import { Role } from "../generated/prisma/client.js";
import { coursesController } from "./courses/courses.controller.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.send("Server running");
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/courses", coursesRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/tests", testsRouter);
apiRouter.use("/psychometric", psychometricRouter);
apiRouter.use("/users", usersRouter);
apiRouter.get("/my-courses", protect, allowRoles(Role.STUDENT, Role.ADMIN), coursesController.myCourses);

import { Router } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { dashboardRouter } from "./dashboard/dashboard.routes.js";
import { usersRouter } from "./users/users.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.send("Server running");
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/users", usersRouter);

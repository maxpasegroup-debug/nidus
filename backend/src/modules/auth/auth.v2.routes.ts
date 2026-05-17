import { Router } from "express";
import { authControllerV2 } from "./auth.v2.controller.js";
import { sessionAuth } from "../../middlewares/session.middleware.js";

export const authRouter = Router();

authRouter.post("/signup", authControllerV2.signup);
authRouter.post("/register", authControllerV2.signup);
authRouter.post("/login", authControllerV2.login);
authRouter.post("/forgot-password", authControllerV2.forgotPassword);
authRouter.post("/forgot-password/send-otp", authControllerV2.forgotPassword);
authRouter.post("/reset-password", authControllerV2.resetPassword);

authRouter.get("/me", sessionAuth, authControllerV2.me);
authRouter.post("/logout", sessionAuth, authControllerV2.logout);
authRouter.post("/logout-all", sessionAuth, authControllerV2.logoutAll);
authRouter.post("/change-password", sessionAuth, authControllerV2.changePassword);

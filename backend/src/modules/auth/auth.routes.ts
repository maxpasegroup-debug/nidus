import { Router } from "express";
import { body } from "express-validator";
import { Role } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { parseCookies } from "./auth.cookies.js";
import { authController } from "./auth.controller.js";
import { allowRoles, protect } from "./auth.middleware.js";

export const authRouter = Router();

const publicRoleValues = [Role.STUDENT, Role.GUEST];

authRouter.get("/csrf", (req, res) => {
  const token = typeof res.locals.csrfToken === "string" ? res.locals.csrfToken : parseCookies(req).get(env.CSRF_COOKIE_NAME);
  res.json({ csrfToken: token });
});

authRouter.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("mobile").trim().isLength({ min: 7 }).withMessage("Valid mobile number is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("role").optional().isIn(publicRoleValues).withMessage("Public registration is limited to student or guest access")
  ],
  authController.register
);

authRouter.post(
  "/login",
  [
    body("identifier").trim().notEmpty().withMessage("Email or mobile is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  authController.login
);

authRouter.post("/refresh", authController.refresh);

authRouter.post(
  "/verify-email/resend",
  [body("identifier").trim().notEmpty().withMessage("Email or mobile is required")],
  authController.resendVerification
);

authRouter.post(
  "/verify-email",
  [body("token").trim().notEmpty().withMessage("Verification token is required")],
  authController.verifyEmail
);

authRouter.post(
  "/mobile/send-otp",
  [body("mobile").trim().isLength({ min: 7 }).withMessage("Valid mobile number is required")],
  authController.sendMobileOtp
);

authRouter.post(
  "/mobile/verify-otp",
  [
    body("mobile").trim().isLength({ min: 7 }).withMessage("Valid mobile number is required"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
  ],
  authController.verifyMobileOtp
);

authRouter.post(
  "/forgot-password/send-otp",
  [body("identifier").trim().notEmpty().withMessage("Email or mobile is required")],
  authController.sendForgotPasswordOtp
);

authRouter.post(
  "/forgot-password/verify",
  [
    body("identifier").trim().notEmpty().withMessage("Email or mobile is required"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
  ],
  authController.verifyForgotPassword
);

authRouter.post(
  "/reset-password",
  [
    body("resetToken").optional().notEmpty().withMessage("Reset token is required"),
    body("token").optional().notEmpty().withMessage("Reset token is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
  ],
  authController.resetPassword
);

authRouter.get("/me", protect, authController.me);
authRouter.get("/sessions", protect, authController.sessions);
authRouter.delete("/sessions/:id", protect, authController.revokeSession);
authRouter.post("/logout-all", protect, authController.logoutAll);
authRouter.post("/logout", protect, authController.logout);
authRouter.post("/parent-link/invite", protect, allowRoles(Role.PARENT), [body("studentId").trim().notEmpty()], authController.inviteParentLink);
authRouter.post("/parent-link/accept", protect, allowRoles(Role.STUDENT), [body("token").trim().notEmpty()], authController.acceptParentLink);

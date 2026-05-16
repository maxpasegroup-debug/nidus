import { Router } from "express";
import { body } from "express-validator";
import { authController } from "./auth.controller.js";
import { protect } from "./auth.middleware.js";

export const authRouter = Router();

const signupValidators = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("mobile").trim().isLength({ min: 7 }).withMessage("Valid mobile number is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
];

authRouter.post("/signup", signupValidators, authController.signup);
authRouter.post("/register", signupValidators, authController.signup);

authRouter.post(
  "/login",
  [
    body("identifier").trim().notEmpty().withMessage("Email or mobile is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  authController.login
);

authRouter.get("/me", protect, authController.me);
authRouter.post(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
  ],
  authController.changePassword
);
authRouter.post("/logout", authController.logout);

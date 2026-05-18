import { Router } from "express";
import { authControllerV2 } from "./auth.v2.controller.js";
import { sessionAuth } from "../../middlewares/session.middleware.js";

export const authRouter = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a public guest account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, mobile, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Account created and session cookie set
 *       400:
 *         description: Invalid signup request
 */
authRouter.post("/signup", authControllerV2.signup);
authRouter.post("/register", authControllerV2.signup);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or mobile number
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful and session cookie set
 *       401:
 *         description: Invalid credentials
 */
authRouter.post("/login", authControllerV2.login);
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent if the email exists
 */
authRouter.post("/forgot-password", authControllerV2.forgotPassword);
authRouter.post("/forgot-password/send-otp", authControllerV2.forgotPassword);
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with a reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired reset token
 */
authRouter.post("/reset-password", authControllerV2.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Not authenticated
 */
authRouter.get("/me", sessionAuth, authControllerV2.me);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
authRouter.post("/logout", sessionAuth, authControllerV2.logout);
authRouter.post("/logout-all", sessionAuth, authControllerV2.logoutAll);
authRouter.get("/sessions", sessionAuth, authControllerV2.sessions);
authRouter.delete("/sessions/:id", sessionAuth, authControllerV2.revokeSession);
authRouter.post("/change-password", sessionAuth, authControllerV2.changePassword);

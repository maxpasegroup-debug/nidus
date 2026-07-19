import { Router } from "express";
import { authControllerV2 } from "./auth.v2.controller.js";
import { sessionAuth } from "../../middlewares/session.middleware.js";
import { upload } from "../media/media.middleware.js";

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
 *             required: [name, email, mobile, pin]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               pin:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 4
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
 *             required: [mobile, pin]
 *             properties:
 *               mobile:
 *                 type: string
 *                 description: Registered mobile number
 *               pin:
 *                 type: string
 *                 description: 4 digit PIN
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
 *     summary: Request a PIN reset using mobile
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Registered mobile number
 *     responses:
 *       200:
 *         description: Reset instructions sent if the account exists
 */
authRouter.post("/forgot-password", authControllerV2.forgotPassword);
authRouter.post("/forgot-password/send-otp", authControllerV2.forgotPassword);
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset PIN with a reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, pin]
 *             properties:
 *               token:
 *                 type: string
 *               pin:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 4
 *     responses:
 *       200:
 *         description: PIN reset successful
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
authRouter.post("/profile-photo", sessionAuth, upload.single("file"), authControllerV2.updateProfilePhoto);
authRouter.post("/parent-link/invite", sessionAuth, authControllerV2.inviteParentLink);
authRouter.post("/parent-link/accept", sessionAuth, authControllerV2.acceptParentLink);

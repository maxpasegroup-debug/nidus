import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../../config/prisma.js";
import { authService } from "./auth.service.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

function validateRequest(req: Request) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
    throw new Error(message);
  }
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.login(req.body);
      await prisma.auditLog.create({
        data: {
          userId: result.user.id,
          action: "LOGIN_SUCCESS",
          module: "auth",
          description: `Successful login for ${result.user.email}`,
          ipAddress: req.ip
        }
      }).catch(() => undefined);
      res.json(result);
    } catch (error) {
      await prisma.auditLog.create({
        data: {
          action: "LOGIN_FAILED",
          module: "auth",
          description: `Failed login attempt for ${req.body?.identifier ?? "unknown"}`,
          ipAddress: req.ip
        }
      }).catch(() => undefined);
      next(error);
    }
  },

  async sendMobileOtp(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.sendMobileOtp(req.body.mobile);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async verifyMobileOtp(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.verifyMobileOtp(req.body.mobile, req.body.otp);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async sendForgotPasswordOtp(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.sendForgotPasswordOtp(req.body.identifier);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async verifyForgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.verifyForgotPasswordOtp(req.body.identifier, req.body.otp);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.resetPassword(req.body.resetToken, req.body.password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await authService.getMe(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
};

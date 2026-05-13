import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../../config/prisma.js";
import { authService } from "./auth.service.js";
import { clearAuthCookies, readRefreshToken, setAuthCookies } from "./auth.cookies.js";
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
      const result = await authService.register(req.body, { ip: req.ip, userAgent: req.headers["user-agent"] });
      if ("accessToken" in result && "refreshToken" in result) {
        setAuthCookies(res, result.accessToken, result.refreshToken);
      }
      res.status(201).json({ user: result.user, message: result.message });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.login(req.body, { ip: req.ip, userAgent: req.headers["user-agent"] });
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ user: result.user });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(readRefreshToken(req), { ip: req.ip, userAgent: req.headers["user-agent"] });
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ user: result.user });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  },

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      res.json(await authService.resendVerification(req.body.identifier));
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.verifyEmail(req.body.token, { ip: req.ip, userAgent: req.headers["user-agent"] });
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ user: result.user });
    } catch (error) {
      next(error);
    }
  },

  async sendMobileOtp(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.resendVerification(req.body.mobile);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async verifyMobileOtp(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      throw new Error("Mobile OTP login is not enabled in production");
    } catch (error) {
      next(error);
    }
  },

  async sendForgotPasswordOtp(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.requestPasswordReset(req.body.identifier);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async verifyForgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      throw new Error("Password reset OTP verification is replaced by secure email reset links");
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.resetPassword(req.body.resetToken ?? req.body.token, req.body.password);
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
  },

  async sessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("Unauthorized");
      res.json({ sessions: await authService.sessions(req.user.id) });
    } catch (error) {
      next(error);
    }
  },

  async revokeSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("Unauthorized");
      const sessionId = req.params.id;
      if (typeof sessionId !== "string") throw new Error("Invalid session id");
      res.json(await authService.revokeSession(req.user.id, sessionId));
    } catch (error) {
      next(error);
    }
  },

  async logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("Unauthorized");
      const result = await authService.logoutAll(req.user.id);
      clearAuthCookies(res);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthenticatedRequest, res: Response) {
    await authService.logout(req.user?.sessionId);
    clearAuthCookies(res);
    res.json({ message: "Logged out successfully" });
  },

  async inviteParentLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      if (!req.user) throw new Error("Unauthorized");
      res.status(201).json(await authService.inviteParentLink(req.user.id, req.body.studentId));
    } catch (error) {
      next(error);
    }
  },

  async acceptParentLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      res.json(await authService.acceptParentLink(req.body.token, req.user?.id));
    } catch (error) {
      next(error);
    }
  }
};

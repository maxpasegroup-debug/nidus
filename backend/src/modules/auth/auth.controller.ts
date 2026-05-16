import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AuthError, AuthErrorCode } from "../../types/auth.types.js";
import { authService } from "./auth.service.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

function validateRequest(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AuthError(AuthErrorCode.VALIDATION_ERROR, errors.array().map((error) => error.msg).join(", "), 422);
  }
}

function readAccessToken(req: Request) {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : undefined;
}

function sendAuthError(res: Response, error: unknown) {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({ success: false, code: error.code, message: error.message });
    return;
  }

  res.status(500).json({ success: false, code: "AUTH_FAILURE", message: "Authentication request failed" });
}

export const authController = {
  async signup(req: Request, res: Response) {
    try {
      validateRequest(req);
      const result = await authService.signup(req.body, { ip: req.ip, userAgent: req.get("user-agent") });
      res.status(201).json({ success: true, accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
    } catch (error) {
      sendAuthError(res, error);
    }
  },

  async login(req: Request, res: Response) {
    try {
      validateRequest(req);
      const result = await authService.login(req.body, { ip: req.ip, userAgent: req.get("user-agent") });
      res.json({ success: true, accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
    } catch (error) {
      sendAuthError(res, error);
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const result = await authService.refresh(String(req.body?.refreshToken ?? ""));
      res.json({ success: true, accessToken: result.accessToken, refreshToken: result.refreshToken });
    } catch (error) {
      sendAuthError(res, error);
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, code: AuthErrorCode.MISSING_TOKEN, message: "Unauthorized" });
        return;
      }
      res.json(await authService.getMe(req.user.id));
    } catch (error) {
      if (error instanceof AuthError) {
        sendAuthError(res, error);
        return;
      }
      next(error);
    }
  },

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      res.json(await authService.logout({ accessToken: readAccessToken(req), refreshToken: req.body?.refreshToken, userId: req.user?.id }));
    } catch (error) {
      sendAuthError(res, error);
    }
  },

  async logoutAll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, code: AuthErrorCode.MISSING_TOKEN, message: "Unauthorized" });
        return;
      }
      res.json(await authService.logoutAll(req.user.id, readAccessToken(req)));
    } catch (error) {
      sendAuthError(res, error);
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, code: AuthErrorCode.MISSING_TOKEN, message: "Unauthorized" });
        return;
      }
      validateRequest(req);
      res.json(await authService.changePassword(req.user.id, req.body));
    } catch (error) {
      if (error instanceof AuthError) {
        sendAuthError(res, error);
        return;
      }
      next(error);
    }
  }
};

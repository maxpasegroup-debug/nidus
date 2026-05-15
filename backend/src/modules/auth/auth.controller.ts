import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { authService } from "./auth.service.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

function validateRequest(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

export const authController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.signup(req.body, { ip: req.ip });
      res.status(201).json({ success: true, token: result.token, user: result.user });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const result = await authService.login(req.body, { ip: req.ip });
      res.json({ success: true, token: result.token, user: result.user });
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
      res.json(await authService.getMe(req.user.id));
    } catch (error) {
      next(error);
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await authService.logout());
    } catch (error) {
      next(error);
    }
  }
};

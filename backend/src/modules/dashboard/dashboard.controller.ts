import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { dashboardService } from "./dashboard.service.js";

function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new Error("Unauthorized");
  }

  return req.user;
}

export const dashboardController = {
  async student(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getStudentDashboard(getAuthenticatedUser(req));
      res.json({ role: "STUDENT", data });
    } catch (error) {
      next(error);
    }
  },

  async parent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getParentDashboard(getAuthenticatedUser(req));
      res.json({ role: "PARENT", data });
    } catch (error) {
      next(error);
    }
  },

  async admin(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getAdminDashboard();
      res.json({ role: "ADMIN", data });
    } catch (error) {
      next(error);
    }
  },

  async guest(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getGuestDashboard();
      res.json({ role: "GUEST", data });
    } catch (error) {
      next(error);
    }
  }
};

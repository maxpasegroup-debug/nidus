import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
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

  async admin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getAdminDashboard(getAuthenticatedUser(req));
      res.json({ role: "ADMIN", data });
    } catch (error) {
      next(error);
    }
  },

  async teacher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getTeacherDashboard(getAuthenticatedUser(req));
      res.json({ role: "TEACHER", data });
    } catch (error) {
      next(error);
    }
  },

  async director(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getDirectorDashboard(getAuthenticatedUser(req));
      res.json({ role: "DIRECTOR", data });
    } catch (error) {
      next(error);
    }
  },

  async directorOpsReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getDirectorOpsReadiness(getAuthenticatedUser(req));
      res.json({ role: "DIRECTOR", data });
    } catch (error) {
      next(error);
    }
  },

  async directorSecurityReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getDirectorSecurityReadiness(getAuthenticatedUser(req));
      res.json({ role: "DIRECTOR", data });
    } catch (error) {
      next(error);
    }
  },

  async businessDevelopment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getBusinessDevelopmentDashboard(getAuthenticatedUser(req));
      res.json({ role: "BUSINESS_DEVELOPMENT_EXECUTIVE", data });
    } catch (error) {
      next(error);
    }
  },

  async marketing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getMarketingDashboard(getAuthenticatedUser(req));
      res.json({ role: "MARKETING_COORDINATOR", data });
    } catch (error) {
      next(error);
    }
  }
};

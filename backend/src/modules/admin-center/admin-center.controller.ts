import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { adminCenterService } from "./admin-center.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function getParam(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

export const adminCenterController = {
  async dashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const dashboard = await adminCenterService.dashboard();
      res.json({ dashboard });
    } catch (error) {
      next(error);
    }
  },

  async operations(_req: Request, res: Response, next: NextFunction) {
    try {
      const operations = await adminCenterService.operations();
      res.json({ operations });
    } catch (error) {
      next(error);
    }
  },

  async roles(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await adminCenterService.listRoles();
      res.json({ roles });
    } catch (error) {
      next(error);
    }
  },

  async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const role = await adminCenterService.createRole(req.body);
      res.status(201).json({ role });
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const role = await adminCenterService.updateRole(getParam(req, "id"), req.body);
      res.json({ role });
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminCenterService.deleteRole(getParam(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async permissions(_req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await adminCenterService.listPermissions();
      res.json({ permissions });
    } catch (error) {
      next(error);
    }
  },

  async assignUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const userRole = await adminCenterService.assignUserRole(req.body.userId, req.body.roleId);
      res.status(201).json({ userRole });
    } catch (error) {
      next(error);
    }
  },

  async settings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await adminCenterService.listSettings();
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const settings = await adminCenterService.updateSettings(req.body);
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  },

  async auditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const auditLogs = await adminCenterService.listAuditLogs({
        module: typeof req.query.module === "string" ? req.query.module : undefined,
        action: typeof req.query.action === "string" ? req.query.action : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined
      });
      res.json({ auditLogs });
    } catch (error) {
      next(error);
    }
  },

  async branches(_req: Request, res: Response, next: NextFunction) {
    try {
      const branches = await adminCenterService.listBranches();
      res.json({ branches });
    } catch (error) {
      next(error);
    }
  },

  async createBranch(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const branch = await adminCenterService.createBranch(req.body);
      res.status(201).json({ branch });
    } catch (error) {
      next(error);
    }
  },

  async disableUser(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.json(await adminCenterService.disableUser(getParam(req, "id"), Boolean(req.body.disabled)));
    } catch (error) {
      next(error);
    }
  },

  async forceLogoutUser(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await adminCenterService.forceLogoutUser(getParam(req, "id")));
    } catch (error) {
      next(error);
    }
  },

  async resetVerification(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await adminCenterService.resetVerification(getParam(req, "id")));
    } catch (error) {
      next(error);
    }
  },

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await adminCenterService.revokeSession(getParam(req, "id")));
    } catch (error) {
      next(error);
    }
  }
};

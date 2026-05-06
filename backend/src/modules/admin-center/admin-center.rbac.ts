import type { NextFunction, Response } from "express";
import { prisma } from "../../config/prisma.js";
import { Role } from "../../generated/prisma/client.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

export const defaultPermissions = [
  { module: "admin", action: "read", name: "View admin center" },
  { module: "roles", action: "manage", name: "Manage roles" },
  { module: "permissions", action: "read", name: "View permissions" },
  { module: "settings", action: "manage", name: "Manage settings" },
  { module: "auditLogs", action: "read", name: "View audit logs" },
  { module: "branches", action: "manage", name: "Manage branches" },
  { module: "media", action: "manage", name: "Manage media library" },
  { module: "documents", action: "manage", name: "Manage documents" },
  { module: "users", action: "manage", name: "Manage users" }
];

export async function ensureDefaultPermissions() {
  await Promise.all(
    defaultPermissions.map((permission) =>
      prisma.permission.upsert({
        where: { module_action: { module: permission.module, action: permission.action } },
        update: { name: permission.name },
        create: permission
      })
    )
  );
}

export function requirePermission(module: string, action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (req.user.role === Role.ADMIN) {
        next();
        return;
      }

      const assignment = await prisma.userRole.findFirst({
        where: {
          userId: req.user.id,
          role: {
            permissions: {
              some: {
                permission: {
                  module,
                  action
                }
              }
            }
          }
        }
      });

      if (!assignment) {
        res.status(403).json({ message: "Permission denied" });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function auditAction(module: string, action: string, description: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;

      void prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action,
          module,
          description,
          ipAddress: req.ip
        }
      }).catch(() => undefined);
    });

    next();
  };
}

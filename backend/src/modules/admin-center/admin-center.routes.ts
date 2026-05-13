import { Router } from "express";
import { body } from "express-validator";
import { protect } from "../auth/auth.middleware.js";
import { adminCenterController } from "./admin-center.controller.js";
import { auditAction, requirePermission } from "./admin-center.rbac.js";

export const adminCenterRouter = Router();

const roleValidators = [
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Role name must be 2-80 characters"),
  body("description").optional().isString().withMessage("Description must be text"),
  body("permissionIds").optional().isArray().withMessage("permissionIds must be an array"),
  body("permissionIds.*").optional().isString().withMessage("Permission id must be valid")
];

adminCenterRouter.use(protect);

adminCenterRouter.get("/", requirePermission("admin", "read"), adminCenterController.dashboard);
adminCenterRouter.get("/operations", requirePermission("operations", "read"), adminCenterController.operations);

adminCenterRouter.get("/roles", requirePermission("roles", "manage"), adminCenterController.roles);
adminCenterRouter.post("/roles", requirePermission("roles", "manage"), roleValidators, auditAction("roles", "CREATE", "Created admin role"), adminCenterController.createRole);
adminCenterRouter.put("/roles/:id", requirePermission("roles", "manage"), roleValidators, auditAction("roles", "UPDATE", "Updated admin role"), adminCenterController.updateRole);
adminCenterRouter.delete("/roles/:id", requirePermission("roles", "manage"), auditAction("roles", "DELETE", "Deleted admin role"), adminCenterController.deleteRole);

adminCenterRouter.get("/permissions", requirePermission("permissions", "read"), adminCenterController.permissions);

adminCenterRouter.post(
  "/user-role",
  requirePermission("roles", "manage"),
  [
    body("userId").trim().notEmpty().withMessage("User id is required"),
    body("roleId").trim().notEmpty().withMessage("Role id is required")
  ],
  auditAction("roles", "ASSIGN", "Assigned user role"),
  adminCenterController.assignUserRole
);

adminCenterRouter.get("/settings", requirePermission("settings", "manage"), adminCenterController.settings);
adminCenterRouter.put(
  "/settings",
  requirePermission("settings", "manage"),
  [
    body("settings").isArray({ min: 1 }).withMessage("Settings array is required"),
    body("settings.*.key").trim().notEmpty().withMessage("Setting key is required"),
    body("settings.*.value").isString().withMessage("Setting value is required"),
    body("settings.*.category").trim().notEmpty().withMessage("Setting category is required")
  ],
  auditAction("settings", "UPDATE", "Updated system settings"),
  adminCenterController.updateSettings
);

adminCenterRouter.get("/audit-logs", requirePermission("auditLogs", "read"), adminCenterController.auditLogs);

adminCenterRouter.get("/branches", requirePermission("branches", "manage"), adminCenterController.branches);
adminCenterRouter.post(
  "/branches",
  requirePermission("branches", "manage"),
  [
    body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Branch name must be 2-120 characters"),
    body("location").trim().isLength({ min: 2, max: 160 }).withMessage("Location is required"),
    body("contactNumber").trim().isLength({ min: 7, max: 24 }).withMessage("Contact number is required")
  ],
  auditAction("branches", "CREATE", "Created branch"),
  adminCenterController.createBranch
);

adminCenterRouter.patch("/users/:id/disabled", requirePermission("users", "manage"), [body("disabled").isBoolean()], auditAction("users", "DISABLE", "Changed user disabled status"), adminCenterController.disableUser);
adminCenterRouter.post("/users/:id/force-logout", requirePermission("users", "manage"), auditAction("users", "FORCE_LOGOUT", "Forced user logout"), adminCenterController.forceLogoutUser);
adminCenterRouter.post("/users/:id/reset-verification", requirePermission("users", "manage"), auditAction("users", "RESET_VERIFICATION", "Reset user verification"), adminCenterController.resetVerification);
adminCenterRouter.delete("/sessions/:id", requirePermission("users", "manage"), auditAction("sessions", "REVOKE", "Revoked user session"), adminCenterController.revokeSession);

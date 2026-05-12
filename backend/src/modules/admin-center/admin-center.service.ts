import { prisma } from "../../config/prisma.js";
import { ensureDefaultPermissions } from "./admin-center.rbac.js";
import { authTokenUtils } from "../auth/auth.service.js";

type RolePayload = {
  name: string;
  description?: string;
  permissionIds?: string[];
};

type SettingsPayload = {
  settings: Array<{
    key: string;
    value: string;
    category: string;
  }>;
};

const defaultSettings = [
  { key: "app.name", value: "NIDUS", category: "app" },
  { key: "branding.primaryColor", value: "#0b1f3a", category: "branding" },
  { key: "branding.accentColor", value: "#c9a646", category: "branding" },
  { key: "email.sender", value: "no-reply@nidus.local", category: "email" },
  { key: "security.sessionTtl", value: "8h", category: "security" }
];

async function ensureDefaultSettings() {
  await Promise.all(
    defaultSettings.map((setting) =>
      prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      })
    )
  );
}

export const adminCenterService = {
  async dashboard() {
    await Promise.all([ensureDefaultPermissions(), ensureDefaultSettings()]);

    const [roles, permissions, settings, branches, auditLogs, users] = await Promise.all([
      prisma.adminRole.count(),
      prisma.permission.count(),
      prisma.systemSetting.count(),
      prisma.branch.count(),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true, email: true } } } }),
      prisma.user.count()
    ]);

    return {
      health: {
        api: "OPERATIONAL",
        database: "CONNECTED",
        security: "ACTIVE",
        storage: "MONITORED"
      },
      totals: { roles, permissions, settings, branches, users },
      recentActions: auditLogs
    };
  },

  async listRoles() {
    return prisma.adminRole.findMany({
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: { select: { users: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async createRole(payload: RolePayload) {
    return prisma.adminRole.create({
      data: {
        name: payload.name,
        description: payload.description,
        permissions: {
          create: payload.permissionIds?.map((permissionId) => ({ permissionId })) ?? []
        }
      },
      include: { permissions: { include: { permission: true } } }
    });
  },

  async updateRole(id: string, payload: RolePayload) {
    await prisma.adminRole.update({
      where: { id },
      data: {
        name: payload.name,
        description: payload.description
      }
    });

    if (payload.permissionIds) {
      await prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await prisma.rolePermission.createMany({
        data: payload.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        skipDuplicates: true
      });
    }

    return prisma.adminRole.findUniqueOrThrow({
      where: { id },
      include: { permissions: { include: { permission: true } } }
    });
  },

  async deleteRole(id: string) {
    await prisma.adminRole.delete({ where: { id } });
    return { message: "Role deleted" };
  },

  async listPermissions() {
    await ensureDefaultPermissions();
    return prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
  },

  async assignUserRole(userId: string, roleId: string) {
    const [user, role] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.adminRole.findUnique({ where: { id: roleId } })
    ]);

    if (!user) throw new Error("User not found");
    if (!role) throw new Error("Role not found");

    return prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
      include: { role: true, user: { select: { id: true, name: true, email: true } } }
    });
  },

  async listSettings() {
    await ensureDefaultSettings();
    return prisma.systemSetting.findMany({ orderBy: [{ category: "asc" }, { key: "asc" }] });
  },

  async updateSettings(payload: SettingsPayload) {
    await Promise.all(
      payload.settings.map((setting) =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value, category: setting.category },
          create: setting
        })
      )
    );

    return this.listSettings();
  },

  async listAuditLogs(filters: { module?: string; action?: string; search?: string }) {
    return prisma.auditLog.findMany({
      where: {
        module: filters.module,
        action: filters.action,
        OR: filters.search
          ? [
              { description: { contains: filters.search, mode: "insensitive" } },
              { module: { contains: filters.search, mode: "insensitive" } },
              { action: { contains: filters.search, mode: "insensitive" } },
              { user: { name: { contains: filters.search, mode: "insensitive" } } }
            ]
          : undefined
      },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  },

  async listBranches() {
    return prisma.branch.findMany({ orderBy: { createdAt: "desc" } });
  },

  async createBranch(payload: { name: string; location: string; contactNumber: string }) {
    return prisma.branch.create({ data: payload });
  },

  async disableUser(userId: string, disabled: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isDisabled: disabled, disabledAt: disabled ? new Date() : null }
    });
    if (disabled) {
      await prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: "ADMIN_DISABLED_USER" }
      });
    }
    await authTokenUtils.audit({ userId, action: disabled ? "USER_DISABLED" : "USER_ENABLED", description: `Admin ${disabled ? "disabled" : "enabled"} user ${user.email}` });
    return { message: disabled ? "User disabled" : "User enabled" };
  },

  async forceLogoutUser(userId: string) {
    await prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: "ADMIN_FORCE_LOGOUT" }
    });
    await authTokenUtils.audit({ userId, action: "ADMIN_FORCE_LOGOUT", description: "Admin forced user logout" });
    return { message: "User sessions revoked" };
  },

  async resetVerification(userId: string) {
    const user = await prisma.user.update({ where: { id: userId }, data: { emailVerified: false } });
    await authTokenUtils.createEmailVerification(user);
    await authTokenUtils.audit({ userId, action: "ADMIN_RESET_VERIFICATION", description: `Admin reset verification for ${user.email}` });
    return { message: "Verification reset and email sent" };
  },

  async revokeSession(sessionId: string) {
    const session = await prisma.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokeReason: "ADMIN_REVOKED" }
    });
    await authTokenUtils.audit({ userId: session.userId, action: "ADMIN_SESSION_REVOKED", description: `Admin revoked session ${sessionId}` });
    return { message: "Session revoked" };
  }
};

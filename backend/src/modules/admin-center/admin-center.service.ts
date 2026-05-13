import { prisma } from "../../config/prisma.js";
import { ensureDefaultPermissions } from "./admin-center.rbac.js";
import { authTokenUtils } from "../auth/auth.service.js";
import { env } from "../../config/env.js";
import { verifyDatabaseConnection } from "../../config/prisma.js";
import { verifyRedisConnection } from "../../config/redis.js";
import { getQueue, isQueueAvailable, queueNames } from "../../queues/queue.config.js";
import { getRuntimeState } from "../../runtime/lifecycle.js";

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

  async operations() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const queueHealth = await Promise.all(
      Object.values(queueNames).map(async (queueName) => {
        const queue = getQueue(queueName);
        if (!queue) {
          return { queueName, status: "UNAVAILABLE", waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 };
        }

        try {
          const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");
          return { queueName, status: counts.failed > 0 ? "ATTENTION" : "HEALTHY", ...counts };
        } catch (_error) {
          return { queueName, status: "DEGRADED", waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 };
        }
      })
    );

    const [
      databaseConnected,
      redisConnected,
      activeUsers,
      newUsers24h,
      cbtAttempts24h,
      aiRequests24h,
      failedAi24h,
      payments24h,
      paymentFailures24h,
      revenue30d,
      dailyIssues30d,
      failedQueueLogs24h,
      auditEvents24h
    ] = await Promise.all([
      verifyDatabaseConnection(),
      verifyRedisConnection().catch(() => false),
      prisma.authSession.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
      prisma.user.count({ where: { createdAt: { gte: since24h } } }),
      prisma.testAttempt.count({ where: { startedAt: { gte: since24h } } }),
      prisma.aIRequestLog.count({ where: { createdAt: { gte: since24h } } }),
      prisma.aIRequestLog.count({ where: { createdAt: { gte: since24h }, status: "FAILED" } }),
      prisma.payment.count({ where: { createdAt: { gte: since24h } } }),
      prisma.payment.count({ where: { createdAt: { gte: since24h }, paymentStatus: { in: ["FAILED", "CANCELLED"] } } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: since30d }, paymentStatus: { in: ["PAID", "VERIFIED", "CAPTURED"] } }, _sum: { amount: true } }),
      prisma.dailyIntelligenceIssue.count({ where: { createdAt: { gte: since30d } } }),
      prisma.queueJobLog.count({ where: { createdAt: { gte: since24h }, status: "FAILED" } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since24h } } })
    ]);

    return {
      runtime: getRuntimeState(),
      environment: {
        nodeEnv: env.NODE_ENV,
        processRole: env.PROCESS_ROLE,
        appDomain: env.APP_DOMAIN,
        apiDomain: env.API_DOMAIN,
        queueWorkersEnabled: env.QUEUE_WORKERS_ENABLED,
        queueAvailable: isQueueAvailable(),
        redisRequired: env.REDIS_REQUIRED,
        maintenanceMode: env.MAINTENANCE_MODE,
        sentryConfigured: Boolean(env.SENTRY_DSN),
        backupTargetConfigured: Boolean(env.BACKUP_BUCKET)
      },
      infrastructure: {
        database: databaseConnected ? "CONNECTED" : "FAILED",
        redis: redisConnected ? "CONNECTED" : "UNAVAILABLE",
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        uptimeSeconds: Math.round(process.uptime())
      },
      queueHealth,
      analytics: {
        activeUsers,
        newUsers24h,
        cbtAttempts24h,
        aiRequests24h,
        failedAi24h,
        payments24h,
        paymentFailures24h,
        revenue30d: revenue30d._sum.amount ?? 0,
        dailyIssues30d,
        failedQueueLogs24h,
        auditEvents24h
      }
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

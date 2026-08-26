import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma.js";

const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const docs = path.join(root, "docs");
fs.mkdirSync(docs, { recursive: true });

const users = await prisma.user.findMany({
  where: { instituteId: null },
  select: { id: true, name: true, email: true, role: true, isDisabled: true, roleMetadata: true, createdAt: true },
  orderBy: { createdAt: "asc" }
});
const orphanUsers = users.map((user) => {
  const metadata = user.roleMetadata && typeof user.roleMetadata === "object" && !Array.isArray(user.roleMetadata) ? user.roleMetadata as Record<string, unknown> : {};
  const global = user.role === "ADMIN" || (user.role === "DIRECTOR" && metadata.superAdmin === true);
  return {
    id: user.id, name: user.name, email: user.email, role: user.role, disabled: user.isDisabled, createdAt: user.createdAt,
    classification: global ? "GLOBAL_OR_SYSTEM_REVIEW" : "TENANT_REQUIRES_MANUAL_REMEDIATION",
    action: "BLOCK_TENANT_SENSITIVE_OPERATIONS_UNTIL_MANUALLY_CLASSIFIED"
  };
});
fs.writeFileSync(path.join(docs, "phase14-orphan-user-resolution.json"), `${JSON.stringify({ phase: 14, policy: "No speculative reassignment or deletion.", totalInstitutionlessUsers: orphanUsers.length, users: orphanUsers }, null, 2)}\n`);

const [notifications, emailLogs, pushNotifications] = await Promise.all([
  prisma.notification.findMany({ where: { instituteId: null }, select: { id: true, userId: true, targetRole: true, createdAt: true } }),
  prisma.emailLog.findMany({ where: { instituteId: null }, select: { id: true, recipient: true, status: true, sentAt: true } }),
  prisma.pushNotification.findMany({ where: { instituteId: null }, select: { id: true, targetAudience: true, status: true, createdAt: true } })
]);
const resolution = {
  phase: 14,
  policy: "Do not guess historical ownership. Tenant actors cannot access unresolved tenant-sensitive delivery records.",
  records: {
    Notification: { total: notifications.length, global: 0, provablyTenantOwned: 0, unresolved: notifications.length },
    EmailLog: { total: emailLogs.length, global: 0, provablyTenantOwned: 0, unresolved: emailLogs.length },
    PushNotification: { total: pushNotifications.length, global: 0, provablyTenantOwned: 0, unresolved: pushNotifications.length }
  },
  samples: {
    notifications: notifications.slice(0, 25),
    emailLogs: emailLogs.slice(0, 25),
    pushNotifications: pushNotifications.slice(0, 25)
  },
  tenantPolicy: "Excluded from tenant dashboards, notification lists, delivery logs, reports, exports and tenant APIs."
};
fs.writeFileSync(path.join(docs, "phase14-historical-delivery-resolution.json"), `${JSON.stringify(resolution, null, 2)}\n`);
console.log(JSON.stringify({ institutionlessUsers: orphanUsers.length, historical: resolution.records }, null, 2));
await prisma.$disconnect();

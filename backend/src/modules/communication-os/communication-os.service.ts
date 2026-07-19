import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { enqueueNotification } from "../../queues/notification.queue.js";
import { enqueueWhatsApp } from "../../queues/whatsapp.queue.js";
import { renderEmailTemplate, resendService } from "../communication/resend.service.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type CommunicationActor = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  roleMetadata?: Record<string, unknown> | null;
};

type Channel = "IN_APP" | "EMAIL" | "PUSH" | "WHATSAPP";
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type DispatchInput = {
  title: string;
  body: string;
  channels?: Channel[];
  priority?: Priority;
  targetUserId?: string;
  targetRole?: string;
  phone?: string;
  email?: string;
  templateKey?: string;
  context?: Record<string, unknown>;
};

const managerRoles = new Set<Role>([
  Role.ADMIN,
  Role.DIRECTOR,
  Role.ACADEMIC_HEAD,
  Role.ADMINISTRATIVE_OFFICER,
  Role.BUSINESS_DEVELOPMENT_EXECUTIVE,
  Role.TELECALLER,
  Role.MARKETING_COORDINATOR
]);

const framework = [
  { key: "MESSAGE_PRIORITY", label: "Message priority", source: "Communication OS dispatch contract" },
  { key: "FREQUENCY_CONTROL", label: "Frequency control", source: "AuditLog duplicate guard window" },
  { key: "OPT_IN_OUT", label: "Opt-in and opt-out", source: "User roleMetadata communication preferences" },
  { key: "SUMMARY_BUNDLING", label: "Summary bundling", source: "AuditLog and Notification summaries" },
  { key: "TEMPLATE_TRACKING", label: "Template tracking", source: "AuditLog metadata templateKey" },
  { key: "AUDIT_TRAIL", label: "Audit trail", source: "AuditLog + QueueJobLog + EmailLog + PushNotification" },
  { key: "WHATSAPP", label: "WhatsApp", source: "Existing WhatsApp queue and service" },
  { key: "EMAIL", label: "Email", source: "Existing Resend/email queue service" },
  { key: "IN_APP", label: "In-app notification", source: "Existing Notification model" },
  { key: "PUSH", label: "Push notification", source: "Existing notification queue and PushNotification model" }
] as const;

function requireManager(actor: CommunicationActor) {
  const template = typeof actor.roleMetadata?.dashboardTemplate === "string" ? actor.roleMetadata.dashboardTemplate.toUpperCase() : "";
  if (!managerRoles.has(actor.role) && template !== "ADMINISTRATION" && template !== "ACADEMIC_HEAD") {
    throw Object.assign(new Error("Communication OS access required"), { statusCode: 403 });
  }
}

function normalizePriority(value?: Priority) {
  return value ?? "NORMAL";
}

function defaultChannels(input: DispatchInput): Channel[] {
  if (input.channels?.length) return Array.from(new Set(input.channels));
  const channels: Channel[] = ["IN_APP"];
  if (input.email) channels.push("EMAIL");
  if (input.phone) channels.push("WHATSAPP");
  return channels;
}

function metadata(input: DispatchInput, actor: CommunicationActor) {
  return {
    actorRole: actor.role,
    priority: normalizePriority(input.priority),
    targetUserId: input.targetUserId ?? null,
    targetRole: input.targetRole ?? null,
    templateKey: input.templateKey ?? "custom",
    context: input.context ?? {}
  };
}

function rolePreferences(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const communication = record.communicationPreferences;
  return communication && typeof communication === "object" && !Array.isArray(communication) ? communication as Record<string, unknown> : {};
}

function optedOut(preferences: Record<string, unknown>, channel: Channel) {
  const key = channel.toLowerCase();
  return preferences[key] === false || preferences[`${key}OptIn`] === false || preferences.optOut === true;
}

async function targetUser(input: DispatchInput) {
  if (!input.targetUserId) return null;
  return prisma.user.findUnique({ where: { id: input.targetUserId }, select: { id: true, email: true, mobile: true, roleMetadata: true } });
}

async function recentlySent(input: DispatchInput, actor: CommunicationActor) {
  if (normalizePriority(input.priority) === "URGENT") return false;
  const since = new Date();
  since.setMinutes(since.getMinutes() - 30);
  const duplicate = await prisma.auditLog.findFirst({
    where: {
      userId: actor.id,
      module: "communication-os",
      action: "COMMUNICATION_DISPATCHED",
      createdAt: { gte: since },
      description: { contains: `${input.templateKey ?? "custom"}:${input.targetUserId ?? input.targetRole ?? input.email ?? input.phone ?? "broadcast"}` }
    },
    select: { id: true }
  });
  return Boolean(duplicate);
}

async function audit(actor: CommunicationActor, action: string, details: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      module: "communication-os",
      action,
      description: JSON.stringify(details)
    }
  }).catch(() => undefined);
  emitDomainEvent({
    category: "COMMUNICATION",
    eventName: action,
    title: action.replaceAll("_", " ").toLowerCase(),
    description: "Communication OS activity occurred.",
    actor,
    entityType: "CommunicationOS",
    severity: action.includes("FAILED") ? "WARNING" : "INFO",
    source: "API",
    metadata: details
  });
}

export const communicationOsService = {
  framework() {
    return {
      name: "NIDUS Communication Operating System",
      principle: "One communication layer should decide priority, channel, frequency and audit trail while existing WhatsApp, email, push and in-app services deliver the message.",
      framework
    };
  },

  async dispatch(actor: CommunicationActor, input: DispatchInput) {
    requireManager(actor);
    if (!input.title?.trim() || !input.body?.trim()) throw Object.assign(new Error("Title and body are required"), { statusCode: 400 });
    if (await recentlySent(input, actor)) {
      await audit(actor, "COMMUNICATION_FREQUENCY_SKIPPED", { key: `${input.templateKey ?? "custom"}:${input.targetUserId ?? input.targetRole ?? input.email ?? input.phone ?? "broadcast"}`, metadata: metadata(input, actor) });
      return { status: "SKIPPED_FREQUENCY_CONTROL", channels: [], priority: normalizePriority(input.priority) };
    }

    const user = await targetUser(input);
    const preferences = rolePreferences(user?.roleMetadata);
    const channels = defaultChannels({ ...input, email: input.email ?? user?.email ?? undefined, phone: input.phone ?? user?.mobile ?? undefined });
    const results: Array<{ channel: Channel; status: string; id?: string | null }> = [];

    for (const channel of channels) {
      if (optedOut(preferences, channel) && normalizePriority(input.priority) !== "URGENT") {
        results.push({ channel, status: "SKIPPED_OPT_OUT" });
        continue;
      }
      if (channel === "IN_APP") {
        const notification = await prisma.notification.create({
          data: {
            title: input.title,
            message: input.body,
            type: normalizePriority(input.priority),
            userId: input.targetUserId,
            targetRole: input.targetRole
          }
        });
        results.push({ channel, status: "SENT", id: notification.id });
      }
      if (channel === "EMAIL") {
        const recipient = input.email ?? user?.email;
        if (!recipient) {
          results.push({ channel, status: "SKIPPED_NO_EMAIL" });
          continue;
        }
        const htmlContent = renderEmailTemplate({ title: input.title, body: input.body });
        const result = await resendService.sendEmail({ recipient, subject: input.title, htmlContent, textContent: input.body }).catch(() => ({ status: "FAILED" }));
        await prisma.emailLog.create({ data: { recipient, subject: input.title, status: result.status } }).catch(() => undefined);
        results.push({ channel, status: result.status });
      }
      if (channel === "PUSH") {
        const job = await enqueueNotification({ title: input.title, body: input.body, targetAudience: input.targetUserId ?? input.targetRole ?? "ALL" });
        await prisma.pushNotification.create({ data: { title: input.title, body: input.body, targetAudience: input.targetUserId ?? input.targetRole ?? "ALL", status: job ? "QUEUED" : "QUEUE_UNAVAILABLE" } }).catch(() => undefined);
        results.push({ channel, status: job ? "QUEUED" : "QUEUE_UNAVAILABLE", id: job?.id ?? null });
      }
      if (channel === "WHATSAPP") {
        const to = input.phone ?? user?.mobile;
        if (!to) {
          results.push({ channel, status: "SKIPPED_NO_PHONE" });
          continue;
        }
        const job = await enqueueWhatsApp({ type: "SEND_TEXT", to, body: input.body, context: { ...input.context, templateKey: input.templateKey, priority: normalizePriority(input.priority) } });
        results.push({ channel, status: job ? "QUEUED" : "QUEUE_UNAVAILABLE", id: job?.id ?? null });
      }
    }

    await audit(actor, "COMMUNICATION_DISPATCHED", {
      key: `${input.templateKey ?? "custom"}:${input.targetUserId ?? input.targetRole ?? input.email ?? input.phone ?? "broadcast"}`,
      metadata: metadata(input, actor),
      channels: results
    });
    return { status: "PROCESSED", priority: normalizePriority(input.priority), channels: results };
  },

  async bundle(actor: CommunicationActor, input: { targetRole?: string; targetUserId?: string; period?: "DAILY" | "WEEKLY" | "MONTHLY" }) {
    requireManager(actor);
    const since = new Date();
    const period = input.period ?? "DAILY";
    if (period === "WEEKLY") since.setDate(since.getDate() - 7);
    else if (period === "MONTHLY") since.setMonth(since.getMonth() - 1);
    else since.setHours(0, 0, 0, 0);

    const [notifications, emailLogs, pushLogs, queueLogs, whatsappLogs] = await Promise.all([
      prisma.notification.count({ where: { createdAt: { gte: since }, userId: input.targetUserId, targetRole: input.targetRole } }),
      prisma.emailLog.count({ where: { sentAt: { gte: since } } }),
      prisma.pushNotification.count({ where: { createdAt: { gte: since }, targetAudience: input.targetUserId ?? input.targetRole } }),
      prisma.queueJobLog.groupBy({ by: ["status"], where: { createdAt: { gte: since }, queueName: { in: ["nidus.email", "nidus.notifications", "nidus.whatsapp"] } }, _count: { _all: true } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since }, module: "whatsapp" } })
    ]);

    const summary = {
      name: "NIDUS Communication Summary",
      period,
      targetRole: input.targetRole ?? null,
      targetUserId: input.targetUserId ?? null,
      notifications,
      emails: emailLogs,
      push: pushLogs,
      whatsappAuditItems: whatsappLogs,
      queueStatus: queueLogs.map((item) => ({ status: item.status, count: item._count._all }))
    };
    await audit(actor, "COMMUNICATION_SUMMARY_BUNDLED", summary);
    return summary;
  },

  async health(actor: CommunicationActor) {
    requireManager(actor);
    const since = new Date();
    since.setDate(since.getDate() - 1);
    const [emailFailures, pushFailures, whatsappFailures, queuedJobs, failedJobs] = await Promise.all([
      prisma.emailLog.count({ where: { status: "FAILED", sentAt: { gte: since } } }),
      prisma.pushNotification.count({ where: { status: "FAILED", createdAt: { gte: since } } }),
      prisma.auditLog.count({ where: { module: "whatsapp", action: "WHATSAPP_SEND_FAILED", createdAt: { gte: since } } }),
      prisma.queueJobLog.count({ where: { queueName: { in: ["nidus.email", "nidus.notifications", "nidus.whatsapp"] }, status: "QUEUED", createdAt: { gte: since } } }),
      prisma.queueJobLog.count({ where: { queueName: { in: ["nidus.email", "nidus.notifications", "nidus.whatsapp"] }, status: "FAILED", createdAt: { gte: since } } })
    ]);
    const health = {
      name: "NIDUS Communication Health",
      window: "24H",
      status: emailFailures + pushFailures + whatsappFailures + failedJobs ? "WATCH" : "GOOD",
      emailFailures,
      pushFailures,
      whatsappFailures,
      queuedJobs,
      failedJobs
    };
    await audit(actor, "COMMUNICATION_HEALTH_VIEWED", health);
    return health;
  }
};

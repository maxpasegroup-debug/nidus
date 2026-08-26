import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";
import { renderEmailTemplate, resendService } from "./resend.service.js";
import { pushService } from "./push.service.js";

const userSelect = { id: true, name: true, email: true, mobile: true, role: true } as const;

export const communicationService = {
  notifications(user: { id: string; role: Role; instituteId?: string | null }) {
    return prisma.notification.findMany({
      where: user.instituteId
        ? { OR: [{ userId: user.id }, { instituteId: user.instituteId, targetRole: user.role }, { instituteId: user.instituteId, targetRole: "ALL" }] }
        : { userId: user.id },
      orderBy: { createdAt: "desc" }
    });
  },
  async markNotificationRead(id: string, user: { id: string; role: Role }) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== user.id) throw new Error("Only user-specific notifications can be marked read");

    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  },
  threads(user: { id: string; role: Role }) {
    return prisma.messageThread.findMany({
      where: user.role === "ADMIN" ? undefined : { OR: [{ createdBy: user.id }, { messages: { some: { OR: [{ senderId: user.id }, { receiverId: user.id }] } } }] },
      orderBy: { createdAt: "desc" },
      include: { creator: { select: userSelect }, messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: userSelect }, receiver: { select: userSelect } } } }
    });
  },
  createThread(input: { subject: string }, createdBy: string) {
    return prisma.messageThread.create({ data: { subject: input.subject, createdBy }, include: { creator: { select: userSelect }, messages: true } });
  },
  async sendMessage(input: { threadId: string; receiverId: string; message: string; attachmentUrl?: string }, sender: { id: string; instituteId?: string | null }) {
    const receiver = await prisma.user.findUnique({ where: { id: input.receiverId }, select: { id: true, instituteId: true } });
    if (!receiver) throw Object.assign(new Error("Receiver not found"), { statusCode: 404 });
    if (!sender.instituteId || !receiver.instituteId || sender.instituteId !== receiver.instituteId) {
      throw Object.assign(new Error("Cross-institution messaging is not allowed"), { statusCode: 403 });
    }
    const thread = await prisma.messageThread.findFirst({
      where: {
        id: input.threadId,
        OR: [
          { createdBy: sender.id },
          { messages: { some: { OR: [{ senderId: sender.id }, { receiverId: sender.id }] } } }
        ]
      }
    });

    if (!thread) throw new Error("Message thread not found");

    return prisma.message.create({
      data: { ...input, senderId: sender.id },
      include: { sender: { select: userSelect }, receiver: { select: userSelect }, thread: true }
    });
  },
  thread(id: string, user: { id: string; role: Role }) {
    return prisma.messageThread.findFirst({
      where: user.role === "ADMIN" ? { id } : { id, OR: [{ createdBy: user.id }, { messages: { some: { OR: [{ senderId: user.id }, { receiverId: user.id }] } } }] },
      include: { creator: { select: userSelect }, messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: userSelect }, receiver: { select: userSelect } } } }
    });
  },
  announcements(user: { id: string; instituteId?: string | null }) {
    return prisma.announcement.findMany({
      where: { OR: [{ createdBy: null }, { creator: { instituteId: user.instituteId ?? "__missing_institute__" } }] },
      orderBy: { createdAt: "desc" },
      include: { creator: { select: userSelect } },
    });
  },
  async createAnnouncement(input: { title: string; description: string; audience?: string; targetAudience?: string }, user: { id: string; instituteId?: string | null }) {
    if (!user.instituteId) throw Object.assign(new Error("Institution scope is required"), { statusCode: 403 });
    const audience = input.audience ?? input.targetAudience ?? "ALL";
    return prisma.announcement.create({ data: { title: input.title, description: input.description, audience, targetAudience: audience, createdBy: user.id }, include: { creator: { select: userSelect } } });
  },
  async sendEmail(input: { recipient: string; subject: string; body: string; actionLabel?: string; actionUrl?: string }, actor: { id: string; role: Role; instituteId?: string | null }) {
    if (actor.role !== "ADMIN" && !actor.instituteId) throw Object.assign(new Error("Institution scope is required"), { statusCode: 403 });
    const htmlContent = renderEmailTemplate({ title: input.subject, body: input.body, actionLabel: input.actionLabel, actionUrl: input.actionUrl });
    let status = "SENT";
    try {
      const result = await resendService.sendEmail({ recipient: input.recipient, subject: input.subject, htmlContent, textContent: input.body });
      status = result.status;
    } catch (_error) {
      status = "FAILED";
    }
    return prisma.emailLog.create({ data: { recipient: input.recipient, subject: input.subject, status, instituteId: actor.instituteId ?? undefined } });
  },
  emailLogs(actor: { id: string; role: Role; instituteId?: string | null }) {
    if (actor.role !== "ADMIN" && !actor.instituteId) throw Object.assign(new Error("Institution scope is required"), { statusCode: 403 });
    return prisma.emailLog.findMany({ where: actor.role === "ADMIN" && !actor.instituteId ? undefined : { instituteId: actor.instituteId }, orderBy: { sentAt: "desc" } });
  },
  async sendPush(input: { title: string; body: string; targetAudience: string }, actor: { id: string; role: Role; instituteId?: string | null }) {
    if (actor.role !== "ADMIN" && !actor.instituteId) throw Object.assign(new Error("Institution scope is required"), { statusCode: 403 });
    const result = await pushService.sendQueued(input);
    return prisma.pushNotification.create({ data: { ...input, status: result.status, instituteId: actor.instituteId ?? undefined } });
  }
};

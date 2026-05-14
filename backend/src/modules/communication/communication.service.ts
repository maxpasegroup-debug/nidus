import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/client.js";
import { renderEmailTemplate, resendService } from "./resend.service.js";
import { pushService } from "./push.service.js";

const userSelect = { id: true, name: true, email: true, mobile: true, role: true } as const;

export const communicationService = {
  notifications(user: { id: string; role: Role }) {
    return prisma.notification.findMany({
      where: { OR: [{ userId: user.id }, { targetRole: user.role }, { targetRole: "ALL" }] },
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
  async sendMessage(input: { threadId: string; receiverId: string; message: string; attachmentUrl?: string }, senderId: string) {
    const thread = await prisma.messageThread.findFirst({
      where: {
        id: input.threadId,
        OR: [
          { createdBy: senderId },
          { messages: { some: { OR: [{ senderId }, { receiverId: senderId }] } } }
        ]
      }
    });

    if (!thread) throw new Error("Message thread not found");

    return prisma.message.create({
      data: { ...input, senderId },
      include: { sender: { select: userSelect }, receiver: { select: userSelect }, thread: true }
    });
  },
  thread(id: string, user: { id: string; role: Role }) {
    return prisma.messageThread.findFirst({
      where: user.role === "ADMIN" ? { id } : { id, OR: [{ createdBy: user.id }, { messages: { some: { OR: [{ senderId: user.id }, { receiverId: user.id }] } } }] },
      include: { creator: { select: userSelect }, messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: userSelect }, receiver: { select: userSelect } } } }
    });
  },
  announcements() {
    return prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, include: { creator: { select: userSelect } } });
  },
  createAnnouncement(input: { title: string; description: string; audience?: string; targetAudience?: string }, createdBy: string) {
    const audience = input.audience ?? input.targetAudience ?? "ALL";
    return prisma.announcement.create({ data: { title: input.title, description: input.description, audience, targetAudience: audience, createdBy }, include: { creator: { select: userSelect } } });
  },
  async sendEmail(input: { recipient: string; subject: string; body: string; actionLabel?: string; actionUrl?: string }) {
    const htmlContent = renderEmailTemplate({ title: input.subject, body: input.body, actionLabel: input.actionLabel, actionUrl: input.actionUrl });
    let status = "SENT";
    try {
      const result = await resendService.sendEmail({ recipient: input.recipient, subject: input.subject, htmlContent, textContent: input.body });
      status = result.status;
    } catch (_error) {
      status = "FAILED";
    }
    return prisma.emailLog.create({ data: { recipient: input.recipient, subject: input.subject, status } });
  },
  emailLogs() {
    return prisma.emailLog.findMany({ orderBy: { sentAt: "desc" } });
  },
  async sendPush(input: { title: string; body: string; targetAudience: string }) {
    const result = await pushService.sendQueued(input);
    return prisma.pushNotification.create({ data: { ...input, status: result.status } });
  }
};

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../utils/logger.js";
import { aiDirectorService } from "../ai-director/ai-director.service.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

const graphBaseUrl = "https://graph.facebook.com/v21.0";

type WhatsAppSendInput = {
  to: string;
  body: string;
  context?: Record<string, unknown>;
};

type WhatsAppInbound = {
  from: string;
  text: string;
  messageId?: string;
  timestamp?: string;
};

function normalizePhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function configured() {
  return Boolean(env.SALESBOOSTER_WHATSAPP_ACCESS_TOKEN && env.SALESBOOSTER_WHATSAPP_PHONE_NUMBER_ID);
}

function defaultDirectorRecipients() {
  return env.SALESBOOSTER_DEFAULT_WHATSAPP_RECIPIENTS
    .split(",")
    .map((item) => normalizePhone(item.trim()))
    .filter(Boolean);
}

async function auditWhatsApp(input: { action: string; description: string; phone?: string; metadata?: Record<string, unknown> }) {
  await prisma.auditLog.create({
    data: {
      module: "whatsapp",
      action: input.action,
      description: JSON.stringify({
        description: input.description,
        phone: input.phone,
        metadata: input.metadata ?? {}
      })
    }
  }).catch(() => undefined);
}

async function sendTextMessage(input: WhatsAppSendInput) {
  const to = normalizePhone(input.to);
  if (!to) throw new Error("Valid WhatsApp recipient is required");

  if (!configured()) {
    await auditWhatsApp({
      action: "WHATSAPP_LOGGED_ONLY",
      phone: to,
      description: "WhatsApp credentials missing; message logged only.",
      metadata: { body: input.body, context: input.context }
    });
    return { status: "LOGGED_ONLY", providerMessageId: "logged-only" };
  }

  const response = await fetch(`${graphBaseUrl}/${env.SALESBOOSTER_WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SALESBOOSTER_WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: input.body }
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    await auditWhatsApp({
      action: "WHATSAPP_SEND_FAILED",
      phone: to,
      description: "WhatsApp Cloud API send failed.",
      metadata: { status: response.status, result, context: input.context }
    });
    throw new Error(`WhatsApp send failed with status ${response.status}`);
  }

  const providerMessageId = Array.isArray(result.messages) ? result.messages[0]?.id : undefined;
  await auditWhatsApp({
    action: "WHATSAPP_SENT",
    phone: to,
    description: "WhatsApp message sent.",
    metadata: { providerMessageId, context: input.context }
  });
  return { status: "SENT", providerMessageId: providerMessageId ?? "unknown" };
}

function formatMoney(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

async function buildDailyReport() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const tomorrow = new Date(start);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [students, staff, leadsDue, feeDue, paymentsToday, admissionsToday, eventsToday, automationToday] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", isDisabled: false } }),
    prisma.user.count({ where: { role: { in: ["TEACHER", "ACADEMIC_HEAD", "ADMINISTRATIVE_OFFICER", "BUSINESS_DEVELOPMENT_EXECUTIVE", "TELECALLER", "MARKETING_COORDINATOR"] }, isDisabled: false } }),
    prisma.followUp.count({ where: { followUpDate: { gte: start, lt: tomorrow }, status: { not: "COMPLETED" } } }),
    prisma.feeInstallment.aggregate({ where: { dueDate: { lt: tomorrow }, paidStatus: { not: "PAID" } }, _sum: { dueAmount: true }, _count: { _all: true } }),
    prisma.payment.aggregate({ where: { createdAt: { gte: start }, paymentStatus: { in: ["SUCCESS", "PAID", "VERIFIED", "CAPTURED"] } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.admission.count({ where: { createdAt: { gte: start } } }),
    prisma.auditLog.count({ where: { module: { startsWith: "event:" }, createdAt: { gte: start } } }),
    prisma.queueJobLog.count({ where: { jobName: { startsWith: "automation:" }, createdAt: { gte: start } } })
  ]);

  return [
    "NIDUS Academy - Today",
    "",
    `Students active: ${students}`,
    `Staff active: ${staff}`,
    `Admission leads due: ${leadsDue}`,
    `Admissions today: ${admissionsToday}`,
    `Collections today: ${formatMoney(paymentsToday._sum.amount ?? 0)} (${paymentsToday._count._all})`,
    `Pending fees: ${formatMoney(feeDue._sum.dueAmount ?? 0)} (${feeDue._count._all})`,
    "",
    "Needs attention:",
    leadsDue ? `- ${leadsDue} admission follow-up(s) due today` : "- Admission follow-ups clear",
    feeDue._count._all ? `- ${feeDue._count._all} fee item(s) need follow-up` : "- Fee follow-ups clear",
    "",
    `AI/automation events today: ${eventsToday}`,
    `Automation actions today: ${automationToday}`,
    "",
    "Reply:",
    "1 - Urgent issues",
    "2 - Admissions",
    "3 - Fees",
    "REPORT - Full report",
    "TOMORROW - Tomorrow's plan"
  ].join("\n");
}

async function commandResponse(command: string) {
  const normalized = command.trim().toUpperCase();
  if (normalized === "1" || normalized === "ISSUES") {
    return "Urgent issues view is ready.\n\nNIDUS AI Director is watching admissions, fees, automation failures and operational risks.";
  }
  if (normalized === "2" || normalized === "ADMISSIONS") {
    return "Admissions command received.\n\nNIDUS AI Director is tracking leads, follow-ups, counselling, pending reviews and batch-readiness.";
  }
  if (normalized === "3" || normalized === "FEES") {
    return "Fees command received.\n\nNIDUS AI Director can summarize collections, overdue fees and payment follow-ups from the finance engine.";
  }
  if (normalized === "REPORT") {
    return "Full report command received.\n\nA dashboard/PDF link will be attached when report generation is connected.";
  }
  if (normalized === "TOMORROW") {
    return "Tomorrow's plan command received.\n\nPlanner, admissions and fee follow-up tasks will be prepared for Director review.";
  }
  if (normalized === "APPROVE") {
    return "Approval received.\n\nSensitive admissions, finance, employee and parent actions remain guarded. Approval must be linked to a specific Director action id before execution.";
  }
  return aiDirectorService.answerWhatsAppCommand(command).catch((error) => {
    logger.warn("NIDUS AI Director WhatsApp answer failed", { error });
    return "NIDUS AI received your command, but the operating insight engine could not prepare a safe answer right now. Please use 1, 2, 3, REPORT, ISSUES, TOMORROW or try again.";
  });
}

export const whatsappService = {
  configured,
  defaultDirectorRecipients,

  verifyWebhook(input: { mode?: string; token?: string; challenge?: string }) {
    if (input.mode !== "subscribe" || input.token !== env.SALESBOOSTER_WHATSAPP_WEBHOOK_VERIFY_TOKEN || !input.challenge) {
      throw new Error("WhatsApp webhook verification failed");
    }
    return input.challenge;
  },

  async send(input: WhatsAppSendInput) {
    const result = await sendTextMessage(input);
    emitDomainEvent({
      category: "COMMUNICATION",
      eventName: "WHATSAPP_MESSAGE_SENT",
      title: "WhatsApp message sent",
      description: `WhatsApp message ${result.status.toLowerCase()} for ${normalizePhone(input.to)}.`,
      entityType: "WhatsAppMessage",
      entityId: result.providerMessageId,
      severity: result.status === "SENT" ? "SUCCESS" : "INFO",
      source: "WHATSAPP",
      metadata: { recipient: normalizePhone(input.to), context: input.context, status: result.status }
    });
    return result;
  },

  async sendDirectorDailyReport() {
    const body = await buildDailyReport();
    const recipients = defaultDirectorRecipients();
    if (!recipients.length) {
      await auditWhatsApp({ action: "WHATSAPP_DIRECTOR_REPORT_SKIPPED", description: "No default Director WhatsApp recipients configured.", metadata: { body } });
      return { status: "NO_RECIPIENTS", sent: 0, body };
    }
    const results = await Promise.allSettled(recipients.map((to) => this.send({ to, body, context: { reportType: "DIRECTOR_DAILY" } })));
    return { status: "PROCESSED", sent: results.filter((item) => item.status === "fulfilled").length, failed: results.filter((item) => item.status === "rejected").length, body };
  },

  extractInbound(payload: unknown): WhatsAppInbound[] {
    const body = payload as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ id?: string; from?: string; timestamp?: string; text?: { body?: string }; button?: { text?: string }; interactive?: { button_reply?: { title?: string } } }> } }> }> };
    return (body.entry ?? []).flatMap((entry) => entry.changes ?? []).flatMap((change) => change.value?.messages ?? []).map((message) => ({
      from: normalizePhone(message.from ?? ""),
      text: message.text?.body ?? message.button?.text ?? message.interactive?.button_reply?.title ?? "",
      messageId: message.id,
      timestamp: message.timestamp
    })).filter((message) => message.from && message.text);
  },

  async handleInbound(payload: unknown) {
    if (!configured()) {
      throw Object.assign(new Error("WhatsApp delivery is unavailable"), { statusCode: 503 });
    }
    const messages = this.extractInbound(payload);
    const processed = [];
    for (const message of messages) {
      const duplicate = message.messageId ? await prisma.auditLog.findFirst({ where: { module: "whatsapp", action: "WHATSAPP_INBOUND_RECEIVED", description: { contains: message.messageId } } }) : null;
      if (duplicate) {
        processed.push({ from: message.from, status: "DUPLICATE_IGNORED" });
        continue;
      }
      await auditWhatsApp({ action: "WHATSAPP_INBOUND_RECEIVED", phone: message.from, description: "WhatsApp inbound command received.", metadata: message });
      emitDomainEvent({
        category: "COMMUNICATION",
        eventName: "WHATSAPP_COMMAND_RECEIVED",
        title: "WhatsApp command received",
        description: `Command received from ${message.from}.`,
        entityType: "WhatsAppInbound",
        entityId: message.messageId,
        severity: "INFO",
        source: "WHATSAPP",
        metadata: { command: message.text, from: message.from }
      });
      const reply = await commandResponse(message.text);
      await this.send({ to: message.from, body: reply, context: { command: message.text, inboundMessageId: message.messageId } });
      processed.push({ from: message.from, status: "REPLIED" });
    }
    return { received: messages.length, processed };
  },

  async health() {
    return {
      configured: configured(),
      phoneNumberIdConfigured: Boolean(env.SALESBOOSTER_WHATSAPP_PHONE_NUMBER_ID),
      tokenConfigured: Boolean(env.SALESBOOSTER_WHATSAPP_ACCESS_TOKEN),
      defaultRecipients: defaultDirectorRecipients().length,
      mode: configured() ? "CLOUD_API" : "LOGGED_ONLY"
    };
  }
};

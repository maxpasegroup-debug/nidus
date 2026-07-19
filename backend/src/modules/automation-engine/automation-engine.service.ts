import { prisma } from "../../config/prisma.js";
import { logger } from "../../utils/logger.js";
import { enqueueNotification } from "../../queues/notification.queue.js";
import { queueNames } from "../../queues/queue.config.js";
import type { DomainEventInput } from "../event-engine/event-engine.service.js";
import { automationRules, matchesRule, type AutomationAction, type AutomationRule } from "./automation-rules.js";

type AutomationEvent = DomainEventInput & { eventId: string };

function eventSeverity(event: DomainEventInput) {
  return event.severity ?? "INFO";
}

function render(value: string, event: AutomationEvent) {
  return value
    .replaceAll("{eventName}", event.eventName)
    .replaceAll("{category}", event.category)
    .replaceAll("{title}", event.title)
    .replaceAll("{entityType}", event.entityType ?? "Record")
    .replaceAll("{entityId}", event.entityId ?? event.eventId);
}

function jobName(rule: AutomationRule, actionIndex: number, eventId: string) {
  return `automation:${rule.id}:${actionIndex}:${eventId}`;
}

async function alreadyPlanned(name: string) {
  const existing = await prisma.queueJobLog.findFirst({ where: { jobName: name }, select: { id: true } });
  return Boolean(existing);
}

async function logAutomation(input: {
  rule: AutomationRule;
  action: AutomationAction;
  event: AutomationEvent;
  actionIndex: number;
  status: string;
  queueJobId?: string | null;
  error?: string;
}) {
  await prisma.queueJobLog.create({
    data: {
      queueName: queueNames.scheduled,
      jobName: jobName(input.rule, input.actionIndex, input.event.eventId),
      jobId: input.queueJobId ?? undefined,
      status: input.status,
      error: input.error,
      payload: {
        automationRuleId: input.rule.id,
        automationRuleName: input.rule.name,
        action: input.action,
        eventId: input.event.eventId,
        eventName: input.event.eventName,
        category: input.event.category,
        entityType: input.event.entityType,
        entityId: input.event.entityId
      }
    }
  }).catch(() => undefined);
}

async function runAction(rule: AutomationRule, action: AutomationAction, event: AutomationEvent, actionIndex: number) {
  const name = jobName(rule, actionIndex, event.eventId);
  if (await alreadyPlanned(name)) return;

  if (action.type === "NOTIFY") {
    const job = await enqueueNotification({
      title: render(action.title, event),
      body: render(action.body, event),
      targetAudience: action.targetAudience
    });
    await logAutomation({ rule, action, event, actionIndex, status: job ? "AUTOMATION_QUEUED" : "AUTOMATION_SKIPPED_QUEUE_UNAVAILABLE", queueJobId: job?.id ?? null });
    return;
  }

  await logAutomation({ rule, action, event, actionIndex, status: action.delayMs ? "AUTOMATION_DELAY_SIGNAL_READY" : "AUTOMATION_SIGNAL_READY" });
}

export const automationEngineService = {
  rules() {
    return automationRules;
  },

  async processEvent(event: AutomationEvent) {
    try {
      const matched = automationRules.filter((rule) => matchesRule(rule, { category: event.category, eventName: event.eventName, severity: eventSeverity(event) }));
      await Promise.all(matched.flatMap((rule) => rule.actions.map((action, actionIndex) => runAction(rule, action, event, actionIndex))));
      return { matchedRules: matched.length, actions: matched.reduce((sum, rule) => sum + rule.actions.length, 0) };
    } catch (error) {
      logger.warn("Automation processing failed", {
        eventId: event.eventId,
        eventName: event.eventName,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return { matchedRules: 0, actions: 0, failed: true };
    }
  },

  async summary() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [queued, skipped, signals, failed, recent] = await Promise.all([
      prisma.queueJobLog.count({ where: { jobName: { startsWith: "automation:" }, status: "AUTOMATION_QUEUED", createdAt: { gte: since24h } } }),
      prisma.queueJobLog.count({ where: { jobName: { startsWith: "automation:" }, status: "AUTOMATION_SKIPPED_QUEUE_UNAVAILABLE", createdAt: { gte: since24h } } }),
      prisma.queueJobLog.count({ where: { jobName: { startsWith: "automation:" }, status: { in: ["AUTOMATION_SIGNAL_READY", "AUTOMATION_DELAY_SIGNAL_READY"] }, createdAt: { gte: since24h } } }),
      prisma.queueJobLog.count({ where: { jobName: { startsWith: "automation:" }, status: "FAILED", createdAt: { gte: since24h } } }),
      prisma.queueJobLog.findMany({
        where: { jobName: { startsWith: "automation:" } },
        orderBy: { createdAt: "desc" },
        take: 20
      })
    ]);

    return {
      window: "24h",
      rules: automationRules.length,
      enabledRules: automationRules.filter((rule) => rule.enabled).length,
      queued,
      skipped,
      signals,
      failed,
      recent
    };
  }
};

import { prisma } from "../../config/prisma.js";
import { logger } from "../../utils/logger.js";
import type { Role } from "../../generated/prisma/client.js";
import { automationEngineService } from "../automation-engine/automation-engine.service.js";
import { categoryFromModule, eventDefinitions, eventModule, type EventCategory, type EventSeverity, type EventSource } from "./event-taxonomy.js";

type Actor = {
  id?: string | null;
  role?: Role | string | null;
  instituteId?: string | null;
  branchId?: string | null;
};

export type DomainEventInput = {
  category: EventCategory;
  eventName: string;
  title: string;
  description?: string;
  actor?: Actor | null;
  entityType?: string;
  entityId?: string;
  severity?: EventSeverity;
  source?: EventSource;
  correlationId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

type EventQuery = {
  category?: EventCategory;
  eventName?: string;
  severity?: EventSeverity;
  search?: string;
  limit?: number;
};

const MAX_DESCRIPTION_LENGTH = 8000;

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch (_error) {
    return JSON.stringify({ serializationError: true });
  }
}

function toStoredDescription(input: DomainEventInput) {
  const envelope = {
    title: input.title,
    description: input.description ?? input.title,
    severity: input.severity ?? "INFO",
    source: input.source ?? "SYSTEM",
    entityType: input.entityType,
    entityId: input.entityId,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    actorRole: input.actor?.role,
    instituteId: input.actor?.instituteId,
    branchId: input.actor?.branchId,
    metadata: input.metadata ?? {}
  };
  const serialized = safeJson(envelope);
  return serialized.length > MAX_DESCRIPTION_LENGTH ? serialized.slice(0, MAX_DESCRIPTION_LENGTH) : serialized;
}

function fromStoredDescription(description: string) {
  try {
    const parsed = JSON.parse(description) as Record<string, unknown>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "Domain event",
      description: typeof parsed.description === "string" ? parsed.description : description,
      severity: typeof parsed.severity === "string" ? parsed.severity : "INFO",
      source: typeof parsed.source === "string" ? parsed.source : "SYSTEM",
      entityType: typeof parsed.entityType === "string" ? parsed.entityType : undefined,
      entityId: typeof parsed.entityId === "string" ? parsed.entityId : undefined,
      correlationId: typeof parsed.correlationId === "string" ? parsed.correlationId : undefined,
      idempotencyKey: typeof parsed.idempotencyKey === "string" ? parsed.idempotencyKey : undefined,
      actorRole: typeof parsed.actorRole === "string" ? parsed.actorRole : undefined,
      instituteId: typeof parsed.instituteId === "string" ? parsed.instituteId : undefined,
      branchId: typeof parsed.branchId === "string" ? parsed.branchId : undefined,
      metadata: parsed.metadata && typeof parsed.metadata === "object" ? parsed.metadata : {}
    };
  } catch (_error) {
    return {
      title: "Domain event",
      description,
      severity: "INFO",
      source: "SYSTEM",
      metadata: {}
    };
  }
}

function normalizeLimit(limit?: number) {
  if (!Number.isFinite(limit)) return 50;
  return Math.min(Math.max(Number(limit), 1), 200);
}

function toDomainEvent(row: Awaited<ReturnType<typeof prisma.auditLog.findMany>>[number]) {
  const category = categoryFromModule(row.module);
  const stored = fromStoredDescription(row.description);
  return {
    id: row.id,
    category,
    eventName: row.action,
    actorUserId: row.userId,
    createdAt: row.createdAt,
    ipAddress: row.ipAddress,
    ...stored
  };
}

export const eventEngineService = {
  definitions() {
    return eventDefinitions;
  },

  async recordEvent(input: DomainEventInput) {
    try {
      const event = await prisma.auditLog.create({
        data: {
          userId: input.actor?.id ?? undefined,
          module: eventModule(input.category),
          action: input.eventName,
          description: toStoredDescription(input),
          ipAddress: input.ipAddress
        }
      });
      void automationEngineService.processEvent({ ...input, eventId: event.id });
      return event;
    } catch (error) {
      logger.warn("Domain event recording failed", {
        category: input.category,
        eventName: input.eventName,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return null;
    }
  },

  emit(input: DomainEventInput) {
    void this.recordEvent(input);
  },

  async listEvents(query: EventQuery = {}) {
    const rows = await prisma.auditLog.findMany({
      where: {
        module: query.category ? eventModule(query.category) : { startsWith: "event:" },
        action: query.eventName,
        description: query.search ? { contains: query.search, mode: "insensitive" } : undefined
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: normalizeLimit(query.limit)
    });

    return rows
      .map((row) => ({ ...toDomainEvent(row), actor: row.user }))
      .filter((event) => !query.severity || event.severity === query.severity);
  },

  async summary() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [total24h, critical24h, categoryRows, eventRows] = await Promise.all([
      prisma.auditLog.count({ where: { module: { startsWith: "event:" }, createdAt: { gte: since24h } } }),
      prisma.auditLog.count({ where: { module: { startsWith: "event:" }, description: { contains: "\"severity\":\"CRITICAL\"" }, createdAt: { gte: since24h } } }),
      prisma.auditLog.groupBy({
        by: ["module"],
        where: { module: { startsWith: "event:" }, createdAt: { gte: since24h } },
        _count: { _all: true },
        orderBy: { _count: { module: "desc" } }
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        where: { module: { startsWith: "event:" }, createdAt: { gte: since24h } },
        _count: { _all: true },
        orderBy: { _count: { action: "desc" } },
        take: 10
      })
    ]);

    return {
      window: "24h",
      total24h,
      critical24h,
      categories: categoryRows.map((row) => ({ category: categoryFromModule(row.module), count: row._count._all })),
      topEvents: eventRows.map((row) => ({ eventName: row.action, count: row._count._all }))
    };
  }
};

export function emitDomainEvent(input: DomainEventInput) {
  eventEngineService.emit(input);
}

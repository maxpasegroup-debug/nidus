import { prisma } from "../../config/prisma.js";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";

type Actor = NonNullable<AuthenticatedRequest["user"]>;
type JsonObject = Record<string, unknown>;

const db = prisma as unknown as {
  aiWorkflowRequest: any;
  aiWorkflowContext: any;
  aiWorkflowContextSource: any;
  aiWorkflowDraft: any;
  aiWorkflowDraftVersion: any;
  aiWorkflowReview: any;
  aiWorkflowApproval: any;
  aiWorkflowFeedback: any;
  aiWorkflowPublication: any;
  aiWorkflowAuditEvent: any;
};

function text(value: unknown, field: string, required = true) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!required) return undefined;
  throw new Error(`${field} is required`);
}

function jsonObject(value: unknown, field: string, required = true): JsonObject | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as JsonObject;
  if (!required) return undefined;
  throw new Error(`${field} must be an object`);
}

function optionalDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${field} must be an ISO date string`);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${field} must be a valid ISO date string`);
  return parsed;
}

function tenantIdFor(actor: Actor) {
  return actor.instituteId ?? actor.branchId ?? "nidus-default";
}

async function audit(eventType: string, actor: Actor, requestId?: string, eventJson?: JsonObject) {
  await db.aiWorkflowAuditEvent.create({
    data: {
      requestId,
      eventType,
      actorUserId: actor.id,
      actorName: actor.name,
      eventJson
    }
  });
}

async function fullRequest(id: string) {
  const request = await db.aiWorkflowRequest.findUnique({
    where: { id },
    include: {
      contexts: { include: { sources: true }, orderBy: { createdAt: "desc" } },
      drafts: {
        include: {
          versions: { orderBy: { version: "desc" } },
          reviews: { orderBy: { createdAt: "desc" } },
          approvals: { orderBy: { createdAt: "desc" } },
          feedback: { orderBy: { createdAt: "desc" } },
          publications: { orderBy: { createdAt: "desc" } }
        },
        orderBy: { createdAt: "desc" }
      },
      reviews: { orderBy: { createdAt: "desc" } },
      approvals: { orderBy: { createdAt: "desc" } },
      feedback: { orderBy: { createdAt: "desc" } },
      publications: { orderBy: { createdAt: "desc" } },
      auditEvents: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!request) throw new Error("AI workflow request not found");
  return request;
}

async function nextVersion(draftId: string) {
  const latest = await db.aiWorkflowDraftVersion.findFirst({
    where: { draftId },
    orderBy: { version: "desc" },
    select: { version: true }
  });
  return (latest?.version ?? 0) + 1;
}

export const aiWorkflowService = {
  async createRequest(actor: Actor, body: unknown) {
    const payload = jsonObject(body, "body") ?? {};
    const request = await db.aiWorkflowRequest.create({
      data: {
        agentType: text(payload.agentType, "agentType"),
        requestType: text(payload.requestType, "requestType"),
        targetType: text(payload.targetType, "targetType", false),
        targetId: text(payload.targetId, "targetId", false),
        actorUserId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        actingMode: text(payload.actingMode, "actingMode", false),
        instituteId: actor.instituteId,
        branchId: actor.branchId,
        tenantId: text(payload.tenantId, "tenantId", false) ?? tenantIdFor(actor),
        status: text(payload.status, "status", false) ?? "REQUESTED",
        inputJson: jsonObject(payload.inputJson ?? payload.input, "inputJson"),
        metadataJson: jsonObject(payload.metadataJson, "metadataJson", false)
      }
    });
    await audit("AI_WORKFLOW_REQUEST_CREATED", actor, request.id, { agentType: request.agentType, requestType: request.requestType });
    return fullRequest(request.id);
  },

  async getRequest(id: string) {
    return fullRequest(id);
  },

  async addContext(actor: Actor, requestId: string, body: unknown) {
    await fullRequest(requestId);
    const payload = jsonObject(body, "body") ?? {};
    const sources = Array.isArray(payload.sources) ? payload.sources : [];
    const context = await db.aiWorkflowContext.create({
      data: {
        requestId,
        scope: text(payload.scope, "scope"),
        programCode: text(payload.programCode, "programCode", false),
        batchId: text(payload.batchId, "batchId", false),
        studentId: text(payload.studentId, "studentId", false),
        teacherId: text(payload.teacherId, "teacherId", false),
        contextJson: jsonObject(payload.contextJson ?? payload.context, "contextJson"),
        summaryText: text(payload.summaryText, "summaryText", false),
        sourceCount: sources.length,
        sensitivityLevel: text(payload.sensitivityLevel, "sensitivityLevel", false) ?? "INTERNAL",
        expiresAt: optionalDate(payload.expiresAt, "expiresAt"),
        schemaVersion: typeof payload.schemaVersion === "number" ? payload.schemaVersion : 1,
        sources: {
          create: sources.map((source) => {
            const sourcePayload = jsonObject(source, "source") ?? {};
            return {
              sourceType: text(sourcePayload.sourceType, "sourceType"),
              sourceId: text(sourcePayload.sourceId, "sourceId", false),
              sourceLabel: text(sourcePayload.sourceLabel, "sourceLabel", false),
              sourceJson: jsonObject(sourcePayload.sourceJson, "sourceJson", false),
              sensitivityLevel: text(sourcePayload.sensitivityLevel, "sensitivityLevel", false) ?? "INTERNAL"
            };
          })
        }
      },
      include: { sources: true }
    });
    await db.aiWorkflowRequest.update({ where: { id: requestId }, data: { status: "CONTEXT_READY" } });
    await audit("AI_WORKFLOW_CONTEXT_ADDED", actor, requestId, { contextId: context.id, scope: context.scope, sourceCount: context.sourceCount });
    return context;
  },

  async createDraft(actor: Actor, requestId: string, body: unknown) {
    await fullRequest(requestId);
    const payload = jsonObject(body, "body") ?? {};
    const draft = await db.aiWorkflowDraft.create({
      data: {
        requestId,
        draftType: text(payload.draftType, "draftType"),
        targetType: text(payload.targetType, "targetType", false),
        targetId: text(payload.targetId, "targetId", false),
        title: text(payload.title, "title", false),
        status: text(payload.status, "status", false) ?? "DRAFT",
        schemaVersion: typeof payload.schemaVersion === "number" ? payload.schemaVersion : 1,
        draftJson: jsonObject(payload.draftJson ?? payload.draft, "draftJson"),
        validationJson: jsonObject(payload.validationJson, "validationJson", false),
        sourceReferencesJson: jsonObject(payload.sourceReferencesJson, "sourceReferencesJson", false),
        versions: {
          create: {
            version: 1,
            draftJson: jsonObject(payload.draftJson ?? payload.draft, "draftJson"),
            changeSummary: "Initial AI draft",
            createdByUserId: actor.id
          }
        }
      },
      include: { versions: true }
    });
    await db.aiWorkflowRequest.update({ where: { id: requestId }, data: { status: "DRAFT_READY" } });
    await audit("AI_WORKFLOW_DRAFT_CREATED", actor, requestId, { draftId: draft.id, draftType: draft.draftType });
    return draft;
  },

  async createDraftVersion(actor: Actor, draftId: string, body: unknown) {
    const draft = await db.aiWorkflowDraft.findUnique({ where: { id: draftId } });
    if (!draft) throw new Error("AI workflow draft not found");
    const payload = jsonObject(body, "body") ?? {};
    const version = await nextVersion(draftId);
    const draftVersion = await db.aiWorkflowDraftVersion.create({
      data: {
        draftId,
        version,
        revisionRequest: text(payload.revisionRequest, "revisionRequest", false),
        draftJson: jsonObject(payload.draftJson ?? payload.draft, "draftJson"),
        changeSummary: text(payload.changeSummary, "changeSummary", false),
        createdByUserId: actor.id
      }
    });
    await db.aiWorkflowDraft.update({
      where: { id: draftId },
      data: {
        status: "REVISED",
        draftJson: jsonObject(payload.draftJson ?? payload.draft, "draftJson")
      }
    });
    await audit("AI_WORKFLOW_DRAFT_VERSION_CREATED", actor, draft.requestId, { draftId, version });
    return draftVersion;
  },

  async createReview(actor: Actor, draftId: string, body: unknown) {
    const draft = await db.aiWorkflowDraft.findUnique({ where: { id: draftId } });
    if (!draft) throw new Error("AI workflow draft not found");
    const payload = jsonObject(body, "body") ?? {};
    const review = await db.aiWorkflowReview.create({
      data: {
        requestId: draft.requestId,
        draftId,
        reviewerUserId: actor.id,
        reviewerName: actor.name,
        reviewType: text(payload.reviewType, "reviewType", false) ?? "TEACHER_REVIEW",
        status: text(payload.status, "status", false) ?? "PENDING",
        notes: text(payload.notes, "notes", false),
        correctionJson: jsonObject(payload.correctionJson, "correctionJson", false)
      }
    });
    await db.aiWorkflowDraft.update({ where: { id: draftId }, data: { status: review.status === "APPROVED" ? "REVIEW_APPROVED" : "IN_REVIEW" } });
    await audit("AI_WORKFLOW_REVIEW_CREATED", actor, draft.requestId, { draftId, reviewId: review.id, status: review.status });
    return review;
  },

  async approveDraft(actor: Actor, draftId: string, body: unknown) {
    const draft = await db.aiWorkflowDraft.findUnique({
      where: { id: draftId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } }
    });
    if (!draft) throw new Error("AI workflow draft not found");
    const payload = jsonObject(body, "body") ?? {};
    const approval = await db.aiWorkflowApproval.create({
      data: {
        requestId: draft.requestId,
        draftId,
        approvalType: text(payload.approvalType, "approvalType", false) ?? "DRAFT_APPROVAL",
        status: "APPROVED",
        approvedByUserId: actor.id,
        approvedByName: actor.name,
        notes: text(payload.notes, "notes", false),
        approvedAt: new Date()
      }
    });
    await db.aiWorkflowDraft.update({
      where: { id: draftId },
      data: {
        status: "APPROVED",
        approvedVersionId: draft.versions[0]?.id
      }
    });
    await audit("AI_WORKFLOW_DRAFT_APPROVED", actor, draft.requestId, { draftId, approvalId: approval.id });
    return approval;
  },

  async createFeedback(actor: Actor, requestId: string, body: unknown) {
    await fullRequest(requestId);
    const payload = jsonObject(body, "body") ?? {};
    const feedback = await db.aiWorkflowFeedback.create({
      data: {
        requestId,
        draftId: text(payload.draftId, "draftId", false),
        userId: actor.id,
        userName: actor.name,
        feedbackType: text(payload.feedbackType, "feedbackType", false) ?? "QUALITY",
        rating: typeof payload.rating === "number" ? payload.rating : undefined,
        feedbackText: text(payload.feedbackText, "feedbackText", false),
        correctionJson: jsonObject(payload.correctionJson, "correctionJson", false)
      }
    });
    await audit("AI_WORKFLOW_FEEDBACK_CREATED", actor, requestId, { feedbackId: feedback.id, rating: feedback.rating });
    return feedback;
  },

  async createPublication(actor: Actor, requestId: string, body: unknown) {
    await fullRequest(requestId);
    const payload = jsonObject(body, "body") ?? {};
    const draftId = text(payload.draftId, "draftId", false);
    if (draftId) {
      const draft = await db.aiWorkflowDraft.findUnique({ where: { id: draftId } });
      if (!draft || draft.requestId !== requestId) throw new Error("AI workflow draft not found for this request");
      if (draft.status !== "APPROVED") throw new Error("Human approval is required before publication");
    }
    const publication = await db.aiWorkflowPublication.create({
      data: {
        requestId,
        draftId,
        targetType: text(payload.targetType, "targetType"),
        targetId: text(payload.targetId, "targetId", false),
        status: "PENDING_APPROVAL",
        publishPayloadJson: jsonObject(payload.publishPayloadJson ?? payload.publishPayload, "publishPayloadJson"),
        scheduledAt: optionalDate(payload.scheduledAt, "scheduledAt")
      }
    });
    await audit("AI_WORKFLOW_PUBLICATION_CREATED", actor, requestId, { publicationId: publication.id, targetType: publication.targetType });
    return publication;
  },

  async approvePublication(actor: Actor, publicationId: string, body: unknown) {
    const publication = await db.aiWorkflowPublication.findUnique({ where: { id: publicationId } });
    if (!publication) throw new Error("AI workflow publication not found");
    const payload = jsonObject(body, "body", false) ?? {};
    const approval = await db.aiWorkflowApproval.create({
      data: {
        requestId: publication.requestId,
        draftId: publication.draftId,
        publicationId,
        approvalType: text(payload.approvalType, "approvalType", false) ?? "PUBLICATION_APPROVAL",
        status: "APPROVED",
        approvedByUserId: actor.id,
        approvedByName: actor.name,
        notes: text(payload.notes, "notes", false),
        approvedAt: new Date()
      }
    });
    const updated = await db.aiWorkflowPublication.update({
      where: { id: publicationId },
      data: {
        approvalId: approval.id,
        status: "APPROVED"
      }
    });
    await audit("AI_WORKFLOW_PUBLICATION_APPROVED", actor, publication.requestId, { publicationId, approvalId: approval.id });
    return updated;
  },

  async markPublished(actor: Actor, publicationId: string) {
    const publication = await db.aiWorkflowPublication.findUnique({ where: { id: publicationId } });
    if (!publication) throw new Error("AI workflow publication not found");
    if (publication.status !== "APPROVED" || !publication.approvalId) {
      throw new Error("Human approval is required before publication");
    }
    const updated = await db.aiWorkflowPublication.update({
      where: { id: publicationId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date()
      }
    });
    await db.aiWorkflowRequest.update({ where: { id: publication.requestId }, data: { status: "PUBLISHED" } });
    await audit("AI_WORKFLOW_MARKED_PUBLISHED", actor, publication.requestId, { publicationId });
    return updated;
  }
};

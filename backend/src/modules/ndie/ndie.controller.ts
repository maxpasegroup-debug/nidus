import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { ndieService } from "./ndie.service.js";
import { auditNdie, ndieActorFromRequest, validateNdieUpload } from "./security/ndie-security.js";

export const ndieController = {
  health: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await ndieService.health());
    } catch (error) {
      next(error);
    }
  },

  createImport: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      validateNdieUpload(req.file);
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.createImport({
        file: req.file!,
        userId: req.user.id,
        examId: typeof req.body.examId === "string" ? req.body.examId : undefined,
        testId: typeof req.body.testId === "string" ? req.body.testId : undefined,
        batchId: typeof req.body.batchId === "string" ? req.body.batchId : undefined,
        subject: typeof req.body.subject === "string" ? req.body.subject : undefined,
        topic: typeof req.body.topic === "string" ? req.body.topic : undefined,
        sourceKind: typeof req.body.sourceKind === "string" ? req.body.sourceKind : undefined
      });
      await auditNdie({
        actor,
        action: "NDIE_IMPORT_CREATED",
        description: "NDIE import created",
        ipAddress: req.ip,
        metadata: { importJobId: result.importJob.id }
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  getImport: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.getImport(actor, importJobId);
      if (!result) {
        res.status(404).json({ message: "NDIE import not found" });
        return;
      }
      await auditNdie({ actor, action: "NDIE_IMPORT_VIEWED", description: "NDIE import viewed", ipAddress: req.ip, metadata: { importJobId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  analyzeLayout: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.analyzeLayout(actor, importJobId);
      await auditNdie({ actor, action: "NDIE_IMPORT_UPDATED", description: "NDIE layout analysis requested", ipAddress: req.ip, metadata: { importJobId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  detectVisuals: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.detectVisuals(actor, importJobId);
      await auditNdie({ actor, action: "NDIE_IMPORT_UPDATED", description: "NDIE visual detection requested", ipAddress: req.ip, metadata: { importJobId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  detectFormulas: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.detectFormulas(actor, importJobId);
      await auditNdie({ actor, action: "NDIE_IMPORT_UPDATED", description: "NDIE formula intelligence requested", ipAddress: req.ip, metadata: { importJobId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  detectQuestions: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.detectQuestions(actor, importJobId);
      await auditNdie({ actor, action: "NDIE_IMPORT_UPDATED", description: "NDIE question detection requested", ipAddress: req.ip, metadata: { importJobId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  mapAnswers: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.mapAnswers(actor, importJobId);
      await auditNdie({ actor, action: "NDIE_IMPORT_UPDATED", description: "NDIE answer mapping requested", ipAddress: req.ip, metadata: { importJobId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  validateAi: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.validateAi(actor, importJobId);
      await auditNdie({ actor, action: "NDIE_IMPORT_UPDATED", description: "NDIE AI validation requested", ipAddress: req.ip, metadata: { importJobId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  reviewWorkspace: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.getReviewWorkspace(actor, importJobId);
      if (!result) {
        res.status(404).json({ message: "NDIE import review workspace not found" });
        return;
      }
      await auditNdie({ actor, action: "NDIE_IMPORT_VIEWED", description: "NDIE review workspace viewed", ipAddress: req.ip, metadata: { importJobId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  reviewCandidate: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      const actor = ndieActorFromRequest(req);
      const candidateId = Array.isArray(req.params.candidateId) ? req.params.candidateId[0] : req.params.candidateId;
      const decision = typeof req.body.decision === "string" ? req.body.decision.toUpperCase() : "";
      if (!["APPROVED", "REJECTED", "NEEDS_EDIT", "SKIPPED"].includes(decision)) {
        res.status(400).json({ message: "Decision must be APPROVED, REJECTED, NEEDS_EDIT or SKIPPED" });
        return;
      }
      const result = await ndieService.reviewCandidate(actor, {
        candidateId,
        decision: decision as "APPROVED" | "REJECTED" | "NEEDS_EDIT" | "SKIPPED",
        notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        candidateJson: req.body.candidateJson,
        reviewedBy: req.user.id,
        reviewedByRole: req.user.role
      });
      await auditNdie({
        actor,
        action: decision === "APPROVED" ? "NDIE_REVIEW_APPROVED" : decision === "REJECTED" ? "NDIE_REVIEW_REJECTED" : "NDIE_REVIEW_NEEDS_EDIT",
        description: `NDIE review decision: ${decision}`,
        ipAddress: req.ip,
        metadata: { candidateId }
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  bulkReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      const actor = ndieActorFromRequest(req);
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const decision = typeof req.body.decision === "string" ? req.body.decision.toUpperCase() : "";
      const candidateIds = Array.isArray(req.body.candidateIds) ? req.body.candidateIds.map((id: unknown) => String(id)).filter(Boolean) : [];
      if (!["APPROVED", "REJECTED", "NEEDS_EDIT", "SKIPPED"].includes(decision)) {
        res.status(400).json({ message: "Decision must be APPROVED, REJECTED, NEEDS_EDIT or SKIPPED" });
        return;
      }
      if (!candidateIds.length) {
        res.status(400).json({ message: "At least one question candidate is required" });
        return;
      }
      const result = await ndieService.bulkReview(actor, {
        importJobId,
        candidateIds,
        decision: decision as "APPROVED" | "REJECTED" | "NEEDS_EDIT" | "SKIPPED",
        notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        reviewedBy: req.user.id,
        reviewedByRole: req.user.role
      });
      await auditNdie({ actor, action: "NDIE_REVIEW_BULK_UPDATED", description: `NDIE bulk review decision: ${decision}`, ipAddress: req.ip, metadata: { importJobId, count: candidateIds.length } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  saveReviewSession: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      const actor = ndieActorFromRequest(req);
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await ndieService.saveReviewSession(actor, {
        importJobId,
        selectedCandidateId: typeof req.body.selectedCandidateId === "string" ? req.body.selectedCandidateId : null,
        selectedPageNumber: Number.isFinite(Number(req.body.selectedPageNumber)) ? Number(req.body.selectedPageNumber) : null,
        filters: req.body.filters && typeof req.body.filters === "object" ? req.body.filters : {},
        scroll: req.body.scroll && typeof req.body.scroll === "object" ? req.body.scroll : {},
        shortcuts: req.body.shortcuts && typeof req.body.shortcuts === "object" ? req.body.shortcuts : {},
        savedBy: req.user.id,
        savedByRole: req.user.role
      });
      await auditNdie({ actor, action: "NDIE_REVIEW_SESSION_SAVED", description: "NDIE review session autosaved", ipAddress: req.ip, metadata: { importJobId } });
      res.json({ id: result.id, teacherSummary: result.teacherSummary });
    } catch (error) {
      next(error);
    }
  },

  publish: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      const actor = ndieActorFromRequest(req);
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await ndieService.publish({
        importJobId,
        requester: actor,
        title: typeof req.body.title === "string" ? req.body.title : undefined,
        description: typeof req.body.description === "string" ? req.body.description : undefined,
        batchId: typeof req.body.batchId === "string" ? req.body.batchId : undefined,
        subject: typeof req.body.subject === "string" ? req.body.subject : undefined,
        topic: typeof req.body.topic === "string" ? req.body.topic : undefined,
        duration: Number.isFinite(Number(req.body.duration)) ? Number(req.body.duration) : undefined,
        publishAt: typeof req.body.publishAt === "string" ? req.body.publishAt : undefined,
        allowAutoApproved: req.body.allowAutoApproved === true
      });
      await auditNdie({ actor, action: "NDIE_PUBLISH_REQUESTED", description: "NDIE publish requested", ipAddress: req.ip, metadata: { importJobId, testId: result.testId } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  replay: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      const actor = ndieActorFromRequest(req);
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const stages = Array.isArray(req.body.stages) ? req.body.stages.map((stage: unknown) => String(stage)) : undefined;
      const result = await ndieService.replay(actor, {
        importJobId,
        requestedBy: req.user.id,
        fromVersion: typeof req.body.fromVersion === "string" ? req.body.fromVersion : undefined,
        toVersion: typeof req.body.toVersion === "string" ? req.body.toVersion : undefined,
        fromCheckpoint: typeof req.body.fromCheckpoint === "string" ? req.body.fromCheckpoint : undefined,
        stages
      });
      await auditNdie({ actor, action: "NDIE_REPLAY_REQUESTED", description: "NDIE replay requested", ipAddress: req.ip, metadata: { importJobId, replayRunId: result.id } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  replayRuns: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      res.json(await ndieService.replayRuns(actor, importJobId));
    } catch (error) {
      next(error);
    }
  },

  cancelImport: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = ndieActorFromRequest(req);
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const reason = typeof req.body.reason === "string" ? req.body.reason : undefined;
      const result = await ndieService.cancelImport(actor, importJobId, reason);
      await auditNdie({
        actor,
        action: "NDIE_IMPORT_CANCELLED",
        description: "NDIE import queue job cancelled",
        ipAddress: req.ip,
        metadata: { importJobId, queueJobId: result.id }
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  qualityReport: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.qualityReport(actor, importJobId);
      await auditNdie({ actor, action: "NDIE_QUALITY_REPORT_REQUESTED", description: "NDIE quality report requested", ipAddress: req.ip, metadata: { importJobId, qualityScoreId: result.id } });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  analytics: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = ndieActorFromRequest(req);
      const result = await ndieService.analytics(actor);
      await auditNdie({ actor, action: "NDIE_ANALYTICS_VIEWED", description: "NDIE analytics viewed", ipAddress: req.ip });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};

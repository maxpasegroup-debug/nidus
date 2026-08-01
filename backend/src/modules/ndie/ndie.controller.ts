import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { ndieService } from "./ndie.service.js";

export const ndieController = {
  health: (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(ndieService.health());
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
      if (!req.file) {
        res.status(400).json({ message: "Upload a PDF, DOCX, image, TXT, or answer-key source file." });
        return;
      }
      const result = await ndieService.createImport({
        file: req.file,
        userId: req.user.id,
        examId: typeof req.body.examId === "string" ? req.body.examId : undefined,
        testId: typeof req.body.testId === "string" ? req.body.testId : undefined,
        batchId: typeof req.body.batchId === "string" ? req.body.batchId : undefined,
        subject: typeof req.body.subject === "string" ? req.body.subject : undefined,
        topic: typeof req.body.topic === "string" ? req.body.topic : undefined,
        sourceKind: typeof req.body.sourceKind === "string" ? req.body.sourceKind : undefined
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  getImport: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await ndieService.getImport(importJobId);
      if (!result) {
        res.status(404).json({ message: "NDIE import not found" });
        return;
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  analyzeLayout: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json(await ndieService.analyzeLayout(importJobId));
    } catch (error) {
      next(error);
    }
  },

  detectVisuals: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json(await ndieService.detectVisuals(importJobId));
    } catch (error) {
      next(error);
    }
  },

  detectQuestions: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json(await ndieService.detectQuestions(importJobId));
    } catch (error) {
      next(error);
    }
  },

  mapAnswers: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json(await ndieService.mapAnswers(importJobId));
    } catch (error) {
      next(error);
    }
  },

  validateAi: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json(await ndieService.validateAi(importJobId));
    } catch (error) {
      next(error);
    }
  },

  reviewWorkspace: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const importJobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await ndieService.getReviewWorkspace(importJobId);
      if (!result) {
        res.status(404).json({ message: "NDIE import review workspace not found" });
        return;
      }
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
      const candidateId = Array.isArray(req.params.candidateId) ? req.params.candidateId[0] : req.params.candidateId;
      const decision = typeof req.body.decision === "string" ? req.body.decision.toUpperCase() : "";
      if (!["APPROVED", "REJECTED", "NEEDS_EDIT"].includes(decision)) {
        res.status(400).json({ message: "Decision must be APPROVED, REJECTED or NEEDS_EDIT" });
        return;
      }
      res.json(await ndieService.reviewCandidate({
        candidateId,
        decision: decision as "APPROVED" | "REJECTED" | "NEEDS_EDIT",
        notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        candidateJson: req.body.candidateJson,
        reviewedBy: req.user.id,
        reviewedByRole: req.user.role
      }));
    } catch (error) {
      next(error);
    }
  }
};

import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { aiWorkflowService } from "./ai-workflow.service.js";

function requester(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Authentication required");
  return req.user;
}

function param(req: AuthenticatedRequest, key: string) {
  const value = req.params[key];
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) throw new Error(`${key} is required`);
  return normalized;
}

export const aiWorkflowController = {
  createRequest: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await aiWorkflowService.createRequest(requester(req), req.body));
    } catch (error) {
      next(error);
    }
  },

  getRequest: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await aiWorkflowService.getRequest(param(req, "id")));
    } catch (error) {
      next(error);
    }
  },

  addContext: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await aiWorkflowService.addContext(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },

  createDraft: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await aiWorkflowService.createDraft(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },

  createDraftVersion: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await aiWorkflowService.createDraftVersion(requester(req), param(req, "draftId"), req.body));
    } catch (error) {
      next(error);
    }
  },

  createReview: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await aiWorkflowService.createReview(requester(req), param(req, "draftId"), req.body));
    } catch (error) {
      next(error);
    }
  },

  approveDraft: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await aiWorkflowService.approveDraft(requester(req), param(req, "draftId"), req.body));
    } catch (error) {
      next(error);
    }
  },

  createFeedback: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await aiWorkflowService.createFeedback(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },

  createPublication: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await aiWorkflowService.createPublication(requester(req), param(req, "id"), req.body));
    } catch (error) {
      next(error);
    }
  },

  approvePublication: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await aiWorkflowService.approvePublication(requester(req), param(req, "publicationId"), req.body));
    } catch (error) {
      next(error);
    }
  },

  markPublished: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await aiWorkflowService.markPublished(requester(req), param(req, "publicationId")));
    } catch (error) {
      next(error);
    }
  }
};

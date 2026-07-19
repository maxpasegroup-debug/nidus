import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { aiDirectorService } from "./ai-director.service.js";

function question(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export const aiDirectorController = {
  async guardrails(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ guardrails: aiDirectorService.guardrails() });
    } catch (error) {
      next(error);
    }
  },

  async summary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("Not authenticated");
      res.json({ summary: await aiDirectorService.summary(req.user) });
    } catch (error) {
      next(error);
    }
  },

  async ask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("Not authenticated");
      res.json({ result: await aiDirectorService.ask(req.user, question(req.body?.question)) });
    } catch (error) {
      next(error);
    }
  },

  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error("Not authenticated");
      res.json({
        result: await aiDirectorService.approve(req.user, {
          actionId: question(req.body?.actionId),
          approvalText: question(req.body?.approvalText),
          note: question(req.body?.note) || undefined
        })
      });
    } catch (error) {
      next(error);
    }
  }
};

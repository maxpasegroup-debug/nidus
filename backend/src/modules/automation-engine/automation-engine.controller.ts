import type { NextFunction, Request, Response } from "express";
import { automationEngineService } from "./automation-engine.service.js";

export const automationEngineController = {
  async rules(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ rules: automationEngineService.rules() });
    } catch (error) {
      next(error);
    }
  },

  async summary(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ summary: await automationEngineService.summary() });
    } catch (error) {
      next(error);
    }
  }
};

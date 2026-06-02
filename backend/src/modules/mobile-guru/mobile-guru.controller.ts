import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { mobileGuruService } from "./mobile-guru.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

function user(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}

export const mobileGuruController = {
  async quests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await mobileGuruService.quests(user(req)));
    } catch (error) {
      next(error);
    }
  },

  async quest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await mobileGuruService.quest(user(req), param(req, "questId")));
    } catch (error) {
      next(error);
    }
  },

  async completeLesson(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await mobileGuruService.completeLesson(user(req), param(req, "lessonId")));
    } catch (error) {
      next(error);
    }
  },

  async submitReflections(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      res.status(201).json(await mobileGuruService.submitReflections(user(req), param(req, "questId"), req.body.answers));
    } catch (error) {
      next(error);
    }
  },

  async completeChallenge(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await mobileGuruService.completeChallenge(user(req), param(req, "challengeId"), req.body));
    } catch (error) {
      next(error);
    }
  },

  async uploadEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const challengeId = typeof req.body?.challengeId === "string" ? req.body.challengeId : "";
      if (!challengeId) throw new Error("challengeId is required");
      if (!req.file) throw new Error("Evidence file is required");
      res.status(201).json(await mobileGuruService.uploadEvidence(user(req), challengeId, req.file));
    } catch (error) {
      next(error);
    }
  },

  async progress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await mobileGuruService.progress(user(req)));
    } catch (error) {
      next(error);
    }
  },

  async certificates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await mobileGuruService.certificates(user(req)));
    } catch (error) {
      next(error);
    }
  },

  async growth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await mobileGuruService.growth(user(req)));
    } catch (error) {
      next(error);
    }
  },

  async completeDailyMission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await mobileGuruService.completeDailyMission(user(req), param(req, "missionId")));
    } catch (error) {
      next(error);
    }
  },

  async adminSummary(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ summary: await mobileGuruService.adminSummary() });
    } catch (error) {
      next(error);
    }
  },

  async adminQuests(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ quests: await mobileGuruService.adminQuests() });
    } catch (error) {
      next(error);
    }
  },

  async adminCreateQuest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json({ quest: await mobileGuruService.adminUpsertQuest(req.body) });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdateQuest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ quest: await mobileGuruService.adminUpsertQuest(req.body, param(req, "id")) });
    } catch (error) {
      next(error);
    }
  },

  async adminAddLesson(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json({ lesson: await mobileGuruService.adminAddLesson(param(req, "questId"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async adminAddReflection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json({ reflection: await mobileGuruService.adminAddReflection(param(req, "questId"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async adminAddChallenge(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json({ challenge: await mobileGuruService.adminAddChallenge(param(req, "questId"), req.body) });
    } catch (error) {
      next(error);
    }
  },

  async adminProgress(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json({ progress: await mobileGuruService.adminProgress() });
    } catch (error) {
      next(error);
    }
  }
};

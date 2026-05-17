import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { learningHubService } from "./learning-hub.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function requesterId(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user.id;
}

export const learningHubController = {
  async pyqCategories(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ categories: await learningHubService.pyqCategories() }); } catch (error) { next(error); }
  },
  async pyqQuestions(req: Request, res: Response, next: NextFunction) {
    try { res.json({ questions: await learningHubService.pyqQuestions({ examType: typeof req.query.examType === "string" ? req.query.examType : undefined, subject: typeof req.query.subject === "string" ? req.query.subject : undefined, year: typeof req.query.year === "string" ? Number(req.query.year) : undefined, search: typeof req.query.search === "string" ? req.query.search : undefined }) }); } catch (error) { next(error); }
  },
  async createPYQQuestion(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ question: await learningHubService.createPYQQuestion(req.body) }); } catch (error) { next(error); }
  },
  async currentAffairs(req: Request, res: Response, next: NextFunction) {
    try { res.json({ currentAffairs: await learningHubService.currentAffairs({ category: typeof req.query.category === "string" ? req.query.category : undefined }) }); } catch (error) { next(error); }
  },
  async createCurrentAffair(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ currentAffair: await learningHubService.createCurrentAffair(req.body) }); } catch (error) { next(error); }
  },
  async quizBattles(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ battles: await learningHubService.quizBattles() }); } catch (error) { next(error); }
  },
  async createQuizBattle(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ battle: await learningHubService.createQuizBattle(req.body) }); } catch (error) { next(error); }
  },
  async joinBattle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ participant: await learningHubService.joinBattle(requesterId(req), req.body.battleId) }); } catch (error) { next(error); }
  },
  async submitBattle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.json({ participant: await learningHubService.submitBattle(requesterId(req), req.body) }); } catch (error) { next(error); }
  },
  async leaderboard(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ leaderboard: await learningHubService.leaderboard() }); } catch (error) { next(error); }
  }
};

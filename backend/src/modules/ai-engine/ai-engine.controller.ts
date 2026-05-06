import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { aiEngineService } from "./ai-engine.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}
function requester(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}
function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

export const aiEngineController = {
  async startInterview(req: AuthenticatedRequest, res: Response, next: NextFunction) { try { assertValid(req); res.status(201).json(await aiEngineService.startInterview(requester(req), req.body)); } catch (error) { next(error); } },
  async nextQuestion(req: Request, res: Response, next: NextFunction) { try { assertValid(req); res.status(201).json({ question: await aiEngineService.nextQuestion(req.body) }); } catch (error) { next(error); } },
  async submitAnswer(req: Request, res: Response, next: NextFunction) { try { assertValid(req); res.json({ question: await aiEngineService.submitAnswer(req.body) }); } catch (error) { next(error); } },
  async result(req: Request, res: Response, next: NextFunction) { try { res.json({ result: await aiEngineService.result(param(req, "sessionId")) }); } catch (error) { next(error); } },
  async doubt(req: AuthenticatedRequest, res: Response, next: NextFunction) { try { assertValid(req); res.status(201).json({ doubt: await aiEngineService.solveDoubt(requester(req), req.body) }); } catch (error) { next(error); } },
  async doubtsHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) { try { res.json({ doubts: await aiEngineService.doubtsHistory(requester(req)) }); } catch (error) { next(error); } },
  async recommendations(req: AuthenticatedRequest, res: Response, next: NextFunction) { try { res.json({ recommendations: await aiEngineService.recommendations(requester(req)) }); } catch (error) { next(error); } },
  async officerPotential(req: AuthenticatedRequest, res: Response, next: NextFunction) { try { res.json({ officerPotential: await aiEngineService.officerPotential(requester(req), typeof req.query.userId === "string" ? req.query.userId : undefined) }); } catch (error) { next(error); } }
};

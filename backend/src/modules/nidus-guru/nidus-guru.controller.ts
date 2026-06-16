import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { nidusGuruService } from "./nidus-guru.service.js";

function actor(req: AuthenticatedRequest) {
  if (!req.user) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  return req.user;
}

export const nidusGuruController = {
  async academicHead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.json(await nidusGuruService.academicHead(actor(req)));
    } catch (error) {
      next(error);
    }
  }
};

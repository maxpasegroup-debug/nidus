import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { communicationService } from "./communication.service.js";

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

export const communicationController = {
  async notifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ notifications: await communicationService.notifications(requester(req)) }); } catch (error) { next(error); }
  },
  async markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ notification: await communicationService.markNotificationRead(param(req, "id"), requester(req)) }); } catch (error) { next(error); }
  },
  async messages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ threads: await communicationService.threads(requester(req)) }); } catch (error) { next(error); }
  },
  async createThread(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ thread: await communicationService.createThread(req.body, requester(req).id) }); } catch (error) { next(error); }
  },
  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ message: await communicationService.sendMessage(req.body, requester(req).id) }); } catch (error) { next(error); }
  },
  async thread(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ thread: await communicationService.thread(param(req, "id"), requester(req)) }); } catch (error) { next(error); }
  },
  async announcements(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ announcements: await communicationService.announcements() }); } catch (error) { next(error); }
  },
  async createAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ announcement: await communicationService.createAnnouncement(req.body, requester(req).id) }); } catch (error) { next(error); }
  },
  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ email: await communicationService.sendEmail(req.body) }); } catch (error) { next(error); }
  },
  async emailLogs(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ emails: await communicationService.emailLogs() }); } catch (error) { next(error); }
  },
  async sendPush(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ push: await communicationService.sendPush(req.body) }); } catch (error) { next(error); }
  }
};

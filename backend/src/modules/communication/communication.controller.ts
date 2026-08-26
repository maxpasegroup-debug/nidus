import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { communicationService } from "./communication.service.js";
import { whatsappService } from "./whatsapp.service.js";
import { enqueueWhatsApp } from "../../queues/whatsapp.queue.js";

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
    try { assertValid(req); res.status(201).json({ message: await communicationService.sendMessage(req.body, requester(req)) }); } catch (error) { next(error); }
  },
  async thread(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ thread: await communicationService.thread(param(req, "id"), requester(req)) }); } catch (error) { next(error); }
  },
  async announcements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ announcements: await communicationService.announcements(requester(req)) }); } catch (error) { next(error); }
  },
  async createAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ announcement: await communicationService.createAnnouncement(req.body, requester(req)) }); } catch (error) { next(error); }
  },
  async sendEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const email = await communicationService.sendEmail(req.body, requester(req));
      res.status(["SENT", "QUEUED"].includes(email.status) ? 201 : 503).json({ email });
    } catch (error) { next(error); }
  },
  async emailLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ emails: await communicationService.emailLogs(requester(req)) }); } catch (error) { next(error); }
  },
  async sendPush(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const push = await communicationService.sendPush(req.body, requester(req));
      res.status(push.status === "QUEUED" ? 201 : 503).json({ push });
    } catch (error) { next(error); }
  },
  async whatsappHealth(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ whatsapp: await whatsappService.health() }); } catch (error) { next(error); }
  },
  async verifyWhatsApp(req: Request, res: Response, next: NextFunction) {
    try {
      const challenge = whatsappService.verifyWebhook({
        mode: typeof req.query["hub.mode"] === "string" ? req.query["hub.mode"] : undefined,
        token: typeof req.query["hub.verify_token"] === "string" ? req.query["hub.verify_token"] : undefined,
        challenge: typeof req.query["hub.challenge"] === "string" ? req.query["hub.challenge"] : undefined
      });
      res.status(200).send(challenge);
    } catch (error) { next(error); }
  },
  async inboundWhatsApp(req: Request, res: Response, next: NextFunction) {
    try { res.json(await whatsappService.handleInbound(req.body)); } catch (error) { next(error); }
  },
  async sendWhatsApp(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const job = await enqueueWhatsApp({ type: "SEND_TEXT", to: req.body.to, body: req.body.body, context: req.body.context });
      if (!job) return res.status(503).json({ error: "WhatsApp delivery is unavailable" });
      res.status(202).json({ job });
    } catch (error) { next(error); }
  },
  async directorDailyWhatsApp(_req: Request, res: Response, next: NextFunction) {
    try {
      const job = await enqueueWhatsApp({ type: "DIRECTOR_DAILY_REPORT" });
      if (!job) return res.status(503).json({ error: "WhatsApp delivery is unavailable" });
      res.status(202).json({ job });
    } catch (error) { next(error); }
  }
};

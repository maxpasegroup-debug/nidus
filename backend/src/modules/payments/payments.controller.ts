import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { paymentsService } from "./payments.service.js";

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

export const paymentsController = {
  async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json(await paymentsService.createOrder(requester(req), req.body)); } catch (error) { next(error); }
  },
  async verify(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.json(await paymentsService.verify(req.body)); } catch (error) { next(error); }
  },
  async history(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ payments: await paymentsService.history(requester(req)) }); } catch (error) { next(error); }
  },
  async subscriptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ subscriptions: await paymentsService.subscriptions(requester(req)) }); } catch (error) { next(error); }
  },
  async createSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ subscription: await paymentsService.createSubscription(requester(req), req.body) }); } catch (error) { next(error); }
  },
  async fees(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ fees: await paymentsService.fees(requester(req)) }); } catch (error) { next(error); }
  },
  async createInstallment(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ fee: await paymentsService.createInstallment(req.body) }); } catch (error) { next(error); }
  },
  async payInstallment(req: Request, res: Response, next: NextFunction) {
    try { res.json({ fee: await paymentsService.payInstallment(param(req, "id")) }); } catch (error) { next(error); }
  },
  async invoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ invoices: await paymentsService.invoices(requester(req)) }); } catch (error) { next(error); }
  },
  async generateInvoice(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ invoice: await paymentsService.generateInvoice(req.body) }); } catch (error) { next(error); }
  }
};

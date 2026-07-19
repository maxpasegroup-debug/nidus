import type { NextFunction, Request, Response } from "express";
import { eventEngineService } from "./event-engine.service.js";
import { isEventCategory, type EventCategory, type EventSeverity } from "./event-taxonomy.js";

function category(value: unknown): EventCategory | undefined {
  if (typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  return isEventCategory(upper) ? upper : undefined;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function limit(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const eventEngineController = {
  async definitions(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ definitions: eventEngineService.definitions() });
    } catch (error) {
      next(error);
    }
  },

  async events(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventEngineService.listEvents({
        category: category(req.query.category),
        eventName: text(req.query.eventName),
        severity: text(req.query.severity) as EventSeverity | undefined,
        search: text(req.query.search),
        limit: limit(req.query.limit)
      });
      res.json({ events });
    } catch (error) {
      next(error);
    }
  },

  async summary(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ summary: await eventEngineService.summary() });
    } catch (error) {
      next(error);
    }
  }
};

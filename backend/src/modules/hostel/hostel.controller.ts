import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { hostelService } from "./hostel.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new Error(errors.array().map((error) => error.msg).join(", "));
}

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

function requester(req: AuthenticatedRequest) {
  if (!req.user) throw new Error("Unauthorized");
  return req.user;
}

export const hostelController = {
  async hostels(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ hostels: await hostelService.hostels() }); } catch (error) { next(error); }
  },
  async createHostel(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ hostel: await hostelService.createHostel(req.body) }); } catch (error) { next(error); }
  },
  async rooms(req: Request, res: Response, next: NextFunction) {
    try { res.json({ rooms: await hostelService.rooms(typeof req.query.hostelId === "string" ? req.query.hostelId : undefined) }); } catch (error) { next(error); }
  },
  async createRoom(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ room: await hostelService.createRoom(req.body) }); } catch (error) { next(error); }
  },
  async allocate(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ allocation: await hostelService.allocate(req.body) }); } catch (error) { next(error); }
  },
  async studentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ student: await hostelService.studentProfile(param(req, "id"), requester(req)) }); } catch (error) { next(error); }
  },
  async createInOut(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ entry: await hostelService.createInOut(req.body, requester(req)) }); } catch (error) { next(error); }
  },
  async inOutHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ entries: await hostelService.inOutHistory(requester(req), typeof req.query.studentId === "string" ? req.query.studentId : undefined) }); } catch (error) { next(error); }
  },
  async createLeave(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ leave: await hostelService.createLeave(req.body, requester(req)) }); } catch (error) { next(error); }
  },
  async leaves(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ leaves: await hostelService.leaves(requester(req)) }); } catch (error) { next(error); }
  },
  async updateLeave(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.json({ leave: await hostelService.updateLeave(param(req, "id"), req.body, requester(req)) }); } catch (error) { next(error); }
  },
  async messMenu(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ menu: await hostelService.messMenu() }); } catch (error) { next(error); }
  },
  async upsertMessMenu(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ menu: await hostelService.upsertMessMenu(req.body) }); } catch (error) { next(error); }
  },
  async createDiscipline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ record: await hostelService.createDiscipline(req.body, requester(req).id) }); } catch (error) { next(error); }
  },
  async disciplineByStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ records: await hostelService.disciplineByStudent(param(req, "id"), requester(req)) }); } catch (error) { next(error); }
  },
  async createParade(req: Request, res: Response, next: NextFunction) {
    try { assertValid(req); res.status(201).json({ performance: await hostelService.createParade(req.body) }); } catch (error) { next(error); }
  },
  async paradeByStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { res.json({ performances: await hostelService.paradeByStudent(param(req, "id"), requester(req)) }); } catch (error) { next(error); }
  }
};

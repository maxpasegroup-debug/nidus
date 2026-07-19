import { Router } from "express";
import { Role } from "../../generated/prisma/client.js";
import { allowRoles, protect } from "../../middlewares/session.middleware.js";
import { eventEngineController } from "./event-engine.controller.js";

export const eventEngineRouter = Router();

eventEngineRouter.use(protect);
eventEngineRouter.use(allowRoles(Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.ADMINISTRATIVE_OFFICER));

eventEngineRouter.get("/definitions", eventEngineController.definitions);
eventEngineRouter.get("/summary", eventEngineController.summary);
eventEngineRouter.get("/", eventEngineController.events);

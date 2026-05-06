import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { ZodError, ZodType } from "zod";

export function validateExpressRequest(req: Request, _res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new Error(errors.array().map((error) => error.msg).join(", ")));
    return;
  }

  next();
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      const zodError = error as ZodError;
      next(new Error(zodError.issues?.map((issue) => issue.message).join(", ") || "Invalid request body"));
    }
  };
}

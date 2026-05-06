import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { coursesService } from "./courses.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new Error(errors.array().map((error) => error.msg).join(", "));
  }
}

function getParam(req: Request, key: string) {
  const value = req.params[key];

  if (typeof value !== "string") {
    throw new Error(`Invalid ${key}`);
  }

  return value;
}

export const coursesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const courses = await coursesService.listCourses({
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        category: typeof req.query.category === "string" ? req.query.category : undefined,
        examType: typeof req.query.examType === "string" ? req.query.examType : undefined
      });
      res.json({ courses });
    } catch (error) {
      next(error);
    }
  },

  async details(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await coursesService.getCourseBySlug(getParam(req, "slug"));
      res.json({ course });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const course = await coursesService.createCourse(req.body);
      res.status(201).json({ course });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const course = await coursesService.updateCourse(getParam(req, "id"), req.body);
      res.json({ course });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await coursesService.deleteCourse(getParam(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async enroll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);

      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const enrollment = await coursesService.enroll(req.user.id, req.body.courseId);
      res.status(201).json({ enrollment });
    } catch (error) {
      next(error);
    }
  },

  async myCourses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const enrollments = await coursesService.myCourses(req.user.id);
      res.json({ enrollments });
    } catch (error) {
      next(error);
    }
  }
};

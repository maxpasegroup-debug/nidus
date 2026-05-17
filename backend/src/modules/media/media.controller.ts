import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";
import { mediaService } from "./media.service.js";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new Error(errors.array().map((error) => error.msg).join(", "));
  }
}

function getUserId(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }

  return req.user.id;
}

function getParam(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

export const mediaController = {
  async listFolders(req: Request, res: Response, next: NextFunction) {
    try {
      const folders = await mediaService.listFolders(typeof req.query.parentId === "string" ? req.query.parentId : undefined);
      res.json({ folders });
    } catch (error) {
      next(error);
    }
  },

  async createFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const createdBy = getUserId(req, res);
      if (!createdBy) return;

      const folder = await mediaService.createFolder({
        name: req.body.name,
        parentId: req.body.parentId,
        createdBy
      });
      res.status(201).json({ folder });
    } catch (error) {
      next(error);
    }
  },

  async uploadFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const uploadedBy = getUserId(req, res);
      if (!uploadedBy) return;
      if (!req.file) throw new Error("File is required");

      const folderId = typeof req.body.folderId === "string" && req.body.folderId.length > 0 ? req.body.folderId : undefined;
      const file = await mediaService.uploadFile(req.file, folderId, uploadedBy);
      res.status(201).json({ file });
    } catch (error) {
      next(error);
    }
  },

  async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const files = await mediaService.listFiles({
        folderId: typeof req.query.folderId === "string" ? req.query.folderId : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        fileType: typeof req.query.fileType === "string" ? req.query.fileType : undefined
      });
      const analytics = await mediaService.analytics();
      res.json({ files, analytics });
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mediaService.deleteFile(getParam(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};

export const documentsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const documents = await mediaService.listDocuments(typeof req.query.category === "string" ? req.query.category : undefined);
      res.json({ documents });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      assertValid(req);
      const uploadedBy = getUserId(req, res);
      if (!uploadedBy) return;

      const document = await mediaService.createDocument({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        fileUrl: req.body.fileUrl,
        uploadedBy,
        file: req.file
      });

      res.status(201).json({ document });
    } catch (error) {
      next(error);
    }
  }
};

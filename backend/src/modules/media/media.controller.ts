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

function getRequester(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }
  return { id: req.user.id, instituteId: req.user.instituteId };
}

function getParam(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== "string") throw new Error(`Invalid ${key}`);
  return value;
}

export const mediaController = {
  async listFolders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requester = getRequester(req, res);
      if (!requester) return;
      const folders = await mediaService.listFolders(typeof req.query.parentId === "string" ? req.query.parentId : undefined, requester);
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
      const requester = getRequester(req, res);
      if (!requester) return;

      const folder = await mediaService.createFolder({
        name: req.body.name,
        parentId: req.body.parentId,
        createdBy
      }, requester);
      res.status(201).json({ folder });
    } catch (error) {
      next(error);
    }
  },

  async uploadFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const uploadedBy = getUserId(req, res);
      if (!uploadedBy) return;
      const requester = getRequester(req, res);
      if (!requester) return;
      if (!req.file) throw new Error("File is required");

      const folderId = typeof req.body.folderId === "string" && req.body.folderId.length > 0 ? req.body.folderId : undefined;
      const storagePath = typeof req.body.storagePath === "string" && req.body.storagePath.length > 0 ? req.body.storagePath : undefined;
      const file = await mediaService.uploadFile(req.file, folderId, uploadedBy, storagePath, requester);
      res.status(201).json({ file });
    } catch (error) {
      next(error);
    }
  },

  async listFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requester = getRequester(req, res);
      if (!requester) return;
      const files = await mediaService.listFiles({
        folderId: typeof req.query.folderId === "string" ? req.query.folderId : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        fileType: typeof req.query.fileType === "string" ? req.query.fileType : undefined
      }, requester);
      const analytics = await mediaService.analytics(requester);
      res.json({ files, analytics });
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requester = getRequester(req, res);
      if (!requester) return;
      const result = await mediaService.deleteFile(getParam(req, "id"), requester);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};

export const documentsController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requester = getRequester(req, res);
      if (!requester) return;
      const documents = await mediaService.listDocuments(typeof req.query.category === "string" ? req.query.category : undefined, requester);
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

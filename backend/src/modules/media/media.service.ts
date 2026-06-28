import { deleteCloudinaryAsset, signedMediaUrl, uploadBufferToCloudinary } from "../../config/cloudinary.js";
import { prisma } from "../../config/prisma.js";

type FolderInput = {
  name: string;
  parentId?: string;
  createdBy: string;
};

type FileFilters = {
  folderId?: string;
  search?: string;
  fileType?: string;
};

type DocumentInput = {
  title: string;
  description?: string;
  category: string;
  fileUrl?: string;
  uploadedBy: string;
  file?: Express.Multer.File;
};

function cloudinaryFolder(storagePath?: string) {
  if (!storagePath) return "nidus/media";
  const safeSegments = storagePath
    .split("/")
    .map((segment) => segment.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .slice(0, 8);
  return safeSegments.length ? `nidus/academy/${safeSegments.join("/")}` : "nidus/media";
}

export const mediaService = {
  async listFolders(parentId?: string) {
    return prisma.mediaFolder.findMany({
      where: parentId ? { parentId } : { parentId: null },
      include: {
        _count: {
          select: { children: true, files: true }
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });
  },

  async createFolder(input: FolderInput) {
    if (input.parentId) {
      const parent = await prisma.mediaFolder.findUnique({ where: { id: input.parentId } });
      if (!parent) throw new Error("Parent folder not found");
    }

    return prisma.mediaFolder.create({
      data: {
        name: input.name,
        parentId: input.parentId,
        createdBy: input.createdBy
      }
    });
  },

  async uploadFile(file: Express.Multer.File, folderId: string | undefined, uploadedBy: string, storagePath?: string) {
    if (folderId) {
      const folder = await prisma.mediaFolder.findUnique({ where: { id: folderId } });
      if (!folder) throw new Error("Folder not found");
    }

    const result = await uploadBufferToCloudinary(file, cloudinaryFolder(storagePath));

    const mediaFile = await prisma.mediaFile.create({
      data: {
        fileName: file.originalname.replace(/\s+/g, "-"),
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        cloudinaryUrl: result.secureUrl,
        publicId: result.publicId,
        folderId,
        uploadedBy
      }
    });
    return {
      ...mediaFile,
      signedUrl: signedMediaUrl(mediaFile.publicId, mediaFile.fileType)
    };
  },

  async listFiles(filters: FileFilters) {
    const files = await prisma.mediaFile.findMany({
      where: {
        folderId: filters.folderId,
        fileType: filters.fileType,
        OR: filters.search
          ? [
              { originalName: { contains: filters.search, mode: "insensitive" } },
              { fileName: { contains: filters.search, mode: "insensitive" } }
            ]
          : undefined
      },
      orderBy: { createdAt: "desc" }
    });
    return files.map((file) => {
      try {
        return { ...file, signedUrl: signedMediaUrl(file.publicId, file.fileType) };
      } catch (_error) {
        return { ...file, signedUrl: file.cloudinaryUrl };
      }
    });
  },

  async deleteFile(id: string) {
    const file = await prisma.mediaFile.findUnique({ where: { id } });
    if (!file) throw new Error("Media file not found");

    await deleteCloudinaryAsset(file.publicId, file.fileType);
    await prisma.mediaFile.delete({ where: { id } });

    return { message: "File deleted" };
  },

  async analytics() {
    const [totalUploads, storage, distribution] = await Promise.all([
      prisma.mediaFile.count(),
      prisma.mediaFile.aggregate({ _sum: { fileSize: true } }),
      prisma.mediaFile.groupBy({
        by: ["fileType"],
        _count: { fileType: true },
        _sum: { fileSize: true }
      })
    ]);

    return {
      totalUploads,
      storageUsage: storage._sum.fileSize ?? 0,
      fileTypeDistribution: distribution.map((item) => ({
        fileType: item.fileType,
        count: item._count.fileType,
        storageUsage: item._sum.fileSize ?? 0
      }))
    };
  },

  async listDocuments(category?: string) {
    return prisma.document.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" }
    });
  },

  async createDocument(input: DocumentInput) {
    let fileUrl = input.fileUrl;

    if (input.file) {
      const result = await uploadBufferToCloudinary(input.file, "nidus/documents");
      fileUrl = result.secureUrl;
    }

    if (!fileUrl) throw new Error("Document file is required");

    return prisma.document.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        fileUrl,
        uploadedBy: input.uploadedBy
      }
    });
  }
};

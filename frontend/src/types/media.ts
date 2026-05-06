export type MediaFolder = {
  id: string;
  name: string;
  parentId?: string | null;
  createdBy: string;
  createdAt: string;
  _count?: {
    children: number;
    files: number;
  };
};

export type MediaFile = {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  publicId: string;
  folderId?: string | null;
  uploadedBy: string;
  createdAt: string;
};

export type StorageAnalyticsData = {
  totalUploads: number;
  storageUsage: number;
  fileTypeDistribution: Array<{
    fileType: string;
    count: number;
    storageUsage: number;
  }>;
};

export type DocumentItem = {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  category: string;
  uploadedBy: string;
  createdAt: string;
};

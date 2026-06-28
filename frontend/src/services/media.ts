import { apiClient } from "@/services/api";
import type { DocumentItem, MediaFile, MediaFolder, StorageAnalyticsData } from "@/types/media";

export async function getMediaFolders(parentId?: string) {
  return (await apiClient.get<{ folders: MediaFolder[] }>("/media/folders", { params: { parentId } })).data.folders;
}

export async function createMediaFolder(payload: { name: string; parentId?: string }) {
  return (await apiClient.post<{ folder: MediaFolder }>("/media/folders", payload)).data.folder;
}

export async function getMediaFiles(params?: { folderId?: string; search?: string; fileType?: string }) {
  return (await apiClient.get<{ files: MediaFile[]; analytics: StorageAnalyticsData }>("/media/files", { params })).data;
}

export async function uploadMediaFile(payload: { file: File; folderId?: string; storagePath?: string }) {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.folderId) formData.append("folderId", payload.folderId);
  if (payload.storagePath) formData.append("storagePath", payload.storagePath);

  return (
    await apiClient.post<{ file: MediaFile }>("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  ).data.file;
}

export async function deleteMediaFile(id: string) {
  return (await apiClient.delete<{ message: string }>(`/media/files/${id}`)).data;
}

export async function getDocuments(category?: string) {
  return (await apiClient.get<{ documents: DocumentItem[] }>("/documents", { params: { category } })).data.documents;
}

export async function createDocument(payload: { title: string; description?: string; category: string; file?: File; fileUrl?: string }) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("category", payload.category);
  if (payload.description) formData.append("description", payload.description);
  if (payload.fileUrl) formData.append("fileUrl", payload.fileUrl);
  if (payload.file) formData.append("file", payload.file);

  return (
    await apiClient.post<{ document: DocumentItem }>("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
  ).data.document;
}

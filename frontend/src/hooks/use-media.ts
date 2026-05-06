"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createDocument, createMediaFolder, deleteMediaFile, getDocuments, getMediaFiles, getMediaFolders, uploadMediaFile } from "@/services/media";

export function useMediaFolders(parentId?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const queryKey = ["media", "folders", parentId];

  return {
    ...useQuery({ queryKey, queryFn: () => getMediaFolders(parentId) }),
    create: useMutation({
      mutationFn: createMediaFolder,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["media", "folders"] });
        showToast("Folder created", "success");
      },
      onError: (error) => showToast(getApiErrorMessage(error), "error")
    })
  };
}

export function useMediaFiles(filters?: { folderId?: string; search?: string; fileType?: string }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return {
    ...useQuery({ queryKey: ["media", "files", filters], queryFn: () => getMediaFiles(filters) }),
    upload: useMutation({
      mutationFn: uploadMediaFile,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["media", "files"] });
        showToast("File uploaded", "success");
      },
      onError: (error) => showToast(getApiErrorMessage(error), "error")
    }),
    remove: useMutation({
      mutationFn: deleteMediaFile,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["media", "files"] });
        showToast("File deleted", "success");
      },
      onError: (error) => showToast(getApiErrorMessage(error), "error")
    })
  };
}

export function useDocuments(category?: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return {
    ...useQuery({ queryKey: ["documents", category], queryFn: () => getDocuments(category) }),
    create: useMutation({
      mutationFn: createDocument,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["documents"] });
        showToast("Document published", "success");
      },
      onError: (error) => showToast(getApiErrorMessage(error), "error")
    })
  };
}

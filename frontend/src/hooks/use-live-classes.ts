"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import {
  getLectureProgress,
  getLiveClasses,
  getRecordedLecture,
  getRecordedLectures,
  updateLectureProgress
} from "@/services/live-classes";

export function useLiveClasses() {
  return useQuery({ queryKey: ["live-classes"], queryFn: getLiveClasses });
}

export function useRecordedLectures() {
  return useQuery({ queryKey: ["recorded-lectures"], queryFn: getRecordedLectures });
}

export function useRecordedLecture(id: string) {
  return useQuery({ queryKey: ["recorded-lectures", id], queryFn: () => getRecordedLecture(id), enabled: Boolean(id) });
}

export function useLectureProgress(lectureId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const progress = useQuery({
    queryKey: ["lecture-progress", lectureId],
    queryFn: () => getLectureProgress(lectureId),
    enabled: Boolean(lectureId)
  });
  const update = useMutation({
    mutationFn: updateLectureProgress,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lecture-progress", lectureId] });
      showToast("Progress updated", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
  return { ...progress, update };
}

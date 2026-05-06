"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/services/api";
import {
  enrollCourse,
  getCourseDetails,
  getCourses,
  getMyCourses,
  type CourseFilters
} from "@/services/courses";
import { useToast } from "@/components/providers/toast-provider";

export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: () => getCourses(filters)
  });
}

export function useCourseDetails(slug: string) {
  return useQuery({
    queryKey: ["courses", slug],
    queryFn: () => getCourseDetails(slug),
    enabled: Boolean(slug)
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: enrollCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      showToast("Enrollment successful", "success");
    },
    onError: (error) => {
      showToast(getApiErrorMessage(error), "error");
    }
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: ["my-courses"],
    queryFn: getMyCourses
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import {
  getResult,
  getTestDetails,
  getTests,
  startTest,
  submitTest,
  type SubmitTestPayload,
  type TestFilters
} from "@/services/tests";

export function useTests(filters: TestFilters = {}) {
  return useQuery({
    queryKey: ["tests", filters],
    queryFn: () => getTests(filters)
  });
}

export function useTestDetails(id: string) {
  return useQuery({
    queryKey: ["tests", id],
    queryFn: () => getTestDetails(id),
    enabled: Boolean(id)
  });
}

export function useStartTest() {
  const router = useRouter();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: startTest,
    onSuccess: (attempt) => {
      localStorage.setItem("nidus_active_attempt", JSON.stringify(attempt));
      localStorage.removeItem(`nidus_attempt_${attempt.id}`);
      showToast("Test started", "success");
      router.push(`/test-attempt/${attempt.id}`);
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useSubmitTest() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: SubmitTestPayload) => submitTest(payload),
    onSuccess: async (attempt) => {
      await queryClient.invalidateQueries({ queryKey: ["results", attempt.id] });
      showToast("Test submitted successfully", "success");
      router.push(`/results/${attempt.id}`);
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useResults(attemptId: string) {
  return useQuery({
    queryKey: ["results", attemptId],
    queryFn: () => getResult(attemptId),
    enabled: Boolean(attemptId)
  });
}

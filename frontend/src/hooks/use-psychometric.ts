"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import {
  getPsychometricAdminOverview,
  getPsychometricReportHistory,
  getOLQReport,
  getPsychometricResults,
  getPsychometricTest,
  getPsychometricTests,
  startPsychometricTest,
  submitPsychometric
} from "@/services/psychometric";

export function usePsychometricTests() {
  return useQuery({ queryKey: ["psychometric", "tests"], queryFn: getPsychometricTests });
}

export function usePsychometricAttempt(id: string) {
  return useQuery({
    queryKey: ["psychometric", "test", id],
    queryFn: () => getPsychometricTest(id),
    enabled: Boolean(id)
  });
}

export function useStartPsychometric() {
  const router = useRouter();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: startPsychometricTest,
    onSuccess: (attempt) => {
      localStorage.setItem("nidus_psychometric_attempt", JSON.stringify(attempt));
      showToast("Assessment started", "success");
      router.push(`/psychometric/attempt/${attempt.id}`);
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useSubmitPsychometric() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: submitPsychometric,
    onSuccess: async (attempt) => {
      await queryClient.invalidateQueries({ queryKey: ["psychometric", "results", attempt.id] });
      showToast("Assessment submitted", "success");
      router.push(`/psychometric/results/${attempt.id}`);
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function usePsychometricResults(attemptId: string) {
  return useQuery({
    queryKey: ["psychometric", "results", attemptId],
    queryFn: () => getPsychometricResults(attemptId),
    enabled: Boolean(attemptId)
  });
}

export function usePsychometricReportHistory() {
  return useQuery({ queryKey: ["psychometric", "reports"], queryFn: getPsychometricReportHistory });
}

export function usePsychometricAdminOverview() {
  return useQuery({ queryKey: ["psychometric", "admin-overview"], queryFn: getPsychometricAdminOverview });
}

export function useOLQReport() {
  return useQuery({ queryKey: ["psychometric", "olq"], queryFn: getOLQReport });
}

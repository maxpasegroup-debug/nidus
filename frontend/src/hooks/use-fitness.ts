"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { checkEligibility, createFitnessLog, createPTSchedule, getEligibility, getFitnessLogs, getFitnessProfile, getPTSchedules, markPTAttendance, upsertFitnessProfile } from "@/services/fitness";

function useToastMutation<TPayload, TResult>(mutationFn: (payload: TPayload) => Promise<TResult>, keys: unknown[][], message: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({ mutationFn, onSuccess: async () => { await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))); showToast(message, "success"); }, onError: (error) => showToast(getApiErrorMessage(error), "error") });
}

export function useFitnessProfile() {
  return { ...useQuery({ queryKey: ["fitness", "profile"], queryFn: getFitnessProfile }), save: useToastMutation(upsertFitnessProfile, [["fitness", "profile"]], "Fitness profile saved") };
}
export function usePTSchedules() {
  return { ...useQuery({ queryKey: ["fitness", "pt-schedules"], queryFn: getPTSchedules }), create: useToastMutation(createPTSchedule, [["fitness", "pt-schedules"]], "PT session created"), mark: useToastMutation(markPTAttendance, [["fitness", "pt-schedules"]], "Attendance marked") };
}
export function useEligibility() {
  return { ...useQuery({ queryKey: ["fitness", "eligibility"], queryFn: getEligibility }), check: useToastMutation(checkEligibility, [["fitness", "eligibility"]], "Eligibility checked") };
}
export function useFitnessLogs() {
  return { ...useQuery({ queryKey: ["fitness", "logs"], queryFn: getFitnessLogs }), create: useToastMutation(createFitnessLog, [["fitness", "logs"]], "Fitness log saved") };
}

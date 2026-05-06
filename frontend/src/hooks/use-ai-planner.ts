"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import {
  createRevision,
  generateStudyPlan,
  getPerformanceAnalytics,
  getRecommendations,
  getRevisionSchedule,
  getStudyPlan,
  type GeneratePlanPayload
} from "@/services/ai-planner";

export function useStudyPlan() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const plan = useQuery({ queryKey: ["ai-planner", "plan"], queryFn: getStudyPlan });
  const generate = useMutation({
    mutationFn: (payload: GeneratePlanPayload) => generateStudyPlan(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ai-planner"] });
      await queryClient.invalidateQueries({ queryKey: ["revision-schedule"] });
      showToast("AI study plan generated", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
  return { ...plan, generate };
}

export function usePerformanceAnalytics() {
  const analytics = useQuery({ queryKey: ["ai-planner", "performance"], queryFn: getPerformanceAnalytics });
  const recommendations = useQuery({ queryKey: ["ai-planner", "recommendations"], queryFn: getRecommendations });
  return { analytics, recommendations };
}

export function useRevisionSchedule() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const revisions = useQuery({ queryKey: ["revision-schedule"], queryFn: getRevisionSchedule });
  const create = useMutation({
    mutationFn: createRevision,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["revision-schedule"] });
      showToast("Revision scheduled", "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
  return { ...revisions, create };
}

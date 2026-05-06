"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { getAIRecommendations, getDoubtHistory, getInterviewResult, getOfficerPotential, nextInterviewQuestion, solveDoubt, startInterview, submitInterviewAnswer } from "@/services/ai-engine";

function useToastMutation<TPayload, TResult>(mutationFn: (payload: TPayload) => Promise<TResult>, keys: unknown[][], message: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({ mutationFn, onSuccess: async () => { await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))); showToast(message, "success"); }, onError: (error) => showToast(getApiErrorMessage(error), "error") });
}

export function useAIInterview(sessionId?: string) {
  return {
    result: useQuery({ queryKey: ["ai", "interview", sessionId], queryFn: () => sessionId ? getInterviewResult(sessionId) : Promise.resolve(null), enabled: Boolean(sessionId) }),
    start: useToastMutation(startInterview, [["ai", "interview"]], "Interview started"),
    nextQuestion: useToastMutation(nextInterviewQuestion, [["ai", "interview", sessionId]], "Next question generated"),
    submitAnswer: useToastMutation(submitInterviewAnswer, [["ai", "interview", sessionId]], "Answer analyzed")
  };
}

export function useDoubtSolver() {
  return { ...useQuery({ queryKey: ["ai", "doubts"], queryFn: getDoubtHistory }), solve: useToastMutation(solveDoubt, [["ai", "doubts"]], "Doubt solved") };
}

export function useAIRecommendations() {
  return useQuery({ queryKey: ["ai", "recommendations"], queryFn: getAIRecommendations });
}

export function useOfficerPotential() {
  return useQuery({ queryKey: ["ai", "officer-potential"], queryFn: getOfficerPotential });
}

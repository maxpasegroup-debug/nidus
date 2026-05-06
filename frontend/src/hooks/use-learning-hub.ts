"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createCurrentAffair, createPYQQuestion, createQuizBattle, getCurrentAffairs, getLeaderboard, getPYQCategories, getPYQQuestions, getQuizBattles, joinQuizBattle, submitQuizBattle } from "@/services/learning-hub";

function useToastMutation<TPayload, TResult>(mutationFn: (payload: TPayload) => Promise<TResult>, keys: unknown[][], message: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({ mutationFn, onSuccess: async () => { await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))); showToast(message, "success"); }, onError: (error) => showToast(getApiErrorMessage(error), "error") });
}

export function usePYQBank(filters?: { examType?: string; subject?: string; year?: string; search?: string }) {
  return { categories: useQuery({ queryKey: ["learning", "pyq-categories"], queryFn: getPYQCategories }), questions: useQuery({ queryKey: ["learning", "pyq", filters], queryFn: () => getPYQQuestions(filters) }), create: useToastMutation(createPYQQuestion, [["learning", "pyq"]], "PYQ added") };
}
export function useCurrentAffairs(category?: string) {
  return { ...useQuery({ queryKey: ["learning", "current-affairs", category], queryFn: () => getCurrentAffairs(category) }), create: useToastMutation(createCurrentAffair, [["learning", "current-affairs", category]], "Current affair published") };
}
export function useQuizBattles() {
  return { ...useQuery({ queryKey: ["learning", "quiz-battles"], queryFn: getQuizBattles }), create: useToastMutation(createQuizBattle, [["learning", "quiz-battles"]], "Quiz battle created"), join: useToastMutation(joinQuizBattle, [["learning", "quiz-battles"]], "Joined battle"), submit: useToastMutation(submitQuizBattle, [["learning", "quiz-battles"], ["learning", "leaderboard"]], "Battle submitted") };
}
export function useLeaderboard() {
  return useQuery({ queryKey: ["learning", "leaderboard"], queryFn: getLeaderboard });
}

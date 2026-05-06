import { apiClient } from "@/services/api";
import type { CurrentAffair, LeaderboardEntry, PYQCategory, PYQQuestion, QuizBattle, QuizBattleParticipant } from "@/types/learning-hub";

export async function getPYQCategories() { return (await apiClient.get<{ categories: PYQCategory[] }>("/pyq/categories")).data.categories; }
export async function getPYQQuestions(params?: { examType?: string; subject?: string; year?: string; search?: string }) { return (await apiClient.get<{ questions: PYQQuestion[] }>("/pyq/questions", { params })).data.questions; }
export async function createPYQQuestion(payload: Omit<PYQQuestion, "id" | "createdAt" | "category">) { return (await apiClient.post<{ question: PYQQuestion }>("/pyq/questions", payload)).data.question; }
export async function getCurrentAffairs(category?: string) { return (await apiClient.get<{ currentAffairs: CurrentAffair[] }>("/current-affairs", { params: { category } })).data.currentAffairs; }
export async function createCurrentAffair(payload: Omit<CurrentAffair, "id" | "createdAt" | "quizzes"> & { quizzes?: Array<Omit<CurrentAffair["quizzes"] extends Array<infer T> ? T : never, "id" | "currentAffairId">> }) { return (await apiClient.post<{ currentAffair: CurrentAffair }>("/current-affairs", payload)).data.currentAffair; }
export async function getQuizBattles() { return (await apiClient.get<{ battles: QuizBattle[] }>("/quiz-battles")).data.battles; }
export async function createQuizBattle(payload: Omit<QuizBattle, "id" | "createdAt" | "participants">) { return (await apiClient.post<{ battle: QuizBattle }>("/quiz-battles", payload)).data.battle; }
export async function joinQuizBattle(battleId: string) { return (await apiClient.post<{ participant: QuizBattleParticipant }>("/quiz-battles/join", { battleId })).data.participant; }
export async function submitQuizBattle(payload: { battleId: string; score: number; timeTaken: number }) { return (await apiClient.post<{ participant: QuizBattleParticipant }>("/quiz-battles/submit", payload)).data.participant; }
export async function getLeaderboard() { return (await apiClient.get<{ leaderboard: LeaderboardEntry[] }>("/leaderboard")).data.leaderboard; }

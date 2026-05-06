import { apiClient } from "@/services/api";
import type { AIInterviewQuestion, AIInterviewSession, AIRecommendation, DoubtQuery, OfficerPotential } from "@/types/ai-engine";

export async function startInterview(payload: { examType: string; interviewType: string }) { return (await apiClient.post<{ session: AIInterviewSession; question: AIInterviewQuestion }>("/ai/interview/start", payload)).data; }
export async function nextInterviewQuestion(payload: { sessionId: string }) { return (await apiClient.post<{ question: AIInterviewQuestion }>("/ai/interview/next-question", payload)).data.question; }
export async function submitInterviewAnswer(payload: { questionId: string; userAnswer: string }) { return (await apiClient.post<{ question: AIInterviewQuestion }>("/ai/interview/submit-answer", payload)).data.question; }
export async function getInterviewResult(sessionId: string) { return (await apiClient.get<{ result: AIInterviewSession }>(`/ai/interview/result/${sessionId}`)).data.result; }
export async function solveDoubt(payload: { question: string; subject: string }) { return (await apiClient.post<{ doubt: DoubtQuery }>("/ai/doubt", payload)).data.doubt; }
export async function getDoubtHistory() { return (await apiClient.get<{ doubts: DoubtQuery[] }>("/ai/doubts/history")).data.doubts; }
export async function getAIRecommendations() { return (await apiClient.get<{ recommendations: AIRecommendation[] }>("/ai/recommendations")).data.recommendations; }
export async function getOfficerPotential() { return (await apiClient.get<{ officerPotential: OfficerPotential }>("/ai/officer-potential")).data.officerPotential; }

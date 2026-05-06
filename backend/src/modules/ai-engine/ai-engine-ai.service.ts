import { aiPrompts } from "./ai-prompts.js";
import { callOpenAIJson } from "./openai.service.js";

export const aiEngineAIService = {
  generateInterviewQuestion(input: { examType: string; interviewType: string; previousQuestions: string[] }) {
    return callOpenAIJson(aiPrompts.interviewQuestion, JSON.stringify(input), { question: `Tell me about a situation where you showed leadership while preparing for ${input.examType}.` });
  },
  analyzeInterviewAnswer(input: { question: string; answer: string }) {
    return callOpenAIJson(aiPrompts.answerAnalysis, JSON.stringify(input), { analysis: "Your answer shows intent. Improve with a specific example, action taken, result achieved and self-reflection.", score: 72, feedback: "Use STAR structure and speak with calm conviction." });
  },
  solveStudentDoubt(input: { subject: string; question: string }) {
    return callOpenAIJson(aiPrompts.doubtSolver, JSON.stringify(input), { answer: `For ${input.subject}, break the problem into concept, formula or rule, then practice 5 similar NDA/CDS-level questions. Key idea: ${input.question}` });
  },
  generateRecommendations(input: { userId: string }) {
    return callOpenAIJson(aiPrompts.recommendations, JSON.stringify(input), { items: [
      { category: "Interview", recommendation: "Practice two personal-experience answers daily using Situation, Task, Action and Result.", priority: "HIGH" },
      { category: "Revision", recommendation: "Revise weak maths topics in 35-minute focused blocks.", priority: "MEDIUM" },
      { category: "Discipline", recommendation: "Maintain a daily fitness and current-affairs log.", priority: "LOW" }
    ] });
  },
  analyzeOfficerPotential(input: { userId: string }) {
    return callOpenAIJson(aiPrompts.officerPotential, JSON.stringify(input), { leadershipScore: 76, communicationScore: 72, disciplineScore: 82, confidenceScore: 74, officerReadiness: 77, aiSummary: "You show solid discipline and developing officer-like qualities. Build sharper examples, improve concise expression and sustain physical consistency." });
  }
};

import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { topRankAPRService } from "./toprank-apr.service.js";
import { topRankReadinessService } from "./toprank-readiness.service.js";

const answerSections: Record<string, string> = {
  mathematicsConfidence: "ACADEMIC",
  englishConfidence: "ACADEMIC",
  reasoningConfidence: "ACADEMIC",
  generalKnowledgeConfidence: "ACADEMIC",
  currentAffairsConfidence: "ACADEMIC",
  computerKnowledge: "ACADEMIC",
  previousMockScore: "ACADEMIC",
  previousCoaching: "ACADEMIC",
  running1600mTiming: "PHYSICAL",
  pushUps: "PHYSICAL",
  sitUps: "PHYSICAL",
  heightCm: "PHYSICAL",
  weightKg: "PHYSICAL",
  medicalStatus: "PHYSICAL",
  exerciseFrequency: "PHYSICAL",
  dailyStudyHours: "LEARNING",
  preferredStudyTime: "LEARNING",
  learningStyle: "LEARNING",
  revisionHabits: "LEARNING",
  distractionLevel: "LEARNING",
  attendanceConsistency: "DISCIPLINE",
  goalClarity: "DISCIPLINE",
  selfConfidence: "DISCIPLINE",
  timeManagement: "DISCIPLINE",
  motivation: "DISCIPLINE",
  stressLevel: "DISCIPLINE",
  commitment: "DISCIPLINE",
  preferredForce: "CAREER",
  reasonForJoining: "CAREER",
  familySupport: "CAREER",
  targetExam: "CAREER"
};

export const topRankAssessmentService = {
  async hasCompleted(userId: string) {
    const count = await prisma.topRankAssessment.count({ where: { userId, status: "COMPLETED" } });
    return count > 0;
  },

  async latest(userId: string) {
    const [assessment, apr] = await Promise.all([
      prisma.topRankAssessment.findFirst({ where: { userId }, include: { answers: true }, orderBy: { completedAt: "desc" } }),
      topRankAPRService.latest(userId)
    ]);
    return { assessment, apr };
  },

  async submit(userId: string, payload: Record<string, unknown>) {
    const scores = topRankReadinessService.calculate(payload);
    const summary = {
      readinessBand: scores.readinessBand,
      strengths: scores.strengths,
      weaknesses: scores.weaknesses,
      improvementAreas: scores.improvementAreas,
      componentScores: scores.componentScores
    } satisfies Prisma.InputJsonObject;

    const assessment = await prisma.topRankAssessment.create({
      data: {
        userId,
        status: "COMPLETED",
        assessmentType: "AGNIVEER_DIAGNOSTIC",
        academicScore: scores.academicScore,
        physicalScore: scores.physicalScore,
        learningScore: scores.learningScore,
        disciplineScore: scores.disciplineScore,
        careerScore: scores.careerScore,
        overallScore: scores.overallScore,
        summary,
        answers: {
          create: Object.entries(payload).map(([questionKey, value]) => ({
            userId,
            section: answerSections[questionKey] ?? "GENERAL",
            questionKey,
            value: value as Prisma.InputJsonValue,
            score: 0
          }))
        }
      }
    });

    const apr = await topRankAPRService.createFromAssessment({ userId, assessmentId: assessment.id, scores });

    await prisma.topRankReadinessScore.create({
      data: {
        userId,
        readinessScore: scores.overallScore,
        readinessBand: scores.readinessBand,
        readinessExplanation: "RC4 diagnostic baseline calculated without AI.",
        academicScore: scores.academicScore,
        disciplineScore: scores.disciplineScore,
        performanceScore: scores.physicalScore,
        growthScore: scores.learningScore,
        riskScore: 100 - scores.overallScore,
        componentScores: scores.componentScores as Prisma.InputJsonObject
      }
    });

    return { assessment, apr, scores };
  }
};


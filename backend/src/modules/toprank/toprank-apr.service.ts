import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

export const topRankAPRService = {
  async latest(userId: string) {
    return prisma.topRankAPR.findFirst({
      where: { userId },
      include: { assessment: true },
      orderBy: { createdAt: "desc" }
    });
  },

  async createFromAssessment(input: {
    userId: string;
    assessmentId: string;
    scores: {
      academicScore: number;
      physicalScore: number;
      learningScore: number;
      disciplineScore: number;
      careerScore: number;
      overallScore: number;
      readinessBand: string;
      strengths: string[];
      weaknesses: string[];
      improvementAreas: string[];
      componentScores: Record<string, unknown>;
    };
  }) {
    const summary = {
      readinessIndex: input.scores.overallScore,
      readinessBand: input.scores.readinessBand,
      generatedBy: "TOPRANK_RC4_DETERMINISTIC_ENGINE"
    } satisfies Prisma.InputJsonObject;

    return prisma.topRankAPR.create({
      data: {
        userId: input.userId,
        assessmentId: input.assessmentId,
        academicScore: input.scores.academicScore,
        physicalScore: input.scores.physicalScore,
        learningScore: input.scores.learningScore,
        disciplineScore: input.scores.disciplineScore,
        careerScore: input.scores.careerScore,
        overallScore: input.scores.overallScore,
        status: input.scores.readinessBand,
        strengths: input.scores.strengths,
        weaknesses: input.scores.weaknesses,
        improvementAreas: input.scores.improvementAreas,
        summary
      }
    });
  }
};


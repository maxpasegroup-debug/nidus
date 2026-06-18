import { prisma } from "../../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { assessmentConfidenceService } from "./assessment-confidence.service.js";
import { assessmentIntegrityService } from "./assessment-integrity.service.js";
import { assessmentReadinessService } from "./assessment-readiness.service.js";
import { assessmentRiskService } from "./assessment-risk.service.js";
import type { DimensionScoreInput, DimensionScoreResult, ScoringAnswerInput, ScoringInput, TraitScoreInput, TraitScoreResult } from "./assessment-scoring.types.js";

function normalizeAnswer(answer: ScoringAnswerInput) {
  const maxScore = Math.max(answer.maxScore ?? 4, 1);
  return Math.max(0, Math.min(100, (answer.rawScore / maxScore) * 100));
}

function weightedAverage(items: Array<{ score: number; weight?: number }>) {
  if (!items.length) return 0;
  const totalWeight = items.reduce((sum, item) => sum + Math.max(item.weight ?? 1, 0), 0) || items.length;
  return items.reduce((sum, item) => sum + item.score * Math.max(item.weight ?? 1, 0), 0) / totalWeight;
}

function scoreDimension(dimension: DimensionScoreInput): DimensionScoreResult {
  const rawScore = dimension.answers.length
    ? Math.round(dimension.answers.reduce((sum, answer) => sum + normalizeAnswer(answer), 0) / dimension.answers.length)
    : 0;
  return {
    dimensionId: dimension.dimensionId,
    dimensionName: dimension.dimensionName,
    traitId: dimension.traitId,
    rawScore,
    weightedScore: rawScore,
    confidenceScore: dimension.answers.length >= 3 ? 85 : dimension.answers.length >= 2 ? 70 : dimension.answers.length === 1 ? 45 : 0,
    answered: dimension.answers.length
  };
}

function scoreTrait(trait: TraitScoreInput): TraitScoreResult {
  const dimensions = trait.dimensions.map(scoreDimension);
  const rawScore = Math.round(weightedAverage(dimensions.map((dimension, index) => ({
    score: dimension.rawScore,
    weight: trait.dimensions[index]?.weight ?? 1
  }))));
  return {
    traitId: trait.traitId,
    traitName: trait.traitName,
    rawScore,
    weightedScore: rawScore,
    confidenceScore: dimensions.length ? Math.round(dimensions.reduce((sum, dimension) => sum + dimension.confidenceScore, 0) / dimensions.length) : 0,
    isCritical: Boolean(trait.isCritical),
    dimensions
  };
}

function persistJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const assessmentScoringService = {
  calculate(input: ScoringInput) {
    const traits = input.traits.map(scoreTrait);
    const answers = input.traits.flatMap((trait) => trait.dimensions.flatMap((dimension) => dimension.answers));
    const weightedTraits = traits.map((trait, index) => ({
      score: trait.rawScore,
      weight: input.traits[index]?.weight ?? 1
    }));

    let assessmentScore = Math.round(weightedAverage(weightedTraits));
    const criticalFailure = traits.find((trait) => trait.isCritical && trait.rawScore < 45);
    if (criticalFailure) assessmentScore = Math.min(assessmentScore, 59);

    const integrity = assessmentIntegrityService.evaluate(answers);
    const risk = assessmentRiskService.evaluate(traits);
    const confidence = assessmentConfidenceService.calculate({
      totalQuestions: input.totalQuestions ?? answers.length,
      answeredQuestions: input.answeredQuestions ?? answers.length,
      expectedTraits: input.traits.length,
      coveredTraits: traits.filter((trait) => trait.dimensions.some((dimension) => dimension.answered > 0)).length,
      expectedDimensions: input.traits.reduce((sum, trait) => sum + trait.dimensions.length, 0),
      coveredDimensions: traits.reduce((sum, trait) => sum + trait.dimensions.filter((dimension) => dimension.answered > 0).length, 0),
      integrityScore: integrity.integrityScore
    });
    const readinessScore = Math.round(assessmentScore * 0.75 + integrity.integrityScore * 0.15 + confidence.confidenceScore * 0.1 - risk.riskScore * 0.1);
    const readiness = assessmentReadinessService.band(readinessScore);

    return {
      rawScore: Math.round(answers.reduce((sum, answer) => sum + answer.rawScore, 0)),
      assessmentScore,
      readinessScore: readiness.score,
      readiness,
      integrity,
      risk,
      confidence,
      traits,
      dimensions: traits.flatMap((trait) => trait.dimensions)
    };
  },

  async calculateAndMaybePersist(input: ScoringInput) {
    const result = this.calculate(input);
    const attemptId = input.attemptId;
    if (!input.persist || !attemptId) return result;

    await prisma.$transaction(async (tx) => {
      await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          assessmentScore: result.assessmentScore,
          readinessScore: result.readinessScore,
          integrityScore: result.integrity.integrityScore,
          riskScore: result.risk.riskScore,
          confidenceScore: result.confidence.confidenceScore,
          metadata: persistJson({
            readiness: result.readiness,
            confidence: result.confidence,
            calculatedAt: new Date().toISOString()
          })
        }
      });

      for (const trait of result.traits) {
        await tx.assessmentTraitScore.upsert({
          where: { attemptId_traitId: { attemptId, traitId: trait.traitId } },
          create: {
            attemptId,
            traitId: trait.traitId,
            rawScore: trait.rawScore,
            weightedScore: trait.weightedScore,
            confidenceScore: trait.confidenceScore,
            metadata: persistJson(trait)
          },
          update: {
            rawScore: trait.rawScore,
            weightedScore: trait.weightedScore,
            confidenceScore: trait.confidenceScore,
            metadata: persistJson(trait)
          }
        });
      }

      for (const dimension of result.dimensions) {
        await tx.assessmentDimensionScore.upsert({
          where: { attemptId_dimensionId: { attemptId, dimensionId: dimension.dimensionId } },
          create: {
            attemptId,
            dimensionId: dimension.dimensionId,
            rawScore: dimension.rawScore,
            weightedScore: dimension.weightedScore,
            confidenceScore: dimension.confidenceScore,
            metadata: persistJson(dimension)
          },
          update: {
            rawScore: dimension.rawScore,
            weightedScore: dimension.weightedScore,
            confidenceScore: dimension.confidenceScore,
            metadata: persistJson(dimension)
          }
        });
      }

      await tx.assessmentIntegritySignal.deleteMany({ where: { attemptId } });
      if (result.integrity.flags.length) {
        await tx.assessmentIntegritySignal.createMany({
          data: result.integrity.flags.map((item) => ({
            attemptId,
            signalType: item.type,
            severity: item.severity,
            scorePenalty: item.penalty,
            description: item.reason,
            metadata: persistJson(item)
          }))
        });
      }

      await tx.assessmentRiskSignal.deleteMany({ where: { attemptId } });
      if (result.risk.signals.length) {
        await tx.assessmentRiskSignal.createMany({
          data: result.risk.signals.map((item) => ({
            attemptId,
            riskType: item.riskType,
            riskLevel: item.riskLevel,
            score: item.score,
            description: item.reason,
            metadata: persistJson(item)
          }))
        });
      }
    });

    return result;
  }
};

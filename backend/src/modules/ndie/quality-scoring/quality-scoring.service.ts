import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { ndieOverallConfidence } from "../confidence-engine/confidence-engine.service.js";

function gradeFor(score: number) {
  if (score >= 0.9) return "EXCELLENT";
  if (score >= 0.78) return "GOOD";
  if (score >= 0.6) return "REVIEW_REQUIRED";
  return "POOR";
}

function clamp(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) return null;
  return Math.max(0, Math.min(1, Number(value)));
}

function average(values: Array<number | null | undefined>) {
  return ndieOverallConfidence(values.map((value) => clamp(value)).filter((value): value is number => typeof value === "number"));
}

function jsonRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export const ndieQualityScoringService = {
  async generate(importJobId: string) {
    const importJob = await prisma.ndieImportJob.findUnique({
      where: { id: importJobId },
      include: {
        pages: true,
        elements: true,
        questionCandidates: true,
        answerKeyCandidates: true,
        reviewDecisions: true,
        providerRuns: true
      }
    });
    if (!importJob) throw Object.assign(new Error("NDIE import not found"), { statusCode: 404 });

    const ocrConfidence = average(importJob.pages.map((page) => clamp(jsonRecord(page.ocrJson).confidence as number | null)));
    const layoutAccuracy = average(importJob.pages.map((page) => clamp(jsonRecord(page.layoutJson).confidence as number | null)));
    const formulaElements = importJob.elements.filter((element) => ["FORMULA", "CHEMICAL_EQUATION"].includes(element.elementType));
    const tableElements = importJob.elements.filter((element) => element.elementType === "TABLE");
    const diagramElements = importJob.elements.filter((element) => ["DIAGRAM", "GRAPH"].includes(element.elementType));
    const formulaAccuracy = formulaElements.length ? average(formulaElements.map((element) => element.confidence)) : null;
    const tableAccuracy = tableElements.length ? average(tableElements.map((element) => element.confidence)) : null;
    const diagramPreservation = diagramElements.length ? average(diagramElements.map((element) => element.confidence)) : null;
    const optionCompleteness = importJob.questionCandidates.length
      ? importJob.questionCandidates.filter((candidate) => {
          const blocks = Array.isArray(jsonRecord(candidate.candidateJson).blocks) ? jsonRecord(candidate.candidateJson).blocks as Array<Record<string, unknown>> : [];
          return blocks.filter((block) => block.type === "OptionBlock").length === 4;
        }).length / importJob.questionCandidates.length
      : null;
    const answerKeyConfidence = average(importJob.answerKeyCandidates.map((answer) => answer.confidence));
    const aiConfidence = average(importJob.questionCandidates.map((candidate) => candidate.confidence));
    const reviewed = importJob.questionCandidates.filter((candidate) => ["APPROVED", "REJECTED"].includes(candidate.reviewStatus)).length;
    const teacherReviewCompletion = importJob.questionCandidates.length ? reviewed / importJob.questionCandidates.length : 0;

    const weighted = [
      { value: ocrConfidence, weight: 0.13 },
      { value: layoutAccuracy, weight: 0.13 },
      { value: formulaAccuracy, weight: formulaElements.length ? 0.16 : 0 },
      { value: tableAccuracy, weight: tableElements.length ? 0.08 : 0 },
      { value: diagramPreservation, weight: diagramElements.length ? 0.1 : 0 },
      { value: optionCompleteness, weight: 0.16 },
      { value: answerKeyConfidence, weight: 0.1 },
      { value: aiConfidence, weight: 0.12 },
      { value: teacherReviewCompletion, weight: 0.12 }
    ].filter((item) => typeof item.value === "number" && item.weight > 0);

    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0) || 1;
    const overall = weighted.reduce((sum, item) => sum + Number(item.value) * item.weight, 0) / totalWeight;
    const needsReview = importJob.questionCandidates.filter((candidate) => !["APPROVED", "REJECTED"].includes(candidate.reviewStatus));
    const highRisk = importJob.questionCandidates.filter((candidate) => Number(candidate.confidence ?? 0) < 0.45);
    const visualRisk = importJob.elements.filter((element) => ["FORMULA", "TABLE", "DIAGRAM", "GRAPH", "CHEMICAL_EQUATION"].includes(element.elementType) && Number(element.confidence ?? 0) < 0.7);

    const details = {
      counts: {
        pages: importJob.pages.length,
        elements: importJob.elements.length,
        questions: importJob.questionCandidates.length,
        answerKeys: importJob.answerKeyCandidates.length,
        reviewDecisions: importJob.reviewDecisions.length,
        formulas: formulaElements.length,
        tables: tableElements.length,
        diagrams: diagramElements.length
      },
      risk: {
        needsReview: needsReview.length,
        highRiskQuestions: highRisk.length,
        lowConfidenceVisuals: visualRisk.length
      },
      checkpoints: Array.from(new Set(importJob.providerRuns.map((run) => run.stage))),
      recommendations: [
        ...(highRisk.length ? ["Review red confidence questions before publishing."] : []),
        ...(visualRisk.length ? ["Inspect formulas, diagrams, tables and graph crops against the original paper."] : []),
        ...(answerKeyConfidence === null ? ["Upload or map an answer key before final CBT publish."] : []),
        ...(teacherReviewCompletion < 1 ? ["Complete teacher approval or rejection for every question candidate."] : [])
      ]
    };

    const score = await prisma.ndieQualityScore.create({
      data: {
        importJobId,
        overall,
        grade: gradeFor(overall),
        ocrConfidence,
        formulaAccuracy,
        layoutAccuracy,
        tableAccuracy,
        diagramPreservation,
        optionCompleteness,
        answerKeyConfidence,
        aiConfidence,
        teacherReviewCompletion,
        details: details as Prisma.InputJsonValue
      }
    });

    await prisma.ndieImportJob.update({
      where: { id: importJobId },
      data: {
        qualitySummary: {
          latestQualityScoreId: score.id,
          overall,
          grade: score.grade,
          generatedAt: score.createdAt.toISOString(),
          ...details
        } as Prisma.InputJsonValue
      }
    });

    return score;
  }
};

import { prisma } from "../../config/prisma.js";
import { AssessmentStatus } from "../../generated/prisma/client.js";
import { assessmentExposureService } from "./assessment-exposure.service.js";

type CandidateQuestion = Awaited<ReturnType<typeof loadCandidates>>[number];

async function loadCandidates(assessmentId: string) {
  return prisma.assessmentQuestion.findMany({
    where: {
      assessmentId,
      status: AssessmentStatus.PUBLISHED
    },
    include: {
      trait: true,
      dimension: true,
      options: { orderBy: { displayOrder: "asc" } }
    },
    orderBy: [{ exposureCount: "asc" }, { difficultyLevel: "asc" }, { createdAt: "asc" }]
  });
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function keyFor(question: CandidateQuestion) {
  return `${question.traitId}:${question.dimensionId}:${question.difficultyLevel}`;
}

function coverageScore(question: CandidateQuestion, selected: CandidateQuestion[]) {
  const traitCount = selected.filter((item) => item.traitId === question.traitId).length;
  const dimensionCount = selected.filter((item) => item.dimensionId === question.dimensionId).length;
  const difficultyCount = selected.filter((item) => item.difficultyLevel === question.difficultyLevel).length;
  return traitCount * 3 + dimensionCount * 2 + difficultyCount;
}

function selectBalanced(pool: CandidateQuestion[], count: number) {
  const selected: CandidateQuestion[] = [];
  const remaining = shuffle(pool);
  const seenComposite = new Set<string>();

  while (selected.length < count && remaining.length) {
    remaining.sort((a, b) => {
      const scoreDelta = coverageScore(a, selected) - coverageScore(b, selected);
      if (scoreDelta !== 0) return scoreDelta;
      const exposureDelta = a.exposureCount - b.exposureCount;
      if (exposureDelta !== 0) return exposureDelta;
      return (a.lastUsedAt?.getTime() ?? 0) - (b.lastUsedAt?.getTime() ?? 0);
    });

    const preferredIndex = remaining.findIndex((question) => !seenComposite.has(keyFor(question)));
    const [next] = remaining.splice(preferredIndex >= 0 ? preferredIndex : 0, 1);
    if (!next) break;
    selected.push(next);
    seenComposite.add(keyFor(next));
  }

  return selected;
}

export const assessmentRandomizationService = {
  async selectQuestions(input: {
    assessmentId: string;
    userId: string;
    questionCount?: number;
    avoidRecentlyShownDays?: number;
  }) {
    const assessment = await prisma.assessmentArenaAssessment.findUnique({
      where: { id: input.assessmentId },
      select: { id: true, name: true, questionsPerAttempt: true }
    });
    if (!assessment) throw new Error("Assessment Arena assessment not found");

    const requestedCount = Math.max(1, input.questionCount ?? assessment.questionsPerAttempt ?? 25);
    const candidates = await loadCandidates(input.assessmentId);
    if (candidates.length < requestedCount) {
      throw new Error(`Not enough published questions. Required ${requestedCount}, available ${candidates.length}.`);
    }

    const recentIds = await assessmentExposureService.recentlyShownQuestionIds({
      assessmentId: input.assessmentId,
      userId: input.userId,
      withinDays: input.avoidRecentlyShownDays ?? 7
    });
    const freshPool = candidates.filter((question) => !recentIds.has(question.id));
    const pool = freshPool.length >= requestedCount ? freshPool : candidates;
    const selected = selectBalanced(pool, requestedCount);
    const coverage = this.validateCoverage(selected);
    if (!coverage.pass) throw new Error(`Question coverage failed: ${coverage.issues.join(", ")}`);

    return {
      assessment,
      selected,
      coverage,
      poolSize: candidates.length,
      recentAvoided: freshPool.length >= requestedCount
    };
  },

  validateCoverage(questions: CandidateQuestion[]) {
    const traitCount = new Set(questions.map((question) => question.traitId)).size;
    const dimensionCount = new Set(questions.map((question) => question.dimensionId)).size;
    const difficultyCount = new Set(questions.map((question) => question.difficultyLevel)).size;
    const issues: string[] = [];
    if (questions.length >= 10 && traitCount < 2) issues.push("minimum trait spread not met");
    if (questions.length >= 10 && dimensionCount < 3) issues.push("minimum dimension spread not met");
    if (questions.length >= 15 && difficultyCount < 2) issues.push("minimum difficulty spread not met");
    return {
      pass: issues.length === 0,
      issues,
      traitCount,
      dimensionCount,
      difficultyCount
    };
  }
};

import { prisma } from "../../config/prisma.js";
import type { Prisma, Role } from "../../generated/prisma/client.js";
import { assessmentExposureService } from "./assessment-exposure.service.js";
import { assessmentRandomizationService } from "./assessment-randomization.service.js";
import { assessmentSnapshotService } from "./assessment-snapshot.service.js";

type Actor = {
  id: string;
  role: Role;
};

type SubmitAnswerInput = {
  attemptQuestionId?: string;
  questionId: string;
  optionId?: string;
  answerText?: string;
  rawScore?: number;
};

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function repeatWindowDays(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  if ([0, 1, 7, 30, 90].includes(parsed)) return parsed;
  return 1;
}

function assertOwnerOrAdmin(attempt: { userId: string }, actor: Actor) {
  if (actor.role === "ADMIN" || actor.role === "DIRECTOR") return;
  if (attempt.userId !== actor.id) throw new Error("Attempt access denied");
}

export const assessmentAttemptService = {
  async start(input: {
    assessmentId: string;
    actor: Actor;
    userId?: string;
    questionCount?: number;
    repeatWindowDays?: number;
    allowRepeat?: boolean;
  }) {
    const userId = (input.actor.role === "ADMIN" || input.actor.role === "DIRECTOR") && input.userId ? input.userId : input.actor.id;
    const days = repeatWindowDays(input.repeatWindowDays);

    if (!input.allowRepeat && days > 0) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const existing = await prisma.assessmentAttempt.findFirst({
        where: {
          assessmentId: input.assessmentId,
          userId,
          status: { in: ["STARTED", "IN_PROGRESS", "SUBMITTED", "SCORED"] },
          startedAt: { gte: since }
        },
        orderBy: { startedAt: "desc" }
      });
      if (existing) throw new Error(`Repeat attempt blocked for ${days} day(s). Existing attempt: ${existing.id}`);
    }

    const randomized = await assessmentRandomizationService.selectQuestions({
      assessmentId: input.assessmentId,
      userId,
      questionCount: input.questionCount,
      avoidRecentlyShownDays: days || 7
    });

    const attempt = await prisma.$transaction(async (tx) => {
      const created = await tx.assessmentAttempt.create({
        data: {
          assessmentId: input.assessmentId,
          userId,
          status: "IN_PROGRESS",
          metadata: json({
            poolSize: randomized.poolSize,
            recentAvoided: randomized.recentAvoided,
            coverage: randomized.coverage,
            startedBy: input.actor.id
          })
        }
      });

      await tx.assessmentAttemptQuestion.createMany({
        data: randomized.selected.map((question, index) => ({
          attemptId: created.id,
          questionId: question.id,
          questionVersion: question.version,
          displayOrder: index + 1,
          questionSnapshot: assessmentSnapshotService.question(question),
          optionsSnapshot: assessmentSnapshotService.options(question)
        }))
      });

      return created;
    });

    await assessmentExposureService.record({
      assessmentId: input.assessmentId,
      attemptId: attempt.id,
      userId,
      questions: randomized.selected.map((question) => ({ id: question.id, version: question.version }))
    });

    return this.get(attempt.id, input.actor);
  },

  async submit(input: { attemptId: string; actor: Actor; answers: SubmitAnswerInput[] }) {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: input.attemptId },
      include: { attemptQuestions: true }
    });
    if (!attempt) throw new Error("Assessment attempt not found");
    assertOwnerOrAdmin(attempt, input.actor);
    if (["SUBMITTED", "SCORED", "ARCHIVED"].includes(attempt.status)) throw new Error(`Attempt is already ${attempt.status.toLowerCase()}`);

    const attemptQuestionByQuestion = new Map(attempt.attemptQuestions.map((item) => [item.questionId, item]));
    const attemptQuestionById = new Map(attempt.attemptQuestions.map((item) => [item.id, item]));

    await prisma.$transaction(async (tx) => {
      for (const answer of input.answers) {
        const attemptQuestion = answer.attemptQuestionId
          ? attemptQuestionById.get(answer.attemptQuestionId)
          : attemptQuestionByQuestion.get(answer.questionId);
        if (!attemptQuestion) throw new Error(`Question ${answer.questionId} is not part of this attempt`);

        let rawScore = Number.isFinite(Number(answer.rawScore)) ? Number(answer.rawScore) : 0;
        if (answer.optionId) {
          const option = await tx.assessmentQuestionOption.findUnique({ where: { id: answer.optionId } });
          if (!option || option.questionId !== attemptQuestion.questionId) throw new Error("Invalid answer option for attempt question");
          rawScore = option.rawScore;
        }

        await tx.assessmentAnswer.upsert({
          where: { attemptId_questionId: { attemptId: attempt.id, questionId: attemptQuestion.questionId } },
          create: {
            attemptId: attempt.id,
            attemptQuestionId: attemptQuestion.id,
            questionId: attemptQuestion.questionId,
            optionId: answer.optionId,
            answerText: answer.answerText,
            rawScore,
            scoredMetadata: json({ submittedBy: input.actor.id })
          },
          update: {
            optionId: answer.optionId,
            answerText: answer.answerText,
            rawScore,
            scoredMetadata: json({ submittedBy: input.actor.id, updatedAt: new Date().toISOString() })
          }
        });

        await tx.assessmentAttemptQuestion.update({
          where: { id: attemptQuestion.id },
          data: { answered: true }
        });
      }

      await tx.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date()
        }
      });
    });

    return this.get(attempt.id, input.actor);
  },

  async get(attemptId: string, actor: Actor) {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: { select: { id: true, name: true, slug: true, questionsPerAttempt: true } },
        attemptQuestions: { orderBy: { displayOrder: "asc" } },
        answers: true,
        traitScores: true,
        dimensionScores: true,
        integritySignals: true,
        riskSignals: true
      }
    });
    if (!attempt) throw new Error("Assessment attempt not found");
    assertOwnerOrAdmin(attempt, actor);
    return attempt;
  },

  async questions(attemptId: string, actor: Actor) {
    const attempt = await this.get(attemptId, actor);
    return attempt.attemptQuestions.map((question) => ({
      id: question.id,
      questionId: question.questionId,
      questionVersion: question.questionVersion,
      displayOrder: question.displayOrder,
      answered: question.answered,
      question: question.questionSnapshot,
      options: question.optionsSnapshot
    }));
  },

  async status(attemptId: string, actor: Actor) {
    const attempt = await this.get(attemptId, actor);
    return {
      id: attempt.id,
      assessmentId: attempt.assessmentId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      totalQuestions: attempt.attemptQuestions.length,
      answeredQuestions: attempt.attemptQuestions.filter((question) => question.answered).length,
      assessmentScore: attempt.assessmentScore,
      readinessScore: attempt.readinessScore,
      integrityScore: attempt.integrityScore,
      riskScore: attempt.riskScore,
      confidenceScore: attempt.confidenceScore
    };
  }
};

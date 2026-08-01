import type { Role, Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { NIDUS_QUESTION_CONTENT_FORMAT } from "../../document-intelligence/question-content.schema.js";
import { testsService, type TestPayload } from "../../tests/tests.service.js";

type Requester = {
  id: string;
  role: Role;
  roleMetadata?: Record<string, unknown> | null;
};

export type NdiePublishInput = {
  importJobId: string;
  requester: Requester;
  title?: string;
  description?: string;
  batchId?: string;
  subject?: string;
  topic?: string;
  duration?: number;
  publishAt?: string;
  allowAutoApproved?: boolean;
};

type CandidateJson = {
  blocks?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textFromBlocks(blocks: Array<Record<string, unknown>>) {
  return blocks
    .filter((block) => block.type !== "OptionBlock" && block.type !== "ExplanationBlock")
    .map((block) => typeof block.text === "string" ? block.text : "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function optionText(block: Record<string, unknown>) {
  const nested = Array.isArray(block.blocks) ? block.blocks : [];
  return nested
    .map((item) => asRecord(item))
    .map((item) => typeof item.text === "string" ? item.text : "")
    .filter(Boolean)
    .join(" ")
    .trim();
}

function optionsFromBlocks(blocks: Array<Record<string, unknown>>) {
  const entries = blocks
    .filter((block) => block.type === "OptionBlock")
    .map((block) => [String(block.key || "").toUpperCase(), optionText(block)] as const)
    .filter(([key, value]) => /^[A-D]$/.test(key) && value);
  return {
    A: entries.find(([key]) => key === "A")?.[1] || "",
    B: entries.find(([key]) => key === "B")?.[1] || "",
    C: entries.find(([key]) => key === "C")?.[1] || "",
    D: entries.find(([key]) => key === "D")?.[1] || ""
  };
}

function firstVisualUrl(blocks: Array<Record<string, unknown>>) {
  for (const block of blocks) {
    const url = block.url || block.formulaImageUrl || block.tableImageUrl;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  return undefined;
}

function sourcePage(candidate: { sourceMap?: Prisma.JsonValue | null }) {
  const map = asRecord(candidate.sourceMap);
  const page = Number(map.firstPage || map.pageNumber || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function sourceCoordinates(candidate: { sourceMap?: Prisma.JsonValue | null }) {
  const map = asRecord(candidate.sourceMap);
  return asRecord(map.coordinates);
}

function answerByQuestionNumber(answers: Array<{ questionNumber?: string | null; answerJson: Prisma.JsonValue }>) {
  return new Map(answers.map((answer) => [String(answer.questionNumber || ""), asRecord(answer.answerJson)]));
}

function solutionByQuestionNumber(solutions: Array<{ questionNumber?: string | null; solutionJson: Prisma.JsonValue }>) {
  return new Map(solutions.map((solution) => [String(solution.questionNumber || ""), asRecord(solution.solutionJson)]));
}

function correctOption(answer: Record<string, unknown>) {
  const value = String(answer.correctOption || answer.correctAnswer || answer.answer || "").toUpperCase();
  return /^[A-D]$/.test(value) ? value : "";
}

function explanationText(solution: Record<string, unknown>, hasAnswer: boolean) {
  const text = typeof solution.text === "string" ? solution.text.trim() : "";
  if (text) return text;
  return hasAnswer ? "NDIE teacher-approved answer key. Explanation was not supplied in the source document." : "";
}

function contentBlocks(input: {
  candidateId: string;
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: string;
  explanation: string;
  subject?: string | null;
  topic?: string | null;
  sourceDocumentId?: string | null;
  importJobId: string;
  page: number;
  coordinates: Record<string, unknown>;
  confidence?: number | null;
  reviewStatus: string;
}) {
  const sourceReference = {
    documentId: input.sourceDocumentId || undefined,
    importJobId: input.importJobId,
    page: input.page,
    coordinates: {
      page: input.page,
      x: Number(input.coordinates.x ?? 0),
      y: Number(input.coordinates.y ?? 0),
      width: Number(input.coordinates.width ?? 1),
      height: Number(input.coordinates.height ?? 1)
    }
  };

  return {
    schemaVersion: 1,
    format: NIDUS_QUESTION_CONTENT_FORMAT,
    questionType: "SINGLE_CHOICE",
    source: "AI_IMPORT",
    blocks: [
      { id: `${input.candidateId}-paragraph-1`, type: "paragraph", text: input.questionText, sourceReference, confidence: input.confidence ?? undefined },
      {
        id: `${input.candidateId}-options-1`,
        type: "options",
        options: [
          { key: "A", text: input.options.A },
          { key: "B", text: input.options.B },
          { key: "C", text: input.options.C },
          { key: "D", text: input.options.D }
        ]
      },
      { id: `${input.candidateId}-explanation-1`, type: "explanation", text: input.explanation }
    ],
    answer: { type: "SINGLE_CHOICE", correctOption: input.correctAnswer },
    sourceReferences: [sourceReference],
    metadata: {
      subject: input.subject || undefined,
      topic: input.topic || undefined,
      difficulty: "MEDIUM",
      marks: 1,
      negativeMarks: 0,
      importJobId: input.importJobId,
      ndieCandidateId: input.candidateId,
      aiConfidence: input.confidence ?? undefined,
      reviewStatus: input.reviewStatus
    }
  } satisfies Prisma.InputJsonObject;
}

export const ndiePublisherService = {
  async publish(input: NdiePublishInput) {
    const importJob = await prisma.ndieImportJob.findUnique({
      where: { id: input.importJobId },
      include: {
        sourceDocuments: true,
        questionCandidates: { orderBy: [{ questionNumber: "asc" }, { createdAt: "asc" }] },
        answerKeyCandidates: true,
        solutionCandidates: true
      }
    });
    if (!importJob) throw Object.assign(new Error("NDIE import not found"), { statusCode: 404 });
    if (importJob.testId) throw Object.assign(new Error("This NDIE import has already been published to CBT."), { statusCode: 409 });

    const publishableStatuses = input.allowAutoApproved ? ["APPROVED", "AUTO_APPROVED"] : ["APPROVED"];
    const approvedCandidates = importJob.questionCandidates.filter((candidate) => publishableStatuses.includes(candidate.reviewStatus));
    if (!approvedCandidates.length) {
      throw Object.assign(new Error("Approve at least one NDIE question candidate before publishing."), { statusCode: 400 });
    }

    const answerMap = answerByQuestionNumber(importJob.answerKeyCandidates);
    const solutionMap = solutionByQuestionNumber(importJob.solutionCandidates);
    const sourceDocumentId = importJob.sourceDocuments[0]?.id ?? null;

    const questions = approvedCandidates.map((candidate, index) => {
      const candidateJson = asRecord(candidate.candidateJson) as CandidateJson;
      const blocks = Array.isArray(candidateJson.blocks) ? candidateJson.blocks.map(asRecord) : [];
      const options = optionsFromBlocks(blocks);
      const answer = answerMap.get(String(candidate.questionNumber || "")) ?? {};
      const correctAnswer = correctOption(answer);
      const solution = solutionMap.get(String(candidate.questionNumber || "")) ?? {};
      const page = sourcePage(candidate);
      const coordinates = sourceCoordinates(candidate);
      const questionText = textFromBlocks(blocks) || `Question ${candidate.questionNumber || index + 1}`;
      const explanation = explanationText(solution, Boolean(correctAnswer));
      const visualUrl = firstVisualUrl(blocks);
      const visualReviewRequired = ["DIAGRAM_BASED", "IMAGE_BASED"].includes(candidate.questionType) && !visualUrl;

      return {
        questionText,
        questionImage: visualUrl,
        visualReviewRequired,
        visualReviewNotes: visualReviewRequired ? ["NDIE detected a visual question without a preserved crop. Attach the source crop before publishing."] as Prisma.InputJsonArray : undefined,
        contentJson: contentBlocks({
          candidateId: candidate.id,
          questionText,
          options,
          correctAnswer,
          explanation,
          subject: input.subject ?? importJob.subject,
          topic: input.topic ?? importJob.topic,
          sourceDocumentId,
          importJobId: importJob.id,
          page,
          coordinates,
          confidence: candidate.confidence,
          reviewStatus: candidate.reviewStatus
        }),
        sourceDocumentId: sourceDocumentId || undefined,
        sourcePageNumber: page,
        boundingBoxes: { sourceMap: candidate.sourceMap ?? null } as Prisma.InputJsonObject,
        assets: { sourceDocuments: importJob.sourceDocuments.map((doc) => ({ id: doc.id, url: doc.storageUrl, name: doc.originalName })) } as Prisma.InputJsonObject,
        layout: { ndieCandidateJson: candidate.candidateJson } as Prisma.InputJsonObject,
        renderMode: "NDIE_RICH_V1",
        aiConfidence: candidate.confidence ?? undefined,
        reviewStatus: "APPROVED",
        publishedVersion: 1,
        optionA: options.A,
        optionB: options.B,
        optionC: options.C,
        optionD: options.D,
        correctAnswer,
        explanation,
        marks: 1,
        negativeMarks: 0,
        difficultyLevel: "MEDIUM",
        topic: input.topic || importJob.topic || input.subject || importJob.subject || "NDIE Import"
      };
    });

    const payload: TestPayload = {
      title: input.title || `${importJob.subject || "NDIE"} Imported Exam`,
      description: input.description || "Published from NIDUS Document Intelligence Engine after teacher review.",
      examType: "NDIE_IMPORT",
      category: "Teacher Imported",
      subject: input.subject || importJob.subject || undefined,
      topic: input.topic || importJob.topic || input.subject || importJob.subject || "NDIE Import",
      batchId: input.batchId || importJob.batchId || undefined,
      teacherId: importJob.uploadedBy || input.requester.id,
      publishAt: input.publishAt,
      duration: Math.max(1, Number(input.duration || Math.max(30, questions.length))),
      totalMarks: questions.reduce((sum, question) => sum + question.marks, 0),
      isMockTest: true,
      isLive: true,
      questions
    };

    const test = await testsService.publishDraft(input.requester, payload);
    const createdQuestions = await prisma.question.findMany({ where: { testId: test.id } });
    const questionByCandidateId = new Map<string, string>();
    for (const question of createdQuestions) {
      const metadata = asRecord(asRecord(question.contentJson).metadata);
      const candidateId = typeof metadata.ndieCandidateId === "string" ? metadata.ndieCandidateId : "";
      if (candidateId) questionByCandidateId.set(candidateId, question.id);
    }

    await prisma.$transaction([
      prisma.ndieImportJob.update({
        where: { id: importJob.id },
        data: {
          testId: test.id,
          status: "PUBLISHED_TO_CBT",
          currentCheckpoint: "PUBLISHED_TO_CBT",
          reviewStatus: "PUBLISHED",
          teacherSummary: {
            publishedTestId: test.id,
            publishedQuestions: createdQuestions.length,
            publishedAt: new Date().toISOString()
          } as Prisma.InputJsonValue
        }
      }),
      ...Array.from(questionByCandidateId.entries()).map(([candidateId, questionId]) =>
        prisma.ndieQuestionCandidate.update({
          where: { id: candidateId },
          data: {
            approvedQuestionId: questionId,
            status: "PUBLISHED_TO_CBT",
            reviewStatus: "APPROVED"
          }
        })
      )
    ]);

    return {
      importJobId: importJob.id,
      testId: test.id,
      questionsPublished: createdQuestions.length,
      status: "PUBLISHED_TO_CBT"
    };
  }
};

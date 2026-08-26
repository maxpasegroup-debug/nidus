import { createHash, randomUUID } from "node:crypto";
import type { Role, Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/prisma.js";
import { NIDUS_QUESTION_CONTENT_FORMAT } from "../../document-intelligence/question-content.schema.js";
import { testsService, type TestPayload } from "../../tests/tests.service.js";
import type { NdieExamPackage, NdiePublishIntegrityIssue, NdiePublishResult, NdiePublishedAsset, NdiePublishedQuestion } from "../contracts/publish-package.js";
import { validateCandidateIntegrity } from "../review-engine/candidate-integrity.js";

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
  relationships?: Array<Record<string, unknown>>;
};

const OBJECTIVE_QUESTION_TYPES = new Set(["MCQ", "SINGLE_CORRECT_MCQ", "MULTIPLE_CORRECT_MCQ", "TRUE_FALSE", "ASSERTION_REASON"]);
const CRITICAL_VALIDATION_STAGES = new Set(["AI_VALIDATION_COMPLETED", "VALIDATION_COMPLETED"]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stableChecksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function issue(input: Omit<NdiePublishIntegrityIssue, "issueId">): NdiePublishIntegrityIssue {
  return {
    issueId: `publish-issue-${stableChecksum(input).slice(0, 12)}`,
    ...input
  };
}

function latestProviderRun<T extends { stage: string; completedAt?: Date | null; startedAt: Date }>(runs: T[], stages: Set<string>) {
  return runs
    .filter((run) => stages.has(run.stage))
    .sort((a, b) => (b.completedAt ?? b.startedAt).getTime() - (a.completedAt ?? a.startedAt).getTime())[0];
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

function answerMaps(answers: Array<{ questionCandidateId?: string | null; questionNumber?: string | null; answerJson: Prisma.JsonValue }>) {
  return {
    byCandidate: new Map(answers.filter((answer) => answer.questionCandidateId).map((answer) => [String(answer.questionCandidateId), asRecord(answer.answerJson)])),
    byNumber: new Map(answers.map((answer) => [String(answer.questionNumber || ""), asRecord(answer.answerJson)]))
  };
}

function answerForCandidate(maps: ReturnType<typeof answerMaps>, candidate: { id: string; questionNumber?: string | null }) {
  return maps.byCandidate.get(candidate.id) ?? maps.byNumber.get(String(candidate.questionNumber || "")) ?? {};
}

function solutionByQuestionNumber(solutions: Array<{ questionNumber?: string | null; solutionJson: Prisma.JsonValue }>) {
  return new Map(solutions.map((solution) => [String(solution.questionNumber || ""), asRecord(solution.solutionJson)]));
}

function correctOption(answer: Record<string, unknown>) {
  const correctOptions = Array.isArray(answer.correctOptions) ? answer.correctOptions : [];
  const value = String(answer.correctOption || answer.correctAnswer || answer.answer || correctOptions[0] || "").toUpperCase();
  return /^[A-D]$/.test(value) ? value : "";
}

function explanationText(solution: Record<string, unknown>, hasAnswer: boolean) {
  const text = typeof solution.text === "string" ? solution.text.trim() : "";
  if (text) return text;
  return hasAnswer ? "NDIE teacher-approved answer key. Explanation was not supplied in the source document." : "";
}

function candidateMarks(candidateJson: CandidateJson) {
  const assessment = asRecord(asRecord(candidateJson).assessment);
  const metadata = asRecord(candidateJson.metadata);
  return Number(assessment.marks ?? metadata.marks);
}

function candidateDifficulty(candidateJson: CandidateJson) {
  const assessment = asRecord(asRecord(candidateJson).assessment);
  const metadata = asRecord(candidateJson.metadata);
  const value = String(assessment.difficulty ?? metadata.difficulty ?? "MEDIUM").toUpperCase();
  return ["EASY", "MEDIUM", "HARD"].includes(value) ? value : "MEDIUM";
}

function contentBlocks(input: {
  candidateId: string;
  questionNumber?: string | null;
  questionType?: string | null;
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
  packageId?: string;
  packageVersion?: number;
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
    questionType: input.questionType === "MULTIPLE_CORRECT_MCQ" ? "MULTIPLE_ANSWER" : input.questionType === "NUMERICAL_ANSWER" || input.questionType === "INTEGER_TYPE" ? "NUMERICAL" : input.questionType === "FILL_BLANK" ? "FILL_BLANK" : input.questionType === "ASSERTION_REASON" ? "ASSERTION_REASON" : input.questionType === "CASE_STUDY" || input.questionType === "PASSAGE_BASED" ? "CASE_STUDY" : input.questionType === "MATCH_THE_FOLLOWING" ? "MATCHING" : input.questionType === "DIAGRAM_BASED" ? "DIAGRAM_LABEL" : input.questionType === "FILE_UPLOAD" ? "FILE_UPLOAD" : "SINGLE_CHOICE",
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
      ndiePackageId: input.packageId,
      ndiePackageVersion: input.packageVersion,
      questionNumber: input.questionNumber || undefined,
      originalQuestionType: input.questionType || undefined,
      aiConfidence: input.confidence ?? undefined,
      reviewStatus: input.reviewStatus
    }
  } satisfies Prisma.InputJsonObject;
}

function assetPackage(assets: Array<{
  id: string;
  assetType: string;
  role: string | null;
  url: string;
  sourceDocumentId: string;
  pageNumber: number | null;
  metadata: Prisma.JsonValue | null;
}>): NdiePublishedAsset[] {
  return assets.map((asset) => ({
    assetId: asset.id,
    assetType: asset.assetType,
    role: asset.role,
    url: asset.url,
    sourceDocumentId: asset.sourceDocumentId,
    pageNumber: asset.pageNumber,
    checksum: typeof asRecord(asset.metadata).checksum === "string" ? String(asRecord(asset.metadata).checksum) : null
  }));
}

function linkIds(candidateJson: CandidateJson, key: string) {
  const metadata = asRecord(candidateJson.metadata);
  const values = [
    ...asArray(metadata[key]),
    ...asArray((candidateJson as Record<string, unknown>)[key])
  ];
  return values.map((value) => String(value)).filter(Boolean);
}

function validationIssues(providerRun: { outputSummary?: Prisma.JsonValue | null } | undefined) {
  const output = asRecord(providerRun?.outputSummary);
  const validation = asRecord(output.validation);
  const issues = asArray(validation.issues).map(asRecord);
  const warnings = asArray(validation.warnings).map(asRecord);
  const readiness = asRecord(validation.publishReadiness);
  return { issues, warnings, readiness };
}

function buildIntegrity(input: {
  importJob: {
    questionCandidates: Array<{ id: string; questionNumber: string | null; questionType: string; reviewStatus: string; candidateJson: Prisma.JsonValue; sourceMap?: Prisma.JsonValue | null }>;
    answerKeyCandidates: Array<{ questionCandidateId?: string | null; questionNumber?: string | null; answerJson: Prisma.JsonValue }>;
    assets: Array<{ id: string; assetType: string; role: string | null; url: string; sourceDocumentId: string; pageNumber: number | null; metadata: Prisma.JsonValue | null }>;
    providerRuns: Array<{ stage: string; outputSummary?: Prisma.JsonValue | null; completedAt?: Date | null; startedAt: Date }>;
  };
  approvedCandidates: Array<{ id: string; questionNumber: string | null; questionType: string; candidateJson: Prisma.JsonValue }>;
}) {
  const issues: NdiePublishIntegrityIssue[] = [];
  const finalStatuses = new Set(["APPROVED", "REJECTED", "SKIPPED"]);
  const pendingCandidates = input.importJob.questionCandidates.filter((candidate) => !finalStatuses.has(candidate.reviewStatus));
  if (pendingCandidates.length) {
    issues.push(issue({
      severity: "CRITICAL",
      issueType: "TEACHER_REVIEW_INCOMPLETE",
      targetId: null,
      reason: `${pendingCandidates.length} question candidate(s) still need teacher review.`,
      blockPublish: true
    }));
  }

  const rejectedCandidates = input.importJob.questionCandidates.filter((candidate) => candidate.reviewStatus === "REJECTED");
  if (rejectedCandidates.length) {
    issues.push(issue({
      severity: "HIGH",
      issueType: "REJECTED_QUESTION",
      targetId: null,
      reason: `${rejectedCandidates.length} rejected question candidate(s) remain in this import. Mark irrelevant candidates as skipped before publishing.`,
      blockPublish: true
    }));
  }

  if (!input.approvedCandidates.length) {
    issues.push(issue({
      severity: "CRITICAL",
      issueType: "EMPTY_PACKAGE",
      targetId: null,
      reason: "No teacher-approved question candidates are available for publishing.",
      blockPublish: true
    }));
  }

  const answers = answerMaps(input.importJob.answerKeyCandidates);
  const assetIds = new Set(input.importJob.assets.map((asset) => asset.id));
  for (const candidate of input.approvedCandidates) {
    const questionType = String(candidate.questionType || "").toUpperCase();
    const answer = answerForCandidate(answers, candidate);
    if (OBJECTIVE_QUESTION_TYPES.has(questionType) && !correctOption(answer)) {
      issues.push(issue({
        severity: "CRITICAL",
        issueType: "MISSING_ANSWER",
        targetId: candidate.id,
        reason: `Question ${candidate.questionNumber || candidate.id} has no publishable answer key.`,
        blockPublish: true
      }));
    }

    const candidateJson = asRecord(candidate.candidateJson) as CandidateJson;
    const candidateValidation = validateCandidateIntegrity({
      questionType: candidate.questionType,
      candidateJson: candidate.candidateJson,
      sourceMap: input.importJob.questionCandidates.find((item) => item.id === candidate.id)?.sourceMap,
      answerJson: answer as Prisma.InputJsonValue,
      availableAssetIds: assetIds
    });
    for (const reason of candidateValidation.errors) {
      issues.push(issue({ severity: "CRITICAL", issueType: "INVALID_CONTENT", targetId: candidate.id, reason, blockPublish: true }));
    }
    const visualLinks = linkIds(candidateJson, "visualLinks");
    const missingVisualLinks = visualLinks.filter((id) => !assetIds.has(id));
    if (missingVisualLinks.length) {
      issues.push(issue({
        severity: "HIGH",
        issueType: "MISSING_ASSET",
        targetId: candidate.id,
        reason: `Question ${candidate.questionNumber || candidate.id} links to missing visual asset(s): ${missingVisualLinks.slice(0, 3).join(", ")}.`,
        blockPublish: true
      }));
    }
  }

  const validation = validationIssues(latestProviderRun(input.importJob.providerRuns, CRITICAL_VALIDATION_STAGES));
  const criticalValidation = validation.issues.filter((item) => String(item.severity || "").toUpperCase() === "CRITICAL");
  if (criticalValidation.length || validation.readiness.status === "BLOCKED") {
    issues.push(issue({
      severity: "CRITICAL",
      issueType: "CRITICAL_VALIDATION",
      targetId: null,
      reason: criticalValidation[0]?.reason ? String(criticalValidation[0].reason) : "Latest NDIE validation blocks publishing.",
      blockPublish: true
    }));
  }

  const blockers = issues.filter((item) => item.blockPublish).length;
  const score = Math.max(0, Math.round((1 - blockers / Math.max(1, input.approvedCandidates.length + 3)) * 100));
  return {
    status: blockers ? "BLOCKED" as const : "READY_FOR_PUBLISH" as const,
    score,
    issues
  };
}

export const ndiePublisherService = {
  async health() {
    const [publishedExams, readyImports, publishRuns, rollbacks] = await Promise.all([
      prisma.ndieImportJob.count({ where: { status: "READY_FOR_STUDENT_DELIVERY" } }),
      prisma.ndieImportJob.count({ where: { status: "READY_FOR_PUBLISH" } }),
      prisma.ndieProviderRun.findMany({
        where: { providerKind: "PUBLISHER", stage: "PUBLISH_COMPLETED", status: "COMPLETED" },
        select: { confidence: true, outputSummary: true, completedAt: true },
        orderBy: { completedAt: "desc" },
        take: 50
      }),
      prisma.ndieRevision.count({ where: { changeType: "PUBLISH_VERSION" } })
    ]);
    const integrityScores = publishRuns
      .map((run) => Number(asRecord(asRecord(run.outputSummary).integrity).score ?? run.confidence ?? 0))
      .filter((score) => Number.isFinite(score));
    const integrityScore = integrityScores.length ? Math.round(integrityScores.reduce((sum, score) => sum + score, 0) / integrityScores.length) : null;
    return {
      provider: "publisher.rich-cbt-compat-v1",
      status: "ready",
      publishedExams,
      publishReadiness: {
        readyImports,
        latestPublishedAt: publishRuns[0]?.completedAt?.toISOString() ?? null
      },
      integrityScore,
      rollbackAvailability: {
        versions: rollbacks,
        supported: true
      }
    };
  },

  async publish(input: NdiePublishInput): Promise<NdiePublishResult> {
    const importJob = await prisma.ndieImportJob.findUnique({
      where: { id: input.importJobId },
      include: {
        sourceDocuments: true,
        assets: true,
        elements: true,
        providerRuns: true,
        revisions: true,
        qualityScores: { orderBy: { createdAt: "desc" }, take: 1 },
        reviewDecisions: true,
        questionCandidates: { orderBy: [{ questionNumber: "asc" }, { createdAt: "asc" }] },
        answerKeyCandidates: true,
        solutionCandidates: true
      }
    });
    if (!importJob) throw Object.assign(new Error("NDIE import not found"), { statusCode: 404 });
    if (importJob.testId) throw Object.assign(new Error("This NDIE import has already been published to CBT."), { statusCode: 409 });

    const approvedCandidates = importJob.questionCandidates.filter((candidate) => candidate.reviewStatus === "APPROVED");
    const integrity = buildIntegrity({ importJob, approvedCandidates });
    if (integrity.status === "BLOCKED") {
      const visible = integrity.issues.filter((item) => item.blockPublish).slice(0, 5).map((item) => item.reason).join(" ");
      throw Object.assign(new Error(`NDIE package is not ready to publish. ${visible}`), { statusCode: 400, integrity });
    }
    if (!approvedCandidates.length) {
      throw Object.assign(new Error("Approve at least one NDIE question candidate before publishing."), { statusCode: 400 });
    }

    const answers = answerMaps(importJob.answerKeyCandidates);
    const solutionMap = solutionByQuestionNumber(importJob.solutionCandidates);
    const sourceDocumentId = importJob.sourceDocuments[0]?.id ?? null;
    const packageId = `ndie-package-${randomUUID()}`;
    const packageVersion = importJob.revisions.filter((revision) => revision.changeType === "PUBLISH_VERSION").length + 1;
    const publishedAssets = assetPackage(importJob.assets);

    const questions = approvedCandidates.map((candidate, index) => {
      const candidateJson = asRecord(candidate.candidateJson) as CandidateJson;
      const blocks = Array.isArray(candidateJson.blocks) ? candidateJson.blocks.map(asRecord) : [];
      const options = optionsFromBlocks(blocks);
      const answer = answerForCandidate(answers, candidate);
      const correctAnswer = correctOption(answer);
      const solution = solutionMap.get(String(candidate.questionNumber || "")) ?? {};
      const page = sourcePage(candidate);
      const coordinates = sourceCoordinates(candidate);
      const questionText = textFromBlocks(blocks) || `Question ${candidate.questionNumber || index + 1}`;
      const explanation = explanationText(solution, Boolean(correctAnswer));
      const visualUrl = firstVisualUrl(blocks);
      const visualReviewRequired = ["DIAGRAM_BASED", "IMAGE_BASED"].includes(candidate.questionType) && !visualUrl;
      const formulaLinks = linkIds(candidateJson, "formulaLinks");
      const visualLinks = linkIds(candidateJson, "visualLinks");
      const layoutLinks = linkIds(candidateJson, "layoutLinks");

      return {
        questionText,
        questionImage: visualUrl,
        visualReviewRequired,
        visualReviewNotes: visualReviewRequired ? ["NDIE detected a visual question without a preserved crop. Attach the source crop before publishing."] as Prisma.InputJsonArray : undefined,
        contentJson: contentBlocks({
          candidateId: candidate.id,
          questionNumber: candidate.questionNumber,
          questionType: candidate.questionType,
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
          reviewStatus: candidate.reviewStatus,
          packageId,
          packageVersion
        }),
        sourceDocumentId: sourceDocumentId || undefined,
        sourcePageNumber: page,
        boundingBoxes: { sourceMap: candidate.sourceMap ?? null, formulaLinks, visualLinks, layoutLinks } as Prisma.InputJsonObject,
        assets: { sourceDocuments: importJob.sourceDocuments.map((doc) => ({ id: doc.id, url: doc.storageUrl, name: doc.originalName, checksum: doc.checksum })), publishedAssets: publishedAssets.filter((asset) => visualLinks.includes(asset.assetId)) } as Prisma.InputJsonObject,
        layout: { ndieCandidateJson: candidate.candidateJson, relationships: candidateJson.relationships ?? [], sourceElementIds: layoutLinks } as Prisma.InputJsonObject,
        renderMode: "NDIE_RICH_V1",
        aiConfidence: candidate.confidence ?? undefined,
        reviewStatus: "APPROVED",
        publishedVersion: packageVersion,
        optionA: options.A,
        optionB: options.B,
        optionC: options.C,
        optionD: options.D,
        correctAnswer,
        explanation,
        marks: candidateMarks(candidateJson),
        negativeMarks: 0,
        difficultyLevel: candidateDifficulty(candidateJson),
        topic: input.topic || importJob.topic || input.subject || importJob.subject || "NDIE Import"
      };
    });

    const richQuestions: NdiePublishedQuestion[] = approvedCandidates.map((candidate, index) => {
      const question = questions[index];
      const candidateJson = asRecord(candidate.candidateJson) as CandidateJson;
      const answer = answerForCandidate(answers, candidate);
      const solution = solutionMap.get(String(candidate.questionNumber || "")) ?? null;
      const formulaLinks = linkIds(candidateJson, "formulaLinks");
      const visualLinks = linkIds(candidateJson, "visualLinks");
      const layoutLinks = linkIds(candidateJson, "layoutLinks");
      const relationships = asArray(candidateJson.relationships).map(asRecord).map((relationship) => ({
        relationshipType: String(relationship.relationshipType || "UNKNOWN"),
        sourceId: candidate.id,
        targetId: String(relationship.targetId || ""),
        confidence: Number.isFinite(Number(relationship.confidence)) ? Number(relationship.confidence) : null,
        sourceReference: asRecord(relationship.sourceReference)
      })).filter((relationship) => relationship.targetId);
      return {
        candidateId: candidate.id,
        questionNumber: candidate.questionNumber,
        questionType: candidate.questionType as NdiePublishedQuestion["questionType"],
        revision: packageVersion,
        reviewStatus: "APPROVED",
        confidence: candidate.confidence ?? null,
        contentJson: question.contentJson as Record<string, unknown>,
        sourceReferences: asArray(asRecord(question.contentJson).sourceReferences).map(asRecord),
        formulaLinks,
        visualLinks,
        layoutLinks,
        relationships,
        evaluationRule: answer ? { answerKey: answer, markingRule: asRecord(answer.markingRule) } : null,
        answer: answer ? asRecord(answer.answerJson) : null,
        solution: solution ? asRecord(solution.solutionJson) : null,
        renderHints: { mode: "NDIE_RICH_V1", legacyProjection: "A_D_COMPATIBLE", formulaRenderer: "KaTeX", imageZoom: true },
        accessibility: { altTextRequired: visualLinks.length > 0, keyboardNavigable: true, screenReaderFallback: question.questionText },
        checksums: {
          candidate: stableChecksum(candidate.candidateJson),
          content: stableChecksum(question.contentJson)
        }
      };
    });

    const packageTitle = input.title || `${importJob.subject || "NDIE"} Imported Exam`;
    const examPackage: NdieExamPackage = {
      schemaVersion: "ndie-rich-exam-package-v1",
      packageId,
      importJobId: importJob.id,
      testId: null,
      version: packageVersion,
      title: packageTitle,
      subject: input.subject || importJob.subject || null,
      topic: input.topic || importJob.topic || null,
      batchId: input.batchId || importJob.batchId || null,
      createdAt: new Date().toISOString(),
      createdBy: input.requester.id,
      pipelineVersion: importJob.pipelineVersion,
      sourceDocuments: importJob.sourceDocuments.map((doc) => ({
        id: doc.id,
        originalName: doc.originalName,
        fileType: doc.fileType,
        checksum: doc.checksum,
        storageUrl: doc.storageUrl
      })),
      metadata: {
        reviewDecisions: importJob.reviewDecisions.length,
        validation: validationIssues(latestProviderRun(importJob.providerRuns, CRITICAL_VALIDATION_STAGES)).readiness,
        quality: importJob.qualityScores[0] ?? null
      },
      questions: richQuestions,
      assets: publishedAssets,
      integrity,
      accessibility: { formulasHaveFallbacks: true, visualsHaveSourceReferences: true, supportsZoom: true },
      checksums: {
        sourceDocuments: stableChecksum(importJob.sourceDocuments.map((doc) => ({ id: doc.id, checksum: doc.checksum }))),
        questions: stableChecksum(richQuestions),
        assets: stableChecksum(publishedAssets)
      }
    };
    const packageChecksum = stableChecksum(examPackage);

    const payload: TestPayload = {
      title: packageTitle,
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

    const test = await testsService.publishDraft(input.requester, {
      ...payload,
      approvalAttestation: "TEACHER_REVIEW_CONFIRMED",
      approvalReferenceId: `ndie:${importJob.id}`,
    });
    const createdQuestions = await prisma.question.findMany({ where: { testId: test.id } });
    const questionByCandidateId = new Map<string, string>();
    for (const question of createdQuestions) {
      const metadata = asRecord(asRecord(question.contentJson).metadata);
      const candidateId = typeof metadata.ndieCandidateId === "string" ? metadata.ndieCandidateId : "";
      if (candidateId) questionByCandidateId.set(candidateId, question.id);
    }

    const finalizedPackage = {
      ...examPackage,
      testId: test.id,
      checksums: {
        ...examPackage.checksums,
        package: packageChecksum,
        publishedTest: stableChecksum({ testId: test.id, questions: createdQuestions.map((question) => question.id) })
      }
    } satisfies NdieExamPackage;

    await prisma.$transaction([
      prisma.ndieImportJob.update({
        where: { id: importJob.id },
        data: {
          testId: test.id,
          status: "READY_FOR_STUDENT_DELIVERY",
          currentCheckpoint: "READY_FOR_STUDENT_DELIVERY",
          reviewStatus: "PUBLISHED",
          teacherSummary: {
            ...asRecord(importJob.teacherSummary),
            publishedTestId: test.id,
            publishedQuestions: createdQuestions.length,
            publishedAt: new Date().toISOString(),
            packageId,
            packageVersion,
            integrityScore: integrity.score,
            publishStatus: "READY_FOR_STUDENT_DELIVERY"
          } as Prisma.InputJsonValue
        }
      }),
      prisma.ndieRevision.create({
        data: {
          importJobId: importJob.id,
          revision: packageVersion,
          changeType: "PUBLISH_VERSION",
          changeReason: "Immutable rich exam package published to CBT.",
          snapshot: finalizedPackage as Prisma.InputJsonValue,
          changedBy: input.requester.id,
          changedByRole: input.requester.role
        }
      }),
      prisma.ndieProviderRun.create({
        data: {
          importJobId: importJob.id,
          providerId: "publisher.rich-cbt-compat-v1",
          providerKind: "PUBLISHER",
          stage: "PUBLISH_COMPLETED",
          status: "COMPLETED",
          inputSummary: {
            approvedCandidates: approvedCandidates.length,
            sourceDocuments: importJob.sourceDocuments.length,
            assets: publishedAssets.length
          } as Prisma.InputJsonValue,
          outputSummary: {
            packageId,
            packageVersion,
            testId: test.id,
            questionsPublished: createdQuestions.length,
            integrity,
            checksum: finalizedPackage.checksums.package
          } as Prisma.InputJsonValue,
          confidence: integrity.score / 100,
          completedAt: new Date()
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
      packageId,
      packageVersion,
      questionsPublished: createdQuestions.length,
      status: "READY_FOR_STUDENT_DELIVERY",
      integrityScore: integrity.score
    };
  }
};

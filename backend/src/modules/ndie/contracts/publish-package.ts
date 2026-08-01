import type { NdieQuestionType } from "./assessment-result.js";

export type NdiePublishReadinessStatus = "READY_FOR_PUBLISH" | "BLOCKED";

export type NdiePublishIntegritySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NdiePublishIntegrityIssue = {
  issueId: string;
  severity: NdiePublishIntegritySeverity;
  issueType:
    | "TEACHER_REVIEW_INCOMPLETE"
    | "CRITICAL_VALIDATION"
    | "MISSING_ANSWER"
    | "BROKEN_RELATIONSHIP"
    | "MISSING_ASSET"
    | "REJECTED_QUESTION"
    | "INVALID_CONTENT"
    | "EMPTY_PACKAGE";
  targetId: string | null;
  reason: string;
  blockPublish: boolean;
};

export type NdiePublishedAsset = {
  assetId: string;
  assetType: string;
  role: string | null;
  url: string;
  sourceDocumentId: string | null;
  pageNumber: number | null;
  checksum: string | null;
};

export type NdiePublishedRelationship = {
  relationshipType: string;
  sourceId: string;
  targetId: string;
  confidence: number | null;
  sourceReference?: Record<string, unknown> | null;
};

export type NdiePublishedQuestion = {
  candidateId: string;
  questionNumber: string | null;
  questionType: NdieQuestionType | "UNKNOWN";
  revision: number;
  reviewStatus: "APPROVED";
  confidence: number | null;
  contentJson: Record<string, unknown>;
  sourceReferences: Record<string, unknown>[];
  formulaLinks: string[];
  visualLinks: string[];
  layoutLinks: string[];
  relationships: NdiePublishedRelationship[];
  evaluationRule: Record<string, unknown> | null;
  answer: Record<string, unknown> | null;
  solution: Record<string, unknown> | null;
  renderHints: Record<string, unknown>;
  accessibility: Record<string, unknown>;
  checksums: Record<string, string>;
};

export type NdieExamPackage = {
  schemaVersion: "ndie-rich-exam-package-v1";
  packageId: string;
  importJobId: string;
  testId: string | null;
  version: number;
  title: string;
  subject: string | null;
  topic: string | null;
  batchId: string | null;
  createdAt: string;
  createdBy: string;
  pipelineVersion: string;
  sourceDocuments: Array<{
    id: string;
    originalName: string;
    fileType: string;
    checksum: string | null;
    storageUrl: string;
  }>;
  metadata: Record<string, unknown>;
  questions: NdiePublishedQuestion[];
  assets: NdiePublishedAsset[];
  integrity: {
    status: NdiePublishReadinessStatus;
    score: number;
    issues: NdiePublishIntegrityIssue[];
  };
  accessibility: Record<string, unknown>;
  checksums: Record<string, string>;
};

export type NdiePublishResult = {
  importJobId: string;
  testId: string;
  packageId: string;
  packageVersion: number;
  questionsPublished: number;
  status: "READY_FOR_STUDENT_DELIVERY";
  integrityScore: number;
};

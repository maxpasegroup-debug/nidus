CREATE TABLE IF NOT EXISTS "NdieImportJob" (
  "id" TEXT NOT NULL,
  "legacyImportJobId" TEXT,
  "examId" TEXT,
  "testId" TEXT,
  "batchId" TEXT,
  "subject" TEXT,
  "topic" TEXT,
  "sourceKind" TEXT NOT NULL DEFAULT 'QUESTION_PAPER',
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "pipelineVersion" TEXT NOT NULL DEFAULT '1.0-foundation',
  "manifest" JSONB,
  "checkpoints" JSONB,
  "currentCheckpoint" TEXT,
  "qualitySummary" JSONB,
  "providerSummary" JSONB,
  "teacherSummary" JSONB,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NdieImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieSourceDocument" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "sourceKind" TEXT NOT NULL DEFAULT 'QUESTION_PAPER',
  "originalName" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageProvider" TEXT NOT NULL DEFAULT 'cloudinary',
  "storageUrl" TEXT NOT NULL,
  "storagePublicId" TEXT NOT NULL,
  "checksum" TEXT,
  "documentClass" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "pipeline" TEXT NOT NULL DEFAULT 'UNCLASSIFIED',
  "classification" JSONB,
  "pageCount" INTEGER,
  "preservationState" TEXT NOT NULL DEFAULT 'PRESERVED',
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NdieSourceDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdiePage" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "sourceDocumentId" TEXT NOT NULL,
  "pageNumber" INTEGER NOT NULL,
  "width" DOUBLE PRECISION,
  "height" DOUBLE PRECISION,
  "rotation" DOUBLE PRECISION,
  "renderStatus" TEXT NOT NULL DEFAULT 'PENDING_RENDER',
  "imageUrl" TEXT,
  "imagePublicId" TEXT,
  "thumbnailUrl" TEXT,
  "ocrStatus" TEXT NOT NULL DEFAULT 'PENDING_OCR',
  "ocrText" TEXT,
  "ocrJson" JSONB,
  "layoutJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NdiePage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdiePageAsset" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "sourceDocumentId" TEXT NOT NULL,
  "pageId" TEXT,
  "assetType" TEXT NOT NULL,
  "role" TEXT,
  "pageNumber" INTEGER,
  "coordinates" JSONB,
  "storageProvider" TEXT NOT NULL DEFAULT 'cloudinary',
  "url" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdiePageAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieElement" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "sourceDocumentId" TEXT NOT NULL,
  "pageId" TEXT,
  "pageNumber" INTEGER NOT NULL,
  "elementType" TEXT NOT NULL,
  "text" TEXT,
  "normalizedText" TEXT,
  "coordinates" JSONB NOT NULL,
  "readingOrder" INTEGER,
  "confidence" DOUBLE PRECISION,
  "providerId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdieElement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieQuestionCandidate" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "questionNumber" TEXT,
  "questionType" TEXT NOT NULL DEFAULT 'MCQ',
  "candidateJson" JSONB NOT NULL,
  "sourceMap" JSONB,
  "confidence" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "approvedQuestionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NdieQuestionCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieAnswerKeyCandidate" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "sourceDocumentId" TEXT,
  "questionNumber" TEXT,
  "answerJson" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'PENDING_MAPPING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdieAnswerKeyCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieSolutionCandidate" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "sourceDocumentId" TEXT,
  "questionNumber" TEXT,
  "solutionJson" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'PENDING_MAPPING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdieSolutionCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieReviewDecision" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "questionCandidateId" TEXT,
  "decision" TEXT NOT NULL,
  "notes" TEXT,
  "snapshot" JSONB,
  "reviewedBy" TEXT NOT NULL,
  "reviewedByRole" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdieReviewDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieRevision" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "questionCandidateId" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "changeType" TEXT NOT NULL,
  "changeReason" TEXT,
  "snapshot" JSONB NOT NULL,
  "changedBy" TEXT,
  "changedByRole" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdieRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieReplayRun" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "requestedBy" TEXT,
  "fromVersion" TEXT,
  "toVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "checkpoint" TEXT,
  "comparisonJson" JSONB,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "NdieReplayRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieQualityScore" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "overall" DOUBLE PRECISION NOT NULL,
  "grade" TEXT NOT NULL,
  "ocrConfidence" DOUBLE PRECISION,
  "formulaAccuracy" DOUBLE PRECISION,
  "layoutAccuracy" DOUBLE PRECISION,
  "tableAccuracy" DOUBLE PRECISION,
  "diagramPreservation" DOUBLE PRECISION,
  "optionCompleteness" DOUBLE PRECISION,
  "answerKeyConfidence" DOUBLE PRECISION,
  "aiConfidence" DOUBLE PRECISION,
  "teacherReviewCompletion" DOUBLE PRECISION,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NdieQualityScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NdieProviderRun" (
  "id" TEXT NOT NULL,
  "importJobId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "providerKind" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "inputSummary" JSONB,
  "outputSummary" JSONB,
  "confidence" DOUBLE PRECISION,
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "NdieProviderRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NdieImportJob_legacyImportJobId_idx" ON "NdieImportJob"("legacyImportJobId");
CREATE INDEX IF NOT EXISTS "NdieImportJob_examId_idx" ON "NdieImportJob"("examId");
CREATE INDEX IF NOT EXISTS "NdieImportJob_testId_idx" ON "NdieImportJob"("testId");
CREATE INDEX IF NOT EXISTS "NdieImportJob_batchId_idx" ON "NdieImportJob"("batchId");
CREATE INDEX IF NOT EXISTS "NdieImportJob_uploadedBy_idx" ON "NdieImportJob"("uploadedBy");
CREATE INDEX IF NOT EXISTS "NdieImportJob_status_idx" ON "NdieImportJob"("status");
CREATE INDEX IF NOT EXISTS "NdieImportJob_reviewStatus_idx" ON "NdieImportJob"("reviewStatus");
CREATE INDEX IF NOT EXISTS "NdieImportJob_sourceKind_idx" ON "NdieImportJob"("sourceKind");
CREATE INDEX IF NOT EXISTS "NdieImportJob_pipelineVersion_idx" ON "NdieImportJob"("pipelineVersion");
CREATE INDEX IF NOT EXISTS "NdieImportJob_batchId_createdAt_idx" ON "NdieImportJob"("batchId", "createdAt");

CREATE INDEX IF NOT EXISTS "NdieSourceDocument_importJobId_idx" ON "NdieSourceDocument"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieSourceDocument_sourceKind_idx" ON "NdieSourceDocument"("sourceKind");
CREATE INDEX IF NOT EXISTS "NdieSourceDocument_documentClass_idx" ON "NdieSourceDocument"("documentClass");
CREATE INDEX IF NOT EXISTS "NdieSourceDocument_pipeline_idx" ON "NdieSourceDocument"("pipeline");
CREATE INDEX IF NOT EXISTS "NdieSourceDocument_storagePublicId_idx" ON "NdieSourceDocument"("storagePublicId");

CREATE UNIQUE INDEX IF NOT EXISTS "NdiePage_sourceDocumentId_pageNumber_key" ON "NdiePage"("sourceDocumentId", "pageNumber");
CREATE INDEX IF NOT EXISTS "NdiePage_importJobId_idx" ON "NdiePage"("importJobId");
CREATE INDEX IF NOT EXISTS "NdiePage_sourceDocumentId_idx" ON "NdiePage"("sourceDocumentId");
CREATE INDEX IF NOT EXISTS "NdiePage_renderStatus_idx" ON "NdiePage"("renderStatus");
CREATE INDEX IF NOT EXISTS "NdiePage_ocrStatus_idx" ON "NdiePage"("ocrStatus");

CREATE INDEX IF NOT EXISTS "NdiePageAsset_importJobId_idx" ON "NdiePageAsset"("importJobId");
CREATE INDEX IF NOT EXISTS "NdiePageAsset_sourceDocumentId_idx" ON "NdiePageAsset"("sourceDocumentId");
CREATE INDEX IF NOT EXISTS "NdiePageAsset_pageId_idx" ON "NdiePageAsset"("pageId");
CREATE INDEX IF NOT EXISTS "NdiePageAsset_assetType_idx" ON "NdiePageAsset"("assetType");
CREATE INDEX IF NOT EXISTS "NdiePageAsset_role_idx" ON "NdiePageAsset"("role");

CREATE INDEX IF NOT EXISTS "NdieElement_importJobId_idx" ON "NdieElement"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieElement_sourceDocumentId_idx" ON "NdieElement"("sourceDocumentId");
CREATE INDEX IF NOT EXISTS "NdieElement_pageId_idx" ON "NdieElement"("pageId");
CREATE INDEX IF NOT EXISTS "NdieElement_elementType_idx" ON "NdieElement"("elementType");
CREATE INDEX IF NOT EXISTS "NdieElement_pageNumber_readingOrder_idx" ON "NdieElement"("pageNumber", "readingOrder");

CREATE INDEX IF NOT EXISTS "NdieQuestionCandidate_importJobId_idx" ON "NdieQuestionCandidate"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieQuestionCandidate_questionNumber_idx" ON "NdieQuestionCandidate"("questionNumber");
CREATE INDEX IF NOT EXISTS "NdieQuestionCandidate_questionType_idx" ON "NdieQuestionCandidate"("questionType");
CREATE INDEX IF NOT EXISTS "NdieQuestionCandidate_status_idx" ON "NdieQuestionCandidate"("status");
CREATE INDEX IF NOT EXISTS "NdieQuestionCandidate_reviewStatus_idx" ON "NdieQuestionCandidate"("reviewStatus");
CREATE INDEX IF NOT EXISTS "NdieQuestionCandidate_approvedQuestionId_idx" ON "NdieQuestionCandidate"("approvedQuestionId");

CREATE INDEX IF NOT EXISTS "NdieAnswerKeyCandidate_importJobId_idx" ON "NdieAnswerKeyCandidate"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieAnswerKeyCandidate_sourceDocumentId_idx" ON "NdieAnswerKeyCandidate"("sourceDocumentId");
CREATE INDEX IF NOT EXISTS "NdieAnswerKeyCandidate_questionNumber_idx" ON "NdieAnswerKeyCandidate"("questionNumber");
CREATE INDEX IF NOT EXISTS "NdieAnswerKeyCandidate_status_idx" ON "NdieAnswerKeyCandidate"("status");

CREATE INDEX IF NOT EXISTS "NdieSolutionCandidate_importJobId_idx" ON "NdieSolutionCandidate"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieSolutionCandidate_sourceDocumentId_idx" ON "NdieSolutionCandidate"("sourceDocumentId");
CREATE INDEX IF NOT EXISTS "NdieSolutionCandidate_questionNumber_idx" ON "NdieSolutionCandidate"("questionNumber");
CREATE INDEX IF NOT EXISTS "NdieSolutionCandidate_status_idx" ON "NdieSolutionCandidate"("status");

CREATE INDEX IF NOT EXISTS "NdieReviewDecision_importJobId_idx" ON "NdieReviewDecision"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieReviewDecision_questionCandidateId_idx" ON "NdieReviewDecision"("questionCandidateId");
CREATE INDEX IF NOT EXISTS "NdieReviewDecision_decision_idx" ON "NdieReviewDecision"("decision");
CREATE INDEX IF NOT EXISTS "NdieReviewDecision_reviewedBy_idx" ON "NdieReviewDecision"("reviewedBy");

CREATE INDEX IF NOT EXISTS "NdieRevision_importJobId_idx" ON "NdieRevision"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieRevision_questionCandidateId_idx" ON "NdieRevision"("questionCandidateId");
CREATE INDEX IF NOT EXISTS "NdieRevision_changeType_idx" ON "NdieRevision"("changeType");
CREATE INDEX IF NOT EXISTS "NdieRevision_changedBy_idx" ON "NdieRevision"("changedBy");

CREATE INDEX IF NOT EXISTS "NdieReplayRun_importJobId_idx" ON "NdieReplayRun"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieReplayRun_requestedBy_idx" ON "NdieReplayRun"("requestedBy");
CREATE INDEX IF NOT EXISTS "NdieReplayRun_status_idx" ON "NdieReplayRun"("status");

CREATE INDEX IF NOT EXISTS "NdieQualityScore_importJobId_idx" ON "NdieQualityScore"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieQualityScore_grade_idx" ON "NdieQualityScore"("grade");

CREATE INDEX IF NOT EXISTS "NdieProviderRun_importJobId_idx" ON "NdieProviderRun"("importJobId");
CREATE INDEX IF NOT EXISTS "NdieProviderRun_providerId_idx" ON "NdieProviderRun"("providerId");
CREATE INDEX IF NOT EXISTS "NdieProviderRun_providerKind_idx" ON "NdieProviderRun"("providerKind");
CREATE INDEX IF NOT EXISTS "NdieProviderRun_stage_idx" ON "NdieProviderRun"("stage");
CREATE INDEX IF NOT EXISTS "NdieProviderRun_status_idx" ON "NdieProviderRun"("status");

ALTER TABLE "NdieSourceDocument" ADD CONSTRAINT "NdieSourceDocument_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdiePage" ADD CONSTRAINT "NdiePage_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdiePage" ADD CONSTRAINT "NdiePage_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "NdieSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdiePageAsset" ADD CONSTRAINT "NdiePageAsset_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdiePageAsset" ADD CONSTRAINT "NdiePageAsset_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "NdieSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdiePageAsset" ADD CONSTRAINT "NdiePageAsset_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "NdiePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdieElement" ADD CONSTRAINT "NdieElement_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieElement" ADD CONSTRAINT "NdieElement_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "NdieSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieElement" ADD CONSTRAINT "NdieElement_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "NdiePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdieQuestionCandidate" ADD CONSTRAINT "NdieQuestionCandidate_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieAnswerKeyCandidate" ADD CONSTRAINT "NdieAnswerKeyCandidate_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieSolutionCandidate" ADD CONSTRAINT "NdieSolutionCandidate_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieReviewDecision" ADD CONSTRAINT "NdieReviewDecision_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieReviewDecision" ADD CONSTRAINT "NdieReviewDecision_questionCandidateId_fkey" FOREIGN KEY ("questionCandidateId") REFERENCES "NdieQuestionCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdieRevision" ADD CONSTRAINT "NdieRevision_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieRevision" ADD CONSTRAINT "NdieRevision_questionCandidateId_fkey" FOREIGN KEY ("questionCandidateId") REFERENCES "NdieQuestionCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdieReplayRun" ADD CONSTRAINT "NdieReplayRun_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieQualityScore" ADD CONSTRAINT "NdieQualityScore_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdieProviderRun" ADD CONSTRAINT "NdieProviderRun_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "NdieImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

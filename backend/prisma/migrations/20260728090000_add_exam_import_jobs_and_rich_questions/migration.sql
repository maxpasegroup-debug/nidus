ALTER TABLE "Question"
ADD COLUMN IF NOT EXISTS "contentJson" JSONB,
ADD COLUMN IF NOT EXISTS "sourceDocumentId" TEXT,
ADD COLUMN IF NOT EXISTS "sourcePageNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "boundingBoxes" JSONB,
ADD COLUMN IF NOT EXISTS "latex" JSONB,
ADD COLUMN IF NOT EXISTS "assets" JSONB,
ADD COLUMN IF NOT EXISTS "layout" JSONB,
ADD COLUMN IF NOT EXISTS "renderMode" TEXT NOT NULL DEFAULT 'LEGACY_MCQ',
ADD COLUMN IF NOT EXISTS "aiConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN IF NOT EXISTS "publishedVersion" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "Question_sourceDocumentId_idx" ON "Question"("sourceDocumentId");
CREATE INDEX IF NOT EXISTS "Question_renderMode_idx" ON "Question"("renderMode");
CREATE INDEX IF NOT EXISTS "Question_reviewStatus_idx" ON "Question"("reviewStatus");

CREATE TABLE IF NOT EXISTS "ExamImportJob" (
  "id" TEXT NOT NULL,
  "examId" TEXT,
  "testId" TEXT,
  "batchId" TEXT,
  "subject" TEXT,
  "topic" TEXT,
  "sourceKind" TEXT NOT NULL DEFAULT 'QUESTION_PAPER',
  "originalName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "cloudinaryUrl" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "documentClass" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "pipeline" TEXT NOT NULL DEFAULT 'UNCLASSIFIED',
  "status" TEXT NOT NULL DEFAULT 'CLASSIFIED',
  "classification" JSONB,
  "pageImages" JSONB,
  "rawText" TEXT,
  "rawOcr" JSONB,
  "layoutJson" JSONB,
  "aiResult" JSONB,
  "teacherEdits" JSONB,
  "confidence" DOUBLE PRECISION,
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "manualReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExamImportJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExamImportJob_examId_idx" ON "ExamImportJob"("examId");
CREATE INDEX IF NOT EXISTS "ExamImportJob_testId_idx" ON "ExamImportJob"("testId");
CREATE INDEX IF NOT EXISTS "ExamImportJob_batchId_idx" ON "ExamImportJob"("batchId");
CREATE INDEX IF NOT EXISTS "ExamImportJob_uploadedBy_idx" ON "ExamImportJob"("uploadedBy");
CREATE INDEX IF NOT EXISTS "ExamImportJob_documentClass_idx" ON "ExamImportJob"("documentClass");
CREATE INDEX IF NOT EXISTS "ExamImportJob_pipeline_idx" ON "ExamImportJob"("pipeline");
CREATE INDEX IF NOT EXISTS "ExamImportJob_status_idx" ON "ExamImportJob"("status");
CREATE INDEX IF NOT EXISTS "ExamImportJob_reviewStatus_idx" ON "ExamImportJob"("reviewStatus");
CREATE INDEX IF NOT EXISTS "ExamImportJob_batchId_createdAt_idx" ON "ExamImportJob"("batchId", "createdAt");
CREATE INDEX IF NOT EXISTS "ExamImportJob_batchId_reviewStatus_idx" ON "ExamImportJob"("batchId", "reviewStatus");
CREATE INDEX IF NOT EXISTS "ExamImportJob_documentClass_reviewStatus_idx" ON "ExamImportJob"("documentClass", "reviewStatus");

ALTER TABLE "ExamUpload"
ADD COLUMN IF NOT EXISTS "importJobId" TEXT,
ADD COLUMN IF NOT EXISTS "documentClass" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN IF NOT EXISTS "pipeline" TEXT NOT NULL DEFAULT 'UNCLASSIFIED',
ADD COLUMN IF NOT EXISTS "classification" JSONB;

CREATE INDEX IF NOT EXISTS "ExamUpload_importJobId_idx" ON "ExamUpload"("importJobId");
CREATE INDEX IF NOT EXISTS "ExamUpload_documentClass_idx" ON "ExamUpload"("documentClass");
CREATE INDEX IF NOT EXISTS "ExamUpload_pipeline_idx" ON "ExamUpload"("pipeline");
CREATE INDEX IF NOT EXISTS "ExamUpload_batchId_createdAt_idx" ON "ExamUpload"("batchId", "createdAt");
CREATE INDEX IF NOT EXISTS "ExamUpload_examId_sourceKind_idx" ON "ExamUpload"("examId", "sourceKind");
CREATE INDEX IF NOT EXISTS "ExamUpload_importJobId_sourceKind_idx" ON "ExamUpload"("importJobId", "sourceKind");

CREATE TABLE IF NOT EXISTS "QuestionVersion" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "changeType" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "changeReason" TEXT,
  "changedById" TEXT,
  "changedByRole" TEXT,
  "questionText" TEXT NOT NULL,
  "questionImage" TEXT,
  "contentJson" JSONB,
  "optionsSnapshot" JSONB NOT NULL,
  "answerSnapshot" JSONB NOT NULL,
  "explanation" TEXT,
  "renderMode" TEXT NOT NULL DEFAULT 'LEGACY_MCQ',
  "aiConfidence" DOUBLE PRECISION,
  "reviewStatus" TEXT NOT NULL DEFAULT 'APPROVED',
  "sourceDocumentId" TEXT,
  "sourcePageNumber" INTEGER,
  "boundingBoxes" JSONB,
  "latex" JSONB,
  "assets" JSONB,
  "layout" JSONB,
  "metadataSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuestionVersion_questionId_version_key" ON "QuestionVersion"("questionId", "version");
CREATE INDEX IF NOT EXISTS "QuestionVersion_questionId_idx" ON "QuestionVersion"("questionId");
CREATE INDEX IF NOT EXISTS "QuestionVersion_testId_idx" ON "QuestionVersion"("testId");
CREATE INDEX IF NOT EXISTS "QuestionVersion_changedById_idx" ON "QuestionVersion"("changedById");
CREATE INDEX IF NOT EXISTS "QuestionVersion_changeType_idx" ON "QuestionVersion"("changeType");
CREATE INDEX IF NOT EXISTS "QuestionVersion_reviewStatus_idx" ON "QuestionVersion"("reviewStatus");

ALTER TABLE "QuestionVersion"
ADD CONSTRAINT "QuestionVersion_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionVersion"
ADD CONSTRAINT "QuestionVersion_testId_fkey"
FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionVersion"
ADD CONSTRAINT "QuestionVersion_changedById_fkey"
FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "QuestionVersion"
("id", "questionId", "testId", "version", "changeType", "changeReason", "questionText", "questionImage", "contentJson", "optionsSnapshot", "answerSnapshot", "explanation", "renderMode", "aiConfidence", "reviewStatus", "sourceDocumentId", "sourcePageNumber", "boundingBoxes", "latex", "assets", "layout", "metadataSnapshot", "createdAt")
SELECT
  gen_random_uuid()::text,
  q."id",
  q."testId",
  COALESCE(q."publishedVersion", 1),
  'MIGRATED',
  'Initial version created during NDIE question versioning rollout.',
  q."questionText",
  q."questionImage",
  q."contentJson",
  jsonb_build_object('A', q."optionA", 'B', q."optionB", 'C', q."optionC", 'D', q."optionD"),
  jsonb_build_object('type', 'SINGLE_CHOICE', 'correctAnswer', q."correctAnswer"),
  q."explanation",
  COALESCE(q."renderMode", 'LEGACY_MCQ'),
  q."aiConfidence",
  COALESCE(q."reviewStatus", 'APPROVED'),
  q."sourceDocumentId",
  q."sourcePageNumber",
  q."boundingBoxes",
  q."latex",
  q."assets",
  q."layout",
  jsonb_build_object('topic', q."topic", 'difficultyLevel', q."difficultyLevel", 'marks', q."marks", 'negativeMarks', q."negativeMarks", 'source', 'MIGRATION'),
  CURRENT_TIMESTAMP
FROM "Question" q
WHERE NOT EXISTS (
  SELECT 1 FROM "QuestionVersion" qv WHERE qv."questionId" = q."id" AND qv."version" = COALESCE(q."publishedVersion", 1)
);

DO $$ BEGIN
  CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PILOT', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'RETIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AssessmentQuestionType" AS ENUM ('BEHAVIOURAL', 'SITUATIONAL', 'DECISION', 'PRESSURE', 'LEADERSHIP', 'GROUP_DYNAMICS', 'DISCIPLINE', 'EXAM', 'FITNESS', 'SSB', 'RANK_PREDICTION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AssessmentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AssessmentArenaAssessment" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "description" TEXT,
  "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
  "recommendedMinutes" INTEGER,
  "minimumQuestionBank" INTEGER NOT NULL DEFAULT 0,
  "recommendedQuestionBank" INTEGER NOT NULL DEFAULT 0,
  "idealQuestionBank" INTEGER NOT NULL DEFAULT 0,
  "questionsPerAttempt" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentArenaAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentTrait" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "definition" TEXT,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "isMandatory" BOOLEAN NOT NULL DEFAULT false,
  "isCritical" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentTrait_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentDimension" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "traitId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "definition" TEXT,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "minimumQuestions" INTEGER NOT NULL DEFAULT 0,
  "recommendedQuestions" INTEGER NOT NULL DEFAULT 0,
  "idealQuestions" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentDimension_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentQuestion" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "traitId" TEXT NOT NULL,
  "dimensionId" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "instructionText" TEXT,
  "questionType" "AssessmentQuestionType" NOT NULL,
  "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
  "programRelevance" JSONB NOT NULL,
  "serviceRelevance" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
  "authorId" TEXT,
  "authorRole" TEXT,
  "reviewerId" TEXT,
  "seniorReviewerId" TEXT,
  "approvalBoard" TEXT,
  "exposureCount" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "retiredAt" TIMESTAMP(3),
  "retirementReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentQuestionOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "optionText" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 1,
  "rawScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reverseScore" DOUBLE PRECISION,
  "integrityWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "riskWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "readinessWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "dimensionWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "traitWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "flags" JSONB,
  "interpretationHint" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentQuestionOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentQuestionVersion" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "questionText" TEXT NOT NULL,
  "optionsSnapshot" JSONB,
  "metadataSnapshot" JSONB NOT NULL,
  "changedBy" TEXT,
  "changeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentQuestionVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentQuestionReview" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "reviewerId" TEXT,
  "reviewerRole" TEXT NOT NULL,
  "boardType" TEXT,
  "status" "AssessmentReviewStatus" NOT NULL DEFAULT 'PENDING',
  "comments" TEXT,
  "score" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentQuestionReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentReviewBoard" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT,
  "name" TEXT NOT NULL,
  "boardType" TEXT NOT NULL,
  "responsibilities" JSONB,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentReviewBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentPilotRun" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "sampleSize" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "validationMetrics" JSONB,
  "acceptanceNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentPilotRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentPilotResponse" (
  "id" TEXT NOT NULL,
  "pilotRunId" TEXT NOT NULL,
  "questionId" TEXT,
  "participantId" TEXT,
  "response" JSONB NOT NULL,
  "metrics" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentPilotResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentAttempt" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "assessmentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "integrityScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata" JSONB,
  CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentQuestionExposure" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "userId" TEXT,
  "attemptId" TEXT,
  "questionVersion" INTEGER NOT NULL,
  "exposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentQuestionExposure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentAttemptQuestion" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "questionVersion" INTEGER NOT NULL,
  "displayOrder" INTEGER NOT NULL,
  "questionSnapshot" JSONB NOT NULL,
  "optionsSnapshot" JSONB,
  "answered" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentAttemptQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentAnswer" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "attemptQuestionId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "optionId" TEXT,
  "answerText" TEXT,
  "rawScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "scoredMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentTraitScore" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "traitId" TEXT NOT NULL,
  "rawScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentTraitScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentDimensionScore" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "dimensionId" TEXT NOT NULL,
  "rawScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentDimensionScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentIntegritySignal" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "signalType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "scorePenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentIntegritySignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentRiskSignal" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "riskType" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentRiskSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentGrowthSnapshot" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT,
  "userId" TEXT NOT NULL,
  "dayLabel" TEXT NOT NULL,
  "baselineAttemptId" TEXT,
  "currentAttemptId" TEXT,
  "growthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "comparisonData" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentGrowthSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentRankPrediction" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT,
  "attemptId" TEXT,
  "userId" TEXT NOT NULL,
  "predictionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "predictionBand" TEXT NOT NULL,
  "inputSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentRankPrediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssessmentReportSnapshot" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "report" JSONB NOT NULL,
  "scoring" JSONB NOT NULL,
  "recommendations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentReportSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentArenaAssessment_slug_key" ON "AssessmentArenaAssessment"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentArenaAssessment_name_key" ON "AssessmentArenaAssessment"("name");
CREATE INDEX IF NOT EXISTS "AssessmentArenaAssessment_status_idx" ON "AssessmentArenaAssessment"("status");
CREATE INDEX IF NOT EXISTS "AssessmentArenaAssessment_level_idx" ON "AssessmentArenaAssessment"("level");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentTrait_assessmentId_name_key" ON "AssessmentTrait"("assessmentId", "name");
CREATE INDEX IF NOT EXISTS "AssessmentTrait_assessmentId_idx" ON "AssessmentTrait"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentTrait_isCritical_idx" ON "AssessmentTrait"("isCritical");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentDimension_traitId_name_key" ON "AssessmentDimension"("traitId", "name");
CREATE INDEX IF NOT EXISTS "AssessmentDimension_assessmentId_idx" ON "AssessmentDimension"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentDimension_traitId_idx" ON "AssessmentDimension"("traitId");

CREATE INDEX IF NOT EXISTS "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestion_traitId_idx" ON "AssessmentQuestion"("traitId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestion_dimensionId_idx" ON "AssessmentQuestion"("dimensionId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestion_status_idx" ON "AssessmentQuestion"("status");
CREATE INDEX IF NOT EXISTS "AssessmentQuestion_questionType_idx" ON "AssessmentQuestion"("questionType");
CREATE INDEX IF NOT EXISTS "AssessmentQuestion_difficultyLevel_idx" ON "AssessmentQuestion"("difficultyLevel");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentQuestionOption_questionId_displayOrder_key" ON "AssessmentQuestionOption"("questionId", "displayOrder");
CREATE INDEX IF NOT EXISTS "AssessmentQuestionOption_questionId_idx" ON "AssessmentQuestionOption"("questionId");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentQuestionVersion_questionId_version_key" ON "AssessmentQuestionVersion"("questionId", "version");
CREATE INDEX IF NOT EXISTS "AssessmentQuestionVersion_questionId_idx" ON "AssessmentQuestionVersion"("questionId");

CREATE INDEX IF NOT EXISTS "AssessmentQuestionReview_assessmentId_idx" ON "AssessmentQuestionReview"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestionReview_questionId_idx" ON "AssessmentQuestionReview"("questionId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestionReview_status_idx" ON "AssessmentQuestionReview"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentReviewBoard_assessmentId_name_key" ON "AssessmentReviewBoard"("assessmentId", "name");
CREATE INDEX IF NOT EXISTS "AssessmentReviewBoard_boardType_idx" ON "AssessmentReviewBoard"("boardType");
CREATE INDEX IF NOT EXISTS "AssessmentReviewBoard_status_idx" ON "AssessmentReviewBoard"("status");

CREATE INDEX IF NOT EXISTS "AssessmentPilotRun_assessmentId_idx" ON "AssessmentPilotRun"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentPilotRun_status_idx" ON "AssessmentPilotRun"("status");
CREATE INDEX IF NOT EXISTS "AssessmentPilotResponse_pilotRunId_idx" ON "AssessmentPilotResponse"("pilotRunId");
CREATE INDEX IF NOT EXISTS "AssessmentPilotResponse_questionId_idx" ON "AssessmentPilotResponse"("questionId");

CREATE INDEX IF NOT EXISTS "AssessmentAttempt_assessmentId_idx" ON "AssessmentAttempt"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentAttempt_userId_idx" ON "AssessmentAttempt"("userId");
CREATE INDEX IF NOT EXISTS "AssessmentAttempt_status_idx" ON "AssessmentAttempt"("status");
CREATE INDEX IF NOT EXISTS "AssessmentAttempt_submittedAt_idx" ON "AssessmentAttempt"("submittedAt");

CREATE INDEX IF NOT EXISTS "AssessmentQuestionExposure_assessmentId_idx" ON "AssessmentQuestionExposure"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestionExposure_questionId_idx" ON "AssessmentQuestionExposure"("questionId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestionExposure_userId_idx" ON "AssessmentQuestionExposure"("userId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestionExposure_attemptId_idx" ON "AssessmentQuestionExposure"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentQuestionExposure_exposedAt_idx" ON "AssessmentQuestionExposure"("exposedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentAttemptQuestion_attemptId_questionId_key" ON "AssessmentAttemptQuestion"("attemptId", "questionId");
CREATE INDEX IF NOT EXISTS "AssessmentAttemptQuestion_attemptId_idx" ON "AssessmentAttemptQuestion"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentAttemptQuestion_questionId_idx" ON "AssessmentAttemptQuestion"("questionId");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentAnswer_attemptId_questionId_key" ON "AssessmentAnswer"("attemptId", "questionId");
CREATE INDEX IF NOT EXISTS "AssessmentAnswer_attemptId_idx" ON "AssessmentAnswer"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentAnswer_questionId_idx" ON "AssessmentAnswer"("questionId");
CREATE INDEX IF NOT EXISTS "AssessmentAnswer_optionId_idx" ON "AssessmentAnswer"("optionId");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentTraitScore_attemptId_traitId_key" ON "AssessmentTraitScore"("attemptId", "traitId");
CREATE INDEX IF NOT EXISTS "AssessmentTraitScore_attemptId_idx" ON "AssessmentTraitScore"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentTraitScore_traitId_idx" ON "AssessmentTraitScore"("traitId");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentDimensionScore_attemptId_dimensionId_key" ON "AssessmentDimensionScore"("attemptId", "dimensionId");
CREATE INDEX IF NOT EXISTS "AssessmentDimensionScore_attemptId_idx" ON "AssessmentDimensionScore"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentDimensionScore_dimensionId_idx" ON "AssessmentDimensionScore"("dimensionId");

CREATE INDEX IF NOT EXISTS "AssessmentIntegritySignal_attemptId_idx" ON "AssessmentIntegritySignal"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentIntegritySignal_signalType_idx" ON "AssessmentIntegritySignal"("signalType");
CREATE INDEX IF NOT EXISTS "AssessmentIntegritySignal_severity_idx" ON "AssessmentIntegritySignal"("severity");

CREATE INDEX IF NOT EXISTS "AssessmentRiskSignal_attemptId_idx" ON "AssessmentRiskSignal"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentRiskSignal_riskType_idx" ON "AssessmentRiskSignal"("riskType");
CREATE INDEX IF NOT EXISTS "AssessmentRiskSignal_riskLevel_idx" ON "AssessmentRiskSignal"("riskLevel");

CREATE INDEX IF NOT EXISTS "AssessmentGrowthSnapshot_assessmentId_idx" ON "AssessmentGrowthSnapshot"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentGrowthSnapshot_userId_idx" ON "AssessmentGrowthSnapshot"("userId");
CREATE INDEX IF NOT EXISTS "AssessmentGrowthSnapshot_dayLabel_idx" ON "AssessmentGrowthSnapshot"("dayLabel");

CREATE INDEX IF NOT EXISTS "AssessmentRankPrediction_assessmentId_idx" ON "AssessmentRankPrediction"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentRankPrediction_attemptId_idx" ON "AssessmentRankPrediction"("attemptId");
CREATE INDEX IF NOT EXISTS "AssessmentRankPrediction_userId_idx" ON "AssessmentRankPrediction"("userId");
CREATE INDEX IF NOT EXISTS "AssessmentRankPrediction_predictionBand_idx" ON "AssessmentRankPrediction"("predictionBand");

CREATE UNIQUE INDEX IF NOT EXISTS "AssessmentReportSnapshot_attemptId_audience_key" ON "AssessmentReportSnapshot"("attemptId", "audience");
CREATE INDEX IF NOT EXISTS "AssessmentReportSnapshot_assessmentId_idx" ON "AssessmentReportSnapshot"("assessmentId");
CREATE INDEX IF NOT EXISTS "AssessmentReportSnapshot_userId_idx" ON "AssessmentReportSnapshot"("userId");
CREATE INDEX IF NOT EXISTS "AssessmentReportSnapshot_audience_idx" ON "AssessmentReportSnapshot"("audience");

DO $$ BEGIN
  ALTER TABLE "AssessmentTrait" ADD CONSTRAINT "AssessmentTrait_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentDimension" ADD CONSTRAINT "AssessmentDimension_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentDimension" ADD CONSTRAINT "AssessmentDimension_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "AssessmentTrait"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "AssessmentTrait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "AssessmentDimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestionOption" ADD CONSTRAINT "AssessmentQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestionVersion" ADD CONSTRAINT "AssessmentQuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestionReview" ADD CONSTRAINT "AssessmentQuestionReview_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestionReview" ADD CONSTRAINT "AssessmentQuestionReview_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentReviewBoard" ADD CONSTRAINT "AssessmentReviewBoard_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentPilotRun" ADD CONSTRAINT "AssessmentPilotRun_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentPilotResponse" ADD CONSTRAINT "AssessmentPilotResponse_pilotRunId_fkey" FOREIGN KEY ("pilotRunId") REFERENCES "AssessmentPilotRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentPilotResponse" ADD CONSTRAINT "AssessmentPilotResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestionExposure" ADD CONSTRAINT "AssessmentQuestionExposure_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestionExposure" ADD CONSTRAINT "AssessmentQuestionExposure_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentQuestionExposure" ADD CONSTRAINT "AssessmentQuestionExposure_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentAttemptQuestion" ADD CONSTRAINT "AssessmentAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentAttemptQuestion" ADD CONSTRAINT "AssessmentAttemptQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_attemptQuestionId_fkey" FOREIGN KEY ("attemptQuestionId") REFERENCES "AssessmentAttemptQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "AssessmentQuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentTraitScore" ADD CONSTRAINT "AssessmentTraitScore_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentTraitScore" ADD CONSTRAINT "AssessmentTraitScore_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "AssessmentTrait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentDimensionScore" ADD CONSTRAINT "AssessmentDimensionScore_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentDimensionScore" ADD CONSTRAINT "AssessmentDimensionScore_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "AssessmentDimension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentIntegritySignal" ADD CONSTRAINT "AssessmentIntegritySignal_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentRiskSignal" ADD CONSTRAINT "AssessmentRiskSignal_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentGrowthSnapshot" ADD CONSTRAINT "AssessmentGrowthSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentRankPrediction" ADD CONSTRAINT "AssessmentRankPrediction_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentRankPrediction" ADD CONSTRAINT "AssessmentRankPrediction_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentReportSnapshot" ADD CONSTRAINT "AssessmentReportSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "AssessmentArenaAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssessmentReportSnapshot" ADD CONSTRAINT "AssessmentReportSnapshot_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO "AssessmentArenaAssessment" (
  "id", "slug", "name", "level", "purpose", "description", "status", "recommendedMinutes", "minimumQuestionBank", "recommendedQuestionBank", "idealQuestionBank", "questionsPerAttempt", "updatedAt"
) VALUES
  ('defence-career-fit-index', 'defence-career-fit-index', 'Defence Career Fit Index', 'DEFENCE_READINESS', 'Identify best-fit defence pathway across officer, soldier and service branches.', 'Foundation career-fit assessment for Army, Navy, Air Force, Coast Guard and officer/soldier pathways.', 'DRAFT', 25, 120, 250, 400, 40, CURRENT_TIMESTAMP),
  ('officer-potential-index', 'officer-potential-index', 'Officer Potential Index', 'DEFENCE_READINESS', 'Measure officer-like potential across leadership, decision making and responsibility.', 'Officer readiness assessment for SSB-oriented leadership development.', 'DRAFT', 35, 150, 300, 500, 50, CURRENT_TIMESTAMP),
  ('soldier-readiness-index', 'soldier-readiness-index', 'Soldier Readiness Index', 'DEFENCE_READINESS', 'Measure ground-level defence toughness, discipline and service mindset.', 'Soldier and Agniveer readiness assessment for hardship, routine and teamwork.', 'DRAFT', 25, 120, 250, 400, 40, CURRENT_TIMESTAMP),
  ('exam-warrior-index', 'exam-warrior-index', 'Exam Warrior Index', 'EXAM_SUCCESS', 'Measure exam battle readiness, pressure handling and accuracy mindset.', 'TOP RANK exam readiness assessment for NDA, CDS, AFCAT and related exams.', 'DRAFT', 25, 120, 250, 400, 40, CURRENT_TIMESTAMP),
  ('focus-concentration-index', 'focus-concentration-index', 'Focus & Concentration Index', 'EXAM_SUCCESS', 'Measure attention strength, distraction resistance and deep work capacity.', 'Study focus diagnostic for competitive defence preparation.', 'DRAFT', 20, 100, 200, 350, 35, CURRENT_TIMESTAMP),
  ('competitive-mindset-index', 'competitive-mindset-index', 'Competitive Mindset Index', 'EXAM_SUCCESS', 'Measure competitive temperament, confidence and recovery after failure.', 'Performance temperament assessment for exam and academy competition.', 'DRAFT', 20, 100, 200, 350, 35, CURRENT_TIMESTAMP),
  ('olq-master-assessment', 'olq-master-assessment', 'OLQ Master Assessment', 'SSB_ARENA', 'Measure the full Officer Like Qualities framework used in SSB preparation.', 'Deep OLQ assessment across intelligence, responsibility, initiative, confidence, influence and stamina.', 'DRAFT', 45, 250, 500, 800, 60, CURRENT_TIMESTAMP),
  ('psychological-suitability-assessment', 'psychological-suitability-assessment', 'Psychological Suitability Assessment', 'SSB_ARENA', 'Measure SSB psychology readiness, maturity and response quality.', 'SSB psychology assessment for SRT, WAT, TAT and self-description readiness.', 'DRAFT', 45, 250, 500, 800, 60, CURRENT_TIMESTAMP),
  ('group-dynamics-assessment', 'group-dynamics-assessment', 'Group Dynamics Assessment', 'SSB_ARENA', 'Measure GTO group readiness, cooperation and social adaptability.', 'Group task and GTO behaviour assessment for SSB preparation.', 'DRAFT', 30, 150, 300, 500, 45, CURRENT_TIMESTAMP),
  ('leadership-dna-assessment', 'leadership-dna-assessment', 'Leadership DNA Assessment', 'SSB_ARENA', 'Identify leadership style, accountability and people-handling pattern.', 'Leadership style assessment for command presence and influence development.', 'DRAFT', 30, 150, 300, 500, 45, CURRENT_TIMESTAMP),
  ('physical-readiness-index', 'physical-readiness-index', 'Physical Readiness Index', 'FITNESS_DISCIPLINE', 'Measure fitness mindset, stamina and training discipline.', 'Physical readiness diagnostic for defence fitness preparation.', 'DRAFT', 20, 100, 200, 350, 35, CURRENT_TIMESTAMP),
  ('lifestyle-discipline-index', 'lifestyle-discipline-index', 'Lifestyle Discipline Index', 'FITNESS_DISCIPLINE', 'Measure daily routine, time discipline, habit strength and self-control.', 'Lifestyle discipline assessment for academy routine and exam consistency.', 'DRAFT', 20, 100, 200, 350, 35, CURRENT_TIMESTAMP),
  ('exam-muscle-memory-assessment', 'exam-muscle-memory-assessment', 'Exam Muscle Memory Assessment', 'TOP_RANK_PERFORMANCE', 'Measure revision loops, recall strength and mistake correction.', 'TOP RANK performance assessment for revision discipline and retained practice.', 'DRAFT', 25, 120, 250, 400, 40, CURRENT_TIMESTAMP),
  ('performance-growth-assessment', 'performance-growth-assessment', 'Performance Growth Assessment', 'TOP_RANK_PERFORMANCE', 'Measure learning agility, feedback response and improvement consistency.', 'Growth-tracking assessment for academic, mentor and self-correction behaviour.', 'DRAFT', 20, 100, 200, 350, 35, CURRENT_TIMESTAMP),
  ('rank-prediction-index', 'rank-prediction-index', 'Rank Prediction Index', 'TOP_RANK_PERFORMANCE', 'Predict readiness trajectory using assessment, academic, attendance, fitness and growth signals.', 'Readiness prediction framework for TOP RANK; not a selection guarantee.', 'DRAFT', 35, 150, 350, 600, 50, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "level" = EXCLUDED."level",
  "purpose" = EXCLUDED."purpose",
  "description" = EXCLUDED."description",
  "recommendedMinutes" = EXCLUDED."recommendedMinutes",
  "minimumQuestionBank" = EXCLUDED."minimumQuestionBank",
  "recommendedQuestionBank" = EXCLUDED."recommendedQuestionBank",
  "idealQuestionBank" = EXCLUDED."idealQuestionBank",
  "questionsPerAttempt" = EXCLUDED."questionsPerAttempt",
  "updatedAt" = CURRENT_TIMESTAMP;

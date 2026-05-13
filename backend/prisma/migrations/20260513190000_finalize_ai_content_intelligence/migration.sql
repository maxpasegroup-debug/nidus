CREATE TABLE "AITutorFeedback" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "feedback" TEXT,
  "escalationRequested" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AITutorFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIResponseCache" (
  "id" TEXT NOT NULL,
  "cacheKey" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "promptHash" TEXT NOT NULL,
  "response" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "hitCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIResponseCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningTopicInsight" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "examType" TEXT,
  "subject" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "strengthScore" INTEGER NOT NULL DEFAULT 0,
  "weaknessScore" INTEGER NOT NULL DEFAULT 0,
  "confidenceScore" INTEGER NOT NULL DEFAULT 50,
  "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "speedScore" INTEGER NOT NULL DEFAULT 0,
  "engagementScore" INTEGER NOT NULL DEFAULT 0,
  "trend" TEXT NOT NULL DEFAULT 'STABLE',
  "recommendations" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningTopicInsight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RevisionQueueItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "reason" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "source" TEXT NOT NULL DEFAULT 'ADAPTIVE_ENGINE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "RevisionQueueItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CBTIntelligenceReport" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "skippedQuestionIds" JSONB NOT NULL,
  "aiReviewOrder" JSONB NOT NULL,
  "confidenceAnalysis" JSONB,
  "accuracyAnalytics" JSONB,
  "speedAnalytics" JSONB,
  "timePressureAnalysis" JSONB,
  "weakTopicAnalytics" JSONB,
  "quickWinSuggestions" JSONB,
  "rankPrediction" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CBTIntelligenceReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentIngestionJob" (
  "id" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "uploadUrl" TEXT,
  "targetModule" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "createdBy" TEXT,
  "processedAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentIngestionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneratedContentAsset" (
  "id" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sourceId" TEXT,
  "title" TEXT NOT NULL,
  "body" JSONB NOT NULL,
  "tags" JSONB,
  "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "createdBy" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GeneratedContentAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIResponseCache_cacheKey_key" ON "AIResponseCache"("cacheKey");
CREATE UNIQUE INDEX "LearningTopicInsight_userId_subject_topic_key" ON "LearningTopicInsight"("userId", "subject", "topic");
CREATE UNIQUE INDEX "CBTIntelligenceReport_attemptId_key" ON "CBTIntelligenceReport"("attemptId");
CREATE INDEX "AITutorFeedback_sessionId_idx" ON "AITutorFeedback"("sessionId");
CREATE INDEX "AITutorFeedback_userId_idx" ON "AITutorFeedback"("userId");
CREATE INDEX "AITutorFeedback_rating_idx" ON "AITutorFeedback"("rating");
CREATE INDEX "AIResponseCache_feature_idx" ON "AIResponseCache"("feature");
CREATE INDEX "AIResponseCache_expiresAt_idx" ON "AIResponseCache"("expiresAt");
CREATE INDEX "LearningTopicInsight_userId_idx" ON "LearningTopicInsight"("userId");
CREATE INDEX "LearningTopicInsight_examType_idx" ON "LearningTopicInsight"("examType");
CREATE INDEX "LearningTopicInsight_weaknessScore_idx" ON "LearningTopicInsight"("weaknessScore");
CREATE INDEX "RevisionQueueItem_userId_status_idx" ON "RevisionQueueItem"("userId", "status");
CREATE INDEX "RevisionQueueItem_priority_idx" ON "RevisionQueueItem"("priority");
CREATE INDEX "RevisionQueueItem_dueAt_idx" ON "RevisionQueueItem"("dueAt");
CREATE INDEX "CBTIntelligenceReport_userId_idx" ON "CBTIntelligenceReport"("userId");
CREATE INDEX "CBTIntelligenceReport_createdAt_idx" ON "CBTIntelligenceReport"("createdAt");
CREATE INDEX "ContentIngestionJob_sourceType_idx" ON "ContentIngestionJob"("sourceType");
CREATE INDEX "ContentIngestionJob_targetModule_idx" ON "ContentIngestionJob"("targetModule");
CREATE INDEX "ContentIngestionJob_status_idx" ON "ContentIngestionJob"("status");
CREATE INDEX "ContentIngestionJob_createdAt_idx" ON "ContentIngestionJob"("createdAt");
CREATE INDEX "GeneratedContentAsset_contentType_idx" ON "GeneratedContentAsset"("contentType");
CREATE INDEX "GeneratedContentAsset_sourceId_idx" ON "GeneratedContentAsset"("sourceId");
CREATE INDEX "GeneratedContentAsset_moderationStatus_idx" ON "GeneratedContentAsset"("moderationStatus");

ALTER TABLE "AITutorFeedback" ADD CONSTRAINT "AITutorFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AITutorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

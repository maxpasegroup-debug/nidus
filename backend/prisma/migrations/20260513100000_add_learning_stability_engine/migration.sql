ALTER TABLE "TestAttempt"
  ADD COLUMN "lastSavedAt" TIMESTAMP(3),
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  ADD COLUMN "currentQuestionId" TEXT,
  ADD COLUMN "sectionState" JSONB,
  ADD COLUMN "integrityScore" INTEGER NOT NULL DEFAULT 100;

ALTER TABLE "LectureProgress"
  ADD COLUMN "activeWatchTime" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastPosition" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "engagementScore" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "CBTAnswerState" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "selectedAnswer" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNANSWERED',
  "confidence" TEXT,
  "timeSpent" INTEGER NOT NULL DEFAULT 0,
  "visitCount" INTEGER NOT NULL DEFAULT 0,
  "markedForReview" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CBTAnswerState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CBTIntegrityEvent" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'LOW',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CBTIntegrityEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LecturePlaybackEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lectureId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "duration" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LecturePlaybackEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AITutorSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "topic" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "context" JSONB,
  "escalationStatus" TEXT NOT NULL DEFAULT 'NONE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AITutorSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AITutorMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AITutorMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfflineSyncEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "syncedAt" TIMESTAMP(3),
  CONSTRAINT "OfflineSyncEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningAnalyticsSnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "studyConsistency" INTEGER NOT NULL DEFAULT 0,
  "lectureEngagement" INTEGER NOT NULL DEFAULT 0,
  "completionRate" INTEGER NOT NULL DEFAULT 0,
  "productivityScore" INTEGER NOT NULL DEFAULT 0,
  "weakTopics" JSONB,
  "heatmap" JSONB,
  "aiInsights" JSONB,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyIntelligenceIssue" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "categories" JSONB NOT NULL,
  "currentAffairs" JSONB,
  "vocabulary" JSONB,
  "quiz" JSONB,
  "pdfPublicId" TEXT,
  "pdfUrl" TEXT,
  "whatsappText" TEXT,
  "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "publishedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyIntelligenceIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentModerationItem" (
  "id" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentModerationItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CBTAnswerState_attemptId_questionId_key" ON "CBTAnswerState"("attemptId", "questionId");
CREATE INDEX "CBTAnswerState_attemptId_status_idx" ON "CBTAnswerState"("attemptId", "status");
CREATE INDEX "CBTAnswerState_questionId_idx" ON "CBTAnswerState"("questionId");
CREATE INDEX "CBTIntegrityEvent_attemptId_idx" ON "CBTIntegrityEvent"("attemptId");
CREATE INDEX "CBTIntegrityEvent_eventType_idx" ON "CBTIntegrityEvent"("eventType");
CREATE INDEX "CBTIntegrityEvent_createdAt_idx" ON "CBTIntegrityEvent"("createdAt");
CREATE INDEX "LecturePlaybackEvent_userId_idx" ON "LecturePlaybackEvent"("userId");
CREATE INDEX "LecturePlaybackEvent_lectureId_idx" ON "LecturePlaybackEvent"("lectureId");
CREATE INDEX "LecturePlaybackEvent_eventType_idx" ON "LecturePlaybackEvent"("eventType");
CREATE INDEX "LecturePlaybackEvent_createdAt_idx" ON "LecturePlaybackEvent"("createdAt");
CREATE INDEX "AITutorSession_userId_idx" ON "AITutorSession"("userId");
CREATE INDEX "AITutorSession_status_idx" ON "AITutorSession"("status");
CREATE INDEX "AITutorSession_createdAt_idx" ON "AITutorSession"("createdAt");
CREATE INDEX "AITutorMessage_sessionId_idx" ON "AITutorMessage"("sessionId");
CREATE INDEX "AITutorMessage_createdAt_idx" ON "AITutorMessage"("createdAt");
CREATE INDEX "OfflineSyncEvent_userId_status_idx" ON "OfflineSyncEvent"("userId", "status");
CREATE INDEX "OfflineSyncEvent_entityType_entityId_idx" ON "OfflineSyncEvent"("entityType", "entityId");
CREATE INDEX "OfflineSyncEvent_createdAt_idx" ON "OfflineSyncEvent"("createdAt");
CREATE INDEX "LearningAnalyticsSnapshot_userId_idx" ON "LearningAnalyticsSnapshot"("userId");
CREATE INDEX "LearningAnalyticsSnapshot_generatedAt_idx" ON "LearningAnalyticsSnapshot"("generatedAt");
CREATE UNIQUE INDEX "DailyIntelligenceIssue_issueDate_key" ON "DailyIntelligenceIssue"("issueDate");
CREATE INDEX "DailyIntelligenceIssue_status_idx" ON "DailyIntelligenceIssue"("status");
CREATE INDEX "DailyIntelligenceIssue_moderationStatus_idx" ON "DailyIntelligenceIssue"("moderationStatus");
CREATE INDEX "DailyIntelligenceIssue_issueDate_idx" ON "DailyIntelligenceIssue"("issueDate");
CREATE INDEX "ContentModerationItem_contentType_contentId_idx" ON "ContentModerationItem"("contentType", "contentId");
CREATE INDEX "ContentModerationItem_status_idx" ON "ContentModerationItem"("status");
CREATE INDEX "ContentModerationItem_createdAt_idx" ON "ContentModerationItem"("createdAt");

ALTER TABLE "CBTAnswerState" ADD CONSTRAINT "CBTAnswerState_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CBTAnswerState" ADD CONSTRAINT "CBTAnswerState_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CBTIntegrityEvent" ADD CONSTRAINT "CBTIntegrityEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LecturePlaybackEvent" ADD CONSTRAINT "LecturePlaybackEvent_progress_fkey" FOREIGN KEY ("userId", "lectureId") REFERENCES "LectureProgress"("userId", "lectureId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AITutorMessage" ADD CONSTRAINT "AITutorMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AITutorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

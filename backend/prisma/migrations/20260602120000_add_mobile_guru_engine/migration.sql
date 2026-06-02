CREATE TABLE "GuruQuest" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "introduction" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "locked" BOOLEAN NOT NULL DEFAULT false,
  "unlockAfterQuestId" TEXT,
  "certificateTitle" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruQuest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuruQuest_slug_key" ON "GuruQuest"("slug");
CREATE INDEX "GuruQuest_status_idx" ON "GuruQuest"("status");
CREATE INDEX "GuruQuest_sortOrder_idx" ON "GuruQuest"("sortOrder");
CREATE INDEX "GuruQuest_unlockAfterQuestId_idx" ON "GuruQuest"("unlockAfterQuestId");

CREATE TABLE "GuruLesson" (
  "id" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL DEFAULT 'audio',
  "audioUrl" TEXT,
  "videoUrl" TEXT,
  "documentUrl" TEXT,
  "textContent" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruLesson_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuruLesson_questId_idx" ON "GuruLesson"("questId");
CREATE INDEX "GuruLesson_sortOrder_idx" ON "GuruLesson"("sortOrder");

CREATE TABLE "GuruLessonCompletion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruLessonCompletion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruLessonCompletion_userId_lessonId_key" ON "GuruLessonCompletion"("userId", "lessonId");
CREATE INDEX "GuruLessonCompletion_userId_idx" ON "GuruLessonCompletion"("userId");
CREATE INDEX "GuruLessonCompletion_questId_idx" ON "GuruLessonCompletion"("questId");
CREATE INDEX "GuruLessonCompletion_lessonId_idx" ON "GuruLessonCompletion"("lessonId");

CREATE TABLE "GuruReflectionQuestion" (
  "id" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'text',
  "options" JSONB,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruReflectionQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuruReflectionQuestion_questId_idx" ON "GuruReflectionQuestion"("questId");
CREATE INDEX "GuruReflectionQuestion_sortOrder_idx" ON "GuruReflectionQuestion"("sortOrder");

CREATE TABLE "GuruReflectionAnswer" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "answer" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruReflectionAnswer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruReflectionAnswer_userId_questionId_key" ON "GuruReflectionAnswer"("userId", "questionId");
CREATE INDEX "GuruReflectionAnswer_userId_idx" ON "GuruReflectionAnswer"("userId");
CREATE INDEX "GuruReflectionAnswer_questId_idx" ON "GuruReflectionAnswer"("questId");
CREATE INDEX "GuruReflectionAnswer_questionId_idx" ON "GuruReflectionAnswer"("questionId");

CREATE TABLE "GuruChallenge" (
  "id" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "evidenceRequired" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruChallenge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuruChallenge_questId_idx" ON "GuruChallenge"("questId");
CREATE INDEX "GuruChallenge_sortOrder_idx" ON "GuruChallenge"("sortOrder");

CREATE TABLE "GuruChallengeCompletion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "notes" TEXT,
  "evidenceUrl" TEXT,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruChallengeCompletion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruChallengeCompletion_userId_challengeId_key" ON "GuruChallengeCompletion"("userId", "challengeId");
CREATE INDEX "GuruChallengeCompletion_userId_idx" ON "GuruChallengeCompletion"("userId");
CREATE INDEX "GuruChallengeCompletion_questId_idx" ON "GuruChallengeCompletion"("questId");
CREATE INDEX "GuruChallengeCompletion_challengeId_idx" ON "GuruChallengeCompletion"("challengeId");

CREATE TABLE "GuruProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'unlocked',
  "completionPercent" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruProgress_userId_questId_key" ON "GuruProgress"("userId", "questId");
CREATE INDEX "GuruProgress_userId_idx" ON "GuruProgress"("userId");
CREATE INDEX "GuruProgress_questId_idx" ON "GuruProgress"("questId");
CREATE INDEX "GuruProgress_status_idx" ON "GuruProgress"("status");

CREATE TABLE "GuruAchievement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ruleKey" TEXT NOT NULL,
  "iconUrl" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruAchievement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruAchievement_ruleKey_key" ON "GuruAchievement"("ruleKey");
CREATE INDEX "GuruAchievement_enabled_idx" ON "GuruAchievement"("enabled");

CREATE TABLE "GuruUserAchievement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruUserAchievement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruUserAchievement_userId_achievementId_key" ON "GuruUserAchievement"("userId", "achievementId");
CREATE INDEX "GuruUserAchievement_userId_idx" ON "GuruUserAchievement"("userId");
CREATE INDEX "GuruUserAchievement_achievementId_idx" ON "GuruUserAchievement"("achievementId");

CREATE TABLE "GuruCertificate" (
  "id" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "templateUrl" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruCertificate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuruCertificate_questId_idx" ON "GuruCertificate"("questId");
CREATE INDEX "GuruCertificate_enabled_idx" ON "GuruCertificate"("enabled");

CREATE TABLE "GuruUserCertificate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "certificateId" TEXT NOT NULL,
  "certificateUrl" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruUserCertificate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruUserCertificate_userId_certificateId_key" ON "GuruUserCertificate"("userId", "certificateId");
CREATE INDEX "GuruUserCertificate_userId_idx" ON "GuruUserCertificate"("userId");
CREATE INDEX "GuruUserCertificate_questId_idx" ON "GuruUserCertificate"("questId");
CREATE INDEX "GuruUserCertificate_certificateId_idx" ON "GuruUserCertificate"("certificateId");

CREATE TABLE "GuruDailyMission" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruDailyMission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuruDailyMission_enabled_idx" ON "GuruDailyMission"("enabled");
CREATE INDEX "GuruDailyMission_sortOrder_idx" ON "GuruDailyMission"("sortOrder");

CREATE TABLE "GuruDailyMissionCompletion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "completedDate" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruDailyMissionCompletion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruDailyMissionCompletion_userId_missionId_completedDate_key" ON "GuruDailyMissionCompletion"("userId", "missionId", "completedDate");
CREATE INDEX "GuruDailyMissionCompletion_userId_idx" ON "GuruDailyMissionCompletion"("userId");
CREATE INDEX "GuruDailyMissionCompletion_missionId_idx" ON "GuruDailyMissionCompletion"("missionId");
CREATE INDEX "GuruDailyMissionCompletion_completedDate_idx" ON "GuruDailyMissionCompletion"("completedDate");

CREATE TABLE "GuruMentorNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruMentorNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuruMentorNote_userId_idx" ON "GuruMentorNote"("userId");
CREATE INDEX "GuruMentorNote_createdAt_idx" ON "GuruMentorNote"("createdAt");

CREATE TABLE "GuruReflectionInsight" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruReflectionInsight_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuruReflectionInsight_userId_idx" ON "GuruReflectionInsight"("userId");
CREATE INDEX "GuruReflectionInsight_createdAt_idx" ON "GuruReflectionInsight"("createdAt");

CREATE TABLE "GuruXpLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "xp" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GuruXpLedger_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuruXpLedger_userId_sourceType_sourceId_key" ON "GuruXpLedger"("userId", "sourceType", "sourceId");
CREATE INDEX "GuruXpLedger_userId_idx" ON "GuruXpLedger"("userId");
CREATE INDEX "GuruXpLedger_sourceType_idx" ON "GuruXpLedger"("sourceType");
CREATE INDEX "GuruXpLedger_createdAt_idx" ON "GuruXpLedger"("createdAt");

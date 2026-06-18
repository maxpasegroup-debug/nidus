-- CreateTable
CREATE TABLE "TopRankSignalSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "programSlug" TEXT,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendanceSignals" JSONB NOT NULL,
    "assignmentSignals" JSONB NOT NULL,
    "examSignals" JSONB NOT NULL,
    "testSignals" JSONB NOT NULL,
    "liveClassSignals" JSONB NOT NULL,
    "fitnessSignals" JSONB NOT NULL,
    "progressSignals" JSONB NOT NULL,
    "teacherSignals" JSONB NOT NULL,
    "sourceCounts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopRankSignalSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopRankReadinessScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "snapshotId" TEXT,
    "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "readinessBand" TEXT NOT NULL,
    "readinessExplanation" TEXT NOT NULL,
    "academicScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disciplineScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "componentScores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopRankReadinessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopRankPerformanceTrend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "snapshotId" TEXT,
    "performanceTrend" TEXT NOT NULL,
    "completionTrend" TEXT NOT NULL,
    "improvementTrend" TEXT NOT NULL,
    "studyTrend" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopRankPerformanceTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopRankGrowthTrend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "snapshotId" TEXT,
    "dayLabel" TEXT NOT NULL,
    "growthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthClassification" TEXT NOT NULL,
    "baselineScore" DOUBLE PRECISION,
    "currentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comparisonData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopRankGrowthTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopRankRiskTrend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "snapshotId" TEXT,
    "riskType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "interventionStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopRankRiskTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopRankMentorFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT,
    "mentorId" TEXT,
    "mentorRole" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "feedbackText" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopRankMentorFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopRankSignalWeightConfig" (
    "id" TEXT NOT NULL,
    "programSlug" TEXT,
    "name" TEXT NOT NULL,
    "attendanceWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "assignmentWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "examWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "testWeight" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "liveClassWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "fitnessWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "progressWeight" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "disciplineWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopRankSignalWeightConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopRankSignalSnapshot_userId_idx" ON "TopRankSignalSnapshot"("userId");
CREATE INDEX "TopRankSignalSnapshot_batchId_idx" ON "TopRankSignalSnapshot"("batchId");
CREATE INDEX "TopRankSignalSnapshot_programSlug_idx" ON "TopRankSignalSnapshot"("programSlug");
CREATE INDEX "TopRankSignalSnapshot_snapshotDate_idx" ON "TopRankSignalSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "TopRankReadinessScore_userId_idx" ON "TopRankReadinessScore"("userId");
CREATE INDEX "TopRankReadinessScore_batchId_idx" ON "TopRankReadinessScore"("batchId");
CREATE INDEX "TopRankReadinessScore_snapshotId_idx" ON "TopRankReadinessScore"("snapshotId");
CREATE INDEX "TopRankReadinessScore_readinessBand_idx" ON "TopRankReadinessScore"("readinessBand");
CREATE INDEX "TopRankReadinessScore_createdAt_idx" ON "TopRankReadinessScore"("createdAt");

-- CreateIndex
CREATE INDEX "TopRankPerformanceTrend_userId_idx" ON "TopRankPerformanceTrend"("userId");
CREATE INDEX "TopRankPerformanceTrend_batchId_idx" ON "TopRankPerformanceTrend"("batchId");
CREATE INDEX "TopRankPerformanceTrend_snapshotId_idx" ON "TopRankPerformanceTrend"("snapshotId");
CREATE INDEX "TopRankPerformanceTrend_performanceTrend_idx" ON "TopRankPerformanceTrend"("performanceTrend");
CREATE INDEX "TopRankPerformanceTrend_createdAt_idx" ON "TopRankPerformanceTrend"("createdAt");

-- CreateIndex
CREATE INDEX "TopRankGrowthTrend_userId_idx" ON "TopRankGrowthTrend"("userId");
CREATE INDEX "TopRankGrowthTrend_batchId_idx" ON "TopRankGrowthTrend"("batchId");
CREATE INDEX "TopRankGrowthTrend_snapshotId_idx" ON "TopRankGrowthTrend"("snapshotId");
CREATE INDEX "TopRankGrowthTrend_dayLabel_idx" ON "TopRankGrowthTrend"("dayLabel");
CREATE INDEX "TopRankGrowthTrend_growthClassification_idx" ON "TopRankGrowthTrend"("growthClassification");
CREATE INDEX "TopRankGrowthTrend_createdAt_idx" ON "TopRankGrowthTrend"("createdAt");

-- CreateIndex
CREATE INDEX "TopRankRiskTrend_userId_idx" ON "TopRankRiskTrend"("userId");
CREATE INDEX "TopRankRiskTrend_batchId_idx" ON "TopRankRiskTrend"("batchId");
CREATE INDEX "TopRankRiskTrend_snapshotId_idx" ON "TopRankRiskTrend"("snapshotId");
CREATE INDEX "TopRankRiskTrend_riskType_idx" ON "TopRankRiskTrend"("riskType");
CREATE INDEX "TopRankRiskTrend_riskLevel_idx" ON "TopRankRiskTrend"("riskLevel");
CREATE INDEX "TopRankRiskTrend_interventionStatus_idx" ON "TopRankRiskTrend"("interventionStatus");
CREATE INDEX "TopRankRiskTrend_createdAt_idx" ON "TopRankRiskTrend"("createdAt");

-- CreateIndex
CREATE INDEX "TopRankMentorFeedback_userId_idx" ON "TopRankMentorFeedback"("userId");
CREATE INDEX "TopRankMentorFeedback_batchId_idx" ON "TopRankMentorFeedback"("batchId");
CREATE INDEX "TopRankMentorFeedback_mentorId_idx" ON "TopRankMentorFeedback"("mentorId");
CREATE INDEX "TopRankMentorFeedback_mentorRole_idx" ON "TopRankMentorFeedback"("mentorRole");
CREATE INDEX "TopRankMentorFeedback_feedbackType_idx" ON "TopRankMentorFeedback"("feedbackType");
CREATE INDEX "TopRankMentorFeedback_actionStatus_idx" ON "TopRankMentorFeedback"("actionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TopRankSignalWeightConfig_programSlug_name_key" ON "TopRankSignalWeightConfig"("programSlug", "name");
CREATE INDEX "TopRankSignalWeightConfig_programSlug_idx" ON "TopRankSignalWeightConfig"("programSlug");
CREATE INDEX "TopRankSignalWeightConfig_status_idx" ON "TopRankSignalWeightConfig"("status");

-- AddForeignKey
ALTER TABLE "TopRankReadinessScore" ADD CONSTRAINT "TopRankReadinessScore_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TopRankSignalSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TopRankPerformanceTrend" ADD CONSTRAINT "TopRankPerformanceTrend_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TopRankSignalSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TopRankGrowthTrend" ADD CONSTRAINT "TopRankGrowthTrend_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TopRankSignalSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TopRankRiskTrend" ADD CONSTRAINT "TopRankRiskTrend_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "TopRankSignalSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

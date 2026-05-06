CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetExam" TEXT NOT NULL,
    "studyHoursPerDay" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "generatedPlan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerformanceAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weakTopics" JSONB NOT NULL,
    "strongTopics" JSONB NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studyConsistency" INTEGER NOT NULL DEFAULT 0,
    "revisionRate" INTEGER NOT NULL DEFAULT 0,
    "aiSuggestions" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerformanceAnalytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RevisionSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "revisionDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    CONSTRAINT "RevisionSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudyPlan_userId_idx" ON "StudyPlan"("userId");
CREATE UNIQUE INDEX "PerformanceAnalytics_userId_key" ON "PerformanceAnalytics"("userId");
CREATE INDEX "RevisionSchedule_userId_idx" ON "RevisionSchedule"("userId");

ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerformanceAnalytics" ADD CONSTRAINT "PerformanceAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RevisionSchedule" ADD CONSTRAINT "RevisionSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

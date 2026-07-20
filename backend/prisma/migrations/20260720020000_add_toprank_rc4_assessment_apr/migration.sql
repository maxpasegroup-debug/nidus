CREATE TABLE "TopRankAssessment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "assessmentType" TEXT NOT NULL DEFAULT 'AGNIVEER_DIAGNOSTIC',
  "academicScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "physicalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "learningScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "disciplineScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "careerScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "summary" JSONB NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankAssessmentAnswer" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "questionKey" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TopRankAssessmentAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankAPR" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "academicScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "physicalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "learningScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "disciplineScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "careerScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "strengths" JSONB NOT NULL,
  "weaknesses" JSONB NOT NULL,
  "improvementAreas" JSONB NOT NULL,
  "summary" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankAPR_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TopRankAssessment_userId_idx" ON "TopRankAssessment"("userId");
CREATE INDEX "TopRankAssessment_status_idx" ON "TopRankAssessment"("status");
CREATE INDEX "TopRankAssessment_completedAt_idx" ON "TopRankAssessment"("completedAt");
CREATE INDEX "TopRankAssessmentAnswer_assessmentId_idx" ON "TopRankAssessmentAnswer"("assessmentId");
CREATE INDEX "TopRankAssessmentAnswer_userId_idx" ON "TopRankAssessmentAnswer"("userId");
CREATE INDEX "TopRankAssessmentAnswer_section_idx" ON "TopRankAssessmentAnswer"("section");
CREATE INDEX "TopRankAssessmentAnswer_questionKey_idx" ON "TopRankAssessmentAnswer"("questionKey");
CREATE UNIQUE INDEX "TopRankAPR_assessmentId_key" ON "TopRankAPR"("assessmentId");
CREATE INDEX "TopRankAPR_userId_idx" ON "TopRankAPR"("userId");
CREATE INDEX "TopRankAPR_overallScore_idx" ON "TopRankAPR"("overallScore");
CREATE INDEX "TopRankAPR_status_idx" ON "TopRankAPR"("status");
CREATE INDEX "TopRankAPR_createdAt_idx" ON "TopRankAPR"("createdAt");

ALTER TABLE "TopRankAssessment" ADD CONSTRAINT "TopRankAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankAssessmentAnswer" ADD CONSTRAINT "TopRankAssessmentAnswer_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TopRankAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankAPR" ADD CONSTRAINT "TopRankAPR_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankAPR" ADD CONSTRAINT "TopRankAPR_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TopRankAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

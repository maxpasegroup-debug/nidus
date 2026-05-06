CREATE TABLE "AIInterviewSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "interviewType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "overallScore" DOUBLE PRECISION,
  "aiFeedback" TEXT,
  CONSTRAINT "AIInterviewSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIInterviewQuestion" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "userAnswer" TEXT,
  "aiAnalysis" TEXT,
  "score" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIInterviewQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DoubtQuery" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "aiResponse" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DoubtQuery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIRecommendation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfficerPotential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "leadershipScore" DOUBLE PRECISION NOT NULL,
  "communicationScore" DOUBLE PRECISION NOT NULL,
  "disciplineScore" DOUBLE PRECISION NOT NULL,
  "confidenceScore" DOUBLE PRECISION NOT NULL,
  "officerReadiness" DOUBLE PRECISION NOT NULL,
  "aiSummary" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OfficerPotential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OfficerPotential_userId_key" ON "OfficerPotential"("userId");
CREATE INDEX "AIInterviewSession_userId_idx" ON "AIInterviewSession"("userId");
CREATE INDEX "AIInterviewSession_status_idx" ON "AIInterviewSession"("status");
CREATE INDEX "AIInterviewQuestion_sessionId_idx" ON "AIInterviewQuestion"("sessionId");
CREATE INDEX "DoubtQuery_userId_idx" ON "DoubtQuery"("userId");
CREATE INDEX "DoubtQuery_subject_idx" ON "DoubtQuery"("subject");
CREATE INDEX "AIRecommendation_userId_idx" ON "AIRecommendation"("userId");
CREATE INDEX "AIRecommendation_priority_idx" ON "AIRecommendation"("priority");

ALTER TABLE "AIInterviewSession" ADD CONSTRAINT "AIInterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIInterviewQuestion" ADD CONSTRAINT "AIInterviewQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AIInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoubtQuery" ADD CONSTRAINT "DoubtQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfficerPotential" ADD CONSTRAINT "OfficerPotential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

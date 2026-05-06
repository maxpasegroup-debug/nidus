CREATE TABLE "PsychometricTest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PsychometricTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PsychometricQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "questionType" TEXT NOT NULL,
    "options" JSONB,
    "order" INTEGER NOT NULL,
    CONSTRAINT "PsychometricQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PsychometricAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiAnalysis" TEXT,
    "overallRemark" TEXT,
    CONSTRAINT "PsychometricAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PsychometricAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT,
    "selectedOption" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "PsychometricAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OLQScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "effectiveIntelligence" INTEGER NOT NULL DEFAULT 0,
    "reasoningAbility" INTEGER NOT NULL DEFAULT 0,
    "organizingAbility" INTEGER NOT NULL DEFAULT 0,
    "socialAdaptability" INTEGER NOT NULL DEFAULT 0,
    "cooperation" INTEGER NOT NULL DEFAULT 0,
    "senseOfResponsibility" INTEGER NOT NULL DEFAULT 0,
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "selfConfidence" INTEGER NOT NULL DEFAULT 0,
    "speedOfDecision" INTEGER NOT NULL DEFAULT 0,
    "abilityToInfluence" INTEGER NOT NULL DEFAULT 0,
    "liveliness" INTEGER NOT NULL DEFAULT 0,
    "determination" INTEGER NOT NULL DEFAULT 0,
    "courage" INTEGER NOT NULL DEFAULT 0,
    "stamina" INTEGER NOT NULL DEFAULT 0,
    "emotionalStability" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OLQScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PsychometricQuestion_testId_idx" ON "PsychometricQuestion"("testId");
CREATE INDEX "PsychometricAttempt_userId_idx" ON "PsychometricAttempt"("userId");
CREATE INDEX "PsychometricAttempt_testId_idx" ON "PsychometricAttempt"("testId");
CREATE UNIQUE INDEX "PsychometricAnswer_attemptId_questionId_key" ON "PsychometricAnswer"("attemptId", "questionId");
CREATE INDEX "PsychometricAnswer_questionId_idx" ON "PsychometricAnswer"("questionId");
CREATE UNIQUE INDEX "OLQScore_userId_key" ON "OLQScore"("userId");

ALTER TABLE "PsychometricQuestion" ADD CONSTRAINT "PsychometricQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "PsychometricTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychometricAttempt" ADD CONSTRAINT "PsychometricAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychometricAttempt" ADD CONSTRAINT "PsychometricAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "PsychometricTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychometricAnswer" ADD CONSTRAINT "PsychometricAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PsychometricAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PsychometricAnswer" ADD CONSTRAINT "PsychometricAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PsychometricQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OLQScore" ADD CONSTRAINT "OLQScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

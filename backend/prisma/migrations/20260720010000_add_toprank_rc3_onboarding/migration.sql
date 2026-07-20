CREATE TABLE "TopRankSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "rememberMe" BOOLEAN NOT NULL DEFAULT false,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankStudentProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "age" INTEGER,
  "gender" TEXT,
  "heightCm" DOUBLE PRECISION,
  "weightKg" DOUBLE PRECISION,
  "education" TEXT,
  "currentOccupation" TEXT,
  "preferredLanguage" TEXT,
  "previousAgniveerAttempts" INTEGER,
  "runningExperience" TEXT,
  "pushUpExperience" TEXT,
  "sitUpExperience" TEXT,
  "currentPreparationLevel" TEXT,
  "dailyStudyHours" DOUBLE PRECISION,
  "internetAvailability" TEXT,
  "deviceType" TEXT,
  "learningPreference" TEXT,
  "careerGoal" TEXT,
  "completionPercentage" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankStudentProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankEnrollment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "batchId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ONBOARDING',
  "currentStep" TEXT NOT NULL DEFAULT 'WELCOME',
  "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "TopRankEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankBatchAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "enrollmentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TopRankBatchAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankProgramAgreement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "enrollmentId" TEXT,
  "version" TEXT NOT NULL DEFAULT 'RC3-AGNIVEER-FOUNDATION',
  "accepted" BOOLEAN NOT NULL DEFAULT false,
  "acceptedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankProgramAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopRankOrientationProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "videoKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "percentage" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TopRankOrientationProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TopRankSession_tokenHash_key" ON "TopRankSession"("tokenHash");
CREATE INDEX "TopRankSession_userId_idx" ON "TopRankSession"("userId");
CREATE INDEX "TopRankSession_expiresAt_idx" ON "TopRankSession"("expiresAt");
CREATE UNIQUE INDEX "TopRankStudentProfile_userId_key" ON "TopRankStudentProfile"("userId");
CREATE INDEX "TopRankEnrollment_userId_idx" ON "TopRankEnrollment"("userId");
CREATE INDEX "TopRankEnrollment_programId_idx" ON "TopRankEnrollment"("programId");
CREATE INDEX "TopRankEnrollment_batchId_idx" ON "TopRankEnrollment"("batchId");
CREATE INDEX "TopRankEnrollment_status_idx" ON "TopRankEnrollment"("status");
CREATE UNIQUE INDEX "TopRankBatchAssignment_userId_batchId_key" ON "TopRankBatchAssignment"("userId", "batchId");
CREATE INDEX "TopRankBatchAssignment_batchId_idx" ON "TopRankBatchAssignment"("batchId");
CREATE INDEX "TopRankBatchAssignment_enrollmentId_idx" ON "TopRankBatchAssignment"("enrollmentId");
CREATE INDEX "TopRankBatchAssignment_status_idx" ON "TopRankBatchAssignment"("status");
CREATE INDEX "TopRankProgramAgreement_userId_idx" ON "TopRankProgramAgreement"("userId");
CREATE INDEX "TopRankProgramAgreement_programId_idx" ON "TopRankProgramAgreement"("programId");
CREATE INDEX "TopRankProgramAgreement_enrollmentId_idx" ON "TopRankProgramAgreement"("enrollmentId");
CREATE INDEX "TopRankProgramAgreement_accepted_idx" ON "TopRankProgramAgreement"("accepted");
CREATE UNIQUE INDEX "TopRankOrientationProgress_userId_programId_videoKey_key" ON "TopRankOrientationProgress"("userId", "programId", "videoKey");
CREATE INDEX "TopRankOrientationProgress_programId_idx" ON "TopRankOrientationProgress"("programId");
CREATE INDEX "TopRankOrientationProgress_status_idx" ON "TopRankOrientationProgress"("status");

ALTER TABLE "TopRankSession" ADD CONSTRAINT "TopRankSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankStudentProfile" ADD CONSTRAINT "TopRankStudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankEnrollment" ADD CONSTRAINT "TopRankEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankEnrollment" ADD CONSTRAINT "TopRankEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TopRankProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankEnrollment" ADD CONSTRAINT "TopRankEnrollment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "TopRankBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TopRankBatchAssignment" ADD CONSTRAINT "TopRankBatchAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankBatchAssignment" ADD CONSTRAINT "TopRankBatchAssignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "TopRankBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankBatchAssignment" ADD CONSTRAINT "TopRankBatchAssignment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TopRankEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TopRankProgramAgreement" ADD CONSTRAINT "TopRankProgramAgreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankProgramAgreement" ADD CONSTRAINT "TopRankProgramAgreement_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TopRankProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankProgramAgreement" ADD CONSTRAINT "TopRankProgramAgreement_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TopRankEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TopRankOrientationProgress" ADD CONSTRAINT "TopRankOrientationProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TopRankUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopRankOrientationProgress" ADD CONSTRAINT "TopRankOrientationProgress_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TopRankProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

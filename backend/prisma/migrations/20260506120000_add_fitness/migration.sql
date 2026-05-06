ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TRAINER';

CREATE TABLE "FitnessProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "height" DOUBLE PRECISION NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "bmi" DOUBLE PRECISION NOT NULL,
  "runningTime" DOUBLE PRECISION NOT NULL,
  "pushups" INTEGER NOT NULL,
  "pullups" INTEGER NOT NULL,
  "situps" INTEGER NOT NULL,
  "staminaScore" DOUBLE PRECISION NOT NULL,
  "fitnessLevel" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FitnessProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PTSchedule" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "trainerName" TEXT NOT NULL,
  "activityType" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PTSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PTAttendance" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "ptScheduleId" TEXT NOT NULL,
  "attendanceStatus" TEXT NOT NULL,
  "remarks" TEXT,
  "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PTAttendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhysicalEligibility" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "examType" TEXT NOT NULL,
  "eligibilityStatus" TEXT NOT NULL,
  "heightEligible" BOOLEAN NOT NULL,
  "weightEligible" BOOLEAN NOT NULL,
  "bmiEligible" BOOLEAN NOT NULL,
  "staminaEligible" BOOLEAN NOT NULL,
  "overallRemark" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PhysicalEligibility_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyFitnessLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "runningDistance" DOUBLE PRECISION NOT NULL,
  "caloriesBurned" DOUBLE PRECISION NOT NULL,
  "waterIntake" DOUBLE PRECISION NOT NULL,
  "workoutDuration" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyFitnessLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FitnessProfile_userId_key" ON "FitnessProfile"("userId");
CREATE INDEX "PTSchedule_scheduledDate_idx" ON "PTSchedule"("scheduledDate");
CREATE INDEX "PTSchedule_activityType_idx" ON "PTSchedule"("activityType");
CREATE INDEX "PTAttendance_studentId_idx" ON "PTAttendance"("studentId");
CREATE INDEX "PTAttendance_ptScheduleId_idx" ON "PTAttendance"("ptScheduleId");
CREATE UNIQUE INDEX "PhysicalEligibility_userId_examType_key" ON "PhysicalEligibility"("userId", "examType");
CREATE INDEX "PhysicalEligibility_eligibilityStatus_idx" ON "PhysicalEligibility"("eligibilityStatus");
CREATE INDEX "DailyFitnessLog_userId_idx" ON "DailyFitnessLog"("userId");
CREATE INDEX "DailyFitnessLog_createdAt_idx" ON "DailyFitnessLog"("createdAt");

ALTER TABLE "FitnessProfile" ADD CONSTRAINT "FitnessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PTAttendance" ADD CONSTRAINT "PTAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PTAttendance" ADD CONSTRAINT "PTAttendance_ptScheduleId_fkey" FOREIGN KEY ("ptScheduleId") REFERENCES "PTSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhysicalEligibility" ADD CONSTRAINT "PhysicalEligibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyFitnessLog" ADD CONSTRAINT "DailyFitnessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

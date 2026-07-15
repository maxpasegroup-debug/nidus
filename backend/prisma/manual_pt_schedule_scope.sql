ALTER TABLE "PTSchedule" ADD COLUMN IF NOT EXISTS "trainerId" TEXT;
ALTER TABLE "PTSchedule" ADD COLUMN IF NOT EXISTS "batchId" TEXT;

CREATE INDEX IF NOT EXISTS "PTSchedule_trainerId_idx" ON "PTSchedule"("trainerId");
CREATE INDEX IF NOT EXISTS "PTSchedule_batchId_idx" ON "PTSchedule"("batchId");
CREATE INDEX IF NOT EXISTS "PTAttendance_studentId_ptScheduleId_idx" ON "PTAttendance"("studentId", "ptScheduleId");

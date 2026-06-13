ALTER TABLE "TeacherExamRecord"
  ADD COLUMN IF NOT EXISTS "testId" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "analytics" JSONB;

CREATE INDEX IF NOT EXISTS "TeacherExamRecord_testId_idx" ON "TeacherExamRecord"("testId");

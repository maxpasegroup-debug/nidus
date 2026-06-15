ALTER TABLE "LiveClass"
  ADD COLUMN IF NOT EXISTS "batchId" TEXT,
  ADD COLUMN IF NOT EXISTS "programSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "subject" TEXT,
  ADD COLUMN IF NOT EXISTS "topic" TEXT,
  ADD COLUMN IF NOT EXISTS "teacherId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN IF NOT EXISTS "recordingUrl" TEXT;

CREATE INDEX IF NOT EXISTS "LiveClass_batchId_idx" ON "LiveClass"("batchId");
CREATE INDEX IF NOT EXISTS "LiveClass_programSlug_idx" ON "LiveClass"("programSlug");
CREATE INDEX IF NOT EXISTS "LiveClass_teacherId_idx" ON "LiveClass"("teacherId");
CREATE INDEX IF NOT EXISTS "LiveClass_status_idx" ON "LiveClass"("status");
CREATE INDEX IF NOT EXISTS "LiveClass_scheduledAt_idx" ON "LiveClass"("scheduledAt");

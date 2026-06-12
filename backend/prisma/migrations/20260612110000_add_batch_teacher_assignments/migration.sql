CREATE TABLE IF NOT EXISTS "BatchTeacherAssignment" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "subject" TEXT NOT NULL DEFAULT 'General',
  "role" TEXT NOT NULL DEFAULT 'Subject Teacher',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BatchTeacherAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BatchTeacherAssignment_batch_teacher_subject_key"
  ON "BatchTeacherAssignment"("batchId", "teacherId", "subject");

CREATE INDEX IF NOT EXISTS "BatchTeacherAssignment_batchId_idx"
  ON "BatchTeacherAssignment"("batchId");

CREATE INDEX IF NOT EXISTS "BatchTeacherAssignment_teacherId_idx"
  ON "BatchTeacherAssignment"("teacherId");

ALTER TABLE "BatchTeacherAssignment"
  ADD CONSTRAINT "BatchTeacherAssignment_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "Batch"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BatchTeacherAssignment"
  ADD CONSTRAINT "BatchTeacherAssignment_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

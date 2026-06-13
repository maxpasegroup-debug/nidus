CREATE TABLE IF NOT EXISTS "AssignmentSubmissionRecord" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "answerText" TEXT,
  "attachmentName" TEXT,
  "link" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedBy" TEXT,
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "feedback" TEXT,
  "score" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssignmentSubmissionRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssignmentSubmissionRecord_assignment_student_key"
  ON "AssignmentSubmissionRecord"("assignmentId", "studentId");

CREATE INDEX IF NOT EXISTS "AssignmentSubmissionRecord_assignmentId_idx"
  ON "AssignmentSubmissionRecord"("assignmentId");

CREATE INDEX IF NOT EXISTS "AssignmentSubmissionRecord_batchId_idx"
  ON "AssignmentSubmissionRecord"("batchId");

CREATE INDEX IF NOT EXISTS "AssignmentSubmissionRecord_studentId_idx"
  ON "AssignmentSubmissionRecord"("studentId");

CREATE INDEX IF NOT EXISTS "AssignmentSubmissionRecord_status_idx"
  ON "AssignmentSubmissionRecord"("status");

CREATE INDEX IF NOT EXISTS "AssignmentSubmissionRecord_reviewStatus_idx"
  ON "AssignmentSubmissionRecord"("reviewStatus");

CREATE TABLE IF NOT EXISTS "AcademicLeaveRequest" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT,
  "batchId" TEXT,
  "batchName" TEXT,
  "fromDate" TIMESTAMP(3) NOT NULL,
  "toDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "attachmentName" TEXT,
  "attachmentUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedByName" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcademicLeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AcademicLeaveRequest_studentId_idx" ON "AcademicLeaveRequest"("studentId");
CREATE INDEX IF NOT EXISTS "AcademicLeaveRequest_batchId_idx" ON "AcademicLeaveRequest"("batchId");
CREATE INDEX IF NOT EXISTS "AcademicLeaveRequest_status_idx" ON "AcademicLeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "AcademicLeaveRequest_fromDate_toDate_idx" ON "AcademicLeaveRequest"("fromDate", "toDate");

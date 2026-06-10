CREATE TABLE "AcademicCalendarItem" (
  "id" TEXT NOT NULL,
  "batchId" TEXT,
  "batchName" TEXT NOT NULL,
  "programSlug" TEXT,
  "subject" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "plannedDate" TIMESTAMP(3) NOT NULL,
  "startTime" TIMESTAMP(3),
  "endTime" TIMESTAMP(3),
  "teacherId" TEXT,
  "teacherName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "completionStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "teacherLog" TEXT,
  "nextAction" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcademicCalendarItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcademicCalendarItem_batchId_idx" ON "AcademicCalendarItem"("batchId");
CREATE INDEX "AcademicCalendarItem_teacherId_idx" ON "AcademicCalendarItem"("teacherId");
CREATE INDEX "AcademicCalendarItem_plannedDate_idx" ON "AcademicCalendarItem"("plannedDate");
CREATE INDEX "AcademicCalendarItem_status_idx" ON "AcademicCalendarItem"("status");
CREATE INDEX "AcademicCalendarItem_completionStatus_idx" ON "AcademicCalendarItem"("completionStatus");

ALTER TABLE "AcademicCalendarItem"
ADD CONSTRAINT "AcademicCalendarItem_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AcademicCalendarItem"
ADD CONSTRAINT "AcademicCalendarItem_teacherId_fkey"
FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

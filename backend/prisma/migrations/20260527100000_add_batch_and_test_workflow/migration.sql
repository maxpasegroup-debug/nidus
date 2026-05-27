-- Batch allocation, teacher subject assignment, and teacher-led test publishing workflow.

CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "batchType" TEXT NOT NULL,
    "programSlug" TEXT NOT NULL,
    "courseId" TEXT,
    "instituteId" TEXT,
    "branchId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "schedule" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BatchStudent" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "BatchStudent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeacherBatchAssignment" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FACULTY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherBatchAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Test"
ADD COLUMN "subject" TEXT,
ADD COLUMN "topic" TEXT,
ADD COLUMN "batchId" TEXT,
ADD COLUMN "teacherId" TEXT,
ADD COLUMN "publishAt" TIMESTAMP(3),
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedById" TEXT;

CREATE UNIQUE INDEX "Batch_name_programSlug_key" ON "Batch"("name", "programSlug");
CREATE INDEX "Batch_batchType_idx" ON "Batch"("batchType");
CREATE INDEX "Batch_programSlug_idx" ON "Batch"("programSlug");
CREATE INDEX "Batch_courseId_idx" ON "Batch"("courseId");
CREATE INDEX "Batch_status_idx" ON "Batch"("status");
CREATE INDEX "Batch_startDate_idx" ON "Batch"("startDate");

CREATE UNIQUE INDEX "BatchStudent_batchId_studentId_key" ON "BatchStudent"("batchId", "studentId");
CREATE INDEX "BatchStudent_batchId_idx" ON "BatchStudent"("batchId");
CREATE INDEX "BatchStudent_studentId_idx" ON "BatchStudent"("studentId");
CREATE INDEX "BatchStudent_status_idx" ON "BatchStudent"("status");

CREATE UNIQUE INDEX "TeacherBatchAssignment_batchId_teacherId_subject_key" ON "TeacherBatchAssignment"("batchId", "teacherId", "subject");
CREATE INDEX "TeacherBatchAssignment_batchId_idx" ON "TeacherBatchAssignment"("batchId");
CREATE INDEX "TeacherBatchAssignment_teacherId_idx" ON "TeacherBatchAssignment"("teacherId");
CREATE INDEX "TeacherBatchAssignment_subject_idx" ON "TeacherBatchAssignment"("subject");
CREATE INDEX "TeacherBatchAssignment_status_idx" ON "TeacherBatchAssignment"("status");

CREATE INDEX "Test_batchId_idx" ON "Test"("batchId");
CREATE INDEX "Test_teacherId_idx" ON "Test"("teacherId");
CREATE INDEX "Test_status_idx" ON "Test"("status");
CREATE INDEX "Test_publishAt_idx" ON "Test"("publishAt");
CREATE INDEX "Test_subject_idx" ON "Test"("subject");

ALTER TABLE "Batch" ADD CONSTRAINT "Batch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BatchStudent" ADD CONSTRAINT "BatchStudent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatchStudent" ADD CONSTRAINT "BatchStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeacherBatchAssignment" ADD CONSTRAINT "TeacherBatchAssignment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherBatchAssignment" ADD CONSTRAINT "TeacherBatchAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Test" ADD CONSTRAINT "Test_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Test" ADD CONSTRAINT "Test_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Test" ADD CONSTRAINT "Test_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

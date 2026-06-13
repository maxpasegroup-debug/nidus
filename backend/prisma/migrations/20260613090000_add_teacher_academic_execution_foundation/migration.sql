CREATE TABLE IF NOT EXISTS "TeacherAttendanceRecord" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "batchName" TEXT,
  "subject" TEXT,
  "teacherId" TEXT,
  "teacherName" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "records" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SAVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherAttendanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherAttendanceRecord_batchId_idx" ON "TeacherAttendanceRecord"("batchId");
CREATE INDEX IF NOT EXISTS "TeacherAttendanceRecord_teacherId_idx" ON "TeacherAttendanceRecord"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherAttendanceRecord_date_idx" ON "TeacherAttendanceRecord"("date");

CREATE TABLE IF NOT EXISTS "TeacherAssignmentRecord" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "batchName" TEXT,
  "subject" TEXT,
  "course" TEXT,
  "teacherId" TEXT,
  "teacherName" TEXT,
  "title" TEXT NOT NULL,
  "topic" TEXT,
  "instructions" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "attachmentName" TEXT,
  "link" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherAssignmentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherAssignmentRecord_batchId_idx" ON "TeacherAssignmentRecord"("batchId");
CREATE INDEX IF NOT EXISTS "TeacherAssignmentRecord_teacherId_idx" ON "TeacherAssignmentRecord"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherAssignmentRecord_status_idx" ON "TeacherAssignmentRecord"("status");

CREATE TABLE IF NOT EXISTS "TeacherStudyMaterialRecord" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "batchName" TEXT,
  "course" TEXT,
  "folder" TEXT,
  "subject" TEXT,
  "topic" TEXT,
  "teacherId" TEXT,
  "teacherName" TEXT,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'PDF',
  "url" TEXT,
  "fileName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherStudyMaterialRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherStudyMaterialRecord_batchId_idx" ON "TeacherStudyMaterialRecord"("batchId");
CREATE INDEX IF NOT EXISTS "TeacherStudyMaterialRecord_teacherId_idx" ON "TeacherStudyMaterialRecord"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherStudyMaterialRecord_status_idx" ON "TeacherStudyMaterialRecord"("status");

CREATE TABLE IF NOT EXISTS "TeacherExamRecord" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "batchName" TEXT,
  "subject" TEXT,
  "course" TEXT,
  "teacherId" TEXT,
  "teacherName" TEXT,
  "title" TEXT NOT NULL,
  "topic" TEXT,
  "questionCount" INTEGER NOT NULL DEFAULT 10,
  "durationMinutes" INTEGER NOT NULL DEFAULT 20,
  "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
  "instructions" TEXT,
  "draft" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherExamRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherExamRecord_batchId_idx" ON "TeacherExamRecord"("batchId");
CREATE INDEX IF NOT EXISTS "TeacherExamRecord_teacherId_idx" ON "TeacherExamRecord"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherExamRecord_status_idx" ON "TeacherExamRecord"("status");

CREATE TABLE IF NOT EXISTS "TeacherCalendarLogRecord" (
  "id" TEXT NOT NULL,
  "calendarId" TEXT NOT NULL,
  "batchId" TEXT,
  "batchName" TEXT,
  "subject" TEXT,
  "topic" TEXT,
  "teacherId" TEXT,
  "teacherName" TEXT,
  "completionStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
  "teacherLog" TEXT,
  "nextAction" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UPDATED_BY_TEACHER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherCalendarLogRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherCalendarLogRecord_calendarId_idx" ON "TeacherCalendarLogRecord"("calendarId");
CREATE INDEX IF NOT EXISTS "TeacherCalendarLogRecord_teacherId_idx" ON "TeacherCalendarLogRecord"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherCalendarLogRecord_completionStatus_idx" ON "TeacherCalendarLogRecord"("completionStatus");

CREATE TABLE IF NOT EXISTS "TeacherSyllabusProgressRecord" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "batchName" TEXT,
  "subject" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "teacherId" TEXT,
  "teacherName" TEXT,
  "completionStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "progressColor" TEXT NOT NULL DEFAULT 'ORANGE',
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherSyllabusProgressRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherSyllabusProgressRecord_batchId_idx" ON "TeacherSyllabusProgressRecord"("batchId");
CREATE INDEX IF NOT EXISTS "TeacherSyllabusProgressRecord_teacherId_idx" ON "TeacherSyllabusProgressRecord"("teacherId");
CREATE INDEX IF NOT EXISTS "TeacherSyllabusProgressRecord_progressColor_idx" ON "TeacherSyllabusProgressRecord"("progressColor");

CREATE TABLE IF NOT EXISTS "AcademicActivityAuditRecord" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorName" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcademicActivityAuditRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AcademicActivityAuditRecord_actorId_idx" ON "AcademicActivityAuditRecord"("actorId");
CREATE INDEX IF NOT EXISTS "AcademicActivityAuditRecord_entityType_idx" ON "AcademicActivityAuditRecord"("entityType");
CREATE INDEX IF NOT EXISTS "AcademicActivityAuditRecord_createdAt_idx" ON "AcademicActivityAuditRecord"("createdAt");

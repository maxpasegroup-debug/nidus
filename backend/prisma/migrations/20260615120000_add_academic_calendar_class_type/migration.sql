ALTER TABLE "AcademicCalendarItem"
ADD COLUMN IF NOT EXISTS "classType" TEXT NOT NULL DEFAULT 'Live Class';

ALTER TABLE "TeacherCalendarLogRecord"
ADD COLUMN IF NOT EXISTS "classType" TEXT;

CREATE INDEX IF NOT EXISTS "AcademicCalendarItem_classType_idx"
ON "AcademicCalendarItem"("classType");

# 28 - Phase 07 Academic Operating System

## Status

Complete.

## Purpose

Phase 07 turns the academic module into one operating layer without creating another planner, timetable, syllabus tracker, LMS, assignment module or exam module.

The new layer is called:

`NIDUS Academic Operating System`

It connects the existing academic records into one flow:

Program -> Batch -> Curriculum -> Timetable -> Class -> Attendance -> Completion -> Study Material -> Assignment -> Daily Exam -> Progress

## What Was Added

- New protected API module at `/api/academic-os`.
- Unified academic flow contract.
- Role-aware Academic OS dashboard.
- Batch drill-down from curriculum to progress.
- Academic health score.
- Batch-level health colors.
- Planner-to-progress metrics.
- Academic risk alerts.
- Recent academic activity timeline.
- Role workflow guidance for Director, Academic Head and Teacher.
- Event Engine integration for Academic OS usage.
- Verification script: `npm run test:academic-os`.

## API

### `GET /api/academic-os/flow`

Returns the single academic operating flow and the existing source behind every step.

### `GET /api/academic-os/dashboard`

Returns:

- Academy health
- Today's planned/completed classes
- Attendance coverage
- Month-level classes, assignments, exams, material and syllabus metrics
- Batch health
- Academic alerts
- Recent academic activity
- Role workflow

### `GET /api/academic-os/batches/:batchId`

Returns:

- Batch identity
- Teachers
- Curriculum modules and lessons
- Planner-to-progress metrics
- Attendance coverage
- Study material count
- Assignment count
- Exam count
- Syllabus progress
- Next classes
- Recent progress

## Existing Records Reused

- `Course`
- `Module`
- `Lesson`
- `Batch`
- `BatchStudent`
- `TeacherBatchAssignment`
- `AcademicCalendarItem`
- `TeacherCalendarLogRecord`
- `TeacherAttendanceRecord`
- `TeacherStudyMaterialRecord`
- `TeacherAssignmentRecord`
- `AssignmentSubmissionRecord`
- `TeacherExamRecord`
- `TeacherSyllabusProgressRecord`
- `AcademicActivityAuditRecord`

## What Was Intentionally Not Changed

- No Prisma schema change.
- No planner duplication.
- No timetable duplication.
- No syllabus tracker duplication.
- No attendance logic change.
- No assignment logic change.
- No exam logic change.
- No UI redesign.
- No authentication or RBAC behavior change.

## Role Workflows

### Director

- Review academic health
- Check planner progress
- Check batch progress
- Check faculty progress
- Review academic alerts
- Ask NIDUS AI Director for risks

### Academic Head

- Review today's classes
- Check missing attendance
- Review syllabus completion
- Track faculty progress
- Check weak batches
- Approve pending reviews

### Teacher

- Open today's classes
- Mark attendance
- Complete lesson log
- Upload material or recording
- Give assignment
- Publish daily quiz or exam
- Review weak students

## Launch Impact

Phase 07 makes academics measurable from one place.

The system can now answer:

- Are classes happening as planned?
- Is attendance being marked after classes?
- Are teachers completing lessons?
- Are materials, assignments and exams following classes?
- Which batches are weak?
- Which batches need Academic Head attention?

This prepares the next launch phases for deeper academic workflow UI, teacher performance, student competition and reports.

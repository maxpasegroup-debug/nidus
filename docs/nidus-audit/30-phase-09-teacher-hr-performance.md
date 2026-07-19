# 30 - Phase 09 Teacher and HR Performance

## Status

Complete.

## Purpose

Phase 09 creates a unified Teacher and HR Performance Operating System without creating duplicate HR, payroll, teacher tracking or appraisal systems.

The new layer is called:

`NIDUS Teacher and HR Performance Operating System`

It measures staff performance using existing work signals and prepares appraisal/award recommendations for human approval.

## What Was Added

- New protected API module at `/api/performance-os`.
- Performance framework contract.
- Role-aware performance dashboard.
- Staff drill-down.
- Monthly/yearly period support.
- Teacher scorecards.
- HR scorecards.
- Review-needed queue.
- Best Teacher and Best Staff candidate recommendations.
- Appraisal readiness signal.
- Student feedback readiness signal.
- Event Engine integration for Performance OS usage.
- Verification script: `npm run test:performance-os`.

## API

### `GET /api/performance-os/framework`

Returns the single performance framework and the existing source behind every signal.

### `GET /api/performance-os/dashboard?period=MONTH`

Returns:

- Staff count
- Teacher count
- Average performance score
- Green/orange/red staff counts
- Review-needed employees
- Staff scorecards
- Best Teacher candidates
- Best Staff candidates
- Student feedback module readiness
- Role workflow

### `GET /api/performance-os/staff/:userId?period=MONTH`

Returns:

- Staff scorecard
- Appraisal readiness
- Suggested appraisal type
- Evidence summary

## Existing Records Reused

- `User`
- `Faculty`
- `Payroll`
- `RoleActivity`
- `TeacherBatchAssignment`
- `TeacherCalendarLogRecord`
- `TeacherAttendanceRecord`
- `TeacherAssignmentRecord`
- `TeacherExamRecord`
- `TeacherStudyMaterialRecord`
- `TeacherSyllabusProgressRecord`
- `AcademicActivityAuditRecord`

## Performance Signals

- Attendance
- Work logs
- Class completion
- Attendance marking
- Syllabus completion
- Assignments published
- Exams published
- Materials uploaded
- Payroll pending status
- Role activity
- Student feedback readiness

## What Was Intentionally Not Changed

- No Prisma schema change.
- No payroll calculation change.
- No HR workflow change.
- No automatic appraisal decisions.
- No automatic employee warning.
- No automatic award publishing.
- No duplicate teacher tracker.
- No duplicate HR system.
- No dashboard redesign.
- No authentication or RBAC behavior change.

## Award Rules

Best Teacher and Best Staff are recommendation lists only.

Director approval is required before publishing:

- Best Teacher of the Month
- Best Teacher of the Year
- Best Staff of the Month
- Best Staff of the Year

## Launch Impact

The system can now answer:

- Which teachers are performing well?
- Which teachers need support?
- Who is consistently completing classes?
- Who is marking attendance properly?
- Who is progressing syllabus?
- Who is publishing assignments, exams and materials?
- Which employees are ready for appraisal review?
- Who are the award candidates?

This prepares the next launch phases for student competition, class ratings and richer performance reports.

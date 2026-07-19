# 32 - Phase 11 Class Rating System

## Status

Complete.

## Operating Name

`NIDUS Class Rating Operating System`

## Purpose

Phase 11 gives every completed class a simple student feedback loop without creating a duplicate academic, timetable or teacher-performance module.

The feedback system is intentionally simple for students:

- Star rating.
- What was good.
- What was unclear.
- Teacher explanation score.
- Doubt clearing score.
- Pace score.
- Notes/material quality score.
- Optional comment.

## API

Base route:

`/api/class-rating-os`

Routes:

- `GET /framework`
- `GET /pending`
- `POST /feedback`
- `GET /summary?calendarId=optional&teacherId=optional&batchId=optional`

## Reused Existing Records

This phase reuses existing platform data:

- `AcademicCalendarItem`
- `BatchStudent`
- `AuditLog`
- `User`

No Prisma schema change was introduced.

## Persistence Decision

There is currently no dedicated `ClassFeedback` model in the schema.

To avoid unsafe schema churn during launch preparation, Phase 11 stores structured class feedback payloads in the existing `AuditLog` model under:

- `module = class-rating-os`
- `action = CLASS_FEEDBACK_SUBMITTED`

This makes the feedback:

- Persisted.
- Auditable.
- Queryable for summaries.
- Available to the Event Engine.
- Safe for reports and AI Director summaries.

## Student Flow

Student:

1. Opens pending class ratings.
2. Selects a completed class.
3. Gives one star rating.
4. Selects what was good.
5. Selects what was unclear.
6. Scores teacher explanation, doubt clearing, pace and material quality.
7. Adds optional comment.
8. Submits once.

Duplicate feedback for the same class by the same student is blocked.

## Access Rules

Allowed route roles:

- Admin
- Director
- Academic Head
- Teacher
- Student
- Parent

Submission:

- Only students can submit feedback.
- Student must be enrolled in the class batch.

Summaries:

- Management and academic roles can view feedback summaries.
- Student and parent access remains protected by route-level authentication and role behavior.

## Event Engine Integration

Added feedback events:

- `CLASS_FEEDBACK_SUBMITTED`
- `CLASS_RATING_PENDING_VIEWED`
- `CLASS_RATING_SUMMARY_VIEWED`

These enable later:

- WhatsApp summaries.
- Daily reports.
- Teacher performance insights.
- AI Director recommendations.

## Performance OS Integration

The Teacher and HR Performance OS now marks class feedback as ready:

`CLASS_RATING_OS_READY`

This replaces the previous readiness-only gap.

## What Was Not Changed

- No dashboard redesign.
- No public landing page changes.
- No authentication change.
- No RBAC behavior change.
- No Prisma schema change.
- No duplicate academic calendar.
- No duplicate timetable.
- No duplicate teacher tracker.

## Current Limitation

Because class feedback is stored in `AuditLog`, deeper future analytics such as indexed teacher feedback trends, student anonymity controls and per-question reporting can later benefit from a dedicated feedback model.

For launch readiness, this phase is sufficient because it makes feedback submission, summary, audit trail and event integration work without schema risk.

## Validation

Added:

`npm run test:class-rating-os`

The script verifies:

- Framework contract.
- Required feedback fields.
- API routes.
- API mount.
- Existing record reuse.
- Event taxonomy.
- Performance OS readiness status.

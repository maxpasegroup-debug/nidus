# 33 - Phase 12 Reports Operating System

## Status

Complete.

## Operating Name

`NIDUS Reports Operating System`

## Purpose

Phase 12 creates one report contract for daily, weekly and monthly academy supervision.

The goal is not to create another analytics module. The goal is to make the existing operating data understandable in under 30 seconds.

Every report answers:

- What happened?
- What needs attention?
- What should we do next?

## API

Base route:

`/api/reports-os`

Routes:

- `GET /framework`
- `GET /current?period=DAILY|WEEKLY|MONTHLY`
- `POST /pdf?period=DAILY|WEEKLY|MONTHLY`

## Reused Existing Records

The Reports OS reuses:

- `User`
- `AcademicCalendarItem`
- `TeacherAttendanceRecord`
- `TeacherAssignmentRecord`
- `TeacherExamRecord`
- `AuditLog`
- `Lead`
- `FollowUp`
- `Admission`
- `Payment`
- `FeeInstallment`
- `QueueJobLog`
- `Leaderboard`

No Prisma schema change was introduced.

## Report Contract

Every generated report includes:

- `academyHealth`
- `dashboardLink`
- `pdf`
- `whatsappSummary`
- `sections`
- `attention`
- `aiRecommendations`
- `drillDownCommands`
- `approvalButtons`
- `highlights`

## Report Periods

### Daily

Today's operating view.

### Weekly

Last seven days.

### Monthly

Current month to date.

## Sections

Reports are grouped into simple sections:

- Academics
- Admissions
- Finance
- Operations

This avoids long, messy reports.

## WhatsApp Summary

Each report produces a short WhatsApp-ready text summary with:

- Academy health.
- Class completion.
- Admissions.
- Collections.
- Pending fees.
- Class rating.
- Attention items.
- One recommendation.
- Drill-down command list.

## Drill-down Commands

Supported command structure:

- `REPORT`
- `ISSUES`
- `ACADEMICS`
- `ADMISSIONS`
- `FEES`
- `TEACHERS`
- `STUDENTS`

These point to existing operating APIs instead of creating duplicate drill-down pages.

## PDF Support

Reports reuse the existing PDF queue through:

`enqueuePDF`

If Redis or queues are unavailable, the API returns:

`QUEUE_UNAVAILABLE`

The report still returns a dashboard link and WhatsApp summary. PDF failure must not break reporting.

## Approval Buttons

Reports include approval buttons only for guarded suggestions:

- Fee follow-up plan.
- Admission review queue.

They are not executed automatically.

This preserves the AI Director approval principle.

## Event Engine Integration

Added event category:

- `REPORT`

Added events:

- `REPORT_GENERATED`
- `REPORT_PDF_QUEUED`

## What Was Not Changed

- No dashboard redesign.
- No public landing page changes.
- No authentication behavior change.
- No RBAC behavior change.
- No Prisma schema change.
- No duplicate analytics engine.
- No duplicate payment report logic.
- No duplicate academic report module.
- No automatic sensitive action execution.

## Launch Suitability

This phase is launch-suitable because:

- Reports are simple.
- Reports reuse existing records.
- WhatsApp text is ready.
- Dashboard/PDF paths are represented.
- Approval actions are guarded.
- Queue failure is graceful.
- The Director can understand the report quickly.

## Validation

Added:

`npm run test:reports-os`

The script verifies:

- Framework contract.
- Daily/weekly/monthly report signals.
- WhatsApp summary support.
- Dashboard link support.
- PDF queue support.
- Drill-down command support.
- AI recommendation support.
- Approval button support.
- API routes.
- API mount.
- Existing record reuse.
- Event taxonomy.

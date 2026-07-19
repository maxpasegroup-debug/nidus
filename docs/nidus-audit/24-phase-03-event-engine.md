# 24 - Phase 03 Event Engine

## Status

Complete.

## Purpose

Phase 03 creates the first operating layer needed for NIDUS AI Director, WhatsApp reports, workflow automation and daily academy intelligence.

The event engine records important academy activity in one standard language.

## Architecture Decision

No Prisma schema change was introduced.

The event engine reuses the existing `AuditLog` table and stores domain events under namespaced modules:

- `event:admission`
- `event:fee`
- `event:auth`
- `event:admin`
- `event:academic`
- `event:class`
- `event:attendance`
- `event:assignment`
- `event:exam`
- `event:hr`
- `event:communication`
- `event:student_feedback`
- `event:teacher_performance`
- `event:system`

This keeps the current database compatible while giving Phase 04 automation a clean event stream.

## Event Shape

Every domain event supports:

- Category
- Event name
- Title
- Description
- Actor
- Entity type
- Entity id
- Severity
- Source
- Correlation id
- Idempotency key
- Metadata
- IP address

## Event Categories

The locked event families are:

- Admission events
- Academic events
- Attendance events
- Class events
- Assignment events
- Exam events
- Fee events
- HR events
- Communication events
- Student feedback events
- Teacher performance events
- Auth events
- Admin events
- System events

## APIs Added

Protected routes:

- `GET /api/events/definitions`
- `GET /api/events/summary`
- `GET /api/events`

Allowed roles:

- Admin
- Director
- Academic Head
- Administrative Officer

## Workflows Currently Emitting Events

### Admissions and CRM

- Lead created
- Lead updated
- Bulk lead imported
- Guest applicant lead created or updated
- Public enquiry created or updated
- Follow-up created
- Counselling booked
- Admission created
- Admission approved or rejected

### Fees and Payments

- Payment order created
- Payment received
- Payment failed
- Refund requested

### Auth

- Login success
- Login failed
- Account locked
- Password/session/account security actions

### Admin

- Protected admin actions
- Role/settings/branch/user/session management actions

## Safety Rule

Event recording is non-blocking.

If an event cannot be recorded:

- The original workflow continues.
- A warning is logged.
- The user does not see an operational failure caused by event logging.

This is important because admissions, payments and classes must never fail only because automation tracking failed.

## Phase 04 Readiness

Phase 04 can now attach automation rules to events like:

- `LEAD_CREATED`
- `FOLLOW_UP_CREATED`
- `ADMISSION_REVIEWED`
- `PAYMENT_RECEIVED`
- `PAYMENT_FAILED`
- `ADMIN_ACTION`
- `LOGIN_FAILED`

The next phase should add rules, delays, escalation chains and queue dispatch on top of this stream.

## What Was Intentionally Left Unchanged

- Prisma schema
- Existing audit logs
- Existing payment calculations
- Existing admission rules
- Existing auth behavior
- Existing RBAC behavior
- Existing notification queues
- Existing WhatsApp simulation services

## Launch Impact

NIDUS now has a common event language.

This is the base required for:

- Morning WhatsApp reports
- Midday operational alerts
- Evening daily reports
- Weekly summaries
- Monthly summaries
- AI Director recommendations
- Escalation rules
- Audit-ready command history

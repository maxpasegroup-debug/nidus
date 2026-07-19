# 25 - Phase 04 Automation Engine

## Status

Complete.

## Purpose

Phase 04 makes NIDUS proactive.

The application now has a central rules layer that reacts to domain events from Phase 03.

## Architecture

The automation engine is intentionally lightweight and declarative.

Flow:

Event Engine

↓

Automation Rules

↓

Existing Queue Layer

↓

Notification / Signal Logs

↓

Future WhatsApp, AI and escalation workflows

## What Was Added

### Rule Registry

Rules live in one place and include:

- Rule id
- Name
- Description
- Enabled flag
- Trigger category
- Optional trigger event name
- Optional minimum severity
- Actions

### Actions

Two action types exist now:

- `NOTIFY`
- `SIGNAL`

`NOTIFY` uses the existing notification queue.

`SIGNAL` records a workflow-ready automation signal for future escalation and WhatsApp phases.

### APIs Added

Protected routes:

- `GET /api/automation/rules`
- `GET /api/automation/summary`

Allowed roles:

- Admin
- Director
- Academic Head
- Administrative Officer

## Rules Added

### Admission

- New lead notifies Admission Cell.
- Follow-up creation creates a reminder signal.
- Admission review notifies Director visibility.

### Fees

- Payment received notifies Accounts.
- Payment failed notifies Accounts and creates an escalation-watch signal.

### Security

- Login/security warnings notify Admin.

### Academics

- Academic activity creates a signal for future planner/class automation.

## Safety Rules

Automation must never break the original workflow.

If automation fails:

- The event is still recorded.
- The business action remains complete.
- A warning is logged.
- Queue-unavailable states are recorded as skipped automation.

## Idempotency

Automation decisions use deterministic job names:

`automation:{ruleId}:{actionIndex}:{eventId}`

Before planning an action, the engine checks whether the job was already planned.

This prevents duplicate automation actions for the same event.

## What Was Intentionally Left Unchanged

- Prisma schema
- Existing notification queue behavior
- Existing WhatsApp simulation service
- Existing payment logic
- Existing admission rules
- Existing auth behavior
- Existing RBAC
- Existing dashboards

## Phase 05 Readiness

Phase 05 can now connect real WhatsApp delivery and command handling to:

- Domain events
- Automation signals
- Notification queue
- Queue job logs
- Director summary reports

The foundation is ready for WhatsApp-first academy operations.

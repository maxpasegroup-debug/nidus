# 26 - Phase 05 WhatsApp Integration

## Status

Complete.

## Purpose

Phase 05 turns WhatsApp into the first real command layer for NIDUS Academy OS.

The web app remains the system of record.

WhatsApp becomes the Director's daily control surface.

## Architecture

Flow:

Event Engine

↓

Automation Engine

↓

WhatsApp Queue

↓

WhatsApp Cloud API or Logged-Only Mode

↓

Inbound Command Parser

↓

Event Engine

## Environment Variables Reused

The implementation reuses the existing WhatsApp configuration:

- `SALESBOOSTER_WHATSAPP_ACCESS_TOKEN`
- `SALESBOOSTER_WHATSAPP_PHONE_NUMBER_ID`
- `SALESBOOSTER_WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `SALESBOOSTER_DEFAULT_WHATSAPP_RECIPIENTS`

No new provider dependency was introduced.

## Logged-Only Mode

If WhatsApp credentials are missing:

- Startup continues.
- Sending does not crash.
- Messages are recorded as `WHATSAPP_LOGGED_ONLY`.
- Queue and command flows remain testable.

This keeps WhatsApp optional until production credentials are ready.

## Queue Added

Queue:

- `nidus.whatsapp`

Jobs:

- `send-whatsapp`
- `director-daily-report`

Worker:

- `startWhatsAppWorker`

## APIs Added

Public webhook routes:

- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`

Protected routes:

- `GET /api/whatsapp/health`
- `POST /api/whatsapp/send`
- `POST /api/whatsapp/director/daily-report`

Allowed protected roles:

- Admin
- Director
- Administrative Officer for manual send

## Director Daily Report

The report currently includes:

- Active students
- Active staff
- Admission follow-ups due today
- Admissions today
- Collections today
- Pending fee count and amount
- Event count
- Automation action count
- Simple reply commands

The report is intentionally simple and WhatsApp-friendly.

## Scheduled Report

The Director daily WhatsApp report is queued every day at 8:00.

The scheduler queues the report only.

Actual delivery remains in the WhatsApp worker.

## Inbound Commands

Supported commands:

- `1`
- `2`
- `3`
- `REPORT`
- `ISSUES`
- `TOMORROW`
- `APPROVE`

Current responses are safe command acknowledgements.

Sensitive execution is intentionally deferred to Phase 06 NIDUS AI Director guardrails.

## Event Integration

WhatsApp now emits domain events:

- `WHATSAPP_MESSAGE_SENT`
- `WHATSAPP_COMMAND_RECEIVED`

These events feed the same Event Engine and Automation Engine foundation.

## Safety Rules

WhatsApp must never break:

- Admissions
- Payments
- Academic workflows
- Login
- Dashboard access
- Server startup

Failures are logged and contained.

## What Was Intentionally Left Unchanged

- Prisma schema
- Existing notification queue
- Existing SalesBooster WhatsApp campaign workflows
- Existing CRM logic
- Payment logic
- Auth
- RBAC
- Dashboards

## Phase 06 Readiness

Phase 06 can now build NIDUS AI Director on top of:

- WhatsApp inbound commands
- WhatsApp outbound reports
- Domain events
- Automation signals
- Queue logs
- Approval intent from WhatsApp

The system is ready to support AI-assisted Director command flows.

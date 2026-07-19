# 34 - Phase 13 Communication Operating System

## Status

Complete.

## Operating Name

`NIDUS Communication Operating System`

## Purpose

Phase 13 unifies WhatsApp, email, in-app notifications, push notifications and parent/staff messaging into one operating layer without replacing the existing delivery systems.

This phase does not create a new messaging stack. It creates one coordination layer that decides:

- Priority.
- Channel.
- Frequency control.
- Opt-in/out respect.
- Summary bundling.
- Template tracking.
- Audit trail.

## API

Base route:

`/api/communication-os`

Routes:

- `GET /framework`
- `POST /dispatch`
- `GET /bundle?period=DAILY|WEEKLY|MONTHLY&targetRole=optional&targetUserId=optional`
- `GET /health`

## Reused Existing Systems

The Communication OS reuses:

- WhatsApp queue
- Email service
- Push notification queue
- `Notification`
- `EmailLog`
- `PushNotification`
- `AuditLog`
- `QueueJobLog`
- User role metadata

No Prisma schema change was introduced.

## Message Priority

Supported priorities:

- `LOW`
- `NORMAL`
- `HIGH`
- `URGENT`

Urgent messages can bypass opt-out/frequency limits because academy safety or operations may require delivery.

## Channels

Supported channels:

- `IN_APP`
- `EMAIL`
- `PUSH`
- `WHATSAPP`

If no channel is provided, the system defaults to in-app and adds email/WhatsApp when recipient data is available.

## Frequency Control

Repeated non-urgent messages using the same template and recipient key are skipped for 30 minutes.

This prevents WhatsApp/email overload.

## Opt-in / Opt-out

Opt preferences are read from existing `User.roleMetadata.communicationPreferences`.

Supported preference examples:

- `communicationPreferences.whatsapp = false`
- `communicationPreferences.email = false`
- `communicationPreferences.push = false`
- `communicationPreferences.in_app = false`
- `communicationPreferences.optOut = true`

No new preference table was added.

## Template Tracking

Each dispatch accepts `templateKey`.

The key is stored in the audit payload and used by frequency control.

## Summary Bundling

The bundle endpoint summarizes:

- In-app notifications.
- Email logs.
- Push logs.
- WhatsApp audit items.
- Communication queue status.

This prepares Phase 14 launch readiness and daily Director reporting.

## Health

The health endpoint reviews the last 24 hours:

- Email failures.
- Push failures.
- WhatsApp failures.
- Queued jobs.
- Failed jobs.

## Event Engine Integration

Added events:

- `COMMUNICATION_DISPATCHED`
- `COMMUNICATION_FREQUENCY_SKIPPED`
- `COMMUNICATION_SUMMARY_BUNDLED`
- `COMMUNICATION_HEALTH_VIEWED`

## What Was Not Changed

- No dashboard redesign.
- No public landing page changes.
- No authentication behavior change.
- No RBAC behavior change.
- No Prisma schema change.
- No duplicate WhatsApp service.
- No duplicate email service.
- No duplicate push service.
- No duplicate notification table.
- No automatic sensitive action execution.

## Launch Suitability

This phase is launch-suitable because:

- It gives one communication control layer.
- It protects users from repeated messages.
- It respects opt-out where preferences exist.
- It reuses all existing delivery systems.
- It logs every dispatch decision.
- It supports WhatsApp-first operations.

## Validation

Added:

`npm run test:communication-os`

The script verifies:

- Framework contract.
- Required communication capabilities.
- API routes.
- API mount.
- Existing system reuse.
- Frequency control.
- Summary bundling.
- Event taxonomy.

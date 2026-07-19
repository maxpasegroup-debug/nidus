# 36 - Phase 15 Pilot Launch

## Status

Complete.

## Purpose

Phase 15 adds a controlled Pilot Launch Operating System for the first real academy rollout. It does not create a new academy workflow. It checks whether the existing operating layers are ready for a limited 7 to 14 day pilot with real users.

## API

Base route:

- `/api/pilot-launch-os`

Endpoints:

- `GET /framework`
- `GET /readiness`

Access:

- Director
- Admin

## Pilot Scope

The controlled pilot expects:

- Director
- Academic Head
- 2 teachers or physical trainers
- Admission Cell user
- Accounts function user
- 1 active batch of students
- Selected linked parent accounts

## How It Works

The service reads existing records only:

- `User`
- `Batch`
- `BatchStudent`
- `ParentStudentLink`
- `AuditLog`
- `QueueJobLog`

It then returns:

- Pilot roster readiness
- Active batch readiness
- Academic OS rehearsal evidence
- Admissions OS rehearsal evidence
- Reports OS rehearsal evidence
- Communication OS rehearsal evidence
- Failed queue jobs in the last 24 hours
- Pilot score
- Go/no-go status
- Pending execution list

## Accounts Role Limitation

The current Prisma `Role` enum does not contain a dedicated `ACCOUNTS` role. For Phase 15, Accounts is tracked as an operating function using existing admin/administrative roles.

This preserves Prisma compatibility. A dedicated Accounts role can be considered only in a later schema/RBAC phase.

## Dashboard Rule

The pilot readiness response preserves the locked dashboard rule:

All pilot dashboards must remain grid styled, low content, neatly arranged, simple English and rural-area-friendly.

## Events

Phase 15 adds:

- `PILOT_READINESS_VIEWED`

This reuses the existing Event Engine and `AuditLog`. Pilot checks remain observable without changing business logic.

## Pending Real-World Executions

These are intentionally not automated because they require real academy decisions or live production credentials:

- Select the real pilot batch.
- Confirm the pilot duration: 7, 10 or 14 days.
- Assign the Academic Head for the pilot.
- Assign at least two teachers or physical trainers.
- Assign the Admission Cell pilot user.
- Assign the Accounts function owner.
- Link selected parent accounts to pilot students.
- Run one Reports OS daily report rehearsal.
- Run one Communication OS dispatch rehearsal.
- Verify WhatsApp Cloud API credentials in staging or production.
- Verify email delivery credentials in staging or production.
- Verify Redis queues and workers in the target deployment.
- Run database and media backup checks in the trusted deployment shell.
- Record Director go/no-go approval.

## Non-Goals

Phase 15 does not:

- Change Prisma schema.
- Add a dedicated Accounts role.
- Redesign dashboards.
- Change authentication.
- Change RBAC behavior.
- Change admissions, academic, reports or communication business logic.
- Create pilot demo data.

## Validation

The phase includes:

- `npm run test:pilot-launch-os`
- Backend TypeScript build validation
- Prisma schema validation
- Full workspace build validation

# 27 - Phase 06 NIDUS AI Director

## Status

Complete.

## Purpose

Phase 06 introduces `NIDUS AI Director` as the operating intelligence layer for the academy.

It does not replace the LMS, CRM, finance, academic, HR or WhatsApp modules. It reads from the existing system of record and produces Director-ready summaries, recommendations and approval-gated action decisions.

## What Was Added

- A new protected backend module at `/api/ai/director`.
- Live operating snapshot generation from existing records.
- Director summary with academy health, attention items and recommendations.
- Natural-language operations question handling.
- WhatsApp free-text command handoff to NIDUS AI Director.
- Sensitive action detection for fees, admissions, batch allocation and employee actions.
- Explicit approval guardrails using the keyword `APPROVE`.
- AI request logging through existing `AIRequestLog`.
- Audit logging through existing `AuditLog`.
- Domain event emission through the Phase 03 Event Engine.
- Verification script: `npm run test:ai-director`.

## API

### `GET /api/ai/director/guardrails`

Returns the AI Director safety policy and approval rules.

### `GET /api/ai/director/summary`

Returns:

- Assistant name
- Academy health
- Operational snapshot
- Attention list
- Recommendations
- WhatsApp-ready summary
- Guardrails

### `POST /api/ai/director/ask`

Body:

```json
{
  "question": "Why are fees low this week?"
}
```

Returns a concise operating answer with attention, recommendation and any approval-gated sensitive action.

### `POST /api/ai/director/approve`

Body:

```json
{
  "actionId": "fee-reminder-123",
  "approvalText": "APPROVE",
  "note": "Proceed after Accounts review"
}
```

Records Director approval. Actual workflow execution remains delegated to the existing automation/workflow layer.

## Data Sources Reused

- `User`
- `Lead`
- `FollowUp`
- `Admission`
- `FeeInstallment`
- `Payment`
- `AuditLog`
- `QueueJobLog`
- `AIRequestLog`

## Guarded Actions

NIDUS AI Director must ask approval before:

- Sending fee reminders
- Finalizing admissions
- Assigning or changing batches
- Employee warnings, appraisals or HR actions
- Parent-sensitive messages
- Student disciplinary messages

## WhatsApp Integration

The existing WhatsApp command parser still supports:

- `1`
- `2`
- `3`
- `REPORT`
- `ISSUES`
- `TOMORROW`
- `APPROVE`

Free-text questions now flow to NIDUS AI Director.

Example:

```text
Why are fees low this week?
```

NIDUS AI Director answers using the existing fee, payment, event and automation records.

## What Was Intentionally Not Changed

- No Prisma schema changes.
- No authentication changes.
- No RBAC behavior changes.
- No student AI interview/doubt logic changes.
- No OpenAI prompt changes.
- No financial, admission, employee or student action is executed automatically.
- No dashboard redesign.

## Launch Impact

This phase turns WhatsApp and backend APIs into an operating supervision layer:

- The Director can ask operational questions.
- Sensitive actions are never silently executed.
- AI insights are auditable.
- Future workflow execution can connect to approvals without changing the AI Director contract.

# NIDUS Exam Engine Final Readiness

## Decision

**PARTIAL — safe for controlled single-choice CBT preparation, not fully certified for a live examination until a reachable disposable PostgreSQL environment is available.**

## Architecture

The primary exam path is the `Test` / `Question` / `TestAttempt` / `CBTAnswerState` / `Answer` flow in `backend/src/modules/tests`. The legacy question-bank and exam construction path is in `backend/src/modules/examination`. Publication delegates to `exam-publishing-gate.ts`, and student access is enforced through batch enrollment, tenant ownership, publication state, and attempt ownership.

## Verified

- Draft-first question and exam creation.
- Explicit teacher approval before publication.
- Published/closed exam update protection.
- Student answer-key sanitization before release.
- Server-authoritative attempt timing.
- Unique `(userId, testId)` attempt constraint.
- Submission claim state and idempotent duplicate submission handling.
- Transactional answer persistence.
- Objective scoring with positive and negative marks.
- Duplicate answer payload normalization.
- CSV/manual question validation and exact duplicate rejection per teacher.
- Tenant authorization previously certified in Phases 14-17.

## Supported Content

The legacy CBT scoring path safely supports **single-choice A-D MCQs only**.

Multiple-answer, numerical, true/false, assertion/reasoning, matching, subjective, and file-upload questions are not supported by this scoring path and must not be published through it.

CSV and manual JSON question-bank import are supported. PDF, DOCX, image, and AI/OCR ingestion remain assisted workflows requiring teacher review and are not equivalent to direct, fully automated CBT import.

## Tests

- Focused exam integrity and launch safety: **10 passed**.
- Backend full suite: **52 suites passed, 296 tests passed**.
- Skipped: **4 suites, 5 tests**, existing environment-gated/intentional skips.
- Backend TypeScript: **PASS**.
- Prisma validation: **PASS**.

## Environment Blocker

The disposable PostgreSQL endpoint at `127.0.0.1:55432` was unreachable during this phase. Therefore the following were not claimed as passes:

- Real teacher-to-student lifecycle.
- Real 20-question, 50-question, and 100-question simulations.
- Real HTTP exam creation and result reconciliation.
- Live concurrency against PostgreSQL.

## Operational Limits

- Use single-choice A-D MCQs only.
- Require teacher review and approval for every question.
- Do not publish unsupported question types.
- Maximum tested question count in this phase: no new live-database evidence; prior validated exam-core evidence remains the limit.
- Maximum tested students in this phase: no new live-database evidence; prior validated limit remains 25 concurrent students.
- A reachable disposable PostgreSQL staging database is mandatory for final live-exam certification.

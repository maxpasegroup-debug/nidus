# 31 - Phase 10 Student Competition System

## Status

Complete.

## Operating Name

`NIDUS Student Competition Operating System`

## Purpose

Phase 10 creates a healthy student competition layer without creating another leaderboard, another exam system, another assignment tracker or another student progress database.

The goal is to motivate students through simple, understandable competition signals:

- Daily rank.
- Monthly leaderboard.
- Final leaderboard.
- All-time records.
- Improvement awards.
- Attendance streaks.
- Assignment streaks.
- Exam streaks.

## API

Base route:

`/api/student-competition-os`

Routes:

- `GET /framework`
- `GET /leaderboard?period=DAILY|MONTHLY|FINAL|ALL_TIME&batchId=optional`
- `GET /students/:userId`

## Reused Existing Records

The system computes competition from existing records only:

- `Leaderboard`
- `BatchStudent`
- `Attendance`
- `AssignmentSubmissionRecord`
- `TestAttempt`
- `QuizBattleParticipant`
- `DailyFitnessLog`
- `User`

No Prisma schema change was introduced.

## Competition Signals

### Daily Rank

Computed from the current day:

- Attendance.
- Assignment submissions.
- Test attempts.
- Quiz battle participation.
- Fitness logs.

### Monthly Leaderboard

Computed from the current month:

- Attendance consistency.
- Assignment completion.
- Exam performance.
- Quiz battle score.
- Fitness discipline.
- Improvement score.

### Final Leaderboard

Computed across the active available record window. This supports batch-end competition without creating a separate final leaderboard table.

### All-Time Records

Uses the existing `Leaderboard` model as the canonical all-time record source.

### Improvement Awards

Computed by comparing earlier and later exam performance inside the selected period. This prevents the leaderboard from rewarding only already-strong students.

### Streaks

The system calculates:

- Attendance streak.
- Assignment streak.
- Exam streak.
- Total streak.

## Award Logic

Awards are recommendation labels, not final certificates:

- Top Performer
- Most Improved
- Attendance Streak
- Assignment Streak
- Exam Streak

Final recognition should remain a human-approved academic decision.

## Role Access

Allowed roles:

- Admin
- Director
- Academic Head
- Teacher
- Student
- Parent

Students can access only their own competition profile.

## Event Engine Integration

Added event category:

- `STUDENT_COMPETITION`

Added events:

- `STUDENT_COMPETITION_SIGNAL`
- `STUDENT_COMPETITION_VIEWED`
- `STUDENT_COMPETITION_PROFILE_VIEWED`

These prepare the system for WhatsApp reports, automation rules and AI Director summaries.

## What Was Not Changed

- No dashboard redesign.
- No public landing page changes.
- No authentication changes.
- No RBAC behavior changes.
- No Prisma schema changes.
- No duplicate leaderboard table.
- No duplicate exam or assignment logic.
- No new student pressure workflow.

## Current Limitation

Assignment completion percentage currently reflects submitted assignment activity, because the existing system does not yet expose a single due-assignment expectation per student across all batches. The scoring is still useful for launch, but later report phases can make this more exact by comparing published assignments to submissions.

## Launch Suitability

This phase is launch-suitable because:

- It reuses current academy records.
- It provides simple competition summaries.
- It supports daily, monthly, final and all-time views.
- It rewards improvement and consistency, not only marks.
- It can feed student dashboards, parent summaries, AI Director insights and WhatsApp reports.

## Validation

Added:

`npm run test:student-competition-os`

The script verifies:

- Framework contract.
- Required signals.
- API routes.
- API mount.
- Existing model reuse.
- Event taxonomy registration.

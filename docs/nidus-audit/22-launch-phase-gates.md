# 22 - Launch Phase Gates

## Purpose

This file defines the approval gates for the launch build. It prevents NIDUS from drifting back into a messy ERP, duplicate LMS, or experimental rebuild.

## Non-Negotiable Dashboard Rule

All dashboards must be:

- Grid styled
- Simple
- Neatly arranged
- Low content
- Low option count
- Rural-area-friendly
- Clear in simple English
- Built around today's work

If a dashboard feels crowded, the phase is not complete.

## Phase Gate Checklist

Every implementation phase must answer yes to all of these:

- Does this reuse existing system records?
- Does this avoid duplicate modules?
- Does this reduce visible complexity?
- Does this support the AI Director plan?
- Does this support WhatsApp operations?
- Does this preserve existing data?
- Does this preserve existing authentication and role behavior?
- Does this improve launch readiness?
- Can a non-technical academy staff member understand the screen?
- Can the Director understand the summary in under 30 seconds?

## Launch Phase Order

### Phase 01 - Product Lock

Status: Complete.

Locked:

- No full rebuild.
- Existing core remains.
- Operating layer direction.
- WhatsApp-first Director control.
- Dashboard UX rule.

### Phase 02 - Dashboard Cleanup

Goal:

Simplify every role dashboard before adding more automation.

Dashboards:

- Director
- Academic Head
- Teacher
- Student
- Parent
- Admission Cell
- Accounts
- HR/Admin
- Business Development
- Video Editor

Output:

- Clean grid dashboards.
- Fewer options.
- Today's work first.
- No messy module grids.

### Phase 03 - Event Engine

Goal:

Every important academy activity creates an event.

Required event families:

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

### Phase 04 - Automation Engine

Goal:

Rules act on events.

Examples:

- Class delayed -> teacher reminder -> Academic Head escalation -> Director escalation.
- Fee overdue -> account task -> parent message draft -> Director summary.
- Lead untouched -> telecaller task -> admission head escalation.

### Phase 05 - WhatsApp Integration

Goal:

Real WhatsApp delivery and command handling.

Required:

- Director reports
- Staff reminders
- Parent summaries
- Fee reminders
- Admission follow-ups
- Incoming command parser
- Approval handling

### Phase 06 - NIDUS AI Director

Goal:

AI summarises, prioritises, recommends, drafts, and escalates.

AI must ask approval for:

- Financial actions
- Employee warnings
- Admission finalisation
- Parent-sensitive messages
- Student disciplinary actions

### Phase 07 - Academic Operating System

Goal:

Program planner to class completion and progress tracking.

Flow:

Program -> Batch -> Curriculum -> Timetable -> Class -> Attendance -> Completion -> Assignment -> Daily Exam -> Progress.

### Phase 08 - Admissions Operating System

Goal:

Lead to student activation.

Flow:

Lead -> Call -> Follow-up -> Counselling -> Application -> Documents -> Fee -> Admission -> Batch -> Student -> Parent.

### Phase 09 - Teacher and HR Performance

Goal:

Employee and teacher accountability.

Includes:

- Attendance
- Work logs
- Class punctuality
- Student feedback
- Syllabus completion
- Test improvement
- Appraisal
- Best teacher awards

### Phase 10 - Student Competition System

Goal:

Create healthy competition.

Includes:

- Daily rank
- Monthly leaderboard
- Final leaderboard
- All-time records
- Improvement awards
- Attendance streaks
- Assignment streaks
- Exam streaks

### Phase 11 - Class Rating System

Goal:

Every class receives simple student feedback.

Required:

- Star rating
- What was good
- What was unclear
- Teacher explanation
- Doubt clearing
- Pace
- Notes/material quality
- Optional comment

### Phase 12 - Reports

Goal:

Daily, weekly, monthly reports.

Every report must include:

- Short WhatsApp summary
- PDF or dashboard link
- Drill-down commands
- AI recommendations
- Approval buttons where needed

### Phase 13 - Communication Engine

Goal:

Unify WhatsApp, email, in-app notifications, push, and parent/staff messages.

Required:

- Message priority
- Frequency control
- Opt-in/opt-out
- Summary bundling
- Template tracking
- Audit trail

### Phase 14 - Testing and Launch Readiness

Goal:

Production-grade validation.

Required:

- Build
- TypeScript
- Lint
- Prisma validation
- Auth test
- RBAC test
- Payments test
- WhatsApp test
- Email test
- Queue test
- Report test
- Backup test

### Phase 15 - Pilot Launch

Goal:

Controlled real academy pilot.

Pilot users:

- Director
- Academic Head
- 2 teachers
- Admission Cell
- Accounts
- 1 batch of students
- selected parents

Pilot duration:

- 7 to 14 days

## Stop Rule

If any phase creates a duplicate planner, duplicate LMS, duplicate CRM, duplicate exam engine, duplicate notification system, or duplicate AI module, stop and redesign the phase before implementation.

## Launch Definition

The application is launch-ready when:

- Director receives useful WhatsApp reports.
- Staff dashboards are simple and actionable.
- Academic flow works from planner to completion.
- Admission flow works from lead to activation.
- Fee tracking and reminders work.
- Student daily tasks and leaderboards work.
- Class ratings work.
- AI Director can summarize and recommend.
- Critical actions are audited.
- Build, TypeScript, lint, Prisma, and smoke tests pass.


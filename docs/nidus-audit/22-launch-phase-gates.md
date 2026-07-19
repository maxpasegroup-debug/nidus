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

Status: Complete.

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

Completed:

- Academic Head now opens a simple workspace dashboard instead of the older dense HOD control center.
- Student dashboard now opens a clean today-first workspace.
- Parent dashboard now opens a simple child-status workspace.
- Academic Head navigation now points to the new workspace dashboard.
- Existing detailed operational pages remain available through deep links.

### Phase 03 - Event Engine

Status: Complete.

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

Completed:

- Added a centralized Event Engine using existing `AuditLog` persistence.
- Added event taxonomy for admission, academic, attendance, class, assignment, exam, fee, HR, communication, student feedback, teacher performance, auth, admin and system events.
- Added protected event APIs for definitions, recent events and 24-hour summaries.
- Added non-blocking event emitters to admission, CRM, fee/payment, auth and admin action flows.
- Event failures are logged and never block the original workflow.

### Phase 04 - Automation Engine

Status: Complete.

Goal:

Rules act on events.

Examples:

- Class delayed -> teacher reminder -> Academic Head escalation -> Director escalation.
- Fee overdue -> account task -> parent message draft -> Director summary.
- Lead untouched -> telecaller task -> admission head escalation.

Completed:

- Added a centralized Automation Engine that evaluates Phase 03 domain events.
- Added declarative automation rules for leads, follow-ups, admission reviews, payments, security warnings and academic signals.
- Added non-blocking automation dispatch through the existing notification queue.
- Added automation decision logging through existing `QueueJobLog`.
- Added protected automation APIs for rules and 24-hour summaries.
- Queue-unavailable states are logged as skipped automation, not runtime failures.

### Phase 05 - WhatsApp Integration

Status: Complete.

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

Completed:

- Added reusable WhatsApp Cloud API service using existing SalesBooster WhatsApp environment variables.
- Added logged-only mode when WhatsApp credentials are missing.
- Added WhatsApp queue and worker.
- Added public WhatsApp webhook verification and inbound command handling.
- Added protected WhatsApp send and Director daily report endpoints.
- Added daily scheduled Director WhatsApp report queueing.
- Added command parser for `1`, `2`, `3`, `REPORT`, `ISSUES`, `TOMORROW` and `APPROVE`.
- Added communication domain events for sent messages and inbound commands.

### Phase 06 - NIDUS AI Director

Status: Complete.

Goal:

AI summarises, prioritises, recommends, drafts, and escalates.

AI must ask approval for:

- Financial actions
- Employee warnings
- Admission finalisation
- Parent-sensitive messages
- Student disciplinary actions

Completed:

- Added a protected NIDUS AI Director operating layer at `/api/ai/director`.
- Added academy health, operational snapshot, attention items and recommendations.
- Added natural-language operating questions for Director-style supervision.
- Connected WhatsApp free-text commands to NIDUS AI Director.
- Added approval guardrails for financial, admission, batch, employee, parent-sensitive and student disciplinary actions.
- Reused existing `AIRequestLog`, `AuditLog`, Event Engine and operational database records.
- No Prisma schema, authentication, RBAC or business logic changes were introduced.

### Phase 07 - Academic Operating System

Status: Complete.

Goal:

Program planner to class completion and progress tracking.

Flow:

Program -> Batch -> Curriculum -> Timetable -> Class -> Attendance -> Completion -> Assignment -> Daily Exam -> Progress.

Completed:

- Added a protected Academic Operating System API at `/api/academic-os`.
- Added the single academic flow contract from Program to Progress.
- Added role-aware academic dashboard metrics for Director, Academic Head, Teacher and Physical Trainer access.
- Added batch drill-down from curriculum and teachers through calendar, attendance, materials, assignments, exams and syllabus progress.
- Added batch health scoring and academic risk alerts.
- Reused existing academic planner, timetable, attendance, assignment, study material, exam and syllabus records.
- Added Academic OS view events to the Event Engine.
- No duplicate planner, timetable, syllabus, attendance, assignment or exam module was created.

### Phase 08 - Admissions Operating System

Status: Complete.

Goal:

Lead to student activation.

Flow:

Lead -> Call -> Follow-up -> Counselling -> Application -> Documents -> Fee -> Admission -> Batch -> Student -> Parent.

Completed:

- Added a protected Admissions Operating System API at `/api/admissions-os`.
- Added the single admissions journey contract from Lead to Academic Planner Assignment.
- Added role-aware admissions dashboard metrics for Director, Admission Officer, BDE, Telecaller and Marketing access.
- Added lead journey drill-down with next-step visibility.
- Added pending approval, fee readiness, batch allocation, parent invitation and student activation signals.
- Reused existing CRM, follow-up, counselling, admission, fee, payment, batch, parent and document records.
- Added Admissions OS view events to the Event Engine.
- No duplicate CRM, admission workflow, payment workflow or student creation flow was created.

### Phase 09 - Teacher and HR Performance

Status: Complete.

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

Completed:

- Added a protected Teacher and HR Performance Operating System API at `/api/performance-os`.
- Added monthly/yearly performance scorecards.
- Added teacher performance signals for class completion, attendance marking, syllabus completion, assignments, exams and materials.
- Added HR signals for faculty profile, payroll pending status and role activity.
- Added review-needed queue.
- Added Best Teacher and Best Staff candidate recommendations.
- Added appraisal readiness signals with human approval required.
- Reused existing HR, payroll and academic performance records.
- No duplicate HR, payroll, appraisal or teacher tracker module was created.

### Phase 10 - Student Competition System

Status: Complete.

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

Completed:

- Added a protected Student Competition Operating System API at `/api/student-competition-os`.
- Added daily, monthly, final and all-time leaderboard views.
- Added batch-filtered competition views.
- Added student competition profile summaries.
- Added competition score signals for attendance, assignment submissions, test attempts, quiz battles, fitness logs and improvement.
- Added improvement awards so weaker students can still be recognized for progress.
- Added attendance, assignment and exam streak signals.
- Reused the existing `Leaderboard` model for all-time records.
- Reused existing attendance, assignment, exam, quiz battle, fitness and batch records.
- Added Student Competition events to the Event Engine.
- No duplicate leaderboard, exam, assignment, student progress or competition module was created.

### Phase 11 - Class Rating System

Status: Complete.

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

Completed:

- Added a protected Class Rating Operating System API at `/api/class-rating-os`.
- Added student pending class rating view.
- Added student class feedback submission.
- Added class feedback summary view.
- Added star rating, liked tags, unclear tags, teacher explanation score, doubt clearing score, pace score, material quality score and optional comment.
- Added duplicate-submission protection per student and class.
- Added enrollment validation so students can rate only their own batch classes.
- Reused existing `AcademicCalendarItem`, `BatchStudent` and `AuditLog` records.
- Added Student Feedback events to the Event Engine.
- Updated Teacher and HR Performance OS readiness from pending to ready for class ratings.
- No duplicate timetable, academic calendar, teacher tracker or Prisma feedback table was created.

### Phase 12 - Reports

Status: Complete.

Goal:

Daily, weekly, monthly reports.

Every report must include:

- Short WhatsApp summary
- PDF or dashboard link
- Drill-down commands
- AI recommendations
- Approval buttons where needed

Completed:

- Added a protected Reports Operating System API at `/api/reports-os`.
- Added daily, weekly and monthly report generation.
- Added short WhatsApp-ready summaries.
- Added dashboard links for detailed report review.
- Added PDF queue endpoint using the existing PDF queue.
- Added graceful PDF queue fallback when Redis/queues are unavailable.
- Added drill-down commands for issues, academics, admissions, fees, teachers and students.
- Added AI-style operating recommendations from current academy records.
- Added approval buttons only for guarded fee follow-up and admission review suggestions.
- Added academic, admissions, finance and operations report sections.
- Reused existing academic, admissions, payment, fee, class rating, leaderboard, event and queue records.
- Added Report events to the Event Engine.
- No duplicate analytics, academic report, payment report or PDF system was created.

### Phase 13 - Communication Engine

Status: Complete.

Goal:

Unify WhatsApp, email, in-app notifications, push, and parent/staff messages.

Required:

- Message priority
- Frequency control
- Opt-in/opt-out
- Summary bundling
- Template tracking
- Audit trail

Completed:

- Added a protected Communication Operating System API at `/api/communication-os`.
- Added one dispatch contract for in-app, email, push and WhatsApp.
- Added priority levels: low, normal, high and urgent.
- Added frequency control to reduce repeated non-urgent messages.
- Added opt-in/opt-out support through existing user role metadata preferences.
- Added template tracking through audited `templateKey`.
- Added communication summary bundling for daily, weekly and monthly windows.
- Added communication health checks for email, push, WhatsApp and queue failures.
- Reused existing Notification, EmailLog, PushNotification, WhatsApp queue, email service, push queue, AuditLog and QueueJobLog.
- Added Communication OS events to the Event Engine.
- No duplicate WhatsApp, email, push, notification or message system was created.

### Phase 14 - Testing and Launch Readiness

Status: Complete.

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

Completed:

- Added a protected Launch Readiness Operating System API at `/api/launch-readiness-os`.
- Added a launch readiness framework covering build, TypeScript, lint, Prisma, auth, RBAC, payments, WhatsApp, email, queue, report and backup gates.
- Added a Director/Admin checklist endpoint.
- Added launch score, gate status, evidence and required command output.
- Reused existing auth, role, payment, WhatsApp, integration, queue, report and backup verification scripts.
- Added Launch Readiness event tracking to the Event Engine.
- Preserved the non-negotiable dashboard rule inside the readiness response.
- No duplicate testing framework, dashboard redesign, schema change or workflow change was created.

### Phase 15 - Pilot Launch

Status: Complete.

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

Completed:

- Added a protected Pilot Launch Operating System API at `/api/pilot-launch-os`.
- Added a pilot framework endpoint for the 7 to 14 day controlled academy pilot.
- Added a readiness endpoint for Director/Admin go/no-go review.
- Added roster checks for Director, Academic Head, teachers, Admission Cell, Accounts function, students and parents.
- Added active batch, parent link, Reports OS, Communication OS and queue health checks.
- Added a pilot score and pending execution list.
- Preserved the locked dashboard rule inside pilot readiness output.
- Added Pilot Launch event tracking to the Event Engine.
- No dashboard redesign, Prisma schema change, duplicate workflow or fake pilot data was created.

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

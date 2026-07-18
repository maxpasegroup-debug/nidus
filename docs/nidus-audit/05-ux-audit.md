# 05 - UX Audit

## UX Goal

The product principle from the request is:

> Complex automation in the background. Simple actions on the screen.

Every role should quickly understand: "What should I do today?"

## Confirmed UX Surface

The frontend contains 238 route pages. Major public and app surfaces include:

- Public website pages: `/`, `/about-nidus`, `/courses`, `/admissions`, `/faculty`, `/gallery`, `/success-stories`, `/contact`, etc.
- Role dashboards: Director, Academic Head, Teacher, Student, Parent, Guest, Admission Cell, Business Development, Video Editor.
- Academic director pages: programs, batches, syllabus, timetable, reports, student progress, teacher performance.
- Teacher pages: classes, attendance, assignments, exams, lesson planner, library, question bank, reports.
- Student pages: learning, classes, attendance, assignments, exams, progress, top rank.
- CRM pages: leads, admissions, counselling, followups, referrals.
- Exam pages: examination center, tests, test attempts, assessment arena, psychometric.
- Operations pages: fees, invoices, payments, hostel, staff HR, documents, media.

## Positive UX Findings

- `frontend/src/components/layout/nav-items.ts` already simplifies navigation by role.
- Dashboard workspaces were introduced for Director, Academic Head, Teacher, Student, Parent, Admission Cell, Accounts, Business Development, and Video Editor.
- The app shell uses focused views for timetable, classroom, admission desk, and director workspace.
- Public and dashboard shells are separated in `AppShell`.
- Student/parent/teacher role dashboards are not just module grids; they contain "today" and progress patterns.

## UX Complexity Risks

- Too many direct routes create cognitive overload and increase the risk of duplicate workflows.
- Some pages expose implementation terms or backend concepts such as IDs, batch ids, payment statuses, and generated records.
- Large dashboard components suggest pages may be difficult to reason about and maintain.
- Academic workflow is still available from multiple entry points: director academic pages, teacher pages, academy service, ERP timetable, timetable planner, class pages.
- Assessment workflow is spread across tests, examination center, assessment arena, psychometric, AI exam, and top-rank pages.
- Admissions workflow exists as CRM plus admission-cell dashboard plus academy approval.

## Role Journey Audit

### Director

Current pattern:

Login -> `/dashboard/director` -> Academics/Admissions/Admin/Accounts/Reports/Settings -> APIs -> DB.

Good:

- Director menu is simplified.
- Director has overview and operational links.

Concern:

- Director can still reach many detailed screens. Needs executive intelligence, exceptions, and approvals before operational detail.

### Academic Head

Current pattern:

Login -> Academic dashboard/HOD -> timetable/classes/reports/teacher allocation -> academy APIs.

Good:

- Planner/faculty/students/reports group exists.

Concern:

- HOD and teacher paths overlap. Need one Academic Engine UX with role-specific permissions.

### Teacher

Current pattern:

Login -> teacher dashboard -> classes/attendance/assignments/exams/library -> academy APIs.

Good:

- Teacher routes match daily workflow.

Concern:

- Large teacher dashboard file indicates too many responsibilities in one surface.

### Student

Current pattern:

Login -> student dashboard -> learning/practice/exams/progress/profile.

Good:

- Student menu is simple.

Concern:

- Learning, tests, top-rank, guru, psychometric, and progress should feel like one learning journey.

### Parent

Current pattern:

Login -> parent dashboard -> child progress/attendance/fees/messages.

Good:

- Parent menu is simple and aligned with parent needs.

Concern:

- Parent communication should summarize instead of requiring multiple page checks.

### Admission Cell / BDE / Telecaller

Current pattern:

Login -> admission/business dashboard -> CRM leads/followups/counselling/admissions.

Good:

- CRM module and guided admission dashboard exist.

Concern:

- Lead-to-student activation must be one journey, not separate forms.

## UX Verdict

The UX has been moving in the right direction, but the system still feels like a feature-rich academy ERP unless navigation and workflows keep hiding complexity. The next UX phase should preserve all routes and reduce visible choices through role-specific tasks, approval queues, and action cards.


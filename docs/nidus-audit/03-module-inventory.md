# 03 - Module Inventory

## Backend Modules

Confirmed module folders under `backend/src/modules`:

- `academy`
- `admin-center`
- `ai-engine`
- `ai-exam`
- `ai-planner`
- `ai-workflow`
- `assessment-arena`
- `auth`
- `communication`
- `courses`
- `crm`
- `dashboard`
- `erp`
- `examination`
- `fitness`
- `hostel`
- `learning-hub`
- `learning-stability`
- `live-classes`
- `media`
- `mobile-guru`
- `nidus-guru`
- `payments`
- `psychometric`
- `sales-booster`
- `system`
- `tests`
- `toprank`
- `users`

## API Mount Inventory

Mounted in `backend/src/modules/index.ts`:

- `/api/auth`
- `/api/courses`
- `/api/dashboard`
- `/api/tests`
- `/api/psychometric`
- `/api/assessment-arena`
- `/api/ai-planner`
- `/api/analytics`
- `/api/revision-schedule`
- `/api/live-classes`
- `/api/recorded-lectures`
- `/api/lecture-progress`
- `/api/attendance`
- `/api/timetable`
- `/api/faculty`
- `/api/payroll`
- `/api/announcements`
- `/api/users`
- `/api/hostels`
- `/api/rooms`
- `/api/hostel`
- `/api/mess`
- `/api/discipline`
- `/api/parade`
- `/api/crm`
- `/api/payments`
- `/api/subscriptions`
- `/api/fees`
- `/api/invoices`
- `/api/notifications`
- `/api/messages`
- `/api/emails`
- `/api/push`
- `/api/ai/exam`
- `/api/ai/workflow`
- `/api/ai`
- `/api/fitness`
- `/api/pyq`
- `/api/current-affairs`
- `/api/quiz-battles`
- `/api/leaderboard`
- `/api/media`
- `/api/documents`
- `/api/admin`
- `/api/academy`
- `/api/nidus-guru`
- `/api/examination`
- `/api/learning-stability`
- `/api/sales-booster`
- `/api/mobile/guru`
- `/api/my-courses`

## Product Module Mapping

| Product area | Evidence | Current status | Reuse estimate |
|---|---|---:|---:|
| Authentication | `backend/src/modules/auth`, `frontend/src/services/auth.v2.ts` | Mature session-cookie auth | 80% |
| Role navigation | `frontend/src/components/layout/nav-items.ts` | Simplified role menus exist | 70% |
| Admin/RBAC | `backend/src/modules/admin-center` | Permissions exist for admin center | 65% |
| Academics | `backend/src/modules/academy`, director/teacher pages | Broad functionality, complex entry points | 75% |
| Timetable | `/api/timetable`, `academy` calendar routes, director timetable page | Exists, needs product consolidation | 70% |
| Attendance | `/api/attendance`, `Attendance` model, teacher/student pages | Exists | 75% |
| Assignments/materials | academy routes and dashboard pages | Exists | 75% |
| Courses/LMS | `courses`, `learning-hub`, `live-classes`, learning pages | Exists, fragmented | 65% |
| Exams/tests | `tests`, `examination`, `assessment-arena`, `ai-exam` | Strong but overlapping | 70% |
| Psychometric | `psychometric`, assessment arena | Significant domain investment | 80% |
| Admissions/CRM | `crm`, admission dashboard, academy approval | Strong pipeline foundation | 75% |
| Payments/fees | `payments`, Razorpay, finance models | Strong foundation | 80% |
| HR/ERP | `erp`, `Payroll`, `Faculty`, teacher attendance records | Basic to moderate | 55% |
| Hostel | `hostel`, room, allocation, in/out, leave, mess | Exists | 65% |
| Communications | `communication`, email, push, messages, announcements | Exists, not fully orchestrated | 65% |
| Media/upload | `media`, Cloudinary config | Good foundation | 80% |
| AI | `ai-engine`, `ai-exam`, `ai-planner`, `ai-workflow`, AI models | Strong primitives, not one operating layer | 70% |
| Sales/marketing automation | `sales-booster` | Present | 60% |
| Reports/analytics | dashboard services, assessment reports, payments analytics | Exists per module | 60% |

## Frontend Module Surface

The frontend has many feature folders under `frontend/src/components`, including:

- `academy`
- `admission`
- `ai-engine`
- `ai-planner`
- `assessments`
- `communication`
- `crm`
- `dashboard`
- `design-system`
- `examination`
- `learning`
- `payments`
- `teacher`
- `student`
- `workflow`

This confirms a broad UI investment, but the route count also confirms the Director and staff experience can feel crowded without role workspace simplification.

## Module Architecture Verdict

The backend architecture is mostly module-oriented and reusable. The frontend architecture is feature-folder oriented but has accumulated many route entry points and large dashboard files. The correct transformation is consolidation through navigation, workflow, shared service boundaries, and contracts, not deletion or rewrite.


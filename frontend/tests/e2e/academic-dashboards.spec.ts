import { expect, test, type Page, type Route } from "@playwright/test";

const teacher = {
  id: "teacher-1",
  name: "Captain Teacher",
  email: "teacher@nidus.test",
  mobile: "9000000001",
  role: "TEACHER",
};

const student = {
  id: "student-1",
  name: "Aarav Student",
  email: "student@nidus.test",
  mobile: "9000000002",
  role: "STUDENT",
};

const batch = {
  id: "batch-1",
  name: "NDA Foundation Alpha",
  batchType: "REGULAR",
  programSlug: "nda-foundation",
  status: "ACTIVE",
  course: { id: "course-1", title: "NDA Foundation", slug: "nda-foundation", examType: "NDA", category: "Foundation" },
  students: [{ id: "batch-student-1", status: "ACTIVE", student }],
  teachers: [{ id: "batch-teacher-1", subject: "History", role: "Lead Faculty", status: "ACTIVE", teacher }],
  _count: { students: 1, teachers: 1, tests: 1 },
};

const calendarItem = {
  id: "calendar-1",
  batchId: batch.id,
  batchName: batch.name,
  programSlug: "nda-foundation",
  subject: "History",
  topic: "Medieval India",
  plannedDate: new Date().toISOString(),
  startTime: "09:00",
  endTime: "10:00",
  teacherId: teacher.id,
  teacherName: teacher.name,
  status: "PLANNED",
  completionStatus: "PENDING",
  teacherLog: "",
  nextAction: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const attendanceSession = {
  id: "attendance-1",
  batchId: batch.id,
  batchName: batch.name,
  subject: "History",
  teacherId: teacher.id,
  teacherName: teacher.name,
  date: new Date().toISOString(),
  status: "SAVED",
  createdAt: new Date().toISOString(),
  records: [{ studentId: student.id, studentName: student.name, status: "PRESENT" }],
};

const assignment = {
  id: "assignment-1",
  batchId: batch.id,
  batchName: batch.name,
  subject: "History",
  course: "NDA Foundation",
  title: "Medieval India practice",
  topic: "Delhi Sultanate",
  instructions: "Answer all questions in short notes.",
  dueDate: new Date().toISOString(),
  attachmentName: "practice.pdf",
  link: "https://example.com/practice",
  status: "PUBLISHED",
  submissionStatus: "PENDING",
  createdAt: new Date().toISOString(),
  submissions: [],
  submissionStats: { totalStudents: 1, submitted: 0, pending: 1, reviewed: 0 },
};

const material = {
  id: "material-1",
  batchId: batch.id,
  batchName: batch.name,
  course: "NDA Foundation",
  folder: "History",
  subject: "History",
  topic: "Medieval India",
  teacherId: teacher.id,
  teacherName: teacher.name,
  title: "Medieval India quick notes",
  type: "PDF",
  url: "https://example.com/notes",
  fileName: "notes.pdf",
  status: "PUBLISHED",
  reviewStatus: "PENDING_REVIEW",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const exam = {
  id: "exam-1",
  testId: "test-1",
  batchId: batch.id,
  batchName: batch.name,
  subject: "History",
  course: "NDA Foundation",
  teacherId: teacher.id,
  teacherName: teacher.name,
  title: "NDA History Test 01",
  examName: "NDA History Test 01",
  topic: "Medieval India",
  questionCount: 10,
  totalQuestions: 10,
  durationMinutes: 20,
  difficulty: "MEDIUM",
  status: "PUBLISHED",
  studentStatus: "Available",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  attemptStats: { attempts: 1, submitted: 1, averageScore: 80 },
};

async function json(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": "http://127.0.0.1:3000",
      "access-control-allow-credentials": "true",
    },
    body: JSON.stringify(payload),
  });
}

async function mockAcademicApi(page: Page, user: Record<string, unknown>) {
  await page.route("**/api/auth/me", (route) => json(route, { success: true, user }));
  await page.route("**/api/auth/logout", (route) => json(route, { message: "Logged out" }));
  await page.route("**/api/my-courses", (route) => json(route, { courses: [] }));
  await page.route("**/api/dashboard/**", (route) => json(route, {
    role: user.role,
    data: user.role === "STUDENT"
      ? {
          profile: user,
          enrolledCourses: [],
          academyProfile: { assignedBatches: [batch], todayClasses: [], upcomingClasses: [], librarySubjects: [] },
          upcomingTests: [],
          attendance: { percentage: 100, present: 1, total: 1, trend: [] },
          leaderboardRank: { rank: 1, percentile: 100, batch: batch.name },
          aiRecommendations: [],
          fitnessProgress: { score: 0, streakDays: 0, focus: "Baseline" },
          recentActivities: [],
        }
      : { profile: user },
  }));
  await page.route("**/api/tests/available", (route) => json(route, [exam]));
  await page.route("**/api/tests/attempts/history", (route) => json(route, [{ id: "attempt-1", testId: "test-1", score: 80, status: "SUBMITTED", submittedAt: new Date().toISOString() }]));
  await page.route("**/api/academy/**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (request.method() === "POST") {
      if (path.endsWith("/batches")) return json(route, { batch: { ...batch, name: "NDA Foundation Bravo" } }, 201);
      if (path.endsWith("/teachers")) return json(route, { ok: true, assignment: batch.teachers[0] }, 201);
      if (path.endsWith("/academic-calendar")) return json(route, { item: calendarItem }, 201);
      if (path.endsWith("/attendance")) return json(route, { ok: true, attendance: attendanceSession }, 201);
      if (path.endsWith("/study-materials")) return json(route, { material }, 201);
      if (path.endsWith("/exams/ai-draft")) return json(route, { draft: "AI draft ready for Medieval India.", questions: [] }, 201);
      if (path.endsWith("/exams")) return json(route, { ok: true, exam }, 201);
      if (path.endsWith("/assignments")) return json(route, { ok: true, assignment }, 201);
      if (path.includes("/assignments/") && path.endsWith("/submit")) return json(route, { submission: { id: "submission-1", status: "SUBMITTED" } }, 201);
    }

    if (request.method() === "PATCH" && path.includes("/study-materials/")) {
      return json(route, { material: { ...material, reviewStatus: "APPROVED" } });
    }

    if (path.endsWith("/batches")) return json(route, { batches: [batch] });
    if (path.endsWith("/teachers")) return json(route, { teachers: [teacher] });
    if (path.endsWith("/my-teaching-plan")) return json(route, { batches: [batch], calendar: [calendarItem] });
    if (path.endsWith("/my-plan")) {
      return json(route, {
        batches: [batch],
        calendar: [calendarItem],
        attendance: { summary: { present: 1, absent: 0, leave: 0, total: 1, percentage: 100 }, sessions: [attendanceSession] },
        assignments: [assignment],
        materials: [material],
      });
    }
    if (path.endsWith("/academic-calendar")) return json(route, { items: [calendarItem] });
    if (path.endsWith("/attendance")) return json(route, { attendance: [attendanceSession] });
    if (path.endsWith("/assignments")) return json(route, { assignments: [assignment] });
    if (path.endsWith("/study-materials")) return json(route, { materials: [material] });
    if (path.endsWith("/exams")) return json(route, { exams: [exam] });
    if (path.endsWith("/syllabus-progress")) return json(route, { progress: [{ id: "progress-1", batchId: batch.id, batchName: batch.name, subject: "History", topic: "Medieval India", completionStatus: "PARTIAL", progressColor: "ORANGE", updatedAt: new Date().toISOString() }] });
    if (path.endsWith("/attendance-summary")) return json(route, { summary: { sessions: 1, records: 1, present: 1, absent: 0, leave: 0, percentage: 100, batches: [{ batchId: batch.id, batchName: batch.name, sessions: 1, present: 1, absent: 0, leave: 0, total: 1, percentage: 100 }], students: [{ studentId: student.id, studentName: student.name, present: 1, absent: 0, leave: 0, total: 1, percentage: 100 }] }, attendance: [attendanceSession] });
    if (path.endsWith("/assignment-summary")) return json(route, { summary: { assignments: 1, totalExpected: 1, submitted: 0, pending: 1, reviewed: 0 }, assignments: [assignment] });
    if (path.endsWith("/material-summary")) return json(route, { summary: { total: 1, published: 1, pendingReview: 1, approved: 0, rejected: 0, links: 1, files: 1 }, materials: [material] });
    if (path.endsWith("/exam-summary")) return json(route, { summary: { exams: 1, liveTests: 1, attempts: 1, submitted: 1, averageScore: 80 }, exams: [exam] });
    if (path.endsWith("/syllabus-summary")) return json(route, { summary: { total: 1, green: 0, orange: 1, red: 0, completed: 0, partial: 1, pending: 0, completionPercentage: 50 }, batches: [{ batchId: batch.id, batchName: batch.name, total: 1, green: 0, orange: 1, red: 0, completed: 0, partial: 1, pending: 0, completionPercentage: 50 }], progress: [] });
    if (path.endsWith("/academic-audit")) return json(route, { activity: [{ id: "audit-1", action: "ATTENDANCE_SAVED", actorName: teacher.name, createdAt: new Date().toISOString() }] });

    return json(route, {});
  });
}

test.describe("Academic dashboard production flow", () => {
  test("Director can plan batch, teacher allocation and calendar", async ({ page }) => {
    await mockAcademicApi(page, { id: "director-1", name: "Director", email: "director@nidus.test", role: "DIRECTOR" });
    await page.goto("/dashboard/director/academic");

    await expect(page.getByRole("heading", { name: /academic command/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /director actions/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /teach today/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create exam/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create batch/i })).toBeVisible();
  });

  test("Academic Head sees planning, approvals and monitoring", async ({ page }) => {
    await mockAcademicApi(page, { id: "hod-1", name: "Academic Head", email: "hod@nidus.test", role: "TEACHER", roleMetadata: { dashboardTemplate: "ACADEMIC_HEAD" } });
    await page.goto("/dashboard/academic-head");

    await expect(page.getByRole("heading", { name: /today's academic work/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /choose one/i })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "My Classes", exact: true })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "Faculty", exact: true })).toBeVisible();
  });

  test("Teacher can run class actions from one workspace", async ({ page }) => {
    await mockAcademicApi(page, teacher);
    await page.goto("/dashboard/teacher");

    await expect(page.getByRole("heading", { name: /today's teaching work/i })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "My Classes", exact: true })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "Mark Attendance", exact: true })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "Exams", exact: true })).toBeVisible();
  });

  test("Student receives assigned academic services", async ({ page }) => {
    await mockAcademicApi(page, student);
    await page.goto("/dashboard/student");

    await expect(page.getByRole("heading", { name: /today, aarav student/i })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "Learning", exact: true })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "Practice", exact: true })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "Exams", exact: true })).toBeVisible();
  });
});

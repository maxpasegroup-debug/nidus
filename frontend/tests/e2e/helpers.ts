import type { Page, Route } from "@playwright/test";

const betaUser = {
  id: "beta-student",
  name: "Beta Student",
  email: "beta@student.test",
  mobile: "9999999999",
  role: "STUDENT",
  emailVerified: true,
  mobileVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

async function json(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload)
  });
}

export async function mockPublicApi(page: Page, authenticated = false) {
  await page.route("**/api/auth/me", (route) => authenticated ? json(route, betaUser) : json(route, { message: "Unauthorized" }, 401));
  await page.route("**/api/auth/login", (route) => json(route, { user: betaUser }));
  await page.route("**/api/auth/refresh", (route) => authenticated ? json(route, { user: betaUser }) : json(route, { message: "Unauthorized" }, 401));
  await page.route("**/api/auth/register", (route) => json(route, { user: { ...betaUser, emailVerified: false } }, 201));
  await page.route("**/api/auth/forgot-password/send-otp", (route) => json(route, { message: "Reset instructions sent" }));
  await page.route("**/api/auth/logout", (route) => json(route, { message: "Logged out" }));
  await page.route("**/api/tests?**", (route) => json(route, { tests: [{ id: "test-1", title: "NDA Beta Mock", description: "Public beta CBT smoke test", examType: "NDA", category: "Math", duration: 30, totalMarks: 100, isLive: false, isMockTest: true }] }));
  await page.route("**/api/dashboard/**", (route) => json(route, {
    role: betaUser.role,
    data: {
      profile: betaUser,
      enrolledCourses: [],
      upcomingTests: [],
      attendance: { percentage: 0, present: 0, total: 0, trend: [] },
      leaderboardRank: { rank: 1, percentile: 100, batch: "Beta" },
      aiRecommendations: [],
      fitnessProgress: { score: 0, streakDays: 0, focus: "Baseline" },
      recentActivities: []
    }
  }));
  await page.route("**/api/my-courses", (route) => json(route, { courses: [] }));
}

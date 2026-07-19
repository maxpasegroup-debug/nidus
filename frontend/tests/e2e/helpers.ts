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
const authResponse = { success: true, user: betaUser };

async function json(route: Route, payload: unknown, status = 200) {
  if (route.request().method() === "OPTIONS") {
    await route.fulfill({
      status: 204,
      headers: {
        "access-control-allow-origin": "http://127.0.0.1:3000",
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization"
      }
    });
    return;
  }

  await route.fulfill({
    status,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": "http://127.0.0.1:3000",
      "access-control-allow-credentials": "true"
    },
    body: JSON.stringify(payload)
  });
}

export async function mockPublicApi(page: Page, authenticated = false) {
  let isAuthenticated = authenticated;
  let currentUser = betaUser;
  await page.route("**/api/auth/me", (route) => isAuthenticated ? json(route, { success: true, user: currentUser }) : json(route, { message: "Unauthorized" }, 401));
  await page.route("**/api/auth/login", (route) => {
    isAuthenticated = true;
    currentUser = betaUser;
    return json(route, authResponse);
  });
  await page.route("**/api/auth/signup", (route) => {
    isAuthenticated = true;
    currentUser = { ...betaUser, role: "GUEST" };
    return json(route, { ...authResponse, user: { ...currentUser, emailVerified: true } }, 201);
  });
  await page.route("**/api/auth/forgot-password", (route) => json(route, { success: true, message: "PIN reset link sent to the registered email" }));
  await page.route("**/api/auth/forgot-password/send-otp", (route) => json(route, { success: true, message: "PIN reset link sent to the registered email" }));
  await page.route("**/api/auth/reset-password", (route) => json(route, { success: true, message: "PIN reset successful. Please login." }));
  await page.route("**/api/auth/logout", (route) => {
    isAuthenticated = false;
    return json(route, { message: "Logged out" });
  });
  await page.route("**/api/tests**", (route) => json(route, { tests: [{ id: "test-1", title: "NDA Beta Mock", description: "Public beta CBT smoke test", examType: "NDA", category: "Math", duration: 30, totalMarks: 100, isLive: false, isMockTest: true }] }));
  await page.route("**/api/dashboard/**", (route) => {
    const url = route.request().url();
    if (url.includes("/dashboard/guest")) {
      return json(route, {
        role: "GUEST",
        data: {
          featuredCourses: [{ id: "course-1", title: "NDA Foundation", duration: "4 weeks", level: "Beginner" }],
          freeTests: [{ id: "test-1", title: "NDA Beta Mock", questions: 20 }],
          latestNews: ["Orientation briefing open"]
        }
      });
    }

    return json(route, {
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
    });
  });
  await page.route("**/api/my-courses", (route) => json(route, { courses: [] }));
}

export async function waitForNidusHydration(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("main").first().waitFor({ state: "visible" });
}

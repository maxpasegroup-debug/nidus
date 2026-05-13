import { expect, test } from "@playwright/test";
import { mockPublicApi } from "./helpers";

test("login flow reaches dashboard with mocked backend auth", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto("/login");
  await page.getByLabel("Email or mobile").fill("beta@student.test");
  await page.getByLabel("Password").fill("StrongPass123");
  await page.getByRole("button", { name: /access platform/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("registration keeps public roles restricted to student or guest", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto("/register");
  await expect(page.getByLabel("Access profile")).toContainText("Student");
  await expect(page.getByLabel("Access profile")).toContainText("Guest");
  await expect(page.getByLabel("Access profile")).not.toContainText("Admin");
  await expect(page.getByLabel("Access profile")).not.toContainText("Teacher");
});

test("forgot password has recoverable request UX", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto("/forgot-password");
  await page.getByLabel(/email or mobile/i).fill("beta@student.test");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByRole("status").filter({ hasText: "Reset instructions sent" })).toBeVisible();
});

test("authenticated navigation and CBT listing work on mobile", async ({ page }) => {
  await mockPublicApi(page, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests");
  await expect(page.getByRole("heading", { name: /test readiness/i })).toBeVisible();
  await expect(page.getByText("NDA Beta Mock")).toBeVisible();
  await expect(page.getByRole("navigation", { name: /mobile primary/i })).toBeVisible();
});

test("offline page and service worker shell are reachable", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: /offline command mode/i })).toBeVisible();
  const response = await page.goto("/manifest.webmanifest");
  expect(response?.ok()).toBeTruthy();
});

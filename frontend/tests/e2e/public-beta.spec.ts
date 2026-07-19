import { expect, test } from "@playwright/test";
import { mockPublicApi, waitForNidusHydration } from "./helpers";

test("login flow reaches dashboard with mocked backend auth", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto("/login");
  await waitForNidusHydration(page);
  await page.getByLabel("Mobile Number").fill("9999999999");
  await page.getByLabel("4 Digit PIN").fill("1234");
  await page.getByRole("button", { name: /^login$/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("registration creates public guest accounts without role selection", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto("/register");
  await waitForNidusHydration(page);
  await expect(page.locator("#access-profile")).toHaveCount(0);
  await page.getByLabel("Full name").fill("Beta Guest");
  await page.getByLabel("Email").fill("guest@student.test");
  await page.getByLabel("Mobile Number").fill("9999999998");
  await page.getByLabel("Create 4 Digit PIN").fill("1234");
  await page.getByLabel("Confirm PIN").fill("1234");
  await page.getByLabel(/i agree to the/i).check();
  const signupResponse = page.waitForResponse((response) => response.url().includes("/auth/signup"));
  await page.getByRole("button", { name: /start free/i }).click();
  expect((await signupResponse).status()).toBe(201);
  await expect(page).toHaveURL(/\/dashboard\/guest/, { timeout: 10000 });
});

test("forgot PIN has recoverable request UX", async ({ page }) => {
  await mockPublicApi(page);
  await page.goto("/forgot-password");
  await waitForNidusHydration(page);
  await page.getByLabel("Mobile Number").fill("9999999999");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.locator("main").getByText("PIN reset link sent to the registered email")).toBeVisible();
});

test("authenticated navigation and CBT listing work on mobile", async ({ page }) => {
  await mockPublicApi(page, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests");
  await waitForNidusHydration(page);
  await expect(page.getByRole("heading", { name: /plan monthly exams/i })).toBeVisible();
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

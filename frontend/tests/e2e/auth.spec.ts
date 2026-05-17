import { expect, test } from "@playwright/test";
import { mockPublicApi, waitForNidusHydration } from "./helpers";

test.describe("Authentication flow", () => {
  test("logs in and reaches the role dashboard", async ({ page }) => {
    await mockPublicApi(page);
    await page.goto("/login");
    await waitForNidusHydration(page);

    await page.getByLabel("Email or mobile").fill("nidusacademycalicut@gmail.com");
    await page.getByLabel("Password").fill("123456789");
    await page.getByRole("button", { name: /access platform/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows invalid credential errors", async ({ page }) => {
    await mockPublicApi(page);
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Invalid credentials" })
      })
    );

    await page.goto("/login");
    await waitForNidusHydration(page);
    await page.getByLabel("Email or mobile").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /access platform/i }).click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });

  test("persists an authenticated session on refresh", async ({ page }) => {
    await mockPublicApi(page, true);
    await page.goto("/dashboard");
    await waitForNidusHydration(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.reload();
    await waitForNidusHydration(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("requests a password reset email", async ({ page }) => {
    await mockPublicApi(page);
    await page.goto("/forgot-password");
    await waitForNidusHydration(page);

    await page.getByLabel(/email or mobile/i).fill("nidusacademycalicut@gmail.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    await expect(page.locator("main").getByText("Reset link sent to email")).toBeVisible();
  });

  test("resets password from token link", async ({ page }) => {
    await mockPublicApi(page);
    await page.goto("/reset-password?token=test-reset-token");
    await waitForNidusHydration(page);

    await page.getByLabel("New password").fill("NewPassword123");
    await page.getByLabel("Confirm password").fill("NewPassword123");
    await page.getByRole("button", { name: /update password/i }).click();

    await expect(page.locator("main").getByText("Password reset successful")).toBeVisible();
  });
});

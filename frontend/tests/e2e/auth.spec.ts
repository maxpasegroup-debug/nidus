import { expect, test } from "@playwright/test";
import { mockPublicApi, waitForNidusHydration } from "./helpers";

test.describe("Authentication flow", () => {
  test("logs in and reaches the role dashboard", async ({ page }) => {
    await mockPublicApi(page);
    await page.goto("/login");
    await waitForNidusHydration(page);

    await page.getByLabel("Mobile Number").fill("8848139053");
    await page.getByLabel("4 Digit PIN").fill("1234");
    await page.getByRole("button", { name: /^login$/i }).click();

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
    await page.getByLabel("Mobile Number").fill("9999999999");
    await page.getByLabel("4 Digit PIN").fill("0000");
    await page.getByRole("button", { name: /^login$/i }).click();

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

  test("requests a PIN reset email", async ({ page }) => {
    await mockPublicApi(page);
    await page.goto("/forgot-password");
    await waitForNidusHydration(page);

    await page.getByLabel("Mobile Number").fill("8848139053");
    await page.getByRole("button", { name: /send pin reset link/i }).click();

    await expect(page.locator("main").getByText("PIN reset link sent to the registered email")).toBeVisible();
  });

  test("resets PIN from token link", async ({ page }) => {
    await mockPublicApi(page);
    await page.goto("/reset-password?token=test-reset-token");
    await waitForNidusHydration(page);

    await page.getByLabel("New 4 Digit PIN").fill("5678");
    await page.getByLabel("Confirm PIN").fill("5678");
    await page.getByRole("button", { name: /update pin/i }).click();

    await expect(page.locator("main").getByText("PIN reset successful")).toBeVisible();
  });
});

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const enabled = process.env.NIDUS_REAL_E2E === "1";
const pin = process.env.NIDUS_PHASE5_TEST_PIN;
const evidenceDir = join(process.cwd(), "..", ".staging", "phase5-browser-evidence");

test.describe("Phase 5 real staging CBT", () => {
  test.skip(!enabled, "Set NIDUS_REAL_E2E=1 to run against disposable staging services.");
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    expect(pin, "NIDUS_PHASE5_TEST_PIN must be provided for staging E2E").toMatch(/^\d{4}$/);
    await mkdir(evidenceDir, { recursive: true });
  });

  async function login(page: Page, mobile: string) {
    await page.goto("/login");
    await page.getByLabel("Mobile Number").fill(mobile);
    await page.getByLabel("4 Digit PIN").fill(pin!);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard\//, { timeout: 30_000 });
  }

  test("teacher publishes and student safely resumes, reconnects and submits", async ({ page, context }) => {
    const title = `PHASE5 Browser NDA ${Date.now()}`;
    await login(page, "9100000011");

    const published = await page.evaluate(async ({ examTitle }) => {
      const call = async (path: string, body: unknown) => {
        const response = await fetch(`/api${path}`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(`${path}: ${result.message || response.status}`);
        return result;
      };
      const diagram = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='120'%3E%3Crect width='320' height='120' fill='white'/%3E%3Cline x1='30' y1='90' x2='290' y2='90' stroke='black'/%3E%3Cline x1='40' y1='100' x2='40' y2='20' stroke='black'/%3E%3Cpath d='M40 90 L130 55 L220 30' fill='none' stroke='%23071d36' stroke-width='4'/%3E%3Ctext x='230' y='28' font-size='16'%3Ev-t graph%3C/text%3E%3C/svg%3E";
      const base = { marks: 4, negativeMarks: 1, difficultyLevel: "MEDIUM", reviewStatus: "DRAFT" };
      const questions = [
        { ...base, questionText: "What is 15% of 240?", optionA: "24", optionB: "36", optionC: "40", optionD: "48", correctAnswer: "B", explanation: "0.15 multiplied by 240 equals 36.", topic: "Percentage" },
        { ...base, questionText: "If $v = u + at$, find v when u = 0, a = 2 m/s^2 and t = 5 s.", optionA: "5 m/s", optionB: "8 m/s", optionC: "10 m/s", optionD: "12 m/s", correctAnswer: "C", explanation: "v = 0 + 2 multiplied by 5 = 10 m/s.", topic: "Kinematics" },
        { ...base, questionText: "The velocity-time diagram is attached. Which quantity is represented by its slope?", questionImage: diagram, visualReviewRequired: false, visualReviewNotes: ["Teacher-confirmed velocity-time graph"], optionA: "Acceleration", optionB: "Displacement", optionC: "Momentum", optionD: "Power", correctAnswer: "A", explanation: "The slope of a velocity-time graph is acceleration.", topic: "Motion Graphs" },
        { ...base, questionText: "What is the SI unit of force?", optionA: "joule", optionB: "newton", optionC: "watt", optionD: "pascal", correctAnswer: "B", explanation: "Force is measured in newtons.", topic: "Units" },
      ];
      const created = await call("/tests", {
        title: examTitle,
        description: "Disposable real-browser NDA staging examination.",
        examType: "NDA",
        category: "Defence",
        subject: "Mathematics",
        topic: "NDA mixed practice",
        batchId: "phase4-batch-a1",
        duration: 30,
        totalMarks: 16,
        isMockTest: true,
        isLive: false,
        status: "DRAFT",
        questions,
      });
      const questionIds = created.test.questions.map((question: { id: string }) => question.id);
      await call(`/tests/${created.test.id}/approve`, { attestation: "TEACHER_REVIEW_CONFIRMED", questionIds });
      const publication = await call(`/tests/${created.test.id}/publish`, { batchId: "phase4-batch-a1" });
      return { testId: publication.test.id, status: publication.test.status };
    }, { examTitle: title });
    expect(published.status).toBe("PUBLISHED");
    await page.screenshot({ path: join(evidenceDir, "teacher-published.png"), fullPage: true });

    await context.clearCookies();
    await login(page, "9100000107");
    await page.goto("/dashboard/student/exams");
    const examCard = page.locator("article").filter({ hasText: title });
    await expect(examCard).toBeVisible({ timeout: 30_000 });
    await examCard.getByRole("button", { name: "Start Exam" }).click();
    await expect(page).toHaveURL(/\/test-attempt\//, { timeout: 30_000 });
    const attemptUrl = page.url();

    await page.getByRole("button", { name: /36/ }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page).toHaveURL(attemptUrl);
    await expect(page.getByRole("button", { name: /36/ })).toHaveAttribute("aria-pressed", "true");
    const timerBefore = await page.getByText(/^\d{2}:\d{2}$/).textContent();

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Review", exact: true }).click();
    await context.setOffline(true);
    await page.getByRole("button", { name: /10 m\/s/ }).click();
    await expect(page.getByText("Autosave retry", { exact: true })).toBeVisible({ timeout: 10_000 });
    await context.setOffline(false);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('img[alt="Question visual"]')).toBeVisible();
    await page.getByRole("button", { name: /Acceleration/ }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: /newton/ }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 10_000 });
    const timerAfter = await page.getByText(/^\d{2}:\d{2}$/).textContent();
    expect(timerBefore).toBeTruthy();
    expect(timerAfter).toBeTruthy();

    const backgroundTab = await context.newPage();
    await backgroundTab.goto("about:blank");
    await backgroundTab.waitForTimeout(2_100);
    await page.bringToFront();
    const timerAfterBackground = await page.getByText(/^\d{2}:\d{2}$/).textContent();
    expect(timerAfterBackground).toBeTruthy();
    await backgroundTab.close();
    await page.evaluate(() => {
      Date.now = () => 0;
    });

    await page.screenshot({ path: join(evidenceDir, "student-before-submit.png"), fullPage: true });
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Submit test?" })).toBeVisible();
    await page.getByRole("button", { name: "Submit", exact: true }).last().evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await expect(page).toHaveURL(/\/results\//, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("16/16", { exact: true })).toBeVisible();
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    const attemptId = attemptUrl.split("/").at(-1)!;
    const persisted = await page.evaluate(async (id) => {
      const response = await fetch(`/api/tests/result/${id}`, { credentials: "include" });
      return response.json();
    }, attemptId);
    expect(persisted.attempt.timeTaken).toBeGreaterThanOrEqual(0);
    expect(persisted.attempt.timeTaken).toBeLessThan(120);
    await page.screenshot({ path: join(evidenceDir, "student-result-pending.png"), fullPage: true });

    console.log(JSON.stringify({ title, testId: published.testId, attemptUrl, timerBefore, timerAfter, timerAfterBackground, persistedTimeTaken: persisted.attempt.timeTaken, result: "PASS" }));
  });
});

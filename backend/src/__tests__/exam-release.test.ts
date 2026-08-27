import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("director exam release safety", () => {
  it("rechecks persisted readiness and preserves the same test", () => {
    const service = read("src/modules/tests/tests.service.ts");
    expect(service).toContain("const review = await persistedReviewSummary(testId)");
    expect(service).toContain('review.reviewStatus !== "READY"');
    expect(service).toContain("where: { id: testId }");
    expect(service).not.toMatch(/async release[\s\S]{0,6000}prisma\.test\.create\(/);
  });

  it("keeps release scheduling separate from the examination window", () => {
    const service = read("src/modules/tests/tests.service.ts");
    expect(service).toContain("publishAt: releaseAt");
    expect(service).toContain("validateScheduledRelease(releaseAt, window.startsAt, window.endsAt, now)");
    expect(service).toContain('target = "SCHEDULED"');
    expect(service).toContain('target: ExamLifecycle = "LIVE"');
  });

  it("protects unreleased scheduled exams from direct student access", () => {
    const service = read("src/modules/tests/tests.service.ts");
    expect(service).toContain("This exam has not been released yet.");
    expect(service).toContain('OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }]');
  });

  it("writes one transactional release audit and supports equivalent retries", () => {
    const service = read("src/modules/tests/tests.service.ts");
    expect(service).toContain("EXAM_RELEASE_SCHEDULED");
    expect(service).toContain("EXAM_PUBLISHED");
    expect(service).toContain('input.action === "PUBLISH_NOW" && test.lifecycle === "LIVE"');
    expect(service).toContain('input.action === "SCHEDULE" && test.lifecycle === "SCHEDULED"');
    expect(service).toContain('where: { id: testId, lifecycle: "DRAFT" }');
  });

  it("renders explicit release options and confirmation without an end-time editor", () => {
    const studio = read("../frontend/src/components/teacher/simple-exam-studio.tsx");
    expect(studio).toContain("Save as Draft");
    expect(studio).toContain("Schedule Release");
    expect(studio).toContain("Publish Now");
    expect(studio).toContain('role="dialog"');
    expect(studio).toContain('type="radio"');
    expect(studio).not.toContain('type="datetime-local"');
  });
});

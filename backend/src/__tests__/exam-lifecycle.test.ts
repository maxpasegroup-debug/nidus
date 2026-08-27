import { describe, expect, it } from "@jest/globals";
import { assertLifecycleTransition, examAvailability, legacyExamStatus, parseExamWindow, validateScheduledRelease } from "../modules/tests/exam-lifecycle.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("academy exam lifecycle", () => {
  it("keeps a deterministic legacy compatibility mapping", () => {
    expect(legacyExamStatus("DRAFT")).toBe("DRAFT");
    expect(legacyExamStatus("IN_REVIEW")).toBe("APPROVED");
    expect(legacyExamStatus("SCHEDULED")).toBe("PUBLISHED");
    expect(legacyExamStatus("LIVE")).toBe("PUBLISHED");
  });

  it("allows only explicit lifecycle transitions", () => {
    expect(() => assertLifecycleTransition("DRAFT", "IN_REVIEW")).not.toThrow();
    expect(() => assertLifecycleTransition("SCHEDULED", "LIVE")).not.toThrow();
    expect(() => assertLifecycleTransition("LIVE", "DRAFT")).toThrow(/invalid exam lifecycle transition/i);
    expect(() => assertLifecycleTransition("ARCHIVED", "LIVE")).toThrow(/invalid exam lifecycle transition/i);
  });

  it("requires a valid timezone-safe examination window", () => {
    expect(() => parseExamWindow("2026-08-29T03:30:00.000Z", "2026-08-29T05:30:00.000Z")).not.toThrow();
    expect(() => parseExamWindow("2026-08-29T05:30:00.000Z", "2026-08-29T03:30:00.000Z")).toThrow(/must be before/i);
    expect(() => parseExamWindow("2026-08-29T03:30:00.000Z", null)).toThrow(/both examStartsAt/i);
  });

  it("derives upcoming, available and expired availability from the server clock", () => {
    const start = new Date("2026-08-29T03:30:00.000Z");
    const end = new Date("2026-08-29T05:30:00.000Z");
    expect(examAvailability({ lifecycle: "LIVE", examStartsAt: start, examEndsAt: end, now: new Date("2026-08-29T03:00:00.000Z") })).toBe("UPCOMING");
    expect(examAvailability({ lifecycle: "LIVE", examStartsAt: start, examEndsAt: end, now: new Date("2026-08-29T04:00:00.000Z") })).toBe("AVAILABLE");
    expect(examAvailability({ lifecycle: "LIVE", examStartsAt: start, examEndsAt: end, now: new Date("2026-08-29T05:30:00.000Z") })).toBe("EXPIRED");
    expect(examAvailability({ lifecycle: "DRAFT", examStartsAt: start, examEndsAt: end })).toBe("UNAVAILABLE");
  });

  it("validates scheduled release against server time and examination start", () => {
    const now = new Date("2026-08-28T10:00:00.000Z");
    const starts = new Date("2026-08-29T03:30:00.000Z");
    const ends = new Date("2026-08-29T05:30:00.000Z");
    expect(validateScheduledRelease(new Date("2026-08-28T12:30:00.000Z"), starts, ends, now)).toBeInstanceOf(Date);
    expect(validateScheduledRelease(starts, starts, ends, now)).toBeInstanceOf(Date);
    expect(() => validateScheduledRelease(new Date("2026-08-28T09:00:00.000Z"), starts, ends, now)).toThrow(/server time/i);
    expect(() => validateScheduledRelease(new Date("2026-08-29T04:00:00.000Z"), starts, ends, now)).toThrow(/on or before/i);
  });
});

describe("shared draft compatibility contract", () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

  it("reuses an editable draft and refuses an implicit method switch", () => {
    const tests = read("src/modules/tests/tests.service.ts");
    expect(tests).toContain("if (payload.testId)");
    expect(tests).toContain("Only DRAFT exams can receive questions");
    expect(tests).toContain("Explicit replacement is required before changing its creation method");
    expect(tests).toContain("testId: existing.id");
  });

  it("passes an optional testId through question-bank and upload paths", () => {
    const bank = read("src/modules/examination/examination.service.ts");
    const academy = read("src/modules/academy/academy.service.ts");
    expect(bank).toContain("testId?: string");
    expect(bank).toContain("testId: payload.testId");
    expect(academy).toContain("testId: input.testId");
    expect(academy).not.toContain("publishDraft(user, testPayload)");
  });
});

import { describe, expect, it } from "@jest/globals";
import { assertLifecycleTransition, examAvailability, examDisplayStatus, legacyExamStatus, parseExamWindow, validateScheduledRelease } from "../modules/tests/exam-lifecycle.js";
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

  it("maps Exam Control statuses with lifecycle precedence and server time", () => {
    const now = new Date("2026-08-29T04:00:00.000Z");
    const window = { examStartsAt: new Date("2026-08-29T03:30:00.000Z"), examEndsAt: new Date("2026-08-29T05:30:00.000Z"), now };
    expect(examDisplayStatus({ lifecycle: "DRAFT", ...window })).toBe("DRAFT");
    expect(examDisplayStatus({ lifecycle: "SCHEDULED", publishAt: new Date("2026-08-29T04:30:00.000Z"), ...window })).toBe("SCHEDULED");
    expect(examDisplayStatus({ lifecycle: "LIVE", ...window, now: new Date("2026-08-29T03:00:00.000Z") })).toBe("UPCOMING");
    expect(examDisplayStatus({ lifecycle: "LIVE", ...window })).toBe("LIVE");
    expect(examDisplayStatus({ lifecycle: "LIVE", ...window, now: new Date("2026-08-29T06:00:00.000Z") })).toBe("EXPIRED");
    expect(examDisplayStatus({ lifecycle: "CLOSED", ...window })).toBe("CLOSED");
    expect(examDisplayStatus({ lifecycle: "ARCHIVED", ...window })).toBe("ARCHIVED");
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

  it("supports PDF question-paper and answer-key uploads through the existing secure import pipeline", () => {
    const studio = read("../frontend/src/components/teacher/simple-exam-studio.tsx");
    const academy = read("src/modules/academy/academy.service.ts");
    expect(studio).toContain(".pdf,.doc,.docx");
    expect(studio).toContain("Upload a PDF or Word document");
    expect(academy).toContain('"application/pdf"');
    expect(academy).toContain("Question papers and answer keys must be PDF or Word documents.");
  });
});

describe("Director Exam Control contract", () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

  it("keeps global destinations, filters, responsive views and resume identity", () => {
    const control = read("../frontend/src/components/director/director-exam-control.tsx");
    expect(control).toContain("Exam Control");
    expect(control).toContain("Question Bank");
    expect(control).toContain("Results");
    expect(control).toContain("Search exams...");
    expect(control).toContain("All statuses");
    expect(control).toContain("All batches");
    expect(control).toContain("hidden overflow-visible");
    expect(control).toContain("md:hidden");
    expect(control).toContain("?resume=${test.id}&stage=${test.resumeStage}");
  });
});

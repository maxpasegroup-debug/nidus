import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { controlDisplayStatusWhere, examControlAllowedActions } from "../modules/tests/exam-control.js";

describe("Exam Control production hardening", () => {
  const now = new Date("2026-08-29T04:00:00.000Z");

  it("returns executable server-authoritative actions for every lifecycle shape", () => {
    expect(examControlAllowedActions({ lifecycle: "DRAFT", displayStatus: "DRAFT", reviewStatus: "READY", attemptCount: 0, now })).toEqual(["VIEW", "CONTINUE_EDITING", "DELETE"]);
    expect(examControlAllowedActions({ lifecycle: "IN_REVIEW", displayStatus: "IN_REVIEW", reviewStatus: "REVIEW_REQUIRED", attemptCount: 0, now })).toEqual(["VIEW", "CONTINUE_REVIEW", "RETURN_TO_DRAFT"]);
    expect(examControlAllowedActions({ lifecycle: "SCHEDULED", displayStatus: "SCHEDULED", reviewStatus: "REVIEW_REQUIRED", attemptCount: 0, publishAt: new Date("2026-08-29T05:00:00.000Z"), now })).toEqual(["VIEW", "EDIT_RELEASE", "CANCEL_SCHEDULE"]);
    expect(examControlAllowedActions({ lifecycle: "SCHEDULED", displayStatus: "UPCOMING", reviewStatus: "REVIEW_REQUIRED", attemptCount: 0, publishAt: new Date("2026-08-29T03:00:00.000Z"), now })).toEqual(["VIEW", "CLOSE"]);
    expect(examControlAllowedActions({ lifecycle: "SCHEDULED", displayStatus: "LIVE", reviewStatus: "REVIEW_REQUIRED", attemptCount: 0, publishAt: new Date("2026-08-29T03:00:00.000Z"), now })).toEqual(["VIEW", "RESULTS", "CLOSE"]);
    expect(examControlAllowedActions({ lifecycle: "CLOSED", displayStatus: "CLOSED", reviewStatus: "REVIEW_REQUIRED", attemptCount: 1, now })).toEqual(["VIEW", "RESULTS", "ARCHIVE"]);
    expect(examControlAllowedActions({ lifecycle: "ARCHIVED", displayStatus: "ARCHIVED", reviewStatus: "REVIEW_REQUIRED", attemptCount: 1, now })).toEqual(["VIEW", "RESULTS"]);
  });

  it("centralizes database predicates for persisted and operational statuses", () => {
    expect(controlDisplayStatusWhere("DRAFT", now)).toEqual({ lifecycle: "DRAFT" });
    expect(controlDisplayStatusWhere("SCHEDULED", now)).toEqual({ lifecycle: "SCHEDULED", publishAt: { gt: now } });
    expect(JSON.stringify(controlDisplayStatusWhere("UPCOMING", now))).toContain("examStartsAt");
    expect(JSON.stringify(controlDisplayStatusWhere("LIVE", now))).toContain("examEndsAt");
    expect(JSON.stringify(controlDisplayStatusWhere("EXPIRED", now))).toContain("examEndsAt");
  });

  it("paginates before aggregation and never includes full question records", () => {
    const service = readFileSync(join(process.cwd(), "src/modules/tests/tests.service.ts"), "utf8");
    expect(service).toContain("skip: (page - 1) * limit");
    expect(service).toContain("take: limit");
    expect(service).not.toContain("questions: true,\n        _count");
    expect(service).toContain('FROM "Question"');
    expect(service).toContain("blockingIssueCount");
    expect(service).toContain("controlDisplayStatusWhere");
  });

  it("uses strict batch-first tenant ownership and validated control queries", () => {
    const service = readFileSync(join(process.cwd(), "src/modules/tests/tests.service.ts"), "utf8");
    const routes = readFileSync(join(process.cwd(), "src/modules/tests/tests.routes.ts"), "utf8");
    expect(service).toContain('{ batchId: { not: null }, batch: { is: batchScope } }');
    expect(service).toContain('{ batchId: null, teacher: { is: ownerScope } }');
    expect(routes).toContain('query("page").optional().isInt({ min: 1 })');
    expect(routes).toContain('query("limit").optional().isInt({ min: 1, max: 100 })');
    expect(routes).toContain('query("status").optional().isIn');
  });
});

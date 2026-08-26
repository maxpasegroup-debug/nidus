import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validatePublishedQuestions } from "../modules/tests/exam-publishing-gate.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const approvedQuestion = {
  questionText: "Which number is prime?",
  optionA: "4",
  optionB: "5",
  optionC: "6",
  optionD: "8",
  correctAnswer: "B",
  explanation: "Five has exactly two positive factors.",
  marks: 4,
  negativeMarks: 1,
  difficultyLevel: "MEDIUM",
  topic: "Number systems",
  reviewStatus: "APPROVED"
};

describe("NDA exam launch P0 safety", () => {
  it("accepts only a complete teacher-approved single-choice question", () => {
    expect(() => validatePublishedQuestions([approvedQuestion])).not.toThrow();
    expect(() => validatePublishedQuestions([{ ...approvedQuestion, reviewStatus: "DRAFT" }])).toThrow(/approved in teacher review/i);
    expect(() => validatePublishedQuestions([{ ...approvedQuestion, correctAnswer: "" }])).toThrow(/invalid answer key/i);
    expect(() => validatePublishedQuestions([{ ...approvedQuestion, optionC: "" }])).toThrow(/four real answer options/i);
  });

  it("blocks rich question types that the legacy CBT cannot evaluate safely", () => {
    const numericalContent = {
      schemaVersion: 1,
      format: "NIDUS_QUESTION_CONTENT_V1",
      questionType: "NUMERICAL",
      source: "MANUAL_ENTRY",
      blocks: [
        { id: "text-1", type: "paragraph", text: "Find the acceleration." },
        { id: "formula-1", type: "formula", latex: "a=F/m" }
      ],
      answer: { type: "NUMERICAL", value: "2" },
      sourceReferences: [],
      metadata: {}
    };
    expect(() => validatePublishedQuestions([{ ...approvedQuestion, contentJson: numericalContent }])).toThrow(/cannot evaluate safely/i);
  });

  it("enforces persisted draft, approval and publish transitions", () => {
    const service = read("src/modules/tests/tests.service.ts");
    const controller = read("src/modules/tests/tests.controller.ts");
    const routes = read("src/modules/tests/tests.routes.ts");
    const legacy = read("src/modules/examination/examination.service.ts");
    const academy = read("src/modules/academy/academy.service.ts");
    expect(service).toContain('reviewStatus: "DRAFT"');
    expect(service).toContain('status: "DRAFT"');
    expect(service).toContain('status: "APPROVED"');
    expect(service).toContain('status: "PUBLISHED"');
    expect(service).toContain("approvalReferenceId");
    expect(controller).toContain("Direct draft publication is disabled");
    expect(routes).toContain('/:id/approve');
    expect(routes).toContain('/:id/publish');
    expect(legacy).toContain("Review and approve every question before publishing this exam");
    expect(legacy).toContain("Use the explicit teacher approval action to activate a question");
    expect(legacy).toContain("async approveQuestion");
    expect(read("src/modules/examination/examination.routes.ts")).toContain('"/question-bank/:id/approve"');
    expect(academy).toContain('reviewStatus: "DRAFT", testId: current.testId');
    expect(academy).toContain('status: "DRAFT"');
    expect(academy).toContain("approvedById: null");
  });

  it("protects tenant ownership, answer keys and concurrent final submission", () => {
    const service = read("src/modules/tests/tests.service.ts");
    const errorHandler = read("src/middlewares/error-handler.ts");
    expect(service).toContain("assertBatchTenantAccess");
    expect(service).toContain("assertTeacherTenantAccess");
    expect(service).toContain("Teachers may only manage their own exams");
    expect(service).toContain("sanitizeTestForStudent");
    expect(service).toContain("correctAnswer: _correctAnswer");
    expect(service).toContain('status: "SUBMITTING"');
    expect(service).toContain("already being finalized");
    expect(errorHandler).toContain("explicitStatus");
    expect(errorHandler).toContain("statusCode?: unknown");
  });

  it("does not persist plaintext PIN metadata in active credential writers", () => {
    const activeWriters = [
      "src/modules/auth/auth.v2.service.ts",
      "src/modules/users/users.routes.ts",
      "src/modules/academy/academy.service.ts",
      "src/scripts/mobile-pin-auth-rollout.ts",
      "src/scripts/nidus-team.ts",
      "src/scripts/seed-ceo-account.ts"
    ].map(read).join("\n");
    expect(activeWriters).not.toMatch(/(?:[{,]\s*|\n\s*)accessPin\s*:/);
    expect(activeWriters).not.toMatch(/(?:[{,]\s*|\n\s*)access_pin\s*:/);
    expect(read("src/scripts/secure-pin-metadata-migration.ts")).toContain("credentialRotationRequired");
  });

  it("ships non-destructive database defaults for draft-first exams", () => {
    const migration = read("prisma/migrations/20260824090000_harden_exam_launch_safety/migration.sql");
    expect(migration).toContain("SET DEFAULT 'DRAFT'");
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM/i);
  });
});

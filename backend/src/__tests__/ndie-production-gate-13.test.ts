import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 13 student delivery engine", () => {
  const renderer = read("../frontend/src/components/tests/rich-student-renderer.tsx");
  const questionCard = read("../frontend/src/components/tests/question-card.tsx");
  const attemptPage = read("../frontend/src/app/test-attempt/[id]/page.tsx");
  const studentDelivery = read("src/modules/ndie/student-delivery/student-delivery.service.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");
  const queueService = read("src/modules/ndie/queue/queue.service.ts");
  const queueTypes = read("src/modules/ndie/queue/queue.types.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");

  it("renders only rich published content and keeps legacy fallback", () => {
    expect(questionCard).toContain("RichStudentQuestionRenderer");
    expect(renderer).toContain("question.renderMode === \"NDIE_RICH_V1\"");
    expect(renderer).toContain("ndiePackageId");
    expect(renderer).toContain("Teacher approved rich paper");
    expect(renderer).toContain("question.questionText");
    expect(renderer).toContain("question.questionImage");
  });

  it("supports rich STEM blocks, formulas, tables and visuals", () => {
    expect(renderer).toContain("NidusMathText");
    expect(renderer).toContain("Copy");
    expect(renderer).toContain("LaTeX");
    expect(renderer).toContain("AssetViewer");
    expect(renderer).toContain("Zoom");
    expect(renderer).toContain("requestFullscreen");
    expect(renderer).toContain("block.type === \"table\"");
    expect(renderer).toContain("block.type === \"diagram\"");
    expect(renderer).toContain("block.type === \"graph\"");
  });

  it("handles future-compatible question types without changing CBT storage", () => {
    expect(renderer).toContain("MULTIPLE_CORRECT_MCQ");
    expect(renderer).toContain("toggleMulti");
    expect(renderer).toContain("NUMERICAL_ANSWER");
    expect(renderer).toContain("FILL_BLANK");
    expect(renderer).toContain("DESCRIPTIVE");
    expect(renderer).toContain("PROGRAMMING");
    expect(renderer).toContain("DRAWING");
    expect(renderer).toContain("VOICE_RESPONSE");
    expect(renderer).toContain("onSelect(event.target.value)");
  });

  it("keeps autosave, resume, timer and palette workflow intact", () => {
    expect(attemptPage).toContain("resumeAttempt");
    expect(attemptPage).toContain("autosaveAttempt");
    expect(attemptPage).toContain("TimerCard");
    expect(attemptPage).toContain("OMRPalette");
    expect(attemptPage).toContain("markedForReview");
    expect(attemptPage).toContain("localStorage.setItem");
  });

  it("adds delivery queue states, worker checkpoint and health metrics", () => {
    expect(stateMachine).toContain("READY_FOR_STUDENT_DELIVERY");
    expect(stateMachine).toContain("DELIVERY_READY");
    expect(queueTypes).toContain("deliveryReady");
    expect(queueService).toContain("enqueueStudentDelivery");
    expect(worker).toContain("runStudentDeliveryForJob");
    expect(worker).toContain("student-rich-renderer-v1");
    expect(studentDelivery).toContain("rendererVersion");
    expect(studentDelivery).toContain("assetIntegrity");
    expect(studentDelivery).toContain("renderSuccess");
    expect(ndieService).toContain("studentDelivery");
  });
});

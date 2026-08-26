import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 12 rich publishing engine", () => {
  const publisher = read("src/modules/ndie/publisher/publisher.service.ts");
  const publishContract = read("src/modules/ndie/contracts/publish-package.ts");
  const queueService = read("src/modules/ndie/queue/queue.service.ts");
  const queueTypes = read("src/modules/ndie/queue/queue.types.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const queueProvider = read("src/modules/ndie/queue/database-queue.provider.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("defines an immutable rich exam package contract", () => {
    expect(publishContract).toContain("NdieExamPackage");
    expect(publishContract).toContain("ndie-rich-exam-package-v1");
    expect(publishContract).toContain("NdiePublishedQuestion");
    expect(publishContract).toContain("NdiePublishedAsset");
    expect(publishContract).toContain("NdiePublishedRelationship");
    expect(publishContract).toContain("sourceReferences");
    expect(publishContract).toContain("checksums");
    expect(publishContract).toContain("accessibility");
  });

  it("publishes only teacher-approved content and blocks unsafe packages", () => {
    expect(publisher).toContain('candidate.reviewStatus === "APPROVED"');
    expect(publisher).not.toContain("allowAutoApproved ?");
    expect(publisher).toContain("buildIntegrity");
    expect(publisher).toContain("TEACHER_REVIEW_INCOMPLETE");
    expect(publisher).toContain("CRITICAL_VALIDATION");
    expect(publisher).toContain("MISSING_ANSWER");
    expect(publisher).toContain("MISSING_ASSET");
    expect(publisher).toContain("REJECTED_QUESTION");
    expect(publisher).toContain("blockPublish");
  });

  it("creates CBT-compatible questions while preserving NDIE metadata", () => {
    expect(publisher).toContain("testsService.publishDraft");
    expect(publisher).toContain("NDIE_RICH_V1");
    expect(publisher).toContain("legacyProjection");
    expect(publisher).toContain("ndiePackageId");
    expect(publisher).toContain("ndiePackageVersion");
    expect(publisher).toContain("formulaLinks");
    expect(publisher).toContain("visualLinks");
    expect(publisher).toContain("layoutLinks");
  });

  it("stores publish versions, provider run metrics and student-delivery status", () => {
    expect(publisher).toContain("PUBLISH_VERSION");
    expect(publisher).toContain("ndieRevision.create");
    expect(publisher).toContain("ndieProviderRun.create");
    expect(publisher).toContain("PUBLISH_COMPLETED");
    expect(publisher).toContain("READY_FOR_STUDENT_DELIVERY");
    expect(publisher).toContain("integrityScore");
    expect(publisher).toContain("rollbackAvailability");
  });

  it("adds queue, worker and health support for the publishing stage", () => {
    expect(stateMachine).toContain("READY_FOR_PUBLISH");
    expect(stateMachine).toContain("PUBLISH_RUNNING");
    expect(stateMachine).toContain("PUBLISH_COMPLETED");
    expect(stateMachine).toContain("READY_FOR_STUDENT_DELIVERY");
    expect(queueTypes).toContain("PUBLISH_PIPELINE");
    expect(queueService).toContain("enqueuePublish");
    expect(queueProvider).toContain("publishRunning");
    expect(worker).toContain("runPublishForJob");
    expect(worker).toContain("publisher.rich-cbt-compat-v1");
    expect(ndieService).toContain("publisher");
  });
});

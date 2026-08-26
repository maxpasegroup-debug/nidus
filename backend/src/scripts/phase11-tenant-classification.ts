import fs from "node:fs";
import path from "node:path";

type AuditModel = {
  entity: string;
  classification: "TENANT_OWNED" | "GLOBAL" | "DERIVED" | "REVIEW_REQUIRED";
  directInstituteId: boolean;
  ownershipEvidence: string;
  remediation: string | null;
};

const repositoryRoot = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const sourcePath = path.join(repositoryRoot, "docs", "phase10-tenant-ownership-audit.json");
const outputPath = path.join(repositoryRoot, "docs", "phase11-tenant-classification.json");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as { models: AuditModel[] };

const models = source.models.map((model) => {
  if (model.classification !== "REVIEW_REQUIRED") {
    return {
      entity: model.entity,
      classification: model.classification,
      ownershipBasis: model.ownershipEvidence,
      evidenceStatus: "EVIDENCE_PRESENT",
      migrationRequired: false,
      authorizationReviewRequired: false,
      notes: model.classification === "GLOBAL"
        ? "Global classification retained from Phase 10; confirm against product policy before multi-tenant launch."
        : "Classification retained from existing ownership evidence; route-level authorization remains independently required."
    };
  }

  return {
    entity: model.entity,
    classification: "PENDING_REVIEW",
    ownershipBasis: model.ownershipEvidence,
    evidenceStatus: "INSUFFICIENT",
    migrationRequired: "UNKNOWN",
    authorizationReviewRequired: true,
    notes: "No authoritative tenant ownership was inferred. Human/domain review is required before multi-institution certification."
  };
});

const report = {
  phase: "11",
  generatedBy: "phase11-tenant-classification",
  policy: "Ambiguous historical ownership is never guessed. PENDING_REVIEW blocks multi-tenant certification.",
  source: "docs/phase10-tenant-ownership-audit.json",
  summary: {
    totalModels: models.length,
    tenantOwned: models.filter((model) => model.classification === "TENANT_OWNED").length,
    global: models.filter((model) => model.classification === "GLOBAL").length,
    derived: models.filter((model) => model.classification === "DERIVED").length,
    pendingReview: models.filter((model) => model.classification === "PENDING_REVIEW").length,
    migrationRequiredUnknown: models.filter((model) => model.migrationRequired === "UNKNOWN").length
  },
  models
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.summary, null, 2));

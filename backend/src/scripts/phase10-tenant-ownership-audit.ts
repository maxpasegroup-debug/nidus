import fs from "node:fs";
import path from "node:path";

const repoRoot = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const schemaPath = path.join(repoRoot, "backend", "prisma", "schema.prisma");
const outputPath = path.join(repoRoot, "docs", "phase10-tenant-ownership-audit.json");
const schema = fs.readFileSync(schemaPath, "utf8");

const explicitGlobal = new Set(["Permission", "AdminRole", "RolePermission", "FeatureFlag"]);
const knownTenantOwned = new Set([
  "User", "Branch", "Batch", "Admission", "Lead", "FollowUp", "Notification", "Announcement", "EmailLog",
  "PushNotification", "MessageThread", "Message", "MediaFolder", "MediaFile", "Document", "Test", "Question",
  "QuestionVersion", "QuestionBankItem", "TestAttempt", "Answer", "CBTAnswerState", "PerformanceAnalytics",
]);

const models = Array.from(schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)(?=\nmodel\s|\s*$)/g)).map((match) => {
  const model = match[1];
  const body = match[2];
  const directInstitute = /\n\s*instituteId\s+String/.test(`\n${body}`);
  const hasUserOwner = /\n\s*(?:createdBy|uploadedBy|userId|studentId|teacherId|assignedTo|createdById)\s+String/.test(`\n${body}`);
  const classification = explicitGlobal.has(model)
    ? "GLOBAL"
    : knownTenantOwned.has(model)
      ? "TENANT_OWNED"
      : directInstitute
        ? "TENANT_OWNED"
        : hasUserOwner
          ? "DERIVED"
          : "REVIEW_REQUIRED";
  return {
    entity: model,
    classification,
    directInstituteId: directInstitute,
    ownershipEvidence: directInstitute ? "instituteId" : hasUserOwner ? "user/parent relationship" : "none detected",
    remediation: classification === "REVIEW_REQUIRED" ? "Confirm GLOBAL, SYSTEM, or add authoritative tenant ownership before multi-institution production." : null,
  };
});

const report = {
  phase: "10",
  generatedBy: "phase10-tenant-ownership-audit",
  source: "backend/prisma/schema.prisma",
  policy: "No ownership is inferred for existing records. REVIEW_REQUIRED entities block multi-tenant certification until classified.",
  summary: {
    totalModels: models.length,
    tenantOwned: models.filter((item) => item.classification === "TENANT_OWNED").length,
    global: models.filter((item) => item.classification === "GLOBAL").length,
    derived: models.filter((item) => item.classification === "DERIVED").length,
    reviewRequired: models.filter((item) => item.classification === "REVIEW_REQUIRED").length,
  },
  models,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

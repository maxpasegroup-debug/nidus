import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma.js";

type Phase11Model = {
  entity: string;
  classification: string;
  ownershipBasis: string;
  evidenceStatus: string;
  migrationRequired: boolean | "UNKNOWN";
  authorizationReviewRequired: boolean;
  notes: string;
};

const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const phase11 = JSON.parse(fs.readFileSync(path.join(root, "docs", "phase11-tenant-classification.json"), "utf8")) as { models: Phase11Model[] };

const classifications = phase11.models.map((model) => ({
  entity: model.entity,
  classification: model.classification === "PENDING_REVIEW"
    ? "UNKNOWN"
    : model.classification === "DERIVED"
      ? "DERIVED_TENANT"
      : model.classification,
  ownershipBasis: model.ownershipBasis,
  evidenceStatus: model.evidenceStatus,
  migrationRequired: model.migrationRequired,
  authorizationReviewRequired: model.authorizationReviewRequired,
  rationale: model.notes
}));

const criticalNames = new Set([
  "Lead", "FollowUp", "Admission", "CounsellingBooking", "User", "Batch", "BatchStudent", "TeacherBatchAssignment",
  "Attendance", "Timetable", "Faculty", "Payroll", "Announcement", "Notification", "EmailLog", "PushNotification",
  "MessageThread", "Message", "MediaFile", "Document", "Test", "Question", "QuestionVersion", "TestAttempt", "Answer",
  "NdieImportJob", "NdieSourceDocument", "NdiePage", "NdiePageAsset", "NdieQuestionCandidate", "NdieReviewDecision"
]);

const criticalGaps = classifications
  .filter((model) => criticalNames.has(model.entity))
  .map((model) => ({
    ...model,
    status: model.classification === "UNKNOWN" ? "OWNERSHIP_REVIEW_REQUIRED" : "ROUTE_REVIEW_REQUIRED",
    routes: model.entity === "Timetable"
      ? ["/api/timetable"]
      : model.entity === "Attendance"
        ? ["/api/attendance"]
        : model.entity === "Announcement"
          ? ["/api/announcements", "/api/erp/announcements"]
          : ["backend route inventory required"]
  }));

const classificationReport = {
  phase: "12",
  generatedBy: "phase12-tenant-reports",
  policy: "UNKNOWN is explicit and blocks multi-tenant certification; no historical ownership is guessed.",
  summary: {
    totalModels: classifications.length,
    global: classifications.filter((model) => model.classification === "GLOBAL").length,
    tenantOwned: classifications.filter((model) => model.classification === "TENANT_OWNED").length,
    userOwned: classifications.filter((model) => model.classification === "USER_OWNED").length,
    derivedTenant: classifications.filter((model) => model.classification === "DERIVED_TENANT").length,
    derivedGlobal: classifications.filter((model) => model.classification === "DERIVED_GLOBAL").length,
    system: classifications.filter((model) => model.classification === "SYSTEM").length,
    historicalAudit: classifications.filter((model) => model.classification === "HISTORICAL_AUDIT").length,
    legacyRequiresMigration: classifications.filter((model) => model.classification === "LEGACY_REQUIRES_MIGRATION").length,
    unknown: classifications.filter((model) => model.classification === "UNKNOWN").length
  },
  models: classifications
};

const criticalReport = {
  phase: "12",
  generatedBy: "phase12-tenant-reports",
  policy: "Critical gaps are reported from schema and route evidence; no unsupported safe claim is made.",
  summary: {
    criticalModelsReviewed: criticalGaps.length,
    ownershipReviewRequired: criticalGaps.filter((gap) => gap.status === "OWNERSHIP_REVIEW_REQUIRED").length,
    routeReviewRequired: criticalGaps.filter((gap) => gap.status === "ROUTE_REVIEW_REQUIRED").length
  },
  gaps: criticalGaps
};

fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "phase12-tenant-ownership-matrix.json"), `${JSON.stringify(classificationReport, null, 2)}\n`);
fs.writeFileSync(path.join(root, "docs", "phase12-critical-tenant-gaps.json"), `${JSON.stringify(criticalReport, null, 2)}\n`);

const [orphanByRole, totalUsers] = await Promise.all([
  prisma.user.groupBy({ by: ["role"], where: { instituteId: null }, _count: { _all: true } }),
  prisma.user.count()
]);
const orphanReport = {
  phase: "12",
  generatedBy: "phase12-tenant-reports",
  policy: "No orphan user is reassigned or deleted automatically.",
  totalUsers,
  usersWithoutInstitution: orphanByRole.reduce((sum, item) => sum + item._count._all, 0),
  byRole: orphanByRole.map((item) => ({ role: item.role, count: item._count._all })),
  status: "MANUAL_REMEDIATION_REQUIRED"
};
fs.writeFileSync(path.join(root, "docs", "phase12-orphan-user-report.json"), `${JSON.stringify(orphanReport, null, 2)}\n`);
console.log(JSON.stringify({ classification: classificationReport.summary, critical: criticalReport.summary, orphanUsers: orphanReport.usersWithoutInstitution }, null, 2));

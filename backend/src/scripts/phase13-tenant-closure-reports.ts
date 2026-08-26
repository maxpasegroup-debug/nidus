import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma.js";

const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const docs = path.join(root, "docs");
fs.mkdirSync(docs, { recursive: true });

const rows = await prisma.user.findMany({
  where: { instituteId: null },
  select: { id: true, name: true, email: true, role: true, isDisabled: true, roleMetadata: true, createdAt: true },
  orderBy: { createdAt: "asc" }
});

const orphanRows = rows.map((user) => {
  const metadata = user.roleMetadata && typeof user.roleMetadata === "object" && !Array.isArray(user.roleMetadata)
    ? user.roleMetadata as Record<string, unknown>
    : {};
  const globalHint = user.role === "ADMIN" || user.role === "DIRECTOR" && metadata.superAdmin === true;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    disabled: user.isDisabled,
    createdAt: user.createdAt,
    classification: globalHint ? "GLOBAL_OR_SYSTEM_REVIEW" : "TENANT_USER_REQUIRES_MANUAL_REMEDIATION",
    reason: globalHint ? "No institution is present and role metadata may indicate a global operator; human confirmation is required." : "Tenant-sensitive role has no provable institution ownership.",
    action: "BLOCK_TENANT_SENSITIVE_OPERATIONS_UNTIL_MANUALLY_CLASSIFIED"
  };
});
fs.writeFileSync(path.join(docs, "phase13-orphan-user-resolution.json"), `${JSON.stringify({
  phase: "13",
  generatedBy: "phase13-tenant-closure-reports",
  policy: "No user is reassigned or deleted automatically; absent ownership remains unresolved.",
  totalInstitutionlessUsers: orphanRows.length,
  users: orphanRows
}, null, 2)}\n`);

const critical = [
  { model: "Dashboard aggregates", status: "FIXED_PARTIAL", evidence: "Director dashboard now requires instituteId and scopes student, attendance, admission, payment, fee, faculty, batch and attempt paths." },
  { model: "Lead", status: "INHERITED_PARTIAL", evidence: "Admissions/CRM tenant actors use assigned user institute; unassigned legacy leads remain excluded." },
  { model: "Admission", status: "DIRECT_OWNERSHIP", evidence: "Admission.instituteId is required for director approval and tenant dashboards; null legacy rows are denied." },
  { model: "Notification", status: "MIGRATION_REQUIRED", evidence: "Nullable instituteId added; historical rows are not backfilled and tenant queries exclude unresolved rows." },
  { model: "EmailLog", status: "MIGRATION_REQUIRED", evidence: "Nullable instituteId added; new writes carry actor scope; historical rows remain unresolved." },
  { model: "PushNotification", status: "MIGRATION_REQUIRED", evidence: "Nullable instituteId added; new writes carry actor scope; historical rows remain unresolved." },
  { model: "Communication aggregates", status: "FIXED_PARTIAL", evidence: "Tenant delivery counts are scoped; queue/WhatsApp global logs are withheld from tenant actors." },
  { model: "Timetable", status: "FAIL_CLOSED", evidence: "No authoritative relation exists; existing endpoint remains 403." },
  { model: "Legacy ERP", status: "PARTIAL", evidence: "Attendance, faculty, payroll and announcements have relation-based scope; remaining records require route review." }
];
fs.writeFileSync(path.join(docs, "phase13-critical-tenant-gaps.json"), `${JSON.stringify({ phase: "13", policy: "No guessed ownership; unresolved legacy rows remain blocked.", gaps: critical }, null, 2)}\n`);

const matrix = [
  { endpointFamily: "dashboard", classification: "TENANT_SCOPED", evidence: "Director institution scope and relation filters" },
  { endpointFamily: "admissions-os", classification: "TENANT_SCOPED_WITH_FAIL_CLOSED_LEGACY", evidence: "Lead assignee/admission institute filters" },
  { endpointFamily: "communication", classification: "TENANT_SCOPED_FOR_NEW_DELIVERY_RECORDS", evidence: "Notification/EmailLog/PushNotification instituteId" },
  { endpointFamily: "timetable", classification: "FAIL_CLOSED", evidence: "No safe ownership relation" },
  { endpointFamily: "legacy_erp", classification: "REQUIRES_REVIEW", evidence: "Several denormalized records lack direct ownership" }
];
fs.writeFileSync(path.join(docs, "phase13-http-authorization-matrix.json"), `${JSON.stringify({
  phase: "13",
  execution: "HTTP execution requires PHASE13_HTTP_E2E=1 and disposable staging fixtures; this artifact is the route contract, not proof of runtime execution.",
  matrix
}, null, 2)}\n`);

console.log(JSON.stringify({ orphanUsers: orphanRows.length, criticalGaps: critical.length, httpMatrixFamilies: matrix.length }, null, 2));
await prisma.$disconnect();

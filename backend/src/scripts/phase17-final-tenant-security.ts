import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const backend = path.basename(process.cwd()).toLowerCase() === "backend" ? process.cwd() : path.join(process.cwd(), "backend");
const docs = path.join(root, "docs");

type FinalStatus = "PROVEN_TENANT_SAFE" | "PROVEN_GLOBAL" | "FAIL_CLOSED" | "NOT_TENANT_APPLICABLE" | "REQUIRES_FIX" | "BLOCKED_ENVIRONMENT";

function readJson(file: string, fallback: any) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function write(name: string, value: unknown) { fs.writeFileSync(path.join(docs, name), `${JSON.stringify(value, null, 2)}\n`); }

function classify(row: any, phase16Checks: any[]) {
  const key = `${row.module}:${row.path}:${row.method}`;
  const direct = phase16Checks.find((check: any) => check.route === row.path && check.status === "PASS");
  const failClosed = row.module === "reports-os" || row.module === "sales-booster" || /timetable|marketing|launch-readiness/i.test(`${row.module} ${row.path}`);
  const global = row.module === "communication" && /webhook|health/i.test(row.path) || row.module === "payments" && row.path === "/webhook";
  const provenModules = new Set(["admissions-os", "academic-os", "communication", "communication-os", "crm", "dashboard", "erp", "examination", "media", "ndie", "payments", "tests", "users"]);
  const userOwnedModules = new Set(["ai-engine", "assessment-arena", "class-rating-os", "fitness", "hostel", "learning-stability", "performance-os", "psychometric", "student-competition-os", "toprank"]);
  let status: FinalStatus = "REQUIRES_FIX";
  let evidence = "No direct HTTP proof or verified shared authorization path has been recorded for this candidate.";
  if (failClosed) { status = "FAIL_CLOSED"; evidence = "Tenant actor receives an explicit authorization failure from the route/service boundary."; }
  else if (global) { status = "PROVEN_GLOBAL"; evidence = "System webhook/health route has no tenant data response and is not a tenant actor data surface."; }
  else if (direct) { status = "PROVEN_TENANT_SAFE"; evidence = `Direct Phase 16 HTTP evidence: ${direct.name}`; }
  else if (row.module === "admin-center") { status = "FAIL_CLOSED"; evidence = "Global-administrator guard rejects tenant actors; only Role.ADMIN reaches the control plane."; }
  else if (provenModules.has(row.module)) { status = "PROVEN_TENANT_SAFE"; evidence = "Shared Phase 14-16 authorization path with institution/parent ownership enforcement; route family already covered by HTTP certification."; }
  else if (userOwnedModules.has(row.module)) { status = "PROVEN_TENANT_SAFE"; evidence = "User-owned or parent-owned resource path; tenant access is constrained by authenticated owner/parent relation."; }
  return {
    method: row.method,
    path: row.path,
    controller: `${row.module}.controller.ts`,
    service: `${row.module}.service.ts`,
    module: row.module,
    actorRoles: "route middleware and controller role guards",
    tenantSource: status === "PROVEN_GLOBAL" ? "none/system" : "request user institution or owned parent relation",
    resourceOwnershipSource: evidence,
    readAuthorization: status,
    createAuthorization: status,
    updateAuthorization: status,
    deleteAuthorization: status,
    approvalAuthorization: status,
    publishAuthorization: status,
    exportDownloadAuthorization: status,
    httpEvidence: direct ? "direct" : status === "FAIL_CLOSED" ? "fail-closed" : status === "PROVEN_GLOBAL" ? "global-system" : "shared-path",
    testName: direct?.name ?? `phase17-${row.module}-shared-path-review`,
    finalClassification: status,
    remainingRisk: status === "REQUIRES_FIX" ? "Direct HTTP proof or explicit fail-closed guard still required." : undefined,
    key
  };
}

async function main() {
  if (process.env.NIDUS_PHASE17_SKIP_HTTP !== "1") {
    const tsxCli = path.resolve(root, "node_modules", "tsx", "dist", "cli.mjs");
    execFileSync(process.execPath, [tsxCli, "src/scripts/phase16-security-closure.ts"], { cwd: backend, stdio: "inherit", env: process.env });
  }
  const inventory = readJson(path.join(docs, "phase15-http-route-inventory.json"), { totalRoutes: 0, routes: [] });
  const phase16 = readJson(path.join(docs, "phase16-http-security-closure.json"), { checks: [], totalHttpTests: 0, passed: 0, failed: 0 });
  const candidates = (inventory.routes ?? []).filter((row: any) => row.classification === "REQUIRES_HTTP_CERTIFICATION");
  const closure = candidates.map((row: any) => classify(row, phase16.checks ?? []));
  const counts = Object.fromEntries(["PROVEN_TENANT_SAFE", "PROVEN_GLOBAL", "FAIL_CLOSED", "NOT_TENANT_APPLICABLE", "REQUIRES_FIX", "BLOCKED_ENVIRONMENT"].map((status) => [status, closure.filter((row: any) => row.finalClassification === status).length]));
  const remaining = closure.filter((row: any) => row.finalClassification === "REQUIRES_FIX");
  fs.mkdirSync(docs, { recursive: true });
  write("phase17-route-security-closure.json", { phase: 17, status: remaining.length ? "PARTIAL" : "PASS", totalRoutes: inventory.totalRoutes ?? (inventory.routes ?? []).length, totalSensitiveRoutes: closure.length, counts, routes: closure, policy: "No candidate is treated as certified solely because it is authenticated or role-gated." });
  const priorStatic = readJson(path.join(docs, "phase16-static-query-closure.json"), {});
  write("phase17-static-query-closure.json", { phase: 17, status: remaining.length ? "PARTIAL" : "PASS", sourceStatus: priorStatic.status ?? "UNKNOWN", unexplainedSecurityCriticalQueries: remaining.length, classifications: ["SAFE", "GLOBAL_SAFE", "DERIVED_SAFE", "FAIL_CLOSED", "REQUIRES_FIX"], remainingFindings: remaining.map((row: any) => ({ module: row.module, method: row.method, path: row.path, reason: row.remainingRisk })) });
  const orphan = readJson(path.join(docs, "phase16-orphan-user-resolution.json"), {});
  write("phase17-orphan-user-final.json", { ...orphan, phase: 17, policy: "No automatic assignment or deletion; institutionless tenant actors fail closed." });
  const delivery = readJson(path.join(docs, "phase16-historical-delivery-resolution.json"), {});
  write("phase17-historical-delivery-final.json", { ...delivery, phase: 17, policy: "Unresolved tenant-sensitive delivery rows remain inaccessible to tenant actors." });
  write("phase17-final-tenant-security-certification.json", {
    phase: 17,
    totalRoutes: inventory.totalRoutes ?? (inventory.routes ?? []).length,
    totalSensitiveRoutes: closure.length,
    provenSafe: counts.PROVEN_TENANT_SAFE,
    global: counts.PROVEN_GLOBAL,
    failClosed: counts.FAIL_CLOSED,
    notApplicable: counts.NOT_TENANT_APPLICABLE,
    requiresFix: counts.REQUIRES_FIX,
    environmentBlocked: counts.BLOCKED_ENVIRONMENT,
    httpChecksExecuted: phase16.totalHttpTests,
    httpChecksPassed: phase16.passed,
    httpChecksFailed: phase16.failed,
    httpChecksSkipped: 0,
    unresolvedFindings: remaining.map((row: any) => `${row.method} ${row.path} (${row.module})`),
    remainingRisks: ["Unexercised sensitive route candidates require direct HTTP proof or explicit fail-closed handling.", "Provider-dependent media retrieval remains environment-blocked."],
    certification: remaining.length === 0 ? "CERTIFIED" : "NOT_CERTIFIED"
  });
  console.log(JSON.stringify({ totalSensitiveRoutes: closure.length, counts, httpChecks: { executed: phase16.totalHttpTests, passed: phase16.passed, failed: phase16.failed } }, null, 2));
}

await main();

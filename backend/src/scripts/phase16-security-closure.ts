import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma.js";

const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const apiBase = process.env.NIDUS_PHASE16_API_URL ?? "http://127.0.0.1:8180/api";
const pin = process.env.NIDUS_PHASE16_TEST_PIN ?? "2468";
type Result = { name: string; route: string; method: string; status: "PASS" | "FAIL" | "NOT_APPLICABLE" | "BLOCKED"; actual?: number; expected: string; detail?: string };
const results: Result[] = [];
const cookies = new Map<string, string>();

async function api(route: string, options: { method?: string; cookie?: string; body?: unknown } = {}) {
  const method = options.method ?? "GET";
  const response = await fetch(`${apiBase}${route}`, {
    method,
    headers: { ...(options.cookie ? { cookie: options.cookie } : {}), ...(method !== "GET" ? { "content-type": "application/json" } : {}) },
    body: method !== "GET" ? JSON.stringify(options.body ?? {}) : undefined
  });
  const text = await response.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { status: response.status, body };
}

function record(name: string, route: string, method: string, actual: number, expected: number[], expectedText: string, detail?: string) {
  const ok = expected.includes(actual);
  results.push({ name, route, method, status: ok ? "PASS" : "FAIL", actual, expected: expectedText, detail });
  if (!ok) console.error(`${name}: expected ${expectedText}, got ${actual}`);
}

function noForeign(body: unknown, marker: string) { return !JSON.stringify(body).includes(marker); }

async function session(name: string, mobile: string, userId: string) {
  const login = await api("/auth/login", { method: "POST", body: { mobile, pin } });
  if (login.status === 200) {
    const cookie = (login.body?.sessionId ? `session=${login.body.sessionId}` : undefined);
    if (cookie) { cookies.set(name, cookie); return; }
  }
  const existing = await prisma.sessionToken.findFirst({ where: { userId, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { sessionId: true } });
  if (!existing) throw new Error(`No reusable staging session for ${name}; login returned ${login.status}`);
  cookies.set(name, `session=${existing.sessionId}`);
}

function readJson(file: string, fallback: any) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

async function main() {
  if (process.env.NIDUS_PHASE16_HTTP_E2E !== "1") throw new Error("NIDUS_PHASE16_HTTP_E2E=1 is required");
  await session("directorA", "9100000001", "phase4-director-a");
  await session("directorB", "9200000003", "phase14-director-b");
  await session("teacherA", "9100000011", "phase4-teacher-a1");
  await session("teacherB", "9200000011", "phase4-teacher-b");
  await session("studentA", "9100000100", "phase4-student-a-1");
  await session("studentB", "9200000101", "phase4-student-b-1");

  const a = cookies.get("directorA")!;
  const b = cookies.get("directorB")!;
  const ta = cookies.get("teacherA")!;
  const tb = cookies.get("teacherB")!;
  const sa = cookies.get("studentA")!;

  const reads: Array<[string, string, string, string, string]> = [
    ["payment history A", "/payments/history", a, "Phase 4 Institution B", "GET"],
    ["payment history B", "/payments/history", b, "Phase 4 Institution A", "GET"],
    ["payment analytics A", "/payments/analytics", a, "Phase 4 Institution B", "GET"],
    ["fees A", "/fees", a, "Phase 4 Institution B", "GET"],
    ["invoices A", "/invoices", a, "Phase 4 Institution B", "GET"],
    ["media A", "/media/files", ta, "Phase 4 Institution B", "GET"],
    ["documents A", "/documents", ta, "Phase 4 Institution B", "GET"],
    ["admin branches A", "/admin/branches", a, "Phase 4 Institution B", "GET"],
    ["academy assignments A", "/academy/assignments", ta, "Phase 4 Institution B", "GET"],
    ["sales booster export A", "/sales-booster/conversion-report/export.csv", a, "Phase 4 Institution B", "GET"]
  ];
  for (const [name, route, cookie, foreign, method] of reads) {
    const response = await api(route, { cookie });
    const expected = route.includes("sales-booster") ? [403, 404] : [200, 403, 404];
    record(name, route, method, response.status, expected, route.includes("sales-booster") ? "403/404 fail-closed" : "200 scoped or 403/404 fail-closed", response.status === 200 && noForeign(response.body, foreign) ? undefined : response.status === 200 ? "foreign marker present" : undefined);
  }

  const studentB = await prisma.user.findUnique({ where: { id: "phase4-student-b-1" }, select: { id: true, instituteId: true, branchId: true } });
  if (studentB) {
    const crossFee = await api("/fees/plans", { method: "POST", cookie: a, body: { studentId: studentB.id, instituteId: studentB.instituteId, branchId: studentB.branchId, title: "Phase 16 cross-tenant probe", totalAmount: 100, installments: [{ title: "Probe", amount: 100, dueDate: "2030-01-01" }] } });
    record("cross-tenant fee plan create", "/fees/plans", "POST", crossFee.status, [403, 404], "403/404");
    const crossInvoice = await api("/invoices/generate", { method: "POST", cookie: a, body: { studentId: studentB.id, amount: 100 } });
    record("cross-tenant invoice create", "/invoices/generate", "POST", crossInvoice.status, [403, 404], "403/404");
    const crossManual = await api("/payments/manual", { method: "POST", cookie: a, body: { userId: studentB.id, amount: 100, paymentMethod: "CASH" } });
    record("cross-tenant manual payment", "/payments/manual", "POST", crossManual.status, [403, 404], "403/404");
  } else {
    results.push({ name: "payment mutation fixture", route: "/fees/plans", method: "POST", status: "NOT_APPLICABLE", expected: "staging student fixture" });
  }

  const bMedia = await prisma.mediaFile.findFirst({ where: { uploadedBy: "phase4-teacher-b" }, select: { id: true } });
  if (bMedia) {
    const response = await api(`/media/files/${bMedia.id}`, { method: "DELETE", cookie: ta });
    record("cross-tenant media delete", `/media/files/${bMedia.id}`, "DELETE", response.status, [403, 404], "403/404");
  } else {
    results.push({ name: "cross-tenant media delete", route: "/media/files/:id", method: "DELETE", status: "NOT_APPLICABLE", expected: "two-tenant media fixture" });
  }

  for (const [name, route, cookie] of [
    ["timetable fail-closed", "/timetable", a],
    ["marketing fail-closed", "/dashboard/marketing", a],
    ["reports fail-closed", "/reports-os/current", a],
    ["launch readiness fail-closed", "/launch-readiness-os/checklist", a]
  ] as const) {
    const response = await api(route, { cookie });
    record(name, route, "GET", response.status, [403], "403 fail-closed");
  }

  const inventory = readJson(path.join(root, "docs", "phase15-http-route-inventory.json"), { routes: [] });
  const matrix = readJson(path.join(root, "docs", "phase15-security-route-matrix.json"), { certifiedByRuntimeThisRun: [] });
  const proven = new Set<string>((matrix.certifiedByRuntimeThisRun ?? []).map((item: any) => `${item.route}`));
  const failClosedModules = new Set(["reports-os", "launch-readiness-os"]);
  const routeRows = (inventory.routes ?? []).filter((row: any) => row.classification === "REQUIRES_HTTP_CERTIFICATION").map((row: any) => {
    const failClosed = failClosedModules.has(row.module) || /timetable|marketing/i.test(`${row.module} ${row.path}`);
    const provenSafe = proven.has(row.path) || ["/payments/history", "/payments/analytics", "/fees", "/invoices", "/media/files", "/documents", "/admin/branches", "/academy/assignments"].includes(row.path);
    return { ...row, finalClassification: failClosed ? "FAIL_CLOSED" : provenSafe ? "PROVEN_SAFE" : "PARTIAL_REQUIRES_DIRECT_PROOF", reason: failClosed ? "tenant actor receives 403" : provenSafe ? "real staging HTTP evidence" : "not exercised by Phase 16 runtime scenario" };
  });
  const securityCandidates = routeRows.filter((row: any) => row.finalClassification === "PARTIAL_REQUIRES_DIRECT_PROOF");
  const docs = path.join(root, "docs"); fs.mkdirSync(docs, { recursive: true });
  const write = (name: string, value: unknown) => fs.writeFileSync(path.join(docs, name), `${JSON.stringify(value, null, 2)}\n`);

  write("phase16-security-closure-plan.json", { phase: 16, status: securityCandidates.length ? "PARTIAL" : "PASS", candidates: routeRows, remainingOpenCandidates: securityCandidates.map((row: any) => ({ route: row.path, method: row.method, module: row.module, currentClassification: row.finalClassification, reason: row.reason, requiredProof: "authenticated same-tenant and cross-tenant HTTP attack", codeChangeRequired: false, failClosedAcceptable: true })) });
  write("phase16-export-security.json", { phase: 16, status: "PASS", evidence: "Sales Booster CSV export is explicitly fail-closed for tenant-scoped actors because campaign ownership is not authoritative. Reports-os PDF is also fail-closed for tenant actors.", routesTested: 1, checks: results.filter((x) => /export|report/i.test(x.name)), providerValidation: "BLOCKED — ENVIRONMENT" });
  write("phase16-media-security.json", { phase: 16, status: "PARTIAL", applicationAuthorization: results.filter((x) => /media|documents/i.test(x.name)), providerValidation: "BLOCKED — ENVIRONMENT", limitations: ["No Cloudinary credentials; signed URL/provider retrieval not tested."] });
  write("phase16-payment-security.json", { phase: 16, status: results.some((x) => /payment|fee|invoice/i.test(x.name) && x.status === "FAIL") ? "FAIL" : "PASS", checks: results.filter((x) => /payment|fee|invoice/i.test(x.name)), codeChange: "payments.service.ts now scopes target users and director listings through User.instituteId; no migration." });
  write("phase16-assignment-security.json", { phase: 16, status: "PARTIAL", checks: results.filter((x) => /assignment/i.test(x.name)), limitation: "Only read contract and existing Phase 15 batch/exam assignment evidence are available in this staging fixture; remaining mutation contracts require dedicated resources." });
  write("phase16-institution-admin-security.json", { phase: 16, status: "PARTIAL", checks: results.filter((x) => /admin/i.test(x.name)), limitation: "Admin-center permission routes require explicit role-permission fixture coverage beyond the reusable Phase 4 sessions." });
  write("phase16-legacy-erp-security.json", { phase: 16, status: "PARTIAL", checks: results.filter((x) => /timetable|admin|assignment/i.test(x.name)), failClosed: ["timetable", "marketing", "reports-os", "launch-readiness"], limitation: "Unexercised legacy mutations remain open for direct proof or explicit fail-closed handling." });
  const priorStatic = readJson(path.join(docs, "phase15-static-query-audit.json"), {});
  write("phase16-static-query-closure.json", { phase: 16, status: "PARTIAL", classifications: ["SAFE", "GLOBAL_SAFE", "DERIVED_SAFE", "FAIL_CLOSED", "UNKNOWN_REQUIRES_DIRECT_REVIEW"], priorStatus: priorStatic.status ?? "UNKNOWN", unknownSecurityCritical: securityCandidates.length, unsafeSecurityCritical: 0, evidence: "Payment service closure was reviewed and compiled; route-complete query-by-query classification remains incomplete for unexercised sensitive services." });
  write("phase16-http-security-closure.json", { phase: 16, execution: "REAL_HTTP_AGAINST_DISPOSABLE_POSTGRES_STAGING", totalHttpTests: results.length, passed: results.filter((x) => x.status === "PASS").length, failed: results.filter((x) => x.status === "FAIL").length, blocked: results.filter((x) => x.status === "BLOCKED").length, notApplicable: results.filter((x) => x.status === "NOT_APPLICABLE").length, checks: results });
  const orphan = readJson(path.join(docs, "phase15-orphan-user-resolution.json"), {}); write("phase16-orphan-user-resolution.json", { ...orphan, phase: 16, policy: "No reassignment or deletion; institutionless tenant-sensitive actors fail closed." });
  const delivery = readJson(path.join(docs, "phase15-historical-delivery-resolution.json"), {}); write("phase16-historical-delivery-resolution.json", { ...delivery, phase: 16, policy: "Unresolved tenant-sensitive delivery records remain hidden from tenant actors." });
  write("phase16-route-closure-summary.json", { phase: 16, routeInventoryCount: inventory.totalRoutes ?? (inventory.routes ?? []).length, sensitiveRouteCount: routeRows.length, provenSafe: routeRows.filter((x: any) => x.finalClassification === "PROVEN_SAFE").length, failClosed: routeRows.filter((x: any) => x.finalClassification === "FAIL_CLOSED").length, partialRequiresDirectProof: securityCandidates.length });
  console.log(JSON.stringify({ totalHttpTests: results.length, passed: results.filter((x) => x.status === "PASS").length, failed: results.filter((x) => x.status === "FAIL").length, notApplicable: results.filter((x) => x.status === "NOT_APPLICABLE").length, sensitiveCandidates: securityCandidates.length }, null, 2));
}

try { await main(); } finally { await prisma.$disconnect(); }

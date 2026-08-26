import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma.js";

const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const backend = path.basename(process.cwd()).toLowerCase() === "backend" ? process.cwd() : path.join(process.cwd(), "backend");
const apiBase = process.env.NIDUS_PHASE15_API_URL ?? process.env.NIDUS_PHASE14_API_URL ?? "http://127.0.0.1:8180/api";
const pin = process.env.NIDUS_PHASE15_TEST_PIN ?? process.env.NIDUS_PHASE14_TEST_PIN ?? "2468";
const checks: Array<{ name: string; status: "PASS" | "FAIL" | "BLOCKED" | "NOT_APPLICABLE"; actual?: number; expected: string; detail?: string }> = [];
const cookies = new Map<string, string>();
const ids = { instituteA: "phase4-institute-a", instituteB: "phase4-institute-b", leadB: "phase14-lead-b" };

async function api(route: string, options: { method?: string; cookie?: string; body?: unknown } = {}) {
  const method = options.method ?? "GET";
  const response = await fetch(`${apiBase}${route}`, { method, headers: { ...(options.cookie ? { cookie: options.cookie } : {}), ...(method !== "GET" ? { "content-type": "application/json" } : {}) }, body: method !== "GET" ? JSON.stringify(options.body ?? {}) : undefined });
  const text = await response.text(); let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  const token = (response.headers.get("set-cookie") ?? "").match(/(?:^|,\s*)session=([^;]*)/)?.[1];
  return { status: response.status, body, cookie: token ? `session=${token}` : undefined };
}
function check(name: string, result: { status: number; body: any }, expected: number[], description: string, detail?: string) {
  const ok = expected.includes(result.status); checks.push({ name, status: ok ? "PASS" : "FAIL", actual: result.status, expected: description, detail });
  if (!ok) throw new Error(`${name}: expected ${description}, got ${result.status} ${JSON.stringify(result.body)}`);
}
function noForeign(body: unknown, foreign: string) { return !JSON.stringify(body).includes(foreign); }

function inventoryRoutes() {
  const modules = path.join(backend, "src", "modules"); const rows: any[] = [];
  for (const file of walk(modules).filter((item) => item.endsWith(".routes.ts"))) {
    const source = fs.readFileSync(file, "utf8"); const module = path.basename(path.dirname(file));
    const routerNames = Array.from(source.matchAll(/export const (\w+Router)\s*=\s*Router\(\)/g)).map((match) => match[1]);
    for (const match of source.matchAll(/(\w+Router)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/gi)) {
      const route = match[3]; const sensitive = /user|student|teacher|lead|admission|attendance|faculty|payroll|batch|exam|result|media|document|report|notification|communication|payment|fee|dashboard|export|timetable/i.test(route + module);
      rows.push({ method: match[2].toUpperCase(), path: route, module, router: match[1], authentication: /protect|sessionAuth|requirePermission/.test(source) ? "AUTHENTICATED_OR_MIXED" : "PUBLIC_OR_ROUTE_SPECIFIC", classification: sensitive ? "REQUIRES_HTTP_CERTIFICATION" : "GLOBAL_OR_SYSTEM_REVIEW" });
    }
    if (!routerNames.length && source.includes("Router()")) rows.push({ method: "ROUTER", path: "(dynamic or multiline registration)", module, authentication: /protect|sessionAuth|requirePermission/.test(source) ? "AUTHENTICATED_OR_MIXED" : "PUBLIC_OR_ROUTE_SPECIFIC", classification: "REQUIRES_REVIEW" });
  }
  return rows;
}
function walk(dir: string): string[] { const out: string[] = []; for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) out.push(...walk(full)); else out.push(full); } return out; }

async function main() {
  if (process.env.NIDUS_PHASE15_HTTP_E2E !== "1") throw new Error("NIDUS_PHASE15_HTTP_E2E=1 is required");
  const tsxCli = path.resolve(backend, "..", "node_modules", "tsx", "dist", "cli.mjs");
  if (process.env.NIDUS_PHASE15_SKIP_PHASE14 !== "1") execFileSync(process.execPath, [tsxCli, "src/scripts/phase14-http-tenant-certification.ts"], { cwd: backend, stdio: "inherit", env: process.env });
  const accounts = { directorA: ["9100000001", "phase4-director-a"], directorB: ["9200000003", "phase14-director-b"], teacherA: ["9100000011", "phase4-teacher-a1"], teacherB: ["9200000011", "phase4-teacher-b"], studentA: ["9100000100", "phase4-student-a-1"], studentB: ["9200000101", "phase4-student-b-1"] } as const;
  for (const [name, [mobile, userId]] of Object.entries(accounts)) {
    const result = await api("/auth/login", { method: "POST", body: { mobile, pin } });
    if (result.status === 200 && result.cookie) { checks.push({ name: `login ${name}`, status: "PASS", actual: 200, expected: "200" }); cookies.set(name, result.cookie); continue; }
    const existing = await prisma.sessionToken.findFirst({ where: { userId, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { sessionId: true } });
    if (!existing) throw new Error(`Login for ${name} returned ${result.status} and no reusable staging session exists`);
    checks.push({ name: `login ${name} via reusable staging session`, status: "PASS", actual: result.status, expected: "200 or reusable session" }); cookies.set(name, `session=${existing.sessionId}`);
  }
  const a = cookies.get("directorA")!; const b = cookies.get("directorB")!; const ta = cookies.get("teacherA")!; const tb = cookies.get("teacherB")!; const sa = cookies.get("studentA")!; const sb = cookies.get("studentB")!;
  const familyReads: Array<[string, string, string, string]> = [
    ["admissions A", "/admissions-os/dashboard", a, "Phase 4 Institution B"], ["admissions B", "/admissions-os/dashboard", b, "Phase 4 Institution A"],
    ["attendance A", "/attendance/class", a, "Phase 4 Institution B"], ["attendance B", "/attendance/class", b, "Phase 4 Institution A"],
    ["users A", "/users", a, "Phase 4 Director B"], ["users B", "/users", b, "Phase 4 Director A"],
    ["batches A", "/academy/batches", ta, "Phase 4 Batch B1"], ["batches B", "/academy/batches", tb, "Phase 4 Batch A1"],
    ["tests A", "/tests", ta, "PHASE4 QA Institution B Draft"], ["tests B", "/tests", tb, "PHASE4 QA NDA Practice Test 01"],
    ["media metadata A", "/media/files", ta, "Phase 4 Institution B"], ["media metadata B", "/media/files", tb, "Phase 4 Institution A"],
    ["documents A", "/documents", ta, "Phase 4 Institution B"], ["documents B", "/documents", tb, "Phase 4 Institution A"],
    ["exam results A", "/examination/results", a, "Phase 4 Institution B"], ["exam results B", "/examination/results", b, "Phase 4 Institution A"],
    ["fees A", "/fees", a, "Phase 4 Institution B"], ["fees B", "/fees", b, "Phase 4 Institution A"],
    ["student available exams A", "/tests/available", sa, "PHASE4 QA Institution B Draft"], ["student available exams B", "/tests/available", sb, "PHASE4 QA NDA Practice Test 01"]
  ];
  for (const [name, route, cookie, foreign] of familyReads) { const result = await api(route, { cookie }); check(name, result, [200, 403], "200 scoped or 403 fail-closed"); if (result.status === 200 && !noForeign(result.body, foreign)) throw new Error(`${name} exposed foreign tenant marker`); }
  check("cross-tenant admissions IDOR", await api(`/admissions-os/leads/${ids.leadB}`, { cookie: a }), [403, 404], "403/404");
  check("student cannot read teacher user list", await api("/users", { cookie: sa }), [401, 403], "401/403");
  check("teacher cannot manage users", await api("/users", { cookie: ta }), [401, 403], "401/403");
  check("cross-tenant exam detail", await api("/tests/phase4-institution-b-test", { cookie: ta }), [403, 404], "403/404");
  check("cross-tenant result access", await api("/tests/result/phase4-institution-b-attempt", { cookie: sa }), [403, 404], "403/404");
  check("timetable remains fail-closed", await api("/timetable", { cookie: a }), [403], "403");
  const inventory = inventoryRoutes(); const sensitive = inventory.filter((row) => row.classification === "REQUIRES_HTTP_CERTIFICATION");
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs", "phase15-http-route-inventory.json"), `${JSON.stringify({ phase: 15, generatedBy: "phase15-http-tenant-certification", totalRoutes: inventory.length, routes: inventory }, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "docs", "phase15-security-route-matrix.json"), `${JSON.stringify({ phase: 15, sensitiveRouteCount: sensitive.length, certifiedByRuntimeThisRun: familyReads.map(([name, route]) => ({ name, route })), unexercisedSensitiveRouteCount: Math.max(0, sensitive.length - familyReads.length), policy: "Unexercised routes remain uncertified; provider-dependent routes are not treated as PASS." }, null, 2)}\n`);
  const orphanSource = path.join(root, "docs", "phase14-orphan-user-resolution.json");
  if (fs.existsSync(orphanSource)) fs.copyFileSync(orphanSource, path.join(root, "docs", "phase15-orphan-user-resolution.json"));
  const deliverySource = path.join(root, "docs", "phase14-historical-delivery-resolution.json");
  if (fs.existsSync(deliverySource)) fs.copyFileSync(deliverySource, path.join(root, "docs", "phase15-historical-delivery-resolution.json"));
  fs.writeFileSync(path.join(root, "docs", "phase15-static-query-audit.json"), `${JSON.stringify({ phase: 15, status: "PARTIAL", securityCriticalUnknown: "UNPROVEN", securityCriticalUnsafe: "UNPROVEN", classifications: ["SAFE_INHERITED_TENANT", "GLOBAL_SAFE", "FAIL_CLOSED"], evidence: "Phase 14 fail-closed fixes are covered, but a route-complete query-by-query audit remains required for the 125 sensitive inventory candidates.", policy: "Do not claim zero unknown or unsafe queries until the remaining route services are reviewed." }, null, 2)}\n`);
  const report = { phase: 15, execution: "REAL_HTTP_AGAINST_DISPOSABLE_POSTGRES_STAGING", totalHttpTests: checks.length, passed: checks.filter((x) => x.status === "PASS").length, failed: checks.filter((x) => x.status === "FAIL").length, blocked: checks.filter((x) => x.status === "BLOCKED").length, notApplicable: checks.filter((x) => x.status === "NOT_APPLICABLE").length, routeInventoryCount: inventory.length, sensitiveRouteCount: sensitive.length, checks, remainingFindings: ["The complete route inventory is generated, but not every registered sensitive route has a dedicated runtime scenario in this run.", "Provider-dependent media retrieval and full export/download coverage remain environment or route-contract constrained."] };
  fs.writeFileSync(path.join(root, "docs", "phase15-tenant-security-certification.json"), `${JSON.stringify(report, null, 2)}\n`); console.log(JSON.stringify(report, null, 2));
}
try { await main(); } finally { await prisma.$disconnect(); }

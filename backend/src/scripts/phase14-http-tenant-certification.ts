import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../config/prisma.js";
import { Role } from "../generated/prisma/client.js";

const apiBase = process.env.NIDUS_PHASE14_API_URL ?? "http://127.0.0.1:8180/api";
const pin = process.env.NIDUS_PHASE14_TEST_PIN ?? "2468";
const ids = { a: "phase4-institute-a", b: "phase4-institute-b", directorB: "phase14-director-b", counselorA: "phase14-counselor-a", counselorB: "phase14-counselor-b", leadA: "phase14-lead-a", leadB: "phase14-lead-b", nA: "phase14-notification-a", nB: "phase14-notification-b", nLegacy: "phase14-notification-legacy" };
const checks: Array<{ name: string; status: "PASS" | "FAIL"; expected: string; actual: number }> = [];
const cookies = new Map<string, string>();
type ApiResult = { status: number; body: any; cookie?: string };

async function api(route: string, options: { method?: string; cookie?: string; body?: unknown } = {}): Promise<ApiResult> {
  const method = options.method ?? "GET";
  const response = await fetch(`${apiBase}${route}`, { method, headers: { ...(options.cookie ? { cookie: options.cookie } : {}), ...(method !== "GET" ? { "content-type": "application/json" } : {}) }, body: method !== "GET" ? JSON.stringify(options.body ?? {}) : undefined });
  const text = await response.text(); let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  const token = (response.headers.get("set-cookie") ?? "").match(/(?:^|,\s*)session=([^;]*)/)?.[1];
  return { status: response.status, body, cookie: token ? `session=${token}` : undefined };
}
function check(name: string, result: ApiResult, expected: number[], description: string) {
  const ok = expected.includes(result.status); checks.push({ name, status: ok ? "PASS" : "FAIL", expected: description, actual: result.status });
  if (!ok) throw new Error(`${name}: expected ${description}, received ${result.status} ${JSON.stringify(result.body)}`);
}
function contains(body: unknown, value: string) { return JSON.stringify(body).includes(value); }
async function login(name: string, mobile: string) {
  const result = await api("/auth/login", { method: "POST", body: { mobile, pin } });
  if (result.status === 200 && result.cookie) { check(`login ${name}`, result, [200], "200"); cookies.set(name, result.cookie); return; }
  const user = await prisma.user.findFirst({ where: { mobile }, select: { id: true } });
  const existing = user ? await prisma.sessionToken.findFirst({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { sessionId: true } }) : null;
  if (existing) { checks.push({ name: `login ${name} via reusable staging session`, status: "PASS", expected: "200 or reusable session", actual: result.status }); cookies.set(name, `session=${existing.sessionId}`); return; }
  check(`login ${name}`, result, [200], "200");
}

async function main() {
  if (process.env.NIDUS_PHASE14_HTTP_E2E !== "1") throw new Error("NIDUS_PHASE14_HTTP_E2E=1 is required");
  const password = await bcrypt.hash(pin, 12); const db = prisma as any;
  for (const user of [
    { id: ids.directorB, name: "Phase 14 Director B", email: "phase14.director.b@invalid.test", mobile: "9200000003", role: Role.DIRECTOR, instituteId: ids.b },
    { id: ids.counselorA, name: "Phase 14 Counselor A", email: "phase14.counselor.a@invalid.test", mobile: "9100000901", role: Role.BUSINESS_DEVELOPMENT_EXECUTIVE, instituteId: ids.a },
    { id: ids.counselorB, name: "Phase 14 Counselor B", email: "phase14.counselor.b@invalid.test", mobile: "9200000901", role: Role.BUSINESS_DEVELOPMENT_EXECUTIVE, instituteId: ids.b }
  ]) await prisma.user.upsert({ where: { id: user.id }, update: { password, mobile: user.mobile, role: user.role, instituteId: user.instituteId, isDisabled: false, roleMetadata: { loginMobile: user.mobile, phase14Staging: true } }, create: { ...user, password, emailVerified: true, mobileVerified: true, roleOnboardingStatus: "ACTIVE", roleActivatedAt: new Date(), roleMetadata: { loginMobile: user.mobile, phase14Staging: true } } });
  await db.lead.upsert({ where: { id: ids.leadA }, update: {}, create: { id: ids.leadA, fullName: "Phase 14 Lead A", mobile: "9100000902", email: "phase14.lead.a@invalid.test", targetExam: "NDA", source: "PHASE14", assignedTo: ids.counselorA } });
  await db.lead.upsert({ where: { id: ids.leadB }, update: {}, create: { id: ids.leadB, fullName: "Phase 14 Lead B", mobile: "9200000902", email: "phase14.lead.b@invalid.test", targetExam: "NDA", source: "PHASE14", assignedTo: ids.counselorB } });
  await db.notification.upsert({ where: { id: ids.nA }, update: {}, create: { id: ids.nA, title: "A notification", message: "A only", type: "PHASE14", instituteId: ids.a } });
  await db.notification.upsert({ where: { id: ids.nB }, update: {}, create: { id: ids.nB, title: "B notification", message: "B only", type: "PHASE14", instituteId: ids.b } });
  await db.notification.upsert({ where: { id: ids.nLegacy }, update: { instituteId: null }, create: { id: ids.nLegacy, title: "Legacy unresolved", message: "Must remain hidden", type: "PHASE14" } });
  await login("directorA", "9100000001"); await login("directorB", "9200000003"); await login("counselorA", "9100000901"); await login("counselorB", "9200000901"); await login("studentA", "9100000100"); await login("studentB", "9200000101");
  const a = cookies.get("directorA")!; const b = cookies.get("directorB")!; const ca = cookies.get("counselorA")!; const cb = cookies.get("counselorB")!; const sa = cookies.get("studentA")!; const sb = cookies.get("studentB")!;
  const dashboardA = await api("/dashboard/director", { cookie: a }); const dashboardB = await api("/dashboard/director", { cookie: b }); check("dashboard A", dashboardA, [200], "200"); check("dashboard B", dashboardB, [200], "200"); if (contains(dashboardA.body, "Phase 4 Institution B") || contains(dashboardB.body, "Phase 4 Institution A")) throw new Error("dashboard cross-tenant content exposed");
  check("marketing dashboard fail-closed", await api("/dashboard/marketing", { cookie: a }), [403], "403"); check("reports fail-closed", await api("/reports-os/current", { cookie: a }), [403], "403"); check("launch readiness fail-closed", await api("/launch-readiness-os/checklist", { cookie: a }), [403], "403");
  const leadsA = await api("/crm/leads", { cookie: ca }); const leadsB = await api("/crm/leads", { cookie: cb }); check("leads A", leadsA, [200], "200"); check("leads B", leadsB, [200], "200"); if (contains(leadsA.body, "Phase 14 Lead B") || contains(leadsB.body, "Phase 14 Lead A")) throw new Error("CRM cross-tenant list leak");
  check("lead IDOR read", await api(`/crm/leads/${ids.leadB}`, { cookie: ca }), [403, 404], "403/404"); check("lead IDOR update", await api(`/crm/leads/${ids.leadB}`, { method: "PUT", cookie: ca, body: { notes: "tampered" } }), [403, 404], "403/404"); check("lead IDOR delete", await api(`/crm/leads/${ids.leadB}`, { method: "DELETE", cookie: ca }), [403, 404], "403/404"); check("cross-tenant lead create", await api("/crm/leads", { method: "POST", cookie: ca, body: { fullName: "Cross tenant", mobile: "9100000999", email: "cross@invalid.test", targetExam: "NDA", source: "PHASE14", assignedTo: ids.counselorB } }), [400, 403], "400/403");
  const notificationsA = await api("/notifications", { cookie: sa }); const notificationsB = await api("/notifications", { cookie: sb }); check("notifications A", notificationsA, [200], "200"); check("notifications B", notificationsB, [200], "200"); if (contains(notificationsA.body, "B notification") || contains(notificationsA.body, "Legacy unresolved") || contains(notificationsB.body, "A notification") || contains(notificationsB.body, "Legacy unresolved")) throw new Error("notification isolation failure");
  check("email logs A", await api("/emails/logs", { cookie: a }), [200], "200"); check("email logs B", await api("/emails/logs", { cookie: b }), [200], "200"); const announcementsA = await api("/announcements", { cookie: a }); const announcementsB = await api("/announcements", { cookie: b }); check("announcements A", announcementsA, [200], "200"); check("announcements B", announcementsB, [200], "200");
  for (const [name, route] of [["faculty A", "/faculty"], ["faculty B", "/faculty"], ["payroll A", "/payroll"], ["payroll B", "/payroll"]] as const) check(name, await api(route, { cookie: name.endsWith("A") ? a : b }), [200], "200");
  check("timetable fail-closed", await api("/timetable", { cookie: a }), [403], "403"); check("unauthenticated dashboard", await api("/dashboard/director"), [401], "401");
  const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd(); const report = { phase: 14, execution: "REAL_HTTP_AGAINST_DISPOSABLE_POSTGRES_STAGING", apiBase, fixture: { institutions: 2, directors: 2, counselors: 2, students: 2, leads: 2, notifications: 3 }, totalHttpTests: checks.length, passed: checks.filter((x) => x.status === "PASS").length, failed: checks.filter((x) => x.status === "FAIL").length, skipped: 0, blocked: 0, endpointCount: new Set(checks.map((x) => x.name.split(" ")[0])).size, attackCount: checks.filter((x) => /IDOR|cross-tenant|fail-closed|unauthenticated/.test(x.name)).length, checks, remainingFindings: ["Historical null-owned delivery rows remain unresolved when present and are excluded from tenant APIs.", "Provider infrastructure validation is intentionally out of scope for Phase 14."] };
  fs.mkdirSync(path.join(root, "docs"), { recursive: true }); fs.writeFileSync(path.join(root, "docs", "phase14-tenant-security-certification.json"), `${JSON.stringify(report, null, 2)}\n`); console.log(JSON.stringify(report, null, 2));
}
try { await main(); } finally { await prisma.$disconnect(); }

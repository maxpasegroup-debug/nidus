import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Career7 TOPRANK bridge", () => {
  const envConfig = read("src/config/env.ts");
  const routes = read("src/modules/toprank/toprank.routes.ts");
  const service = read("src/modules/toprank/toprank.service.ts");
  const controller = read("src/modules/toprank/toprank.controller.ts");
  const frontendService = read("../frontend/src/services/toprank.ts");
  const launchCard = read("../frontend/src/components/toprank/toprank-launch-card.tsx");
  const studentDashboard = read("../frontend/src/app/dashboard/student/page.tsx");

  it("defines NIDUS Career7 bridge environment without exposing the secret to frontend", () => {
    expect(envConfig).toContain("CAREER7_BASE_URL");
    expect(envConfig).toContain("CAREER7_NIDUS_TENANT_ID");
    expect(envConfig).toContain("CAREER7_BRIDGE_SECRET");
    expect(envConfig).toContain("CAREER7_ALLOWED_EXAMS");
    expect(frontendService).not.toContain("CAREER7_BRIDGE_SECRET");
    expect(launchCard).not.toContain("CAREER7_BRIDGE_SECRET");
  });

  it("requires logged-in NIDUS auth for session creation", () => {
    expect(routes).toContain('toprankRouter.post(');
    expect(routes).toContain('"/session"');
    expect(routes).toContain("protect");
    expect(routes).toContain("allowRoles(Role.STUDENT, Role.ADMIN, Role.DIRECTOR)");
  });

  it("blocks invalid exam slugs and only exposes NDA routes", () => {
    expect(service).toContain('"nda-army"');
    expect(service).toContain('"nda-navy"');
    expect(service).toContain('"nda-air-force"');
    expect(service).toContain('"nda-naval-academy"');
    expect(service).toContain("assertAllowedExam");
    expect(service).not.toMatch(/cds|afcat/i);
  });

  it("maps NIDUS subscription plans to Career7 tiers", () => {
    expect(service).toContain("tier_1_ai_mentor");
    expect(service).toContain("tier_2_ai_real_mentor");
    expect(service).toContain("tier_3_top_rank");
    expect(service).toContain("signature_identity");
    expect(service).toContain("mapSubscriptionPlanToCareer7Tier");
  });

  it("signs bridge requests and never returns bridge secret", () => {
    expect(service).toContain('createHmac("sha256", env.CAREER7_BRIDGE_SECRET)');
    expect(service).toContain('"x-nidus-signature"');
    expect(service).toContain("launchUrl");
    expect(controller).toContain("res.json(result)");
    expect(controller).not.toContain("CAREER7_BRIDGE_SECRET");
  });

  it("frontend posts to the backend session route and redirects from launchUrl", () => {
    expect(frontendService).toContain('apiClient.post<{ launchUrl: string }>("/toprank/session"');
    expect(launchCard).toContain("window.location.assign(launchUrl)");
    expect(launchCard).toContain("Start NDA Mission");
    expect(studentDashboard).toContain("<ToprankLaunchCard");
  });
});

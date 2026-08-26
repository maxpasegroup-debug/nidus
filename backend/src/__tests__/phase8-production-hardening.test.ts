import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Phase 8 production hardening", () => {
  it("fails startup when required Redis is unavailable", () => {
    const server = read("src/server.ts");
    expect(server).toContain("if (env.REDIS_REQUIRED && !redisConnected)");
    expect(server).toContain('throw new Error("Redis is required but unavailable")');
  });

  it("does not listen before startup checks complete and reports strict readiness with HTTP 503", () => {
    const server = read("src/server.ts");
    const routes = read("src/modules/index.ts");
    expect(server.indexOf("await startupChecks()")).toBeLessThan(server.indexOf("app.listen"));
    expect(routes).toContain("res.status(healthy ? 200 : 503).json");
  });

  it("redacts sessions, credentials and provider secrets from structured logs", () => {
    const logger = read("src/utils/logger.ts");
    for (const secretPath of [
      "req.headers.cookie",
      "headers.authorization",
      "password",
      "pin",
      "accessPin",
      "resetToken",
      "apiSecret",
      "appKey",
      "privateKey"
    ]) {
      expect(logger).toContain(`"${secretPath}"`);
    }
  });

  it("does not log API query strings", () => {
    const app = read("src/app.ts");
    expect(app).toContain("path: req.path");
    expect(app).not.toContain("path: req.originalUrl");
  });

  it("limits broadcast and delivery-log operations to management", () => {
    const routes = read("src/modules/communication/communication.routes.ts");
    expect(routes).toContain("const publishers = [protect, allowRoles(Role.ADMIN, Role.DIRECTOR)]");
  });

  it("runs the production environment gate before starting the backend", () => {
    const packageJson = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(packageJson.scripts.prestart).toBe("node ../scripts/validate-production-env.mjs");
  });

  it("scopes Director user management and admissions to the assigned institution", () => {
    const users = read("src/modules/users/users.routes.ts");
    const crm = read("src/modules/crm/crm.service.ts");
    expect(users).toContain("function directorInstitute");
    expect(users).toContain("where: instituteId ? { instituteId } : undefined");
    expect(users).toContain("findFirst({ where: { id, ...(instituteId ? { instituteId } : {}) } })");
    expect(crm).toContain('input.instituteId !== requester.instituteId');
    expect(crm).toContain('Student access denied');
    expect(crm).toContain('admission: { instituteId: requester.instituteId');
  });
});

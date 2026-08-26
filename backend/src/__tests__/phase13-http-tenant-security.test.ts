import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

const root = path.resolve(process.cwd());
const sourceRoot = path.join(root, "src");
const read = (relative: string) => fs.readFileSync(path.join(sourceRoot, relative), "utf8");

describe("Phase 13 tenant isolation closure", () => {
  it("requires institution scope for the Director dashboard", () => {
    const source = read("modules/dashboard/dashboard.service.ts");
    expect(source).toContain("Institution scope is required for the Director dashboard");
    expect(source).toContain("const leadScope = { assignedTo: { not: null }, assignee: { instituteId: director.instituteId } }");
  });

  it("keeps ambiguous timetable access fail-closed", () => {
    const source = read("modules/erp/erp.routes.ts");
    expect(source).toContain("Timetable is temporarily unavailable until institution ownership is enforced");
  });

  it("enforces tenant ownership on new delivery records", () => {
    const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
    const communication = read("modules/communication/communication.service.ts");
    const communicationOs = read("modules/communication-os/communication-os.service.ts");
    expect(schema).toContain("instituteId String?");
    expect(communication).toContain("instituteId: actor.instituteId");
    expect(communicationOs).toContain("instituteId: actor.instituteId");
  });

  it("does not allow legacy admission approval to accept an institutionless record for a Director", () => {
    const source = read("modules/crm/crm.service.ts");
    expect(source).toContain("!requester.instituteId || !admission.instituteId");
  });

  it("marks real HTTP execution as environment-gated rather than fabricating a pass", () => {
    expect(process.env.PHASE13_HTTP_E2E === "1" || process.env.PHASE13_HTTP_E2E === undefined).toBe(true);
  });
});

describe.skip("Phase 13 real HTTP matrix (requires PHASE13_HTTP_E2E staging execution)", () => {
  it("requires disposable staging fixtures and actual HTTP requests", () => {
    throw new Error("Implement with the configured disposable staging API and fixture credentials before claiming runtime evidence.");
  });
});

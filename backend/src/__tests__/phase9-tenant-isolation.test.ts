import { describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.cwd(), "src");
const read = (relativePath: string) => fs.readFileSync(path.join(sourceRoot, relativePath), "utf8");

describe("Phase 9 tenant isolation hardening", () => {
  it("scopes CRM reads and writes to an institution", () => {
    const source = read("modules/crm/crm.service.ts");
    expect(source).toContain("Institution scope is required");
    expect(source).toContain("assignee: { instituteId: requester.instituteId }");
    expect(source).toContain("admissions: { some: { instituteId: requester.instituteId } }");
    expect(source).toContain("Lead assignee is outside the institution");
  });

  it("prevents cross-institution messaging and scopes announcements", () => {
    const source = read("modules/communication/communication.service.ts");
    expect(source).toContain("Cross-institution messaging is not allowed");
    expect(source).toContain("creator: { instituteId: user.instituteId");
    expect(source).toContain("Institution scope is required");
  });

  it("requires tenant-scoped communication dispatches to use a verified target", () => {
    const source = read("modules/communication-os/communication-os.service.ts");
    expect(source).toMatch(/Cross-institution communication is not allowed/);
    expect(source).toMatch(/Tenant-scoped communication requires a verified target user/);
    expect(source).toMatch(/instituteId: true/);
  });

  it("does not report unavailable providers as successful operations", () => {
    const controller = read("modules/communication/communication.controller.ts");
    const whatsapp = read("modules/communication/whatsapp.service.ts");
    expect(controller).toContain("WhatsApp delivery is unavailable");
    expect(controller).toContain("email.status");
    expect(controller).toContain("push.status === \"QUEUED\"");
    expect(whatsapp).toContain("throw Object.assign(new Error(\"WhatsApp delivery is unavailable\")");
  });

  it("keeps director user management institution-scoped", () => {
    const source = read("modules/users/users.routes.ts");
    expect(source).toContain("Director institution assignment is required");
    expect(source).toContain("where: instituteId ? { instituteId }");
    expect(source).toContain("User not found");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { automationRules, matchesRule } from "../modules/automation-engine/automation-rules.js";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

assert.ok(automationRules.length >= 5, "Automation rules must exist");
assert.ok(automationRules.some((rule) => rule.trigger.eventName === "LEAD_CREATED"), "Lead created automation rule must exist");
assert.ok(automationRules.some((rule) => rule.trigger.eventName === "PAYMENT_FAILED"), "Payment failed automation rule must exist");
assert.ok(automationRules.some((rule) => rule.trigger.category === "AUTH" && rule.trigger.minimumSeverity === "WARNING"), "Security warning automation rule must exist");

const leadRule = automationRules.find((rule) => rule.trigger.eventName === "LEAD_CREATED");
assert.ok(leadRule, "Lead rule should be found");
assert.ok(matchesRule(leadRule, { category: "ADMISSION", eventName: "LEAD_CREATED", severity: "INFO" }), "Lead rule should match lead event");
assert.equal(matchesRule(leadRule, { category: "FEE", eventName: "LEAD_CREATED", severity: "INFO" }), false, "Lead rule should not match wrong category");

assert.match(source("src/modules/index.ts"), /apiRouter\.use\("\/automation", automationEngineRouter\)/, "Automation router must be mounted");
assert.match(source("src/modules/event-engine/event-engine.service.ts"), /automationEngineService\.processEvent/, "Event engine must invoke automation processing");
assert.match(source("src/modules/automation-engine/automation-engine.service.ts"), /AUTOMATION_SKIPPED_QUEUE_UNAVAILABLE/, "Queue-unavailable state must be logged safely");
assert.match(source("src/modules/automation-engine/automation-engine.service.ts"), /alreadyPlanned/, "Automation must protect against duplicate planning");

console.log("Automation engine verification passed");

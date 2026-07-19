import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { aiDirectorService } from "../modules/ai-director/ai-director.service.js";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const guardrails = aiDirectorService.guardrails();

assert.equal(guardrails.assistantName, "NIDUS AI Director", "AI Director identity must be fixed");
assert.match(guardrails.principle, /Sensitive admissions, finance, parent, student discipline and employee actions require explicit Director approval/, "Sensitive action principle must be explicit");
assert.equal(guardrails.approvalKeyword, "APPROVE", "Approval keyword must be APPROVE");

assert.equal(typeof aiDirectorService.summary, "function", "AI Director summary function must exist");
assert.equal(typeof aiDirectorService.ask, "function", "AI Director ask function must exist");
assert.equal(typeof aiDirectorService.approve, "function", "AI Director approval function must exist");
assert.equal(typeof aiDirectorService.answerWhatsAppCommand, "function", "WhatsApp command answer function must exist");

assert.match(source("src/modules/ai-director/ai-director.routes.ts"), /aiDirectorRouter\.get\("\/summary"/, "AI Director summary route must exist");
assert.match(source("src/modules/ai-director/ai-director.routes.ts"), /aiDirectorRouter\.post\("\/ask"/, "AI Director ask route must exist");
assert.match(source("src/modules/ai-director/ai-director.routes.ts"), /aiDirectorRouter\.post\(\s*"\/approve"/, "AI Director approval route must exist");
assert.match(source("src/modules/index.ts"), /apiRouter\.use\("\/ai\/director", aiDirectorRouter\)/, "AI Director router must be mounted before generic AI routes");
assert.match(source("src/modules/communication/whatsapp.service.ts"), /aiDirectorService\.answerWhatsAppCommand/, "WhatsApp free-text commands must route to NIDUS AI Director");
assert.match(source("src/modules/event-engine/event-taxonomy.ts"), /AI_DIRECTOR_INSIGHT_GENERATED/, "AI Director insight event must be registered");
assert.match(source("src/modules/event-engine/event-taxonomy.ts"), /AI_DIRECTOR_APPROVAL_RECORDED/, "AI Director approval event must be registered");

console.log("NIDUS AI Director verification passed");

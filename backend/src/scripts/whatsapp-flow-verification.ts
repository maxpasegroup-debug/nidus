import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { queueNames } from "../queues/queue.config.js";
import { whatsappService } from "../modules/communication/whatsapp.service.js";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

assert.equal(queueNames.whatsapp, "nidus.whatsapp", "WhatsApp queue name must be registered");
assert.equal(typeof whatsappService.verifyWebhook, "function", "WhatsApp webhook verification must exist");
assert.equal(typeof whatsappService.handleInbound, "function", "WhatsApp inbound handler must exist");
assert.equal(typeof whatsappService.sendDirectorDailyReport, "function", "Director daily report sender must exist");

assert.match(source("src/modules/communication/communication.routes.ts"), /whatsappRouter\.get\("\/webhook"/, "WhatsApp webhook verification route must exist");
assert.match(source("src/modules/communication/communication.routes.ts"), /whatsappRouter\.post\("\/webhook"/, "WhatsApp inbound webhook route must exist");
assert.match(source("src/modules/communication/communication.routes.ts"), /whatsappRouter\.post\("\/director\/daily-report"/, "Director report route must exist");
assert.match(source("src/modules/index.ts"), /apiRouter\.use\("\/whatsapp", whatsappRouter\)/, "WhatsApp router must be mounted");
assert.match(source("src/queues/index.ts"), /startWhatsAppWorker\(\)/, "WhatsApp worker must start with infrastructure workers");
assert.match(source("src/queues/scheduler.queue.ts"), /director-whatsapp-daily-report/, "Director WhatsApp daily report must be scheduled");
assert.match(source("src/modules/communication/whatsapp.service.ts"), /WHATSAPP_LOGGED_ONLY/, "WhatsApp must support logged-only mode when credentials are missing");
assert.match(source("src/modules/communication/whatsapp.service.ts"), /APPROVE/, "WhatsApp command parser must support approval intent");

console.log("WhatsApp flow verification passed");

import { whatsappService } from "../modules/communication/whatsapp.service.js";
import { addJob, createWorker, queueNames } from "./queue.config.js";

export type WhatsAppJob =
  | { type: "SEND_TEXT"; to: string; body: string; context?: Record<string, unknown> }
  | { type: "DIRECTOR_DAILY_REPORT" };

export function enqueueWhatsApp(payload: WhatsAppJob) {
  return addJob(queueNames.whatsapp, payload.type === "DIRECTOR_DAILY_REPORT" ? "director-daily-report" : "send-whatsapp", payload);
}

export function startWhatsAppWorker() {
  return createWorker<WhatsAppJob>(queueNames.whatsapp, async (job) => {
    if (job.data.type === "DIRECTOR_DAILY_REPORT") return whatsappService.sendDirectorDailyReport();
    return whatsappService.send({ to: job.data.to, body: job.data.body, context: job.data.context });
  });
}

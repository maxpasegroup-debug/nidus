import { brevoService } from "../modules/communication/brevo.service.js";
import { addJob, createWorker, queueNames } from "./queue.config.js";

export type EmailJob = {
  recipient: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
};

export function enqueueEmail(payload: EmailJob) {
  return addJob(queueNames.email, "send-email", payload);
}

export function startEmailWorker() {
  return createWorker<EmailJob>(queueNames.email, async (job) => {
    return brevoService.sendEmailNow(job.data);
  });
}

import { resendService } from "../modules/communication/resend.service.js";
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
    return resendService.sendEmailNow(job.data);
  });
}

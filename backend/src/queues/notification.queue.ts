import { pushService } from "../modules/communication/push.service.js";
import { addJob, createWorker, queueNames } from "./queue.config.js";

export type NotificationJob = { title: string; body: string; targetAudience: string };

export function enqueueNotification(payload: NotificationJob) {
  return addJob(queueNames.notifications, "send-push", payload);
}

export function startNotificationWorker() {
  return createWorker<NotificationJob>(queueNames.notifications, async (job) => pushService.sendPushNow(job.data));
}

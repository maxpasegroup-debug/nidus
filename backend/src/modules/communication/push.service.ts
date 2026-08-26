import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../../config/env.js";
import { enqueueNotification, type NotificationJob } from "../../queues/notification.queue.js";
import { logger } from "../../utils/logger.js";

let firebaseReady = false;

function initFirebase() {
  if (firebaseReady || getApps().length) {
    firebaseReady = true;
    return true;
  }
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) return false;
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
  firebaseReady = true;
  return true;
}

export const pushService = {
  async sendQueued(input: NotificationJob) {
    const job = await enqueueNotification(input);
    if (job) return { provider: "FIREBASE", status: "QUEUED", jobId: job.id };
    return this.sendPushNow(input);
  },

  async sendPushNow(input: NotificationJob) {
    if (!initFirebase()) {
      logger.warn("Firebase not configured; push notification skipped", input);
      return { provider: "FIREBASE", status: "SKIPPED_NO_FIREBASE" };
    }

    await getMessaging().send({
      topic: input.targetAudience,
      notification: { title: input.title, body: input.body }
    });
    return { provider: "FIREBASE", status: "SENT" };
  }
};

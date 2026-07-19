import { addJob, createWorker, queueNames } from "./queue.config.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../config/prisma.js";
import { enqueueWhatsApp } from "./whatsapp.queue.js";

type ScheduledJob = { task: "session-cleanup" | "daily-report" | "daily-intelligence" | "analytics"; payload?: Record<string, unknown> };

export async function scheduleRecurringJobs() {
  await addJob(queueNames.scheduled, "session-cleanup", { task: "session-cleanup" }, { repeat: { pattern: "*/30 * * * *" } });
  await addJob(queueNames.dailyIntelligence, "daily-intelligence-shell", { task: "daily-intelligence" }, { repeat: { pattern: "0 5 * * *" } });
  await addJob(queueNames.scheduled, "director-whatsapp-daily-report", { task: "daily-report" }, { repeat: { pattern: "0 8 * * *" } });
  await addJob(queueNames.analytics, "daily-analytics", { task: "analytics" }, { repeat: { pattern: "15 2 * * *" } });
}

export function startScheduledWorker() {
  return createWorker<ScheduledJob>(queueNames.scheduled, async (job) => {
    if (job.data.task === "session-cleanup") {
      const result = await prisma.sessionToken.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      });
      return { deleted: result.count };
    }
    if (job.data.task === "daily-report") {
      await enqueueWhatsApp({ type: "DIRECTOR_DAILY_REPORT" });
      return { queued: "DIRECTOR_DAILY_REPORT" };
    }
    logger.info("Scheduled task shell executed", { task: job.data.task });
    return { status: "OK" };
  });
}

export function startDailyIntelligenceWorker() {
  return createWorker<ScheduledJob>(queueNames.dailyIntelligence, async () => {
    logger.info("Daily Intelligence Engine shell executed", {
      components: ["current-affairs", "pdf", "quiz", "vocabulary", "whatsapp-format"]
    });
    return { status: "SHELL_READY" };
  });
}

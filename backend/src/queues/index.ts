import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { startAIWorker } from "./ai.queue.js";
import { startEmailWorker } from "./email.queue.js";
import { startNotificationWorker } from "./notification.queue.js";
import { startPDFWorker } from "./pdf.queue.js";
import { scheduleRecurringJobs, startDailyIntelligenceWorker, startScheduledWorker } from "./scheduler.queue.js";
import { closeQueues, isQueueAvailable } from "./queue.config.js";

const workers: Array<{ worker: { close: () => Promise<void> }; events?: { close: () => Promise<void> } } | null> = [];

export async function startInfrastructureWorkers() {
  if (env.PROCESS_ROLE === "web") {
    logger.info("Queue workers skipped for web process", { processRole: env.PROCESS_ROLE });
    return;
  }

  if (!env.QUEUE_WORKERS_ENABLED || !isQueueAvailable()) {
    logger.warn("Queue workers not started", { workersEnabled: env.QUEUE_WORKERS_ENABLED, queueAvailable: isQueueAvailable() });
    return;
  }

  workers.push(startEmailWorker(), startAIWorker(), startPDFWorker(), startNotificationWorker(), startScheduledWorker(), startDailyIntelligenceWorker());
  await scheduleRecurringJobs();
  logger.info("Infrastructure workers started", { count: workers.filter(Boolean).length });
}

export async function stopInfrastructureWorkers() {
  await Promise.all(workers.filter(Boolean).map(async (entry) => {
    await entry?.events?.close().catch(() => undefined);
    await entry?.worker.close().catch(() => undefined);
  }));
  await closeQueues();
}

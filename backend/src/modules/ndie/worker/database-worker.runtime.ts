import { logger } from "../../../utils/logger.js";
import { ndieQueueConfig, ndieQueueService, ndieWorkerId } from "../queue/queue.service.js";
import { ndieWorkerService } from "./worker.service.js";

let stopping = false;
const loops: Promise<void>[] = [];

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function workerLoop(slot: number) {
  const workerId = ndieWorkerId(`ndie-db-${slot}`);
  while (!stopping) {
    try {
      const job = await ndieQueueService.claimNext?.(workerId) as { id?: string } | null | undefined;
      if (!job?.id) {
        await sleep(500);
        continue;
      }
      await ndieWorkerService.runPlaceholderJob(job.id, workerId);
    } catch (error) {
      logger.error("NDIE database worker loop failed", {
        workerId,
        error: error instanceof Error ? error.message : String(error)
      });
      await sleep(1000);
    }
  }
}

export function startNdieDatabaseWorkers() {
  if (!ndieQueueConfig.workersEnabled || loops.length) return;
  stopping = false;
  void ndieQueueService.recoverStale?.(ndieQueueConfig.jobTimeoutMs).catch((error) => {
    logger.warn("NDIE stale job recovery failed", { error: error instanceof Error ? error.message : String(error) });
  });
  for (let slot = 1; slot <= ndieQueueConfig.workerConcurrency; slot += 1) loops.push(workerLoop(slot));
  logger.info("NDIE database workers started", { concurrency: ndieQueueConfig.workerConcurrency });
}

export async function stopNdieDatabaseWorkers() {
  stopping = true;
  await Promise.allSettled(loops);
  loops.length = 0;
}

import { addJob, createWorker, queueNames } from "./queue.config.js";
import { logger } from "../utils/logger.js";

export type AIJob = {
  feature: string;
  input: unknown;
};

export function enqueueAI(payload: AIJob) {
  return addJob(queueNames.ai, "process-ai", payload, { attempts: 2 });
}

export function startAIWorker() {
  return createWorker<AIJob>(queueNames.ai, async (job) => {
  logger.info("AI queued task recorded", { feature: job.data.feature });
    return { status: "PROCESSED", feature: job.data.feature };
  });
}

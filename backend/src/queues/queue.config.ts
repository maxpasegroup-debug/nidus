import { Queue, Worker, QueueEvents, type JobsOptions, type Processor } from "bullmq";
import { env } from "../config/env.js";
import { getRedis, isRedisReady } from "../config/redis.js";
import { prisma } from "../config/prisma.js";
import { logger } from "../utils/logger.js";

export const queueNames = {
  email: "nidus.email",
  ai: "nidus.ai",
  pdf: "nidus.pdf",
  notifications: "nidus.notifications",
  scheduled: "nidus.scheduled",
  analytics: "nidus.analytics",
  dailyIntelligence: "nidus.daily-intelligence"
} as const;

type QueueName = (typeof queueNames)[keyof typeof queueNames];
const queues = new Map<QueueName, Queue>();

export function queueConnection() {
  return getRedis();
}

export function isQueueAvailable() {
  return Boolean(queueConnection() && isRedisReady());
}

export function getQueue(name: QueueName) {
  const connection = queueConnection();
  if (!connection) return null;
  const existing = queues.get(name);
  if (existing) return existing;
  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 30000 },
      removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
      removeOnFail: { age: 7 * 24 * 60 * 60, count: 1000 }
    }
  });
  queues.set(name, queue);
  return queue;
}

export async function addJob<T>(queueName: QueueName, jobName: string, payload: T, options?: JobsOptions) {
  const queue = getQueue(queueName);
  if (!queue) {
    logger.warn("Queue unavailable; job skipped", { queueName, jobName });
    return null;
  }
  const job = await queue.add(jobName, payload, options);
  await prisma.queueJobLog.create({ data: { queueName, jobName, jobId: job.id, status: "QUEUED", payload: payload as object } }).catch(() => undefined);
  return job;
}

export function createWorker<T>(queueName: QueueName, processor: Processor<T, unknown, string>) {
  const connection = queueConnection();
  if (!connection || !env.QUEUE_WORKERS_ENABLED) return null;
  const worker = new Worker(queueName, processor, { connection, concurrency: env.QUEUE_CONCURRENCY });
  const events = new QueueEvents(queueName, { connection });

  worker.on("completed", async (job) => {
    logger.info("Queue job completed", { queueName, jobName: job.name, jobId: job.id });
    await prisma.queueJobLog.create({ data: { queueName, jobName: job.name, jobId: job.id, status: "COMPLETED", attempts: job.attemptsMade, payload: job.data as object } }).catch(() => undefined);
  });
  worker.on("failed", async (job, error) => {
    logger.error("Queue job failed", { queueName, jobName: job?.name, jobId: job?.id, error: error.message });
    await prisma.queueJobLog.create({ data: { queueName, jobName: job?.name ?? "unknown", jobId: job?.id, status: "FAILED", attempts: job?.attemptsMade ?? 0, error: error.message, payload: job?.data as object } }).catch(() => undefined);
  });
  events.on("stalled", ({ jobId }) => logger.warn("Queue job stalled", { queueName, jobId }));

  return { worker, events };
}

export async function closeQueues() {
  await Promise.all(Array.from(queues.values()).map((queue) => queue.close()));
  queues.clear();
}

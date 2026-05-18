import assert from "node:assert/strict";
import { env } from "../config/env.js";
import { getCached, setCached } from "../config/cache.js";
import { closeRedis, verifyRedisConnection } from "../config/redis.js";
import { addJob, closeQueues, getQueue, isQueueAvailable, queueNames } from "../queues/queue.config.js";
import { prisma } from "../config/prisma.js";

await setCached("queue-readiness:cache", { ok: true }, 30);
const cached = await getCached<{ ok: boolean }>("queue-readiness:cache");
assert.equal(cached?.ok, true, "cache read/write must work");

const redisConnected = await verifyRedisConnection();
if (env.REDIS_REQUIRED) {
  assert.equal(redisConnected, true, "Redis must be connected when REDIS_REQUIRED=true");
}

const queueAvailable = isQueueAvailable();
if (env.REDIS_REQUIRED) {
  assert.equal(queueAvailable, true, "queue connection must be available when Redis-backed queues are required/enabled");
}

let queuedJobId: string | undefined;
if (queueAvailable) {
  const job = await addJob(queueNames.scheduled, "queue-readiness-self-test", { ok: true }, { removeOnComplete: true, removeOnFail: true });
  assert.ok(job, "self-test job should be queued");
  queuedJobId = job.id;
  await job.remove().catch(() => undefined);
}

const queueCounts = await Promise.all(
  Object.values(queueNames).map(async (queueName) => {
    const queue = getQueue(queueName);
    if (!queue) return { queueName, status: "UNAVAILABLE" };
    const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");
    return { queueName, status: counts.failed > 0 ? "ATTENTION" : "READY", ...counts };
  })
);

const failedLogs24h = await prisma.queueJobLog.count({
  where: { status: "FAILED", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
});

console.log(
  JSON.stringify({
    cache: "ok",
    redisConnected,
    redisRequired: env.REDIS_REQUIRED,
    queueAvailable,
    workersEnabled: env.QUEUE_WORKERS_ENABLED,
    queuedJobId,
    failedLogs24h,
    queues: queueCounts
  })
);

await closeQueues();
await closeRedis();
await prisma.$disconnect();

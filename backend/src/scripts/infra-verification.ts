import assert from "node:assert/strict";

process.env.JWT_SECRET ||= "infra-verification-secret-32-characters";
process.env.DATABASE_URL ||= "postgresql://user:pass@localhost:5432/nidus";

const { getCached, setCached } = await import("../config/cache.js");
const { verifyRedisConnection } = await import("../config/redis.js");
const { addJob, queueNames } = await import("../queues/queue.config.js");

await setCached("infra:self-test", { ok: true }, 5);
const cached = await getCached<{ ok: boolean }>("infra:self-test");
assert.equal(cached?.ok, true, "cache service should read back values");

const redisConnected = await verifyRedisConnection();
console.log(`Redis connection: ${redisConnected ? "connected" : "fallback"}`);

const job = await addJob(queueNames.scheduled, "infra-self-test", { ok: true });
console.log(`Queue availability: ${job ? "queued" : "fallback"}`);

console.log("Infrastructure verification checks passed.");

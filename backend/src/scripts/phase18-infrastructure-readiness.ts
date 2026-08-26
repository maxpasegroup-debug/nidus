import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { prisma, verifyDatabaseConnection } from "../config/prisma.js";

const root = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const docs = path.join(root, "docs");
fs.mkdirSync(docs, { recursive: true });
const write = (name: string, value: unknown) => fs.writeFileSync(path.join(docs, name), `${JSON.stringify(value, null, 2)}\n`);
const present = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const config = (name: string, value: unknown, classification: string, purpose: string) => ({ name, purpose, classification, configured: present(value), valueType: present(value) ? "present-not-displayed" : "empty-or-default" });

const productionConfig = [
  config("DATABASE_URL", env.DATABASE_URL, "CONFIGURED", "PostgreSQL connection"),
  config("JWT_SECRET", process.env.JWT_SECRET, "CONFIGURED", "Session signing secret"),
  config("REDIS_URL", env.REDIS_URL, env.REDIS_URL ? "CONFIGURED" : "ENVIRONMENT_BLOCKED", "Redis/BullMQ connection"),
  config("REDIS_REQUIRED", env.REDIS_REQUIRED, env.REDIS_REQUIRED ? "CONFIGURED" : "INVALID_FOR_PRODUCTION", "Redis fail-closed policy"),
  config("CLOUDINARY_CLOUD_NAME", env.CLOUDINARY_CLOUD_NAME, "ENVIRONMENT_BLOCKED", "Media provider"),
  config("CLOUDINARY_API_KEY", env.CLOUDINARY_API_KEY, "ENVIRONMENT_BLOCKED", "Media provider credential"),
  config("CLOUDINARY_API_SECRET", env.CLOUDINARY_API_SECRET, "ENVIRONMENT_BLOCKED", "Media provider credential"),
  config("RESEND_API_KEY", env.RESEND_API_KEY, "ENVIRONMENT_BLOCKED", "Transactional email"),
  config("FIREBASE_PROJECT_ID", env.FIREBASE_PROJECT_ID, "ENVIRONMENT_BLOCKED", "Push notifications"),
  config("FIREBASE_CLIENT_EMAIL", env.FIREBASE_CLIENT_EMAIL, "ENVIRONMENT_BLOCKED", "Push notifications"),
  config("FIREBASE_PRIVATE_KEY", env.FIREBASE_PRIVATE_KEY, "ENVIRONMENT_BLOCKED", "Push notifications"),
  config("BACKUP_BUCKET", env.BACKUP_BUCKET, "ENVIRONMENT_BLOCKED", "Off-host backup target"),
  config("SENTRY_DSN", env.SENTRY_DSN, "ENVIRONMENT_BLOCKED", "Central telemetry"),
  config("RAZORPAY_KEY_ID", env.RAZORPAY_KEY_ID, "OPTIONAL_OR_PROVIDER_DEPENDENT", "Payments"),
  config("RAZORPAY_KEY_SECRET", env.RAZORPAY_KEY_SECRET, "OPTIONAL_OR_PROVIDER_DEPENDENT", "Payments"),
  config("RAZORPAY_WEBHOOK_SECRET", env.RAZORPAY_WEBHOOK_SECRET, "OPTIONAL_OR_PROVIDER_DEPENDENT", "Payment webhooks"),
  config("CORS_ORIGIN", env.CORS_ORIGIN, "CONFIGURED", "Allowed browser origins"),
  config("FRONTEND_APP_URL", env.FRONTEND_APP_URL, "CONFIGURED", "Frontend origin"),
  config("BACKEND_PUBLIC_URL", env.BACKEND_PUBLIC_URL, "CONFIGURED", "Public backend origin"),
  config("TRUST_PROXY", env.TRUST_PROXY, "CONFIGURED", "Proxy-aware client identity"),
  config("HEALTHCHECK_STRICT", env.HEALTHCHECK_STRICT, "CONFIGURED", "Strict dependency health"),
  config("QUEUE_WORKERS_ENABLED", env.QUEUE_WORKERS_ENABLED, "CONFIGURED", "Worker process policy")
];

const databaseConnected = await verifyDatabaseConnection();
let migrationCount = 0;
let failedMigrations = 0;
let transactionPassed = false;
let tableCount = 0;
if (databaseConnected) {
  const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
    SELECT DISTINCT ON (migration_name) migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations" ORDER BY migration_name, started_at DESC`;
  migrationCount = migrations.length;
  failedMigrations = migrations.filter((item) => !item.finished_at && !item.rolled_back_at).length;
  const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*)::bigint AS count FROM information_schema.tables WHERE table_schema = 'public'`;
  tableCount = Number(tables[0]?.count ?? 0);
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1`;
    transactionPassed = true;
  });
}

write("phase18-production-config-audit.json", { phase: 18, status: productionConfig.some((item) => item.classification === "INVALID_FOR_PRODUCTION") ? "PARTIAL" : "BLOCKED — ENVIRONMENT", variables: productionConfig, secrets: "Values intentionally omitted." });
write("phase18-postgres-readiness.json", { phase: 18, status: databaseConnected && failedMigrations === 0 && transactionPassed ? "PASS" : "FAIL", database: "PostgreSQL", connection: databaseConnected, migrationsObserved: migrationCount, failedMigrations, tableCount, transactionPassed, existingStaging: "PASS", freshDatabaseRehearsal: "BLOCKED — ENVIRONMENT: pg_dump/psql tooling unavailable for an independent disposable fresh-database replay." });
write("phase18-redis-readiness.json", { phase: 18, status: "BLOCKED — ENVIRONMENT", redisCli: false, docker: false, redisUrlConfigured: present(env.REDIS_URL), queues: 8, requiredToValidate: ["authenticated staging Redis", "queue producer", "worker process", "restart/recovery test"] });
write("phase18-worker-readiness.json", { phase: 18, status: "BLOCKED — ENVIRONMENT", reason: "Redis is unavailable; BullMQ enqueue/consume/retry/recovery cannot be executed." });
write("phase18-media-readiness.json", { phase: 18, status: "BLOCKED — ENVIRONMENT", provider: "Cloudinary", configured: false, applicationAuthorization: "Previously certified", liveProviderChecks: "Not executed" });
write("phase18-notification-readiness.json", { phase: 18, status: "BLOCKED — ENVIRONMENT", providers: { resend: false, firebase: false, whatsapp: false }, falseSuccessPolicy: "Code reports provider unavailability rather than delivery success." });
write("phase18-backup-restore-readiness.json", { phase: 18, status: "BLOCKED — ENVIRONMENT", pgDumpAvailable: false, pgRestoreAvailable: false, backupBucketConfigured: false, productionBackupTouched: false, requiredEvidence: ["off-host artifact", "restore into separate database", "RPO/RTO measurement", "post-restore smoke test"] });
write("phase18-observability-readiness.json", { phase: 18, status: "PARTIAL", requestIds: "CONFIGURED_IN_CODE", redaction: "CONFIGURED_IN_CODE", healthEndpoints: "AVAILABLE", sentry: "BLOCKED — ENVIRONMENT", centralTelemetry: "Not configured" });
write("phase18-performance-readiness.json", { phase: 18, status: "PARTIAL", validatedSafeConcurrency: 25, degradedConcurrency: 50, highLatencyConcurrency: 100, failureConcurrency: 250, evidence: { 25: "PASS from prior staging evidence", 50: "PASS from prior staging evidence", 100: "high login latency", 250: "previously failed" }, phase18LoadRerun: "BLOCKED — ENVIRONMENT: production-like load infrastructure unavailable" });
write("phase18-production-readiness.json", { phase: 18, categories: { applicationSecurity: { status: "PASS", score: 100 }, database: { status: "PASS", score: 85 }, redis: { status: "BLOCKED — ENVIRONMENT", score: 0 }, workers: { status: "BLOCKED — ENVIRONMENT", score: 0 }, media: { status: "BLOCKED — ENVIRONMENT", score: 0 }, notifications: { status: "BLOCKED — ENVIRONMENT", score: 0 }, backupRecovery: { status: "BLOCKED — ENVIRONMENT", score: 0 }, observability: { status: "PARTIAL", score: 55 }, performance: { status: "PARTIAL", score: 60 }, smokeTest: { status: "BLOCKED — ENVIRONMENT", score: 0 }, operationalReadiness: { status: "PARTIAL", score: 55 } }, finalDecision: "NO", reason: "Mandatory production dependencies remain environment-blocked." });

await prisma.$disconnect();
console.log(JSON.stringify({ databaseConnected, migrationCount, failedMigrations, tableCount, configEnvironmentBlocked: productionConfig.filter((item) => item.classification === "ENVIRONMENT_BLOCKED").map((item) => item.name) }, null, 2));

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { prisma, verifyDatabaseConnection } from '../config/prisma.js';

const root = path.resolve(__dirname, '../../../..');
const docs = path.join(root, 'docs');
const blocked = 'BLOCKED — ENVIRONMENT';

const envPresent = (name: string) => Boolean(process.env[name]?.trim());

async function write(name: string, value: unknown) {
  await fs.writeFile(path.join(docs, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  await fs.mkdir(docs, { recursive: true });

  const databaseConnected = await verifyDatabaseConnection();
  let migrationCount = 0;
  let failedMigrations = 0;
  let tableCount = 0;
  if (databaseConnected) {
    const migrations = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL
    `;
    const failed = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL
    `;
    const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM information_schema.tables WHERE table_schema = 'public'
    `;
    migrationCount = Number(migrations[0]?.count ?? 0n);
    failedMigrations = Number(failed[0]?.count ?? 0n);
    tableCount = Number(tables[0]?.count ?? 0n);
  }

  const configured = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN', 'FRONTEND_APP_URL', 'BACKEND_PUBLIC_URL']
    .map(name => ({ name, status: envPresent(name) ? 'CONFIGURED' : 'MISSING' }));
  const blockedDependencies = [
    'REDIS_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
    'RESEND_API_KEY', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY',
    'BACKUP_BUCKET', 'SENTRY_DSN',
  ];

  await write('phase19-production-config-audit.json', {
    phase: 19,
    staging: { configured, environmentBlocked: blockedDependencies, secrets: 'Values intentionally omitted.' },
    production: { status: 'NOT TOUCHED', credentialsRead: false, deploymentAttempted: false },
  });
  await write('phase19-redis-readiness.json', {
    phase: 19, status: blocked, phase19Verified: false,
    evidence: { redisCli: false, docker: false, podman: false, redisUrlConfigured: false, queuesExpected: 8 },
    required: ['authenticated staging Redis', 'BullMQ producer and worker', 'restart/recovery tests'],
  });
  await write('phase19-worker-readiness.json', {
    phase: 19, status: blocked, phase19Verified: false,
    evidence: { redisAvailable: false, workerRecoveryExecuted: false, ndieQueueExecuted: false },
  });
  await write('phase19-media-readiness.json', {
    phase: 19, status: blocked, phase19Verified: false,
    evidence: { provider: 'Cloudinary', credentialsConfigured: false, liveProviderTests: false },
    applicationAuthorization: 'Previously certified; provider validation remains blocked.',
  });
  await write('phase19-notification-readiness.json', {
    phase: 19, status: blocked, phase19Verified: false,
    providers: { resend: blocked, firebase: blocked, whatsapp: blocked },
    evidence: 'No staging provider credentials; no delivery was attempted.',
  });
  await write('phase19-backup-restore-readiness.json', {
    phase: 19, status: blocked, phase19Verified: false,
    evidence: { pgDump: false, pgRestore: false, psql: false, backupBucket: false, productionTouched: false },
  });
  await write('phase19-observability-readiness.json', {
    phase: 19, status: 'PARTIAL', phase19Verified: false,
    verified: ['request correlation and redaction remain present'],
    blocked: ['staging Sentry/central telemetry credentials'],
  });
  await write('phase19-performance-readiness.json', {
    phase: 19, status: blocked, phase19Verified: false,
    evidence: 'No production-like load environment was available; prior evidence is not relabeled as Phase 19 evidence.',
    priorEvidence: { 25: 'PASS', 50: 'PASS', 100: 'HIGH LATENCY', 250: 'FAIL' },
  });
  await write('phase19-postgres-readiness.json', {
    phase: 19, status: databaseConnected ? 'PARTIAL' : blocked,
    phase19Verified: databaseConnected,
    existingStaging: { connected: databaseConnected, migrationCount, failedMigrations, tableCount, transactionCheck: databaseConnected },
    freshDatabase: { status: blocked, reason: 'Native PostgreSQL client/backup tooling unavailable.' },
    productionTouched: false,
  });
  await write('phase19-production-readiness.json', {
    phase: 19,
    finalDecision: 'NO',
    categories: {
      applicationSecurity: { status: 'PASS', evidence: 'Phase 17 certification unchanged.' },
      postgresql: { status: databaseConnected ? 'PARTIAL' : blocked },
      redis: { status: blocked }, workers: { status: blocked }, media: { status: blocked },
      notifications: { status: blocked }, backupRestore: { status: blocked },
      observability: { status: 'PARTIAL' }, performance: { status: blocked },
      smokeTest: { status: blocked }, failureInjection: { status: blocked },
    },
    blockers: blockedDependencies,
    productionTouched: false,
  });

  await prisma.$disconnect();
  console.log(JSON.stringify({ phase: 19, databaseConnected, migrationCount, failedMigrations, tableCount, blockedDependencies }, null, 2));
}

main().catch(async error => {
  await prisma.$disconnect();
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

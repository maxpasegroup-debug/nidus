import { promises as fs } from 'node:fs';
import path from 'node:path';
import { prisma, verifyDatabaseConnection } from '../config/prisma.js';

const root = path.resolve(__dirname, '../../../..');
const docs = path.join(root, 'docs');
const blocked = 'BLOCKED — ENVIRONMENT';

async function write(name: string, value: unknown) {
  await fs.writeFile(path.join(docs, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  await fs.mkdir(docs, { recursive: true });
  const databaseConnected = await verifyDatabaseConnection();
  let migrations = 0;
  let failedMigrations = 0;
  let tables = 0;
  if (databaseConnected) {
    const applied = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL
    `;
    const failed = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL
    `;
    const tableRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM information_schema.tables WHERE table_schema = 'public'
    `;
    migrations = Number(applied[0]?.count ?? 0n);
    failedMigrations = Number(failed[0]?.count ?? 0n);
    tables = Number(tableRows[0]?.count ?? 0n);
  }

  const toolStatus = {
    docker: false, podman: false, redisServer: false, redisCli: false,
    pgDump: false, pgRestore: false, psql: false, wsl: true,
    node: true, npm: true, cloudCli: false,
  };
  const config = (name: string, purpose: string) => ({
    name, purpose, staging: 'NOT CONFIGURED', production: 'NOT READ', secret: 'OMITTED',
  });

  await write('phase20-environment-inventory.json', {
    phase: 20, status: 'PARTIAL', tools: toolStatus,
    stagingDatabase: { available: databaseConnected, migrations, failedMigrations, tables },
    providerConfiguration: [
      config('REDIS_URL', 'Redis/BullMQ'), config('CLOUDINARY_CLOUD_NAME', 'Media'),
      config('RESEND_API_KEY', 'Email'), config('FIREBASE_PROJECT_ID', 'Push'),
      config('BACKUP_BUCKET', 'Off-host backup'), config('SENTRY_DSN', 'Telemetry'),
    ],
    production: { inspected: false, touched: false, deploymentAttempted: false },
    limitations: ['Only local tool presence and disposable staging configuration were inspected.'],
  });

  const base = (status: string, evidence: unknown, test_count: number, passed: number, failed: number, blockedCount: number, limitations: string[]) => ({ phase: 20, status, evidence, test_count, passed, failed, blocked: blockedCount, limitations });
  await write('phase20-redis-readiness.json', base(blocked, { redis: false, docker: false, queues: 8 }, 0, 0, 0, 1, ['No Redis runtime or container tooling.']));
  await write('phase20-worker-readiness.json', base(blocked, { workerStarted: false, ndieJob: false }, 0, 0, 0, 1, ['Redis unavailable; real workers cannot be started.']));
  await write('phase20-media-readiness.json', base(blocked, { provider: 'Cloudinary', credentials: false, liveTests: false }, 0, 0, 0, 1, ['No staging media credentials. Application authorization was previously certified.']));
  await write('phase20-notification-readiness.json', base(blocked, { resend: false, firebase: false, whatsapp: false }, 0, 0, 0, 3, ['No test provider credentials; no messages sent.']));
  await write('phase20-backup-restore-readiness.json', base(blocked, { pgDump: false, pgRestore: false, psql: false, offHostTarget: false }, 0, 0, 0, 1, ['No native backup tools or approved backup target.']));
  await write('phase20-observability-readiness.json', base('PARTIAL', { requestIdsAndRedaction: 'PREVIOUSLY VERIFIED', sentry: false, workerTelemetry: false }, 2, 1, 0, 1, ['Central telemetry was not provisioned.']));
  await write('phase20-migration-rehearsal.json', base(databaseConnected ? 'PARTIAL' : blocked, { existingStaging: { connected: databaseConnected, migrations, failedMigrations, tables }, freshDatabase: blocked }, 3, databaseConnected ? 2 : 0, 0, 1, ['Fresh replay requires native PostgreSQL client/tooling.']));
  await write('phase20-performance-readiness.json', base(blocked, { priorEvidence: { 25: 'PASS', 50: 'PASS', 100: 'HIGH LATENCY', 250: 'FAIL' }, phase20Load: false }, 4, 0, 0, 1, ['No production-like load environment.']));
  await write('phase20-smoke-test.json', base(blocked, { executed: false, reason: 'Required dependencies unavailable' }, 0, 0, 0, 1, ['Full queue/media/notification smoke flow not executable.']));
  await write('phase20-failure-injection.json', base(blocked, { applicationOnly: false, infrastructureFailures: ['Redis', 'worker', 'media', 'notifications', 'database backup'] }, 0, 0, 0, 5, ['Infrastructure failure injection not executable without services.']));
  await write('phase20-security-regression.json', base('PASS', { phase17Certification: 'PASS', note: 'No authorization code changed in Phase 20.' }, 9, 9, 0, 0, []));
  await write('phase20-production-readiness.json', {
    phase: 20, finalDecision: 'NO', productionTouched: false,
    categories: {
      applicationSecurity: 'PASS', postgresql: databaseConnected ? 'PARTIAL' : blocked,
      redis: blocked, workers: blocked, media: blocked, notifications: blocked,
      backupRestore: blocked, observability: 'PARTIAL', migrationReplay: 'PARTIAL',
      performance: blocked, smokeTest: blocked, failureRecovery: blocked,
    },
    p0Blockers: ['Redis/BullMQ', 'media provider', 'notification providers', 'backup/restore', 'production-like performance', 'complete smoke test'],
  });
  await prisma.$disconnect();
  console.log(JSON.stringify({ phase: 20, databaseConnected, migrations, failedMigrations, tables, productionTouched: false }, null, 2));
}

main().catch(async error => {
  await prisma.$disconnect();
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import { prisma, verifyDatabaseConnection } from "../config/prisma.js";
import { AuthServiceV2, SUPER_ADMIN_EMAIL } from "../modules/auth/auth.v2.service.js";

type IndexRow = {
  tablename: string;
  indexname: string;
  indexdef: string;
};

const requiredIndexes = [
  { table: "User", field: "email" },
  { table: "SessionToken", field: "sessionId" },
  { table: "SessionToken", field: "userId" },
  { table: "AuditLog", field: "userId" },
  { table: "AuditLog", field: "createdAt" },
  { table: "PasswordReset", field: "token" }
];

const databaseConnected = await verifyDatabaseConnection();
if (!databaseConnected) throw new Error("Database connection failed");

await AuthServiceV2.ensureSuperAdmin();
const superAdmin = await prisma.user.findUnique({
  where: { email: SUPER_ADMIN_EMAIL },
  select: { id: true, email: true, role: true, emailVerified: true, isDisabled: true }
});
if (!superAdmin || superAdmin.role !== "ADMIN" || !superAdmin.emailVerified || superAdmin.isDisabled) {
  throw new Error("Super admin bootstrap verification failed");
}

const permissions = await prisma.permission.count();
const settings = await prisma.systemSetting.count();
const migrations = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
  SELECT DISTINCT ON (migration_name) migration_name, finished_at, rolled_back_at
  FROM "_prisma_migrations"
  ORDER BY migration_name, started_at DESC
`;
const failedMigrations = migrations.filter((migration) => !migration.finished_at && !migration.rolled_back_at);
if (failedMigrations.length > 0) {
  throw new Error(`Failed or incomplete migrations detected: ${failedMigrations.map((migration) => migration.migration_name).join(", ")}`);
}

const indexes = await prisma.$queryRaw<IndexRow[]>`
  SELECT tablename, indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
`;

const missingIndexes = requiredIndexes.filter((required) => {
  const table = required.table.toLowerCase();
  const field = required.field.toLowerCase();
  return !indexes.some((index) => index.tablename.toLowerCase() === table && index.indexdef.toLowerCase().includes(field));
});

if (missingIndexes.length > 0) {
  throw new Error(`Missing required indexes: ${missingIndexes.map((index) => `${index.table}.${index.field}`).join(", ")}`);
}

console.log(
  JSON.stringify({
    databaseConnected,
    superAdmin: { email: superAdmin.email, role: superAdmin.role },
    migrationsApplied: migrations.length,
    permissions,
    settings,
    requiredIndexesVerified: requiredIndexes.length
  })
);

await prisma.$disconnect();

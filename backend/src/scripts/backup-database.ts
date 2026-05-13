import { prismaBackupConfig } from "../config/prisma.js";
import { env } from "../config/env.js";

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = env.BACKUP_BUCKET ? `${env.BACKUP_BUCKET}/postgres/nidus-${stamp}.dump` : `nidus-${stamp}.dump`;

console.log("NIDUS database backup plan");
console.log(`Provider: ${prismaBackupConfig.provider}`);
console.log(`Create: pg_dump "$DATABASE_URL" --format=custom --file="${target}"`);
console.log(`Restore: ${prismaBackupConfig.restoreCommand}`);
console.log("Run this from a trusted Railway shell or CI job with DATABASE_URL and storage credentials available.");

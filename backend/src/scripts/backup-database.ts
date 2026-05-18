import { prismaBackupConfig } from "../config/prisma.js";
import { env } from "../config/env.js";

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = env.BACKUP_BUCKET ? `${env.BACKUP_BUCKET}/postgres/nidus-${stamp}.dump` : `nidus-${stamp}.dump`;
const shouldExecute = process.argv.includes("--execute");

console.log("NIDUS database backup plan");
console.log(`Provider: ${prismaBackupConfig.provider}`);
console.log(`Create: pg_dump "$DATABASE_URL" --format=custom --file="${target}"`);
console.log(`Restore: ${prismaBackupConfig.restoreCommand}`);

if (!shouldExecute) {
  console.log("Run with --execute from a trusted Railway shell or CI job with DATABASE_URL and storage credentials available.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to execute a database backup");
}

if (env.BACKUP_BUCKET) {
  throw new Error("BACKUP_BUCKET upload execution is not wired yet. Run pg_dump locally and upload the dump to the configured bucket.");
}

const { spawn } = await import("node:child_process");

await new Promise<void>((resolve, reject) => {
  const child = spawn("pg_dump", [process.env.DATABASE_URL ?? "", "--format=custom", `--file=${target}`], {
    stdio: "inherit"
  });

  child.on("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`pg_dump exited with code ${code}`));
  });
  child.on("error", reject);
});

console.log(`Database backup created: ${target}`);

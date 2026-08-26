import bcrypt from "bcryptjs";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

async function main() {
  const apply = process.argv.includes("--apply");
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { roleMetadata: { path: ["accessPin"], not: Prisma.AnyNull } },
        { roleMetadata: { path: ["access_pin"], not: Prisma.AnyNull } },
      ],
    },
    select: { id: true, password: true, roleMetadata: true },
  });

  let migrated = 0;
  let invalidMetadata = 0;
  for (const user of users) {
    const metadata = metadataObject(user.roleMetadata);
    const plaintext = typeof metadata.accessPin === "string"
      ? metadata.accessPin
      : typeof metadata.access_pin === "string" ? metadata.access_pin : "";
    const validPin = /^\d{4}$/.test(plaintext);
    if (!validPin) invalidMetadata += 1;
    delete metadata.accessPin;
    delete metadata.access_pin;
    metadata.credentialRotationRequired = true;
    metadata.plaintextPinRemovedAt = new Date().toISOString();

    if (apply) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            password: validPin && !(await bcrypt.compare(plaintext, user.password))
              ? await bcrypt.hash(plaintext, 12)
              : user.password,
            roleMetadata: metadata as Prisma.InputJsonObject,
          },
        }),
        prisma.sessionToken.deleteMany({ where: { userId: user.id } }),
      ]);
      migrated += 1;
    }
  }

  console.log(JSON.stringify({
    mode: apply ? "APPLY" : "DRY_RUN",
    accountsWithPlaintextPin: users.length,
    invalidMetadata,
    migrated,
    rotationRequired: users.length,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "PIN metadata migration failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

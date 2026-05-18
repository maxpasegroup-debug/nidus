import assert from "node:assert/strict";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { createApp } from "../app.js";
import { prisma } from "../config/prisma.js";
import { Role } from "../generated/prisma/client.js";
import { AuthServiceV2 } from "../modules/auth/auth.v2.service.js";

const app = createApp();
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", () => resolve()));

function address() {
  const value = server.address();
  if (!value || typeof value === "string") throw new Error("Could not resolve test server address");
  return `http://127.0.0.1:${value.port}`;
}

try {
  const baseUrl = address();

  const root = await fetch(`${baseUrl}/`);
  assert.equal(root.headers.get("x-powered-by"), null, "x-powered-by must be disabled");
  assert.equal(root.headers.get("x-frame-options"), "SAMEORIGIN", "helmet should set frame protection in local/dev");
  assert.equal(root.headers.get("x-content-type-options"), "nosniff", "helmet should set nosniff");

  const unauthorizedAdmin = await fetch(`${baseUrl}/api/admin`);
  assert.equal(unauthorizedAdmin.status, 401, "admin center must reject unauthenticated access");

  const unsafeContentType = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify({ identifier: "x@example.com", password: "password123" })
  });
  assert.equal(unsafeContentType.status, 415, "mutating API routes must reject unsupported content types");

  const disallowedCors = await fetch(`${baseUrl}/api/health`, {
    headers: { origin: "https://evil.example" }
  });
  assert.equal(disallowedCors.headers.get("access-control-allow-origin"), null, "disallowed origins must not receive CORS allow headers");

  const email = `security-reset-${Date.now()}@nidus.local`;
  const password = "InitialPassword123";
  const user = await prisma.user.create({
    data: {
      name: "Security Reset Probe",
      email,
      mobile: `+9188${Date.now().toString().slice(-8)}`,
      password: await bcrypt.hash(password, 12),
      role: Role.GUEST,
      emailVerified: true,
      roleOnboardingStatus: "ACTIVE",
      roleActivatedAt: new Date(),
      lastRoleActivityAt: new Date()
    }
  });

  const token = `security-reset-${crypto.randomUUID()}`;
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  });

  await AuthServiceV2.resetPassword(token, "UpdatedPassword123");
  let secondUseRejected = false;
  try {
    await AuthServiceV2.resetPassword(token, "AnotherPassword123");
  } catch {
    secondUseRejected = true;
  }
  assert.equal(secondUseRejected, true, "password reset tokens must be single-use");

  await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);

  console.log(JSON.stringify({
    securityHeaders: "ok",
    adminAuthorization: "ok",
    corsRejection: "ok",
    contentTypeGuard: "ok",
    passwordResetSingleUse: "ok"
  }));
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
}

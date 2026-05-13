import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assertContains(path: string, text: string, label: string) {
  assert.ok(read(path).includes(text), `${label} missing in ${path}`);
}

assertContains("src/runtime/lifecycle.ts", "markRuntimeReady", "runtime readiness state");
assertContains("src/server.ts", "PROCESS_ROLE", "Railway web/worker process role guard");
assertContains("src/app.ts", "https://checkout.razorpay.com", "Razorpay CSP allowance");
assertContains("src/config/env.ts", "BACKEND_PUBLIC_URL", "production API domain validation");
assertContains("src/modules/admin-center/admin-center.routes.ts", "/operations", "admin operations route");
assertContains("src/modules/admin-center/admin-center.service.ts", "queueHealth", "queue health telemetry");
assertContains("../frontend/src/app/admin-center/operations/page.tsx", "Production Operations", "admin operations panel");
assertContains("../frontend/public/sw.js", "SKIP_WAITING", "PWA update handling");
assertContains("../railway.backend.json", "backend/Dockerfile", "Railway backend service config");
assertContains("../railway.frontend.json", "frontend/Dockerfile", "Railway frontend service config");
assertContains("../docs/OPERATIONAL_HANDBOOK.md", "Production Smoke", "operational handbook smoke runbook");

console.log("Production operations verification checks passed.");

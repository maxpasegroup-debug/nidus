import assert from "node:assert/strict";

const apiBaseUrl = process.env.SMOKE_API_URL ?? process.env.BACKEND_PUBLIC_URL ?? "http://localhost:4000";
const appBaseUrl = process.env.SMOKE_APP_URL ?? process.env.FRONTEND_APP_URL ?? "http://localhost:3000";

async function checkJson(url: string, label: string) {
  const response = await fetch(url);
  assert.ok(response.ok, `${label} returned ${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}

async function checkPage(url: string, label: string) {
  const response = await fetch(url);
  assert.ok(response.ok, `${label} returned ${response.status}`);
}

const health = await checkJson(`${apiBaseUrl.replace(/\/$/, "")}/api/health`, "API health");
assert.equal(health.service, "nidus-backend", "API health service marker");
await checkJson(`${apiBaseUrl.replace(/\/$/, "")}/api/system/status`, "System status");
await checkPage(appBaseUrl, "Frontend app");

console.log("Production smoke checks passed.");

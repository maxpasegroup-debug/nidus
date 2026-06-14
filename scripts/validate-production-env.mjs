import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readEnvFile(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return {};

  return Object.fromEntries(
    readFileSync(fullPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      })
  );
}

const backendEnv = { ...readEnvFile("backend/.env"), ...process.env };
const frontendEnv = { ...readEnvFile("frontend/.env"), ...process.env };

const requiredBackend = [
  "DATABASE_URL",
  "JWT_SECRET",
  "NODE_ENV",
  "CORS_ORIGIN",
  "FRONTEND_APP_URL",
  "BACKEND_PUBLIC_URL",
  "APP_DOMAIN",
  "API_DOMAIN",
  "TRUST_PROXY",
  "PROCESS_ROLE",
  "REDIS_REQUIRED",
  "QUEUE_WORKERS_ENABLED",
  "QUEUE_CONCURRENCY",
  "HEALTHCHECK_STRICT"
];

const requiredFrontend = [];
const requiredIntegrations = [
  "RESEND_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "OPENAI_API_KEY"
];

const recommendedIntegrations = [
  "SENTRY_DSN"
];

const errors = [];
const warnings = [];

function requireValue(env, key, label) {
  if (!env[key]) errors.push(`${label}: ${key} is required`);
}

for (const key of requiredBackend) requireValue(backendEnv, key, "backend");
for (const key of requiredFrontend) requireValue(frontendEnv, key, "frontend");

if (backendEnv.NODE_ENV !== "production") {
  errors.push("backend: NODE_ENV must be production for deployment");
}

if (!["web", "all"].includes(backendEnv.PROCESS_ROLE ?? "")) {
  errors.push("backend: PROCESS_ROLE must be web or all in the single-service production deployment");
}

if (frontendEnv.NEXT_PUBLIC_APP_ENV && frontendEnv.NEXT_PUBLIC_APP_ENV !== "production") {
  errors.push("frontend: NEXT_PUBLIC_APP_ENV must be production for deployment");
}

if ((backendEnv.JWT_SECRET ?? "").length < 64) {
  errors.push("backend: JWT_SECRET must be at least 64 characters for production");
}

const corsOriginValues = (backendEnv.CORS_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
if (backendEnv.FRONTEND_APP_URL && !corsOriginValues.includes(backendEnv.FRONTEND_APP_URL)) {
  errors.push("backend: CORS_ORIGIN must include FRONTEND_APP_URL");
}

if (backendEnv.FRONTEND_APP_URL && backendEnv.APP_DOMAIN && !backendEnv.FRONTEND_APP_URL.includes(backendEnv.APP_DOMAIN)) {
  errors.push("backend: FRONTEND_APP_URL must match APP_DOMAIN");
}

if (backendEnv.BACKEND_PUBLIC_URL && backendEnv.API_DOMAIN && !backendEnv.BACKEND_PUBLIC_URL.includes(backendEnv.API_DOMAIN)) {
  errors.push("backend: BACKEND_PUBLIC_URL must match API_DOMAIN");
}

if (frontendEnv.NEXT_PUBLIC_API_URL && !frontendEnv.NEXT_PUBLIC_API_URL.startsWith("/")) {
  warnings.push("frontend: NEXT_PUBLIC_API_URL is set to an absolute URL; prefer leaving it blank so the single NIDUS service uses same-origin /api");
}

for (const urlKey of ["CORS_ORIGIN", "FRONTEND_APP_URL", "BACKEND_PUBLIC_URL"]) {
  const value = backendEnv[urlKey] ?? "";
  if (!value.startsWith("https://")) errors.push(`backend: ${urlKey} must use https://`);
  if (/localhost|127\.0\.0\.1|\*/i.test(value)) errors.push(`backend: ${urlKey} must not allow localhost, 127.0.0.1, or wildcard in production`);
}

if (backendEnv.TRUST_PROXY !== "true") {
  errors.push("backend: TRUST_PROXY must be true behind Railway/proxy deployment");
}

if (backendEnv.REDIS_REQUIRED !== "true") {
  errors.push("backend: REDIS_REQUIRED must be true in production");
}

if (backendEnv.REDIS_REQUIRED === "true" && !backendEnv.REDIS_URL) {
  errors.push("backend: REDIS_URL is required when REDIS_REQUIRED=true");
}

if (backendEnv.PROCESS_ROLE === "web" && backendEnv.QUEUE_WORKERS_ENABLED !== "false") {
  errors.push("backend: QUEUE_WORKERS_ENABLED must be false when PROCESS_ROLE=web");
}

if (backendEnv.PROCESS_ROLE === "all" && backendEnv.QUEUE_WORKERS_ENABLED !== "true") {
  errors.push("backend: QUEUE_WORKERS_ENABLED must be true when PROCESS_ROLE=all");
}

if (backendEnv.HEALTHCHECK_STRICT !== "true") {
  errors.push("backend: HEALTHCHECK_STRICT must be true in production");
}

if (Number(backendEnv.QUEUE_CONCURRENCY) < 1) {
  errors.push("backend: QUEUE_CONCURRENCY must be at least 1");
}

for (const key of recommendedIntegrations) {
  if (!backendEnv[key]) warnings.push(`backend: ${key} is not configured`);
}

for (const key of requiredIntegrations) {
  if (!backendEnv[key]) errors.push(`backend: ${key} is required for production integrations`);
}

if (errors.length) {
  console.error("Production environment validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  if (warnings.length) {
    console.error("\nWarnings:");
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log("Production environment validation passed.");
if (warnings.length) {
  console.warn("Warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

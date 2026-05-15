import "dotenv/config";
import { z } from "zod";

const envBoolean = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "on"].includes(normalized)) return true;
      if (["false", "0", "no", "off"].includes(normalized)) return false;
    }
    return value;
  }, z.boolean());

const nidusDomainString = (defaultValue: string) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    return value.replace(/nidusacademy\.in/g, "nidusacademy.com");
  }, z.string().default(defaultValue));

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(8080),
  CORS_ORIGIN: nidusDomainString("https://app.nidusacademy.com"),
  FRONTEND_APP_URL: nidusDomainString("https://app.nidusacademy.com").pipe(z.string().url()),
  BACKEND_PUBLIC_URL: nidusDomainString("https://api.nidusacademy.com").pipe(z.string().url()),
  APP_DOMAIN: nidusDomainString("app.nidusacademy.com"),
  API_DOMAIN: nidusDomainString("api.nidusacademy.com"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PROCESS_ROLE: z.enum(["web", "worker", "all"]).default("all"),
  TRUST_PROXY: envBoolean(true),
  COOKIE_DOMAIN: nidusDomainString(""),
  COOKIE_SECURE: envBoolean(false).optional(),
  CSRF_COOKIE_NAME: z.string().default("nidus_csrf"),
  AUTH_ACCESS_TOKEN_MINUTES: z.coerce.number().int().positive().default(15),
  AUTH_REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  AUTH_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(720),
  AUTH_VERIFY_TOKEN_MINUTES: z.coerce.number().int().positive().default(15),
  AUTH_RESET_TOKEN_MINUTES: z.coerce.number().int().positive().default(15),
  AUTH_MAX_LOGIN_FAILURES: z.coerce.number().int().positive().default(5),
  AUTH_LOCK_MINUTES: z.coerce.number().int().positive().default(15),
  REDIS_URL: z.string().default(""),
  REDIS_REQUIRED: envBoolean(false),
  QUEUE_WORKERS_ENABLED: envBoolean(true),
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(5),
  HEALTHCHECK_STRICT: envBoolean(true),
  BACKUP_BUCKET: z.string().default(""),
  MEDIA_BACKUP_PREFIX: z.string().default("nidus-media-backups"),
  SENTRY_DSN: z.string().default(""),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.05),
  FIREBASE_PROJECT_ID: z.string().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().default(""),
  FIREBASE_PRIVATE_KEY: z.string().default(""),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  AI_QUEUE_ENABLED: envBoolean(false),
  MAINTENANCE_MODE: envBoolean(false),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM_EMAIL: z.string().default("NIDUS <no-reply@nidus.local>"),
  OPENAI_API_KEY: z.string().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default("")
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;

  if (env.CORS_ORIGIN.includes("localhost") || env.CORS_ORIGIN.includes("*")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CORS_ORIGIN must be explicit production origin(s)",
      path: ["CORS_ORIGIN"]
    });
  }

  if (env.REDIS_REQUIRED && !env.REDIS_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "REDIS_URL is required when REDIS_REQUIRED=true",
      path: ["REDIS_URL"]
    });
  }

  if (!env.FRONTEND_APP_URL.includes(env.APP_DOMAIN)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "FRONTEND_APP_URL must point to APP_DOMAIN in production",
      path: ["FRONTEND_APP_URL"]
    });
  }

  if (!env.BACKEND_PUBLIC_URL.includes(env.API_DOMAIN)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "BACKEND_PUBLIC_URL must point to API_DOMAIN in production",
      path: ["BACKEND_PUBLIC_URL"]
    });
  }

  const requiredInProduction = [
    "OPENAI_API_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ] as const;

  requiredInProduction.forEach((key) => {
    if (!env[key]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} is required in production`,
        path: [key]
      });
    }
  });
});

export const env = envSchema.parse(process.env);

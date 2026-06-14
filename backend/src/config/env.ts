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

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(8080),
  CORS_ORIGIN: z.string().default("https://nidusacademy.in"),
  FRONTEND_APP_URL: z.string().url().default("https://nidusacademy.in"),
  BACKEND_PUBLIC_URL: z.string().url().default("https://nidusacademy.in"),
  APP_DOMAIN: z.string().default("nidusacademy.in"),
  API_DOMAIN: z.string().default("nidusacademy.in"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PROCESS_ROLE: z.enum(["web", "worker", "all"]).default("all"),
  TRUST_PROXY: envBoolean(true),
  AUTH_ACCESS_TOKEN_MINUTES: z.coerce.number().int().positive().default(15),
  AUTH_REFRESH_TOKEN_MINUTES: z.coerce.number().int().positive().default(10080),
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
  CLOUDINARY_API_SECRET: z.string().default(""),
  ENABLE_TEST_ACCOUNT: envBoolean(false),
  CAREER7_BASE_URL: z.string().default(""),
  CAREER7_NIDUS_TENANT_ID: z.string().default("nidus-top-rank"),
  CAREER7_BRIDGE_SECRET: z.string().default(""),
  CAREER7_ALLOWED_EXAMS: z.string().default("nda-army,nda-navy,nda-air-force,nda-naval-academy"),
  SALESBOOSTER_META_ACCESS_TOKEN: z.string().default(""),
  SALESBOOSTER_META_PAGE_ID: z.string().default(""),
  SALESBOOSTER_META_AD_ACCOUNT_ID: z.string().default(""),
  SALESBOOSTER_META_LEAD_FORM_ID: z.string().default(""),
  SALESBOOSTER_META_WEBHOOK_VERIFY_TOKEN: z.string().default("nidus-sales-booster-webhook"),
  SALESBOOSTER_META_DAILY_BUDGET_INR: z.coerce.number().int().positive().default(500),
  SALESBOOSTER_META_TARGET_COUNTRIES: z.string().default("IN"),
  SALESBOOSTER_INSTAGRAM_USER_ID: z.string().default(""),
  SALESBOOSTER_THREADS_ACCESS_TOKEN: z.string().default(""),
  SALESBOOSTER_THREADS_USER_ID: z.string().default(""),
  SALESBOOSTER_YOUTUBE_ACCESS_TOKEN: z.string().default(""),
  SALESBOOSTER_YOUTUBE_CHANNEL_ID: z.string().default(""),
  SALESBOOSTER_YOUTUBE_PRIVACY_STATUS: z.enum(["private", "unlisted", "public"]).default("unlisted"),
  SALESBOOSTER_WHATSAPP_ACCESS_TOKEN: z.string().default(""),
  SALESBOOSTER_WHATSAPP_PHONE_NUMBER_ID: z.string().default(""),
  SALESBOOSTER_WHATSAPP_TEMPLATE_NAME: z.string().default("nidus_campaign_followup"),
  SALESBOOSTER_WHATSAPP_TEMPLATE_NAMES: z.string().default("nidus_campaign_followup,nidus_admission_alert,nidus_counselling_reminder,nidus_assessment_followup"),
  SALESBOOSTER_WHATSAPP_TEMPLATE_LANGUAGE: z.string().default("en"),
  SALESBOOSTER_WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default("nidus-whatsapp-webhook"),
  SALESBOOSTER_DEFAULT_WHATSAPP_RECIPIENTS: z.string().default("")
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

  if (env.JWT_SECRET.length < 32) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "JWT_SECRET must be at least 32 characters",
      path: ["JWT_SECRET"]
    });
  }

  if (env.CAREER7_BASE_URL && !env.CAREER7_BRIDGE_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CAREER7_BRIDGE_SECRET is required when CAREER7_BASE_URL is configured",
      path: ["CAREER7_BRIDGE_SECRET"]
    });
  }
});

export const env = envSchema.parse(process.env);

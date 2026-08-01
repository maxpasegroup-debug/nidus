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
  NDIE_ENABLED: envBoolean(false),
  NDIE_SERVER_IMPORT_ENABLED: envBoolean(false),
  NDIE_BROWSER_EXTRACTION_FALLBACK: envBoolean(true),
  NDIE_REPLAY_ENABLED: envBoolean(false),
  NDIE_PIPELINE_VERSION: z.string().default("1.0-foundation"),
  NDIE_QUEUE_PROVIDER: z.enum(["database"]).default("database"),
  NDIE_QUEUE_WORKERS_ENABLED: envBoolean(false),
  NDIE_WORKER_CONCURRENCY: z.coerce.number().int().positive().max(10).default(1),
  NDIE_JOB_MAX_ATTEMPTS: z.coerce.number().int().positive().max(10).default(3),
  NDIE_JOB_RETRY_DELAY_MS: z.coerce.number().int().positive().default(30000),
  NDIE_JOB_BACKOFF_STRATEGY: z.enum(["FIXED", "EXPONENTIAL"]).default("EXPONENTIAL"),
  NDIE_JOB_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  NDIE_RENDER_REVIEW_DPI: z.coerce.number().int().positive().max(300).default(180),
  NDIE_RENDER_OCR_DPI: z.coerce.number().int().positive().max(400).default(300),
  NDIE_RENDER_PREVIEW_WIDTH: z.coerce.number().int().positive().default(1200),
  NDIE_RENDER_THUMBNAIL_WIDTH: z.coerce.number().int().positive().default(360),
  NDIE_RENDER_CHUNK_SIZE: z.coerce.number().int().positive().max(10).default(1),
  NDIE_RENDERER_PROVIDER: z.string().default("renderer.pdfjs"),
  NDIE_OCR_PROVIDER: z.string().default("ocr.tesseract"),
  NDIE_OCR_LANGUAGES: z.string().default("eng"),
  NDIE_OCR_CONFIDENCE_WARNING: z.coerce.number().min(0).max(1).default(0.75),
  NDIE_OCR_PREPROCESSING_ENABLED: envBoolean(true),
  NDIE_OCR_PREPROCESS_DENOISE: envBoolean(true),
  NDIE_OCR_PREPROCESS_CONTRAST: envBoolean(true),
  NDIE_OCR_PREPROCESS_BINARIZE: envBoolean(false),
  NDIE_OCR_MAX_IMAGE_PIXELS: z.coerce.number().int().positive().default(80_000_000),
  NDIE_LAYOUT_PROVIDER: z.string().default("layout.rule-based"),
  NDIE_LAYOUT_CONFIDENCE_WARNING: z.coerce.number().min(0).max(1).default(0.7),
  NDIE_FORMULA_PROVIDER: z.string().default("formula.rule-based"),
  NDIE_QUESTION_PROVIDER: z.string().default("question.rule-based"),
  NDIE_OPTION_PROVIDER: z.string().default("option.rule-based"),
  NDIE_ANSWER_KEY_PROVIDER: z.string().default("answer-key.rule-based"),
  NDIE_SOLUTION_PROVIDER: z.string().default("solution.rule-based"),
  NDIE_AI_PROVIDER: z.string().default("ai.rule-based"),
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
});

export const env = envSchema.parse(process.env);

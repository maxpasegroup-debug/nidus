import { env } from "../config/env.js";
import fs from "node:fs";
import path from "node:path";

type ConfigRow = {
  variable: string;
  purpose: string;
  required: "CORE" | "PRODUCTION" | "CONDITIONAL" | "OPTIONAL";
  exposure: "SERVER_ONLY" | "PUBLIC";
  configured: boolean;
  safeDefault: boolean;
  failsSafely: boolean;
};

const configured = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : value !== undefined;
const row = (variable: string, purpose: string, required: ConfigRow["required"], exposure: ConfigRow["exposure"], value: unknown, safeDefault: boolean, failsSafely: boolean): ConfigRow => ({
  variable,
  purpose,
  required,
  exposure,
  configured: configured(value),
  safeDefault,
  failsSafely
});

const matrix: ConfigRow[] = [
  row("DATABASE_URL", "PostgreSQL connection", "CORE", "SERVER_ONLY", env.DATABASE_URL, false, true),
  row("JWT_SECRET", "Legacy signing and application secret", "CORE", "SERVER_ONLY", env.JWT_SECRET, false, true),
  row("CORS_ORIGIN", "Allowed browser origins", "PRODUCTION", "SERVER_ONLY", env.CORS_ORIGIN, true, true),
  row("FRONTEND_APP_URL", "Canonical application URL", "PRODUCTION", "SERVER_ONLY", env.FRONTEND_APP_URL, true, true),
  row("BACKEND_PUBLIC_URL", "Canonical API URL", "PRODUCTION", "SERVER_ONLY", env.BACKEND_PUBLIC_URL, true, true),
  row("REDIS_URL", "Distributed cache, rate limits and BullMQ", "PRODUCTION", "SERVER_ONLY", env.REDIS_URL, false, true),
  row("SENTRY_DSN", "Server error telemetry", "OPTIONAL", "SERVER_ONLY", env.SENTRY_DSN, true, true),
  row("CLOUDINARY_CLOUD_NAME", "Authenticated media storage", "PRODUCTION", "SERVER_ONLY", env.CLOUDINARY_CLOUD_NAME, false, true),
  row("CLOUDINARY_API_KEY", "Cloudinary API identity", "PRODUCTION", "SERVER_ONLY", env.CLOUDINARY_API_KEY, false, true),
  row("CLOUDINARY_API_SECRET", "Cloudinary signing secret", "PRODUCTION", "SERVER_ONLY", env.CLOUDINARY_API_SECRET, false, true),
  row("RESEND_API_KEY", "Transactional email", "PRODUCTION", "SERVER_ONLY", env.RESEND_API_KEY, false, true),
  row("RAZORPAY_KEY_ID", "Payment order identity", "CONDITIONAL", "SERVER_ONLY", env.RAZORPAY_KEY_ID, false, true),
  row("RAZORPAY_KEY_SECRET", "Payment signature secret", "CONDITIONAL", "SERVER_ONLY", env.RAZORPAY_KEY_SECRET, false, true),
  row("RAZORPAY_WEBHOOK_SECRET", "Webhook verification", "CONDITIONAL", "SERVER_ONLY", env.RAZORPAY_WEBHOOK_SECRET, false, true),
  row("OPENAI_API_KEY", "AI reconstruction provider", "CONDITIONAL", "SERVER_ONLY", env.OPENAI_API_KEY, false, true),
  row("MATHPIX_APP_ID", "STEM extraction provider identity", "CONDITIONAL", "SERVER_ONLY", env.MATHPIX_APP_ID, false, true),
  row("MATHPIX_APP_KEY", "STEM extraction provider secret", "CONDITIONAL", "SERVER_ONLY", env.MATHPIX_APP_KEY, false, true),
  row("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "Document intelligence endpoint", "CONDITIONAL", "SERVER_ONLY", env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT, false, true),
  row("AZURE_DOCUMENT_INTELLIGENCE_KEY", "Document intelligence secret", "CONDITIONAL", "SERVER_ONLY", env.AZURE_DOCUMENT_INTELLIGENCE_KEY, false, true),
  row("FIREBASE_PROJECT_ID", "Push notifications", "CONDITIONAL", "SERVER_ONLY", env.FIREBASE_PROJECT_ID, false, true),
  row("SALESBOOSTER_WHATSAPP_ACCESS_TOKEN", "WhatsApp delivery", "CONDITIONAL", "SERVER_ONLY", env.SALESBOOSTER_WHATSAPP_ACCESS_TOKEN, false, true),
  row("BACKUP_BUCKET", "Off-host backup destination", "PRODUCTION", "SERVER_ONLY", env.BACKUP_BUCKET, false, true)
];

const publicSecretNames = matrix.filter((item) => item.exposure === "PUBLIC" && /SECRET|KEY|TOKEN|PASSWORD|DATABASE/i.test(item.variable));
if (publicSecretNames.length) throw new Error(`Secret variables marked public: ${publicSecretNames.map((item) => item.variable).join(", ")}`);

const report = {
  matrix,
  summary: {
    configured: matrix.filter((item) => item.configured).length,
    missingCore: matrix.filter((item) => item.required === "CORE" && !item.configured).map((item) => item.variable),
    missingProduction: matrix.filter((item) => item.required === "PRODUCTION" && !item.configured).map((item) => item.variable),
    publicSecrets: publicSecretNames.length
  }
};

const repositoryRoot = path.basename(process.cwd()).toLowerCase() === "backend" ? path.resolve(process.cwd(), "..") : process.cwd();
const outputDirectory = path.join(repositoryRoot, "docs");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "production-config-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TRUST_PROXY: z.coerce.boolean().default(true),
  REDIS_URL: z.string().default(""),
  MAINTENANCE_MODE: z.coerce.boolean().default(false),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  BREVO_API_KEY: z.string().default(""),
  BREVO_SENDER_EMAIL: z.string().email().default("no-reply@nidus.local"),
  OPENAI_API_KEY: z.string().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default("")
}).superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;

  const requiredInProduction = [
    "OPENAI_API_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "BREVO_API_KEY",
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

import * as Sentry from "@sentry/node";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let initialized = false;

export function initMonitoring() {
  if (!env.SENTRY_DSN || initialized) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE
  });
  initialized = true;
  logger.info("Sentry monitoring initialized");
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (initialized) Sentry.captureException(error, { extra: context });
  logger.error("Captured exception", {
    error: error instanceof Error ? error.message : String(error),
    ...context
  });
}

export const monitoring = Sentry;

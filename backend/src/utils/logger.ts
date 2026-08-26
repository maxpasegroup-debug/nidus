import pino from "pino";
import { env } from "../config/env.js";

export const pinoLogger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  base: { service: "nidus-backend", environment: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "request.headers.authorization",
      "request.headers.cookie",
      "headers.authorization",
      "headers.cookie",
      "authorization",
      "cookie",
      "password",
      "pin",
      "accessPin",
      "token",
      "refreshToken",
      "resetToken",
      "api_key",
      "apiKey",
      "apiSecret",
      "appKey",
      "privateKey"
    ],
    censor: "[REDACTED]"
  },
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, singleLine: true }
        }
});

type LogMeta = Record<string, unknown>;

export const logger = {
  info(message: string, meta?: LogMeta) {
    pinoLogger.info(meta ?? {}, message);
  },
  warn(message: string, meta?: LogMeta) {
    pinoLogger.warn(meta ?? {}, message);
  },
  error(message: string, meta?: LogMeta) {
    pinoLogger.error(meta ?? {}, message);
  },
  child(meta: LogMeta) {
    return pinoLogger.child(meta);
  }
};

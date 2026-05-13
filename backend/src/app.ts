import cors from "cors";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { pinoHttp } from "pino-http";
import type { Request } from "express";
import { initMonitoring } from "./config/monitoring.js";
import { env } from "./config/env.js";
import { apiRouter } from "./modules/index.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { responseFormatter } from "./middlewares/response-formatter.js";
import { apiRateLimiter, aiRateLimiter, authRateLimiter, csrfProtection, paymentsRateLimiter, suspiciousActivityLogger, uploadRateLimiter } from "./middlewares/security.js";
import { logger } from "./utils/logger.js";
import { requestContext } from "./middlewares/request-context.js";

const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const productionOrigins = [`https://${env.APP_DOMAIN}`, env.FRONTEND_APP_URL].filter(Boolean);
const allowedCorsOrigins = Array.from(new Set(corsOrigins.length > 0 ? corsOrigins : ["http://localhost:3000", ...productionOrigins]));
const connectSources = Array.from(new Set(["'self'", ...allowedCorsOrigins, env.BACKEND_PUBLIC_URL, "https://api.razorpay.com", "https://checkout.razorpay.com", "https://*.sentry.io"]));

export function createApp() {
  initMonitoring();
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY ? 1 : false);
  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(pinoHttp({
    logger: logger.child({ component: "http" }),
    genReqId: (req: Request) => req.requestId ?? "unknown",
    customProps: (req: Request) => ({ requestId: req.requestId })
  }));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy:
        env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
                mediaSrc: ["'self'", "https://res.cloudinary.com"],
                connectSrc: connectSources,
                frameSrc: ["'self'", "https://res.cloudinary.com", "https://api.razorpay.com", "https://checkout.razorpay.com"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"]
              }
            }
          : false
    })
  );
  app.use(
    cors({
      origin: allowedCorsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"]
    })
  );
  app.use(compression());
  app.use(
    morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
      stream: {
        write: (message) => logger.info("http", { message: message.trim() })
      }
    })
  );
  app.use("/api/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(responseFormatter);
  app.use(csrfProtection);
  app.use(suspiciousActivityLogger);
  app.use("/api/auth", authRateLimiter);
  app.use("/api/ai", aiRateLimiter);
  app.use("/api/payments", paymentsRateLimiter);
  app.use("/api/media/upload", uploadRateLimiter);
  app.use("/api/documents", uploadRateLimiter);
  app.use("/api", apiRateLimiter);

  app.use((_req, res, next) => {
    if (env.MAINTENANCE_MODE) {
      res.status(503).json({ message: "NIDUS is temporarily in maintenance mode" });
      return;
    }
    next();
  });

  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}

import cors from "cors";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import type { NextFunction, Request, Response } from "express";
import { initMonitoring } from "./config/monitoring.js";
import { env } from "./config/env.js";
import { apiRouter } from "./modules/index.js";
import { swaggerSpec } from "./swagger.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { responseFormatter } from "./middlewares/response-formatter.js";
import { apiRateLimiter, aiRateLimiter, authRateLimiter, paymentsRateLimiter, requireSafeContentType, suspiciousActivityLogger, uploadRateLimiter } from "./middlewares/security.js";
import { logger } from "./utils/logger.js";
import { requestContext } from "./middlewares/request-context.js";

const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const productionOrigins = [`https://${env.APP_DOMAIN}`, env.FRONTEND_APP_URL].filter(Boolean);
const allowedCorsOrigins = Array.from(new Set([...corsOrigins, ...productionOrigins, env.NODE_ENV === "production" ? undefined : "http://localhost:3000"].filter((origin): origin is string => Boolean(origin))));
const connectSources = Array.from(new Set(["'self'", ...allowedCorsOrigins, env.BACKEND_PUBLIC_URL, "https://api.razorpay.com", "https://checkout.razorpay.com", "https://*.sentry.io"]));

function apiRouteDebugger(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api")) {
    next();
    return;
  }

  const startedAt = Date.now();
  logger.info("API request started", { requestId: req.requestId, method: req.method, path: req.path });
  res.on("finish", () => {
    logger.info("API request finished", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });
  next();
}

type CreateAppOptions = {
  mountErrorHandler?: boolean;
};

export function createApp(options: CreateAppOptions = {}) {
  initMonitoring();
  const app = express();
  const mountErrorHandler = options.mountErrorHandler ?? true;

  app.set("trust proxy", env.TRUST_PROXY ? 1 : false);
  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(apiRouteDebugger);
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
      allowedHeaders: ["Content-Type", "Authorization"]
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
  app.use(requireSafeContentType);
  app.use(suspiciousActivityLogger);
  app.use(
    [
      "/api/auth/signup",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/forgot-password",
      "/api/auth/forgot-password/send-otp",
      "/api/auth/reset-password"
    ],
    authRateLimiter
  );
  app.use("/api/ai", aiRateLimiter);
  app.use("/api/payments", paymentsRateLimiter);
  app.use("/api/media/upload", uploadRateLimiter);
  app.use("/api/documents", uploadRateLimiter);
  app.use("/api", apiRateLimiter);

  if (env.NODE_ENV !== "production") {
    app.get("/", (_req, res) => {
    res.json({
      service: "nidus-backend",
      status: "ok",
      apiBase: "/api"
    });
    });
  }
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use((req, res, next) => {
    if (req.path === "/api/health") {
      next();
      return;
    }

    if (env.MAINTENANCE_MODE) {
      res.status(503).json({ message: "NIDUS is temporarily in maintenance mode" });
      return;
    }
    next();
  });

  app.use("/api", apiRouter);
  if (mountErrorHandler) app.use(errorHandler);

  return app;
}

export { errorHandler };

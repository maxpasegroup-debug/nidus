import cors from "cors";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { apiRouter } from "./modules/index.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { responseFormatter } from "./middlewares/response-formatter.js";
import { apiRateLimiter, authRateLimiter, csrfPlaceholder, suspiciousActivityLogger } from "./middlewares/security.js";
import { logger } from "./utils/logger.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY ? 1 : false);
  app.disable("x-powered-by");

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy:
        env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
                mediaSrc: ["'self'", "https://res.cloudinary.com"],
                connectSrc: ["'self'", env.CORS_ORIGIN],
                frameSrc: ["'self'", "https://res.cloudinary.com"]
              }
            }
          : false
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
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
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(responseFormatter);
  app.use(csrfPlaceholder);
  app.use(suspiciousActivityLogger);
  app.use("/api/auth", authRateLimiter);
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

import type { ErrorRequestHandler } from "express";
import { captureException } from "../config/monitoring.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof Error) {
    const statusCode =
      error.message.includes("Invalid credentials") ||
      error.message.includes("Invalid or expired OTP") ||
      error.message.includes("Invalid reset token")
        ? 401
        : error.message.includes("Forbidden") || error.message.includes("Permission denied")
          ? 403
          : error.message.includes("not found") || error.message.includes("not registered")
          ? 404
          : error.message.includes("already registered")
            ? 409
            : 400;

    logger.error("Request failed", {
      statusCode,
      method: req.method,
      path: req.path,
      ip: req.ip,
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack
    });
    captureException(error, { statusCode, method: req.method, path: req.path, requestId: req.requestId });

    res.status(statusCode).json({
      success: false,
      message: error.message,
      code: statusCode
    });
    return;
  }

  logger.error("Unknown request failure", { method: req.method, path: req.path, ip: req.ip });
  res.status(500).json({ success: false, message: "Internal server error", code: 500 });
};

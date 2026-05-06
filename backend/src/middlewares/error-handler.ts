import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof Error) {
    const statusCode =
      error.message.includes("Invalid credentials") ||
      error.message.includes("Invalid or expired OTP") ||
      error.message.includes("Invalid reset token")
        ? 401
        : error.message.includes("not found") || error.message.includes("not registered")
          ? 404
          : error.message.includes("already registered")
            ? 409
            : 400;

    res.status(statusCode).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "Internal server error" });
};

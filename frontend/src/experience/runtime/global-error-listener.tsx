"use client";

/**
 * Global runtime listener for recoverable Experience errors.
 * It records browser-level errors without throwing from the landing page.
 */
import { useEffect } from "react";
import { logExperienceError } from "./logger";

export function ExperienceGlobalErrorListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logExperienceError("global:error", "Unhandled browser error captured", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      logExperienceError("global:unhandled-rejection", "Unhandled promise rejection captured", {
        reason: event.reason instanceof Error ? event.reason.message : String(event.reason)
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

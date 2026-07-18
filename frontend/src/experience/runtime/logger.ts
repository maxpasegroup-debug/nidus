"use client";

/**
 * Runtime-safe logging helpers for the NIDUS Experience.
 * Warnings are deduped so recovery paths do not spam the browser console.
 */
const loggedKeys = new Set<string>();

export function logExperienceWarning(key: string, message: string, detail?: unknown) {
  if (loggedKeys.has(key)) return;
  loggedKeys.add(key);
  if (typeof console === "undefined") return;
  console.warn(`[NIDUS Experience] ${message}`, detail ?? "");
}

export function logExperienceError(key: string, message: string, detail?: unknown) {
  if (loggedKeys.has(key)) return;
  loggedKeys.add(key);
  if (typeof console === "undefined") return;
  console.error(`[NIDUS Experience] ${message}`, detail ?? "");
}

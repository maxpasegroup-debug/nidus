import type { Prisma } from "../../generated/prisma/client.js";

const emptyJsonObject = {};

export function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(value: unknown) {
  const valueText = text(value);
  return valueText || undefined;
}

export function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function optionalNumberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function jsonObject(value: unknown): Prisma.InputJsonValue {
  if (value && typeof value === "object") return value as Prisma.InputJsonValue;
  return emptyJsonObject;
}

export function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

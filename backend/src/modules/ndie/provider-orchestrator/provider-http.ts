import { env } from "../../../config/env.js";

export class NdieProviderError extends Error {
  readonly retryable: boolean;
  readonly providerId: string;

  constructor(providerId: string, message: string, retryable = true) {
    super(message);
    this.name = "NdieProviderError";
    this.providerId = providerId;
    this.retryable = retryable;
  }
}

export async function fetchProviderJson(
  providerId: string,
  url: string,
  init: RequestInit,
  timeoutMs = env.AI_REQUEST_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      throw new NdieProviderError(providerId, `${providerId} request failed with status ${response.status}.`, retryable);
    }
    return { response, payload };
  } catch (error) {
    if (error instanceof NdieProviderError) throw error;
    throw new NdieProviderError(providerId, `${providerId} is temporarily unavailable.`, true);
  } finally {
    clearTimeout(timeout);
  }
}

export async function imageSource(input: { imageUrl?: string | null; imageBuffer?: Buffer }) {
  // Mathpix limits JSON base64 images to 2 MB. Prefer the preserved asset URL
  // for larger pages so provider routing does not fail solely on payload size.
  if (input.imageBuffer?.length && input.imageBuffer.length <= 1_400_000) {
    return `data:image/png;base64,${input.imageBuffer.toString("base64")}`;
  }
  if (input.imageUrl) return input.imageUrl;
  if (input.imageBuffer?.length) {
    throw new NdieProviderError("provider.input", "The rendered page is too large for inline provider transfer.", false);
  }
  throw new NdieProviderError("provider.input", "A preserved rendered page image is required.", false);
}

export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function finite(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value: unknown, fallback = 0) {
  return Math.max(0, Math.min(1, finite(value, fallback)));
}

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../utils/logger.js";
import crypto from "node:crypto";
import type { Prisma } from "../../generated/prisma/client.js";

type JsonValue = Record<string, unknown>;

const MODEL = env.OPENAI_NDIE_MODEL;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

function extractOutputText(payload: unknown) {
  const data = payload as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  if (data.output_text) return data.output_text;
  return data.output?.flatMap((item) => item.content ?? []).map((content) => content.text).filter(Boolean).join("\n") ?? "";
}

export async function callOpenAIJson<T extends JsonValue>(instructions: string, input: string, fallback: T): Promise<T> {
  const promptHash = crypto.createHash("sha256").update(`${instructions}:${input}`).digest("hex");
  const cacheKey = `responses-json:${MODEL}:${promptHash}`;
  const cached = await prisma.aIResponseCache.findFirst({ where: { cacheKey, expiresAt: { gt: new Date() } } }).catch(() => null);
  if (cached) {
    await prisma.aIResponseCache.update({ where: { id: cached.id }, data: { hitCount: { increment: 1 } } }).catch(() => undefined);
    return cached.response as T;
  }
  if (!env.OPENAI_API_KEY) {
    if (env.NODE_ENV === "production") throw new Error("OPENAI_API_KEY is required for AI features in production");
    return fallback;
  }
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, instructions, input }),
      signal: controller.signal
    });
    if (!response.ok) return fallback;
    const raw = await response.json();
    const text = extractOutputText(raw);
    await prisma.aIRequestLog.create({
      data: {
        feature: "responses-json",
        model: MODEL,
        status: "SUCCESS",
        promptChars: instructions.length + input.length,
        outputChars: text.length,
        tokenUsage: (raw as { usage?: object }).usage,
        durationMs: Date.now() - started
      }
    }).catch(() => undefined);
    const clean = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(clean) as T;
    const cacheResponse = parsed as Prisma.InputJsonValue;
    await prisma.aIResponseCache.upsert({
      where: { cacheKey },
      update: { response: cacheResponse, expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
      create: { cacheKey, feature: "responses-json", promptHash, response: cacheResponse, expiresAt: new Date(Date.now() + CACHE_TTL_MS) }
    }).catch(() => undefined);
    return parsed;
  } catch (error) {
    logger.warn("OpenAI request failed; using fallback", { error: error instanceof Error ? error.message : "Unknown error" });
    await prisma.aIRequestLog.create({
      data: {
        feature: "responses-json",
        model: MODEL,
        status: "FAILED",
        promptChars: instructions.length + input.length,
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - started
      }
    }).catch(() => undefined);
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

export async function callOpenAIMultimodalJson<T extends JsonValue>(input: {
  instructions: string;
  text: string;
  imageUrls: string[];
  schemaName: string;
  schema: Record<string, unknown>;
  fallback: T;
}): Promise<T> {
  if (!env.OPENAI_ENABLED || !env.OPENAI_API_KEY) return input.fallback;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        instructions: input.instructions,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: input.text },
            ...input.imageUrls.slice(0, env.OPENAI_NDIE_MAX_PAGE_IMAGES).map((imageUrl) => ({ type: "input_image", image_url: imageUrl, detail: "high" }))
          ]
        }],
        text: { format: { type: "json_schema", name: input.schemaName, strict: true, schema: input.schema } }
      }),
      signal: controller.signal
    });
    if (!response.ok) return input.fallback;
    const payload = await response.json();
    const text = extractOutputText(payload);
    const parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim()) as T;
    return parsed;
  } catch (error) {
    logger.warn("OpenAI multimodal verification unavailable; retaining review-safe deterministic result", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return input.fallback;
  } finally {
    clearTimeout(timeout);
  }
}

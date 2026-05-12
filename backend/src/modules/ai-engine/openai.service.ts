import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../utils/logger.js";

type JsonValue = Record<string, unknown>;

const MODEL = "gpt-4.1-mini";

function extractOutputText(payload: unknown) {
  const data = payload as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  if (data.output_text) return data.output_text;
  return data.output?.flatMap((item) => item.content ?? []).map((content) => content.text).filter(Boolean).join("\n") ?? "";
}

export async function callOpenAIJson<T extends JsonValue>(instructions: string, input: string, fallback: T): Promise<T> {
  if (!env.OPENAI_API_KEY) return fallback;
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
    return JSON.parse(clean) as T;
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

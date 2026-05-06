import { env } from "../../config/env.js";

type JsonValue = Record<string, unknown>;

const MODEL = "gpt-4.1-mini";

function extractOutputText(payload: unknown) {
  const data = payload as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  if (data.output_text) return data.output_text;
  return data.output?.flatMap((item) => item.content ?? []).map((content) => content.text).filter(Boolean).join("\n") ?? "";
}

export async function callOpenAIJson<T extends JsonValue>(instructions: string, input: string, fallback: T): Promise<T> {
  if (!env.OPENAI_API_KEY) return fallback;
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, instructions, input })
    });
    if (!response.ok) return fallback;
    const text = extractOutputText(await response.json());
    const clean = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(clean) as T;
  } catch (_error) {
    return fallback;
  }
}

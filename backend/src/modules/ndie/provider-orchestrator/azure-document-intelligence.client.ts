import { env } from "../../../config/env.js";
import { NdieProviderError, fetchProviderJson } from "./provider-http.js";

export type AzureAnalyzeResult = Record<string, unknown> & {
  apiVersion?: string;
  modelId?: string;
  content?: string;
  pages?: Array<Record<string, unknown>>;
  paragraphs?: Array<Record<string, unknown>>;
  tables?: Array<Record<string, unknown>>;
  figures?: Array<Record<string, unknown>>;
};

export function azureDocumentIntelligenceConfigured() {
  return env.AZURE_DOCUMENT_INTELLIGENCE_ENABLED
    && Boolean(env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT && env.AZURE_DOCUMENT_INTELLIGENCE_KEY);
}

export async function callAzureLayout(imageUrl: string) {
  const endpoint = env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT.replace(/\/$/, "");
  const query = new URLSearchParams({
    "api-version": env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION,
    _overload: "analyzeDocument",
    outputContentFormat: "markdown",
    features: "ocr.highResolution,ocr.formula"
  });
  const { response } = await fetchProviderJson(
    "layout.azure",
    `${endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?${query}`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({ urlSource: imageUrl })
    }
  );
  const operationLocation = response.headers.get("operation-location");
  if (!operationLocation) throw new NdieProviderError("layout.azure", "Azure did not return an analysis operation.", true);

  const deadline = Date.now() + env.NDIE_JOB_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const { payload } = await fetchProviderJson("layout.azure", operationLocation, {
      headers: { "Ocp-Apim-Subscription-Key": env.AZURE_DOCUMENT_INTELLIGENCE_KEY }
    });
    const status = String(payload.status ?? "").toLowerCase();
    if (status === "succeeded") return payload.analyzeResult as AzureAnalyzeResult;
    if (status === "failed") throw new NdieProviderError("layout.azure", "Azure could not analyze this page.", false);
  }
  throw new NdieProviderError("layout.azure", "Azure document analysis timed out.", true);
}

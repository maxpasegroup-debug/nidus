import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

process.env.DATABASE_URL ??= "postgresql://verification:verification@localhost:5432/verification";
process.env.JWT_SECRET ??= "ndie-provider-verification-only-secret";

const { env } = await import("../config/env.js");
const { AzureLayoutProvider, MathpixFormulaProvider, MathpixOcrProvider, ProductionAiProvider, ProductionFormulaProvider, ProductionLayoutProvider, ProductionOcrProvider } = await import("../modules/ndie/provider-orchestrator/production-providers.js");

const imageArg = process.argv.find((value) => value.startsWith("--image="))?.slice("--image=".length);
const providers = [new ProductionOcrProvider(), new MathpixOcrProvider(), new ProductionLayoutProvider(), new AzureLayoutProvider(), new ProductionFormulaProvider(), new MathpixFormulaProvider(), new ProductionAiProvider()];

const result: Record<string, unknown> = {
  status: "READY_FOR_CREDENTIALLED_VERIFICATION",
  routingMode: env.NDIE_PROVIDER_ROUTING_MODE,
  providers: providers.map((provider) => provider.health()),
  credentials: {
    mathpix: Boolean(env.MATHPIX_ENABLED && env.MATHPIX_APP_ID && env.MATHPIX_APP_KEY),
    azureDocumentIntelligence: Boolean(env.AZURE_DOCUMENT_INTELLIGENCE_ENABLED && env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT && env.AZURE_DOCUMENT_INTELLIGENCE_KEY),
    openai: Boolean(env.OPENAI_ENABLED && env.OPENAI_API_KEY)
  },
  liveProbe: null
};

if (imageArg) {
  const imagePath = resolve(imageArg);
  if (!existsSync(imagePath)) throw new Error(`Verification image not found: ${imagePath}`);
  const imageBuffer = readFileSync(imagePath);
  const extension = extname(imagePath).toLowerCase();
  const ocr = new ProductionOcrProvider();
  result.liveProbe = await ocr.recognize({ importJobId: "provider-verification", pageId: "page-1", pageNumber: 1, imageBuffer, languageHints: ["eng"], preprocessing: { verification: true, extension } });
  result.status = "LIVE_PROBE_COMPLETED";
}

console.log(JSON.stringify(result, null, 2));

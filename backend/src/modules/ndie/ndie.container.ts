import { env } from "../../config/env.js";
import { RuleBasedAnswerKeyProvider } from "./answer-key-mapper/rule-based-answer-key.provider.js";
import { OpenAiValidatorProvider } from "./ai-validator/openai-ai.provider.js";
import { RuleBasedAiValidatorProvider } from "./ai-validator/rule-based-ai.provider.js";
import { NdieEventBus } from "./events/event-bus.js";
import { RuleBasedEvaluationProvider } from "./evaluation-intelligence/rule-based-evaluation.provider.js";
import { RuleBasedFormulaProvider } from "./formula-analyzer/rule-based-formula.provider.js";
import { RuleBasedLayoutProvider } from "./layout-analyzer/rule-based-layout.provider.js";
import { StubOcrProvider } from "./ocr/stub-ocr.provider.js";
import { TesseractOcrProvider } from "./ocr/tesseract-ocr.provider.js";
import { RuleBasedOptionProvider } from "./option-detector/rule-based-option.provider.js";
import { MetadataPdfRendererProvider } from "./pdf-renderer/metadata-pdf-renderer.provider.js";
import { PdfJsRendererProvider } from "./pdf-renderer/pdfjs-pdf-renderer.provider.js";
import { createDisabledProvider, ProviderRegistry } from "./providers/provider-registry.js";
import { RuleBasedQuestionProvider } from "./question-detector/rule-based-question.provider.js";
import { NdieFoundationService } from "./services/base-service.js";
import { RuleBasedSolutionProvider } from "./solution-mapper/rule-based-solution.provider.js";
import { RuleBasedVisualProvider } from "./visual-detector/rule-based-visual.provider.js";

const serviceDefinitions = [
  ["DocumentClassifier", "Classifies documents by type, subject risk, scan status, and required pipeline."],
  ["ImportCoordinator", "Orchestrates NDIE checkpoints without owning extraction logic."],
  ["SourceStorage", "Preserves original documents and generated source artifacts."],
  ["PdfRenderer", "Renders PDFs page-by-page for visual source-of-truth workflows."],
  ["DocxSemanticParser", "Parses DOCX semantic structure without exposing raw XML to teachers."],
  ["OCRService", "Runs OCR through replaceable providers."],
  ["LayoutAnalyzer", "Detects pages, regions, columns, reading order, and coordinates."],
  ["FormulaAnalyzer", "Detects and preserves formulas as LaTeX, MathML, or formula images."],
  ["DiagramDetector", "Finds diagrams and image-linked question regions."],
  ["TableDetector", "Finds tables and table images."],
  ["GraphDetector", "Finds charts, plotted graphs, and coordinate visuals."],
  ["QuestionDetector", "Creates question candidates from analyzed document elements."],
  ["OptionDetector", "Finds answer option blocks and option completeness."],
  ["AnswerKeyMapper", "Maps answer keys to question candidates."],
  ["SolutionMapper", "Maps worked solutions and explanations."],
  ["AIValidator", "Validates candidates through pluggable LLM providers."],
  ["ConfidenceEngine", "Aggregates provider confidence into review decisions."],
  ["QualityScoringEngine", "Scores import quality across OCR, formulas, layout, options, visuals, and AI."],
  ["ReviewEngine", "Manages teacher approve, reject, edit, and crop review decisions."],
  ["RevisionEngine", "Creates immutable revisions for every teacher edit."],
  ["Publisher", "Publishes approved candidates into the existing CBT-compatible question model."],
  ["ImportReplayService", "Reprocesses preserved source documents against newer providers."],
  ["AnalyticsService", "Reports import quality, provider runs, and review effort."]
] as const;

function buildRegistry() {
  const registry = new ProviderRegistry();
  registry.register(new StubOcrProvider());
  registry.register(new TesseractOcrProvider());
  registry.register(new PdfJsRendererProvider());
  registry.register(new MetadataPdfRendererProvider());
  registry.register(new RuleBasedLayoutProvider());
  registry.register(new RuleBasedFormulaProvider());
  registry.register(new RuleBasedVisualProvider());
  registry.register(new RuleBasedQuestionProvider());
  registry.register(new RuleBasedOptionProvider());
  registry.register(new RuleBasedEvaluationProvider());
  registry.register(new RuleBasedAnswerKeyProvider());
  registry.register(new RuleBasedSolutionProvider());
  registry.register(new RuleBasedAiValidatorProvider());
  registry.register(new OpenAiValidatorProvider());
  registry.register(createDisabledProvider("ocr.tesseract", "OCR", "Tesseract OCR"));
  registry.register(createDisabledProvider("ocr.google-vision", "OCR", "Google Vision OCR"));
  registry.register(createDisabledProvider("ocr.azure", "OCR", "Azure OCR"));
  registry.register(createDisabledProvider("layout.docling", "LAYOUT", "Docling Layout"));
  registry.register(createDisabledProvider("layout.azure", "LAYOUT", "Azure Layout"));
  registry.register(createDisabledProvider("formula.mathpix", "FORMULA", "Mathpix Formula"));
  registry.register(createDisabledProvider("formula.azure", "FORMULA", "Azure AI Formula"));
  registry.register(createDisabledProvider("formula.google-document-ai", "FORMULA", "Google Document AI Formula"));
  registry.register(createDisabledProvider("formula.pix2tex", "FORMULA", "Pix2Tex Formula"));
  registry.register(createDisabledProvider("formula.nougat", "FORMULA", "Nougat Formula"));
  registry.register(createDisabledProvider("formula.local-vision", "FORMULA", "Local Vision Formula"));
  registry.register(createDisabledProvider("formula.katex", "FORMULA", "KaTeX Formula Renderer"));
  registry.register(createDisabledProvider("visual.azure-vision", "VISUAL", "Azure Vision"));
  registry.register(createDisabledProvider("visual.google-vision", "VISUAL", "Google Vision"));
  registry.register(createDisabledProvider("visual.opencv", "VISUAL", "OpenCV"));
  registry.register(createDisabledProvider("visual.yolo", "VISUAL", "YOLO"));
  registry.register(createDisabledProvider("visual.detectron2", "VISUAL", "Detectron2"));
  registry.register(createDisabledProvider("visual.sam", "VISUAL", "Segment Anything"));
  registry.register(createDisabledProvider("visual.grounding-dino", "VISUAL", "Grounding DINO"));
  registry.register(createDisabledProvider("visual.florence", "VISUAL", "Florence"));
  registry.register(createDisabledProvider("visual.custom-vision", "VISUAL", "Custom Vision Models"));
  registry.register(createDisabledProvider("ai.openai", "AI", "OpenAI Validator"));
  registry.register(createDisabledProvider("ai.gemini", "AI", "Gemini Validator"));
  registry.register(createDisabledProvider("ai.claude", "AI", "Claude Validator"));
  registry.register(createDisabledProvider("renderer.pdf", "RENDERER", "Server PDF Renderer"));
  registry.register(createDisabledProvider("storage.source", "STORAGE", "NDIE Source Storage"));
  return registry;
}

export function createNdieContainer() {
  const enabled = env.NDIE_ENABLED;
  const services = serviceDefinitions.map(([name, responsibility]) => new NdieFoundationService(name, responsibility, enabled));
  const registry = buildRegistry();
  const eventBus = new NdieEventBus();
  services.forEach((service) => service.logReady());

  return {
    flags: {
      enabled,
      serverImportEnabled: env.NDIE_SERVER_IMPORT_ENABLED,
      browserExtractionFallback: env.NDIE_BROWSER_EXTRACTION_FALLBACK,
      replayEnabled: env.NDIE_REPLAY_ENABLED,
      pipelineVersion: env.NDIE_PIPELINE_VERSION
    },
    services,
    providerRegistry: registry,
    eventBus
  };
}

export type NdieContainer = ReturnType<typeof createNdieContainer>;

import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RuleBasedVisualProvider } from "../modules/ndie/visual-detector/rule-based-visual.provider.js";
import { assertNdieJobTransition } from "../modules/ndie/queue/state-machine.js";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("NDIE Production Gate 7 visual intelligence engine", () => {
  const contract = read("src/modules/ndie/contracts/visual-result.ts");
  const providers = read("src/modules/ndie/contracts/providers.ts");
  const provider = read("src/modules/ndie/visual-detector/rule-based-visual.provider.ts");
  const service = read("src/modules/ndie/visual-detector/visual-detector.service.ts");
  const worker = read("src/modules/ndie/worker/worker.service.ts");
  const queue = read("src/modules/ndie/queue/queue.service.ts");
  const stateMachine = read("src/modules/ndie/queue/state-machine.ts");
  const container = read("src/modules/ndie/ndie.container.ts");
  const ndieService = read("src/modules/ndie/ndie.service.ts");

  it("defines normalized educational visual JSON", () => {
    expect(contract).toContain("NdieNormalizedVisual");
    expect(contract).toContain("visualId");
    expect(contract).toContain("visualType");
    expect(contract).toContain("linkedOcrRegionIds");
    expect(contract).toContain("linkedFormulaRegionIds");
    expect(contract).toContain("table?");
    expect(contract).toContain("graph?");
    expect(contract).toContain("diagram?");
    expect(contract).toContain("diagnostics");
    expect(contract).toContain("checksum");
  });

  it("keeps visual providers swappable", () => {
    expect(providers).toContain("interface VisualProvider");
    expect(providers).toContain("NdieVisualResult");
    expect(container).toContain("visual.azure-vision");
    expect(container).toContain("visual.google-vision");
    expect(container).toContain("visual.opencv");
    expect(container).toContain("visual.yolo");
    expect(container).toContain("visual.detectron2");
    expect(container).toContain("visual.sam");
    expect(container).toContain("visual.grounding-dino");
    expect(container).toContain("visual.florence");
    expect(provider).toContain('readonly id = "visual.rule-based"');
  });

  it("classifies educational visuals and links nearby OCR/formula regions", async () => {
    const visualProvider = new RuleBasedVisualProvider();
    const result = await visualProvider.detect({
      importJobId: "visual-import",
      pageId: "visual-page",
      pageNumber: 1,
      pageImageUrl: "https://example.test/page.png",
      layoutJson: { normalized: { schemaVersion: "ndie-layout-v1" } },
      ocrJson: { normalized: { schemaVersion: "ndie-ocr-v1" } },
      formulaElements: [
        { id: "f1", elementType: "FORMULA", text: "F = ma", coordinates: { page: 1, x: 0.1, y: 0.2, width: 0.2, height: 0.05, rotation: 0 }, readingOrder: 1, confidence: 0.9 }
      ],
      layoutElements: [
        { id: "t1", elementType: "TABLE_AREA", text: "Table 1: Force | Mass | Acceleration", coordinates: { page: 1, x: 0.1, y: 0.18, width: 0.5, height: 0.08, rotation: 0 }, readingOrder: 1, confidence: 0.86 },
        { id: "g1", elementType: "GRAPH_AREA", text: "Line graph with x-axis y-axis origin and trend line", coordinates: { page: 1, x: 0.55, y: 0.25, width: 0.3, height: 0.22, rotation: 0 }, readingOrder: 2, confidence: 0.88 },
        { id: "d1", elementType: "DIAGRAM_AREA", text: "Circuit diagram with battery resistor and switch", coordinates: { page: 1, x: 0.12, y: 0.55, width: 0.35, height: 0.18, rotation: 0 }, readingOrder: 3, confidence: 0.84 }
      ]
    });

    expect(result.visuals.length).toBe(3);
    expect(result.visuals.map((visual) => visual.visualType)).toEqual(expect.arrayContaining(["TABLE", "LINE_GRAPH", "CIRCUIT_DIAGRAM"]));
    expect(result.visuals.find((visual) => visual.visualType === "TABLE")?.table?.columns).toBeGreaterThanOrEqual(3);
    expect(result.visuals.find((visual) => visual.visualType === "LINE_GRAPH")?.graph?.axes.length).toBeGreaterThanOrEqual(2);
    expect(result.visuals.find((visual) => visual.visualType === "CIRCUIT_DIAGRAM")?.diagram?.circuitSymbols).toEqual(expect.arrayContaining(["battery", "resistor", "switch"]));
    expect(result.visuals[0].linkedFormulaRegionIds).toContain("f1");
    expect(result.visuals[0].crop?.status).toBe("REFERENCE_ONLY");
  });

  it("detects visual diagnostics for weak visuals", async () => {
    const visualProvider = new RuleBasedVisualProvider();
    const result = await visualProvider.detect({
      importJobId: "visual-import",
      pageId: "visual-page",
      pageNumber: 1,
      layoutElements: [
        { id: "low", elementType: "DIAGRAM_AREA", text: "diagram", coordinates: { page: 1, x: 0.1, y: 0.2, width: 0.02, height: 0.02, rotation: 0 }, readingOrder: 1, confidence: 0.4 }
      ],
      formulaElements: []
    });
    expect(result.visuals[0].diagnostics.issues).toEqual(expect.arrayContaining(["LOW_CONFIDENCE", "MISSING_LABELS", "LOW_RESOLUTION", "UNREADABLE_DIAGRAM"]));
  });

  it("integrates visual intelligence with queue and worker checkpoints only", () => {
    expect(worker).toContain('job.stage === "VISUAL"');
    expect(worker).toContain("ndieVisualDetectorService.detectImport");
    expect(queue).toContain("enqueueVisual");
    expect(stateMachine).toContain('"VISUAL_RUNNING"');
    expect(stateMachine).toContain('"VISUAL_COMPLETED"');
    expect(stateMachine).toContain('"READY_FOR_QUESTION_ENGINE"');
    expect(() => assertNdieJobTransition("READY_FOR_VISUAL_ENGINE", "VISUAL_RUNNING")).not.toThrow();
    expect(() => assertNdieJobTransition("VISUAL_RUNNING", "READY_FOR_QUESTION_ENGINE")).toThrow();
    expect(() => assertNdieJobTransition("VISUAL_COMPLETED", "READY_FOR_QUESTION_ENGINE")).not.toThrow();
  });

  it("adds visual health and persistence metrics", () => {
    expect(service).toContain("visualCount");
    expect(service).toContain("tableCount");
    expect(service).toContain("graphCount");
    expect(service).toContain("diagramCount");
    expect(service).toContain("averageConfidence");
    expect(service).toContain("VISUAL_COMPLETED");
    expect(service).toContain("READY_FOR_QUESTION_ENGINE");
    expect(ndieService).toContain("ndieVisualDetectorService.health()");
  });
});

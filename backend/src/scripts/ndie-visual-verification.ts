import { RuleBasedVisualProvider } from "../modules/ndie/visual-detector/rule-based-visual.provider.js";

const corpus = [
  { id: "table", elementType: "TABLE_AREA", text: "Table 1: Speed | Time | Distance", expected: "TABLE" },
  { id: "bar", elementType: "GRAPH_AREA", text: "Bar graph showing marks by batch", expected: "BAR_CHART" },
  { id: "pie", elementType: "GRAPH_AREA", text: "Pie chart with sectors for subjects", expected: "PIE_CHART" },
  { id: "line", elementType: "GRAPH_AREA", text: "Line graph with x-axis y-axis origin and trend line", expected: "LINE_GRAPH" },
  { id: "scatter", elementType: "GRAPH_AREA", text: "Scatter plot of height and weight", expected: "SCATTER_PLOT" },
  { id: "coordinate", elementType: "GRAPH_AREA", text: "Coordinate plane with x-axis y-axis and origin", expected: "COORDINATE_PLANE" },
  { id: "triangle", elementType: "DIAGRAM_AREA", text: "Triangle ABC with angle A and circle", expected: "TRIANGLE" },
  { id: "circuit", elementType: "DIAGRAM_AREA", text: "Circuit diagram with battery resistor switch", expected: "CIRCUIT_DIAGRAM" },
  { id: "bio", elementType: "DIAGRAM_AREA", text: "Biology diagram of cell and organ", expected: "BIOLOGY_DIAGRAM" },
  { id: "chem", elementType: "DIAGRAM_AREA", text: "Chemical structure of benzene molecule", expected: "CHEMISTRY_STRUCTURE" },
  { id: "map", elementType: "DIAGRAM_AREA", text: "Map of India with river and mountain", expected: "MAP" },
  { id: "photo", elementType: "DIAGRAM_AREA", text: "Photograph of apparatus", expected: "PHOTOGRAPH" }
];

async function main() {
  const provider = new RuleBasedVisualProvider();
  const result = await provider.detect({
    importJobId: "visual-verification-import",
    pageId: "visual-verification-page",
    pageNumber: 1,
    pageImageUrl: "https://example.test/page.png",
    layoutJson: { normalized: { schemaVersion: "ndie-layout-v1" } },
    ocrJson: { normalized: { schemaVersion: "ndie-ocr-v1" } },
    formulaElements: [
      { id: "formula-1", elementType: "FORMULA", text: "F = ma", coordinates: { page: 1, x: 0.08, y: 0.08, width: 0.2, height: 0.04, rotation: 0 }, readingOrder: 1, confidence: 0.9 }
    ],
    layoutElements: corpus.map((item, index) => ({
      id: item.id,
      elementType: item.elementType,
      text: item.text,
      coordinates: { page: 1, x: index % 2 ? 0.52 : 0.08, y: 0.1 + Math.floor(index / 2) * 0.12, width: 0.34, height: 0.08, rotation: 0 },
      readingOrder: index + 1,
      confidence: 0.88
    }))
  });

  for (const item of corpus) {
    const visual = result.visuals.find((candidate) => candidate.sourceRegionId === item.id);
    if (!visual) throw new Error(`Missing visual for ${item.id}`);
    if (visual.visualType !== item.expected) throw new Error(`Expected ${item.id} to be ${item.expected}, got ${visual.visualType}`);
    if (!visual.checksum) throw new Error(`Missing checksum for ${item.id}`);
    if (!visual.coordinates.polygon.length) throw new Error(`Missing polygon for ${item.id}`);
  }

  console.log(JSON.stringify({
    status: "PASS",
    provider: provider.id,
    schemaVersion: result.visuals[0]?.schemaVersion,
    visualCount: result.visuals.length,
    averageConfidence: result.confidence,
    visualTypes: result.raw.visualTypes,
    diagnostics: result.visuals.flatMap((visual) => visual.diagnostics.issues)
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: "FAIL",
    message: error instanceof Error ? error.message : "Visual verification failed"
  }));
  process.exit(1);
});

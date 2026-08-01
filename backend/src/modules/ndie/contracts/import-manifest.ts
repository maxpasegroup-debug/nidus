export type NdieImportManifest = {
  source: string;
  sourceKind: string;
  fileType: string;
  fileSize: number;
  pages: number | null;
  questionsDetected: number;
  formulaCount: number;
  tables: number;
  diagrams: number;
  graphs: number;
  ocrConfidence: number | null;
  quality: "Not Scored" | "Excellent" | "Good" | "Review Required" | "Poor" | "Blocked";
  pipelineVersion: string;
  checkpoints: Array<{
    name: string;
    status: string;
  }>;
};

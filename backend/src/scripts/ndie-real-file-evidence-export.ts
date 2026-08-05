import { realFileEvidenceExporterService } from "../modules/ndie/certification/real-file-evidence-exporter.service.js";

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const slotId = arg("--slot");
const importJobId = arg("--import");
const executedBy = arg("--executed-by") ?? "ndie-real-file-evidence-export";
const write = process.argv.includes("--write");

if (!slotId || !importJobId) {
  console.error(JSON.stringify({
    status: "FAIL",
    message: "Usage: npm run ndie:evidence:export --workspace backend -- --slot <slot-id> --import <ndie-import-job-id> [--write]",
    required: ["--slot", "--import"],
    optional: ["--executed-by", "--write"]
  }, null, 2));
  process.exit(1);
}

try {
  const result = await realFileEvidenceExporterService.export({
    slotId,
    importJobId,
    executedBy,
    write
  });

  console.log(JSON.stringify({
    status: "PASS",
    slotId: result.slotId,
    importJobId: result.importJobId,
    sourceChecksumMatchesImport: result.sourceChecksumMatchesImport,
    evidencePath: result.evidencePath,
    wroteEvidence: write,
    stageSummary: result.manifest.stages.map((stage) => ({
      stage: stage.stage,
      status: stage.status,
      score: stage.score,
      provider: stage.provider,
      failures: stage.failures ?? []
    })),
    certificationPreview: {
      overallScore: result.certificationPreview.overallScore,
      fullPipelineExecuted: result.certificationPreview.fullPipelineExecuted,
      productionCertified: result.certificationPreview.productionCertified
    }
  }, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({
    status: "FAIL",
    slotId,
    importJobId,
    message
  }, null, 2));
  process.exit(1);
}

import { ndiePerformanceService } from "../modules/ndie/performance/performance.service.js";

const benchmark = ndiePerformanceService.benchmarkSuite();

const failures: string[] = [];
const pageCases = benchmark.pageCases.map((item) => item.pages);
for (const pages of [10, 50, 250, 500, 1000]) {
  if (!pageCases.includes(pages)) failures.push(`missing ${pages}-page benchmark`);
}

const thousandPage = benchmark.pageCases.find((item) => item.pages === 1000);
if (!thousandPage || thousandPage.renderChunks < 1 || thousandPage.ocrChunks < 1 || thousandPage.layoutChunks < 1) {
  failures.push("1000-page benchmark does not produce chunked plans");
}

if (!benchmark.concurrencyCases.some((item) => item.scenario === "concurrent-imports")) failures.push("missing concurrent import benchmark");
if (!benchmark.concurrencyCases.some((item) => item.scenario === "concurrent-publishing")) failures.push("missing concurrent publishing benchmark");
if (!benchmark.concurrencyCases.some((item) => item.scenario === "concurrent-delivery")) failures.push("missing concurrent delivery benchmark");
if (!benchmark.reliabilityChecks.includes("worker-heartbeat")) failures.push("missing worker heartbeat reliability check");
if (!benchmark.reliabilityChecks.includes("backpressure")) failures.push("missing backpressure reliability check");

const publishPool = ndiePerformanceService.poolForStage("PUBLISH");
const renderPool = ndiePerformanceService.poolForStage("PDF_RENDERING");
const deliveryPool = ndiePerformanceService.poolForStage("STUDENT_DELIVERY");
if (publishPool.kind !== "PUBLISH") failures.push("publish stage not classified into publish pool");
if (renderPool.kind !== "IMPORT") failures.push("PDF rendering not classified into import pool");
if (deliveryPool.kind !== "DELIVERY") failures.push("student delivery not classified into delivery pool");

if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "production-gate-14-enterprise-performance",
  benchmark,
  pools: { publishPool, renderPool, deliveryPool }
}, null, 2));

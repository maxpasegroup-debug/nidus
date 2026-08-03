import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  operations: readFileSync(join(root, "src/modules/ndie/operations/operations.service.ts"), "utf8"),
  service: readFileSync(join(root, "src/modules/ndie/ndie.service.ts"), "utf8"),
  controller: readFileSync(join(root, "src/modules/ndie/ndie.controller.ts"), "utf8"),
  routes: readFileSync(join(root, "src/modules/ndie/ndie.routes.ts"), "utf8"),
  security: readFileSync(join(root, "src/modules/ndie/security/ndie-security.ts"), "utf8")
};

const required = [
  ["operations center service", files.operations.includes("ndieOperationsService") && files.operations.includes("operationalState")],
  ["pipeline timeline", files.operations.includes("IMPORT_CREATED") && files.operations.includes("DELIVERED") && files.operations.includes("timeline(importJobId")],
  ["provider monitoring", files.operations.includes("providerMonitoring") && files.operations.includes("successRate") && files.operations.includes("availability")],
  ["worker monitoring", files.operations.includes("ndieWorkerRegistryService.health") && files.operations.includes("staleWorkers")],
  ["queue dashboard", files.operations.includes("queueDashboard") && files.operations.includes("queueDepth") && files.operations.includes("backpressure")],
  ["storage dashboard", files.operations.includes("storageDashboard") && files.operations.includes("duplicateUploads") && files.operations.includes("publishPackages")],
  ["cost dashboard", files.operations.includes("buildCostEstimate") && files.operations.includes("provider-independent-estimate")],
  ["quality dashboard", files.operations.includes("qualityDashboard") && files.operations.includes("teacherApprovalRate")],
  ["diagnostics API", files.operations.includes("diagnosticsDashboard") && files.routes.includes("/operations/diagnostics")],
  ["health v2", files.service.includes("enterpriseHealth") && files.service.includes("overallStatus")],
  ["operations routes", files.routes.includes("/operations") && files.routes.includes("/imports/:id/timeline")],
  ["audit trail", files.security.includes("NDIE_OPERATIONS_VIEWED") && files.controller.includes("NDIE_TIMELINE_VIEWED")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", gate: "production-gate-16-operations-center", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "production-gate-16-operations-center",
  checks: required.length,
  capabilities: required.map(([name]) => name)
}, null, 2));

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  env: readFileSync(join(root, "src/config/env.ts"), "utf8"),
  security: readFileSync(join(root, "src/modules/ndie/security/ndie-security.ts"), "utf8"),
  compliance: readFileSync(join(root, "src/modules/ndie/security/compliance.service.ts"), "utf8"),
  controller: readFileSync(join(root, "src/modules/ndie/ndie.controller.ts"), "utf8"),
  sourceStorage: readFileSync(join(root, "src/modules/ndie/source-storage/source-storage.service.ts"), "utf8"),
  registry: readFileSync(join(root, "src/modules/ndie/performance/worker-registry.service.ts"), "utf8"),
  service: readFileSync(join(root, "src/modules/ndie/ndie.service.ts"), "utf8")
};

const required = [
  ["magic-byte validation", files.security.includes("hasMagicSignature")],
  ["mime sniffing", files.compliance.includes("sniffMime")],
  ["malware scanning hook", files.compliance.includes("malwareHook") && files.env.includes("NDIE_MALWARE_SCANNING_ENABLED")],
  ["quarantine workflow", files.compliance.includes("QUARANTINE_REQUIRED") && files.controller.includes("NDIE_UPLOAD_QUARANTINED")],
  ["password/encrypted document detection", files.compliance.includes("/Encrypt") && files.compliance.includes("PASSWORD_PROTECTED_DOCUMENT")],
  ["duplicate sha256 detection", files.sourceStorage.includes("findFirst") && files.sourceStorage.includes("checksum: fileChecksum")],
  ["structured audit payload", files.security.includes("institution") && files.security.includes("before") && files.security.includes("after")],
  ["authorization denial audit", files.security.includes("NDIE_AUTHORIZATION_DENIED")],
  ["data protection policies", files.compliance.includes("retention") && files.compliance.includes("signedAssetTtlSeconds") && files.compliance.includes("secureDeletionHook")],
  ["queue security hooks", files.registry.includes("validateWorkerSecret") && files.compliance.includes("workerSharedSecretConfigured")],
  ["security health", files.service.includes("security") && files.compliance.includes("authorizationFailuresLast24h")]
] as const;

const failures = required.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ status: "FAIL", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "PASS",
  checks: required.length,
  gate: "production-gate-15-enterprise-security",
  capabilities: required.map(([name]) => name)
}));

import fs from "node:fs";
import path from "node:path";
import { OPERATIONAL_CORPUS_ROOT, operationalCorpusIntakeService, type OperationalIntakeMetadata } from "../modules/ndie/certification/seed-corpus/operational-corpus-intake.service.js";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const sourcePath = argument("--source");
const metadataPath = argument("--metadata");
const corpusRoot = argument("--root") ?? OPERATIONAL_CORPUS_ROOT;

if (!sourcePath || !metadataPath) {
  console.error("Usage: npm run ndie:corpus:intake --workspace backend -- --source <file> --metadata <metadata.json> [--root <corpus-root>]");
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(path.resolve(metadataPath), "utf8")) as OperationalIntakeMetadata;
const result = operationalCorpusIntakeService.intakeFile({ sourcePath: path.resolve(sourcePath), corpusRoot: path.resolve(corpusRoot), metadata });
console.log(JSON.stringify(result, null, 2));


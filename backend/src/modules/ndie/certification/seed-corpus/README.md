# Universal Exam Engine Seed Corpus

Target: 150 real, licensed, anonymized and expert-verified documents; preferred initial size: 300.

## Partitions

- `development/`: 60%. Expected annotations may be available to developers and tests.
- `validation/`: 20%. Used for model and provider selection, never training.
- `blind/`: 20%. Expected outputs are held away from processing logic and ordinary development access.

Operational source intake is stored under `real-documents/`. The older partition README directories describe policy only and contain no evidence.

Each real document requires a `manifest.json` conforming to `seedCorpusManifestSchema`, an immutable source file, and an expert annotation conforming to `expertAnnotationSchema`. Expected outputs for blind documents must be stored in a separately controlled evaluation location and supplied only to the certification runner after processing.

Existing `TEXT_FIXTURE` samples under `certification/golden-corpus` are development fixtures. They are useful for deterministic regression tests but are not real evidence and must never increase a production-readiness score.

## Curation workflow

1. Establish ownership, consent or a public licence.
2. Remove personal data that is not required for examination fidelity.
3. Store the immutable source and SHA-256 checksum.
4. Assign the document to exactly one partition before annotation.
5. Have two qualified subject experts annotate independently.
6. Measure agreement and adjudicate disagreements.
7. Seal blind expected outputs outside processing inputs.
8. Run the complete pipeline and retain artifacts for every metric.

No placeholder document, fabricated annotation or synthetic snapshot may be marked `REAL`.

Operational evidence classes are `REAL_SOURCE`, `DEVELOPMENT_FIXTURE`, `SYNTHETIC_FIXTURE`, `TEXT_FIXTURE` and `UNKNOWN_SOURCE`. Only `REAL_SOURCE` can contribute to evidence, and only after provenance, rights and privacy verification.

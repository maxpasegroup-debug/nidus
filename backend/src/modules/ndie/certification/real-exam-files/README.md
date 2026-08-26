# NDIE Real STEM Certification Fixtures

Phase 1 is the real-paper baseline for making NIDUS internationally competitive in Mathematics, Physics and Chemistry.

This folder must contain real examination documents only. Do not add synthetic PDFs, mock OCR output, or screenshots made only for tests. A paper is not production certified until the real source file exists and every upload-to-CBT stage has executable evidence.

Place each real source document in its slot folder as `source.<extension>`.

If you are not sure which slot a file belongs to, first place it in `../real-exam-intake/` and run:

```bash
npm run test:ndie-real-intake --workspace backend
```

## Required Phase 1 Slots

Mathematics:

- `nda-maths-pdf/source.pdf`
- `jee-maths-pdf/source.pdf`
- `university-maths-paper/source.pdf` or `source.docx`
- `mobile-camera-maths-paper/source.jpg` or `source.png` or `source.webp`
- `docx-office-math/source.docx`
- `handwritten-stem-paper/source.pdf` or `source.jpg` or `source.png` or `source.webp`
- `olympiad-maths-paper/source.pdf` or `source.docx`

Physics:

- `jee-physics-pdf/source.pdf`
- `neet-physics-pdf/source.pdf`
- `graph-heavy-physics-math-paper/source.pdf` or `source.jpg` or `source.png` or `source.webp`

Chemistry:

- `neet-chemistry-pdf/source.pdf`
- `university-chemistry-paper/source.pdf` or `source.docx`
- `scanned-chemistry-paper/source.pdf` or `source.jpg` or `source.png` or `source.webp`
- `organic-chemistry-structure-paper/source.pdf` or `source.jpg` or `source.png` or `source.webp`
- `table-heavy-chemistry-paper/source.pdf` or `source.docx` or `source.jpg` or `source.png` or `source.webp`

Answer and solution evidence:

- `answer-key-pdf/source.pdf`
- `solution-book-pdf/source.pdf`

## What Phase 1 Must Prove

The expanded baseline requires real evidence for:

- formulas
- chemistry structures
- physics diagrams
- numerical answers
- handwritten scans
- multi-page questions
- mixed question types
- diagrams
- graphs
- tables
- scanned documents
- mobile camera photos
- DOCX Office Math
- answer keys
- solutions

The baseline runner will not mark a paper production certified unless the real source exists and every upload-to-CBT stage has executable evidence.

## Evidence Manifest

After a real paper is processed, add `evidence.json` in the same slot folder.

Example:

```json
{
  "manifestVersion": "real-file-pipeline-evidence-v1",
  "slotId": "nda-maths-pdf",
  "pipelineRunId": "ndie-import-job-id-or-ci-run-id",
  "sourceSha256": "sha256-of-source.pdf",
  "executedAt": "2026-08-04T00:00:00.000Z",
  "executedBy": "certification-runner",
  "stages": [
    {
      "stage": "UPLOAD",
      "status": "PASS",
      "score": 1,
      "notes": "Source preserved and import job created."
    },
    {
      "stage": "RENDER",
      "status": "PASS",
      "score": 1,
      "artifacts": [
        {
          "kind": "review-page-image",
          "path": "outputs/render/page-1.png",
          "sha256": "sha256-of-page-1.png"
        }
      ]
    }
  ]
}
```

Allowed stages:

- `UPLOAD`
- `RENDER`
- `OCR`
- `LAYOUT`
- `FORMULA`
- `VISUAL`
- `AI_RECONSTRUCTION`
- `TEACHER_REVIEW`
- `PUBLISH`
- `CBT_RENDER`

Artifact paths must stay inside the fixture slot folder. Absolute paths and traversal paths are rejected.

## Export Evidence From A Real NDIE Import

After uploading and processing a real paper through NDIE, export evidence from the stored import job:

```bash
npm run ndie:evidence:export --workspace backend -- --slot nda-maths-pdf --import <ndie-import-job-id> --write
```

The exporter reads NDIE database records and generates `evidence.json` for the selected slot. It does not run OCR, rendering, publishing, or CBT itself. It only certifies what the system actually stored.

## Verification Commands

```bash
npm run test:ndie-real-file-baseline --workspace backend
npm run test:ndie-real-evidence-readiness --workspace backend
npm run test:ndie-real-certification-report --workspace backend
npm run test:ndie-real-launch-gate --workspace backend
```

The launch gate requires:

- executive real certification decision is `GO`
- production readiness is at least `95%`
- Mathematics readiness is at least `95%`
- Chemistry readiness is at least `95%`
- every upload-to-CBT stage is certified
- every STEM subject is certified
- every mandatory STEM proof area is certified
- no P0/P1 blockers remain
## Phase 8 Evidence Readiness Planner

Run the evidence readiness planner:

```bash
npm run test:ndie-real-evidence-readiness --workspace backend
```

The planner gives an ordered, slot-by-slot action list:

- which required real paper is missing
- which evidence file must be generated
- which upload-to-CBT stages are incomplete
- which Mathematics, Chemistry, Physics or STEM proof area is still unproven
- the exact evidence export command to run after a real NDIE import

Use this before rerunning the launch gate. It is the practical checklist for moving from `PRODUCTION_BLOCKED` to `INTERNATIONAL_CERTIFIED`.

## Phase 9 Certification Dossier

Run the audit-ready certification dossier:

```bash
npm run test:ndie-real-certification-dossier --workspace backend
```

The dossier packages the launch status into one management/QA report:

- executive GO/NO-GO decision
- production, Mathematics, Physics, Chemistry and international readiness scores
- version provenance for the certification report, launch gate and evidence planner
- explicit launch-decision reasons
- intelligence-engine readiness and focused recovery commands
- source-file, checksum, slot and pipeline-stage evidence totals
- blocker register
- upload-to-CBT stage evidence status
- subject readiness
- STEM feature proof
- real-file slot checklist
- ordered next actions
- certification sign-off eligibility for Academic QA, Engineering QA, Security and Release Authority
- a SHA-256 dossier fingerprint plus a human-readable Markdown report

The dossier is intentionally honest. If the real corpus is empty or incomplete, it reports `PRODUCTION_BLOCKED`, preserves the P0 blocker list and keeps sign-off `BLOCKED`. A dossier becomes `READY_FOR_SIGNATURE` only after both the real certification decision and launch gate pass.

The JSON dossier can be checked programmatically with `realCertificationDossierService.verify(report)`. Any change to its decision, evidence, scores, engine state, blockers or slot results invalidates `dossierSha256`.

## Phase 10 Release Pack

Run the tamper-evident release pack:

```bash
npm run test:ndie-real-release-pack --workspace backend
```

The release pack bundles and checksums:

- `real-file-baseline.json`
- `real-certification-report.json`
- `real-launch-gate.json`
- `real-evidence-readiness.json`
- `real-certification-dossier.json`
- `real-certification-dossier.md`

Phase 10 uses canonical JSON and SHA-256 to verify both metadata and payloads. The pack records a unique snapshot ID, all component versions, evidence readiness, the Phase 9 dossier checksum and an explicit certification state. `realReleasePackService.verify(pack)` recomputes the manifest and package hashes; `realReleasePackService.verifyBundle(bundle)` also re-hashes every artifact body and rejects missing, duplicate, unsafe or modified files.

A failed launch gate always produces `PRELAUNCH_FAILED`, keeps sign-off blocked and cannot request an immutable production archive. Only an internationally certified `GO` pack may become `READY_FOR_IMMUTABLE_ARCHIVE`.

Each artifact receives a SHA-256 hash, and the package receives both a manifest hash and a package hash.

If the launch gate is still failing, the pack is only a failed pre-launch dossier. It must not be archived as production certification evidence.

When the launch gate passes, archive the release pack before production launch so the exact certified state can be audited later.

## Phase 11 Release Archive

Run the archive verifier in dry-run mode:

```bash
npm run test:ndie-real-release-archive --workspace backend
```

Dry-run mode verifies the archive plan and hashes but does not write files.

Write an archive only when you intentionally want a launch-review artifact:

```bash
npm run test:ndie-real-release-archive --workspace backend -- --write
```

Write mode creates a timestamped directory under:

```text
backend/src/modules/ndie/certification/real-release-archives/
```

The archive includes:

- every release-pack artifact
- `release-pack-manifest.json`
- checksum-bound `archive-seal.json`
- SHA-256 hashes for every file
- package and manifest hashes

Phase 11 verifies the complete Phase 10 bundle before planning or writing an archive. Write mode uses a private staging directory, verifies every staged payload and atomically renames the completed directory into place. Existing archive IDs cannot be overwritten, and unsafe archive IDs or roots are rejected.

Use `realReleaseArchiveService.verifyWrittenArchive(report)` to detect post-write modification. If the launch gate is failing, the archive is verified only as a failed pre-launch dossier. Production certification requires a written, sealed archive from a `READY_FOR_IMMUTABLE_ARCHIVE` pack with sign-off ready.

## Phase 12 Certification Suite

Run the full real certification suite:

```bash
npm run test:ndie-real-certification-suite --workspace backend
```

The suite checks the full release chain:

1. real file intake
2. real file baseline
3. executive certification report
4. real launch gate
5. evidence readiness planner
6. certification dossier
7. release pack
8. release archive dry run

The suite returns:

- suite status
- assessment or release mode
- `BLOCKED`, `READY_TO_ARCHIVE` or `CERTIFIED_FOR_LAUNCH` state
- release scope
- failed steps
- detailed blocking failures
- dossier, release-pack and archive integrity results
- shared release snapshot and package checksums
- next required action
- next required command
- readiness to write the production archive
- production launch safety decision

Assessment mode never authorizes launch because it only plans the archive. After every certification prerequisite passes, run release mode deliberately:

```bash
npm run test:ndie-real-certification-suite --workspace backend -- --write-archive
```

Release mode uses the same verified Phase 10 bundle for its Phase 11 archive. It refuses to write when prerequisites fail. `safeToBeginProductionLaunch` becomes true only after the physical archive is atomically written, sealed and reverified. If it is false, do not launch as production certified.

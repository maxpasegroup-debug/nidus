# NDIE Real File Certification Fixtures

Phase 1 requires actual examination files before any production score can be trusted.

Place each real source document in its slot folder as `source.<extension>`.

If you are not sure which slot a file belongs to, first place it in `../real-exam-intake/` and run:

```bash
npm run test:ndie-real-intake --workspace backend
```

Required slots:

- `nda-maths-pdf/source.pdf`
- `jee-maths-pdf/source.pdf`
- `neet-chemistry-pdf/source.pdf`
- `scanned-chemistry-paper/source.pdf` or `source.jpg` or `source.png` or `source.webp`
- `mobile-camera-maths-paper/source.jpg` or `source.png` or `source.webp`
- `docx-office-math/source.docx`
- `answer-key-pdf/source.pdf`
- `solution-book-pdf/source.pdf`
- `organic-chemistry-structure-paper/source.pdf` or `source.jpg` or `source.png` or `source.webp`
- `graph-heavy-physics-math-paper/source.pdf` or `source.jpg` or `source.png` or `source.webp`

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

## Real Certification Report

Run the executive GO/NO-GO report:

```bash
npm run test:ndie-real-certification-report --workspace backend
```

The report summarizes:

- production readiness
- Mathematics readiness
- Chemistry readiness
- international competitiveness
- stage readiness
- subject blockers
- STEM proof gaps
- launch recommendation

## Phase 7 Real Launch Gate

Run the advisory launch gate:

```bash
npm run test:ndie-real-launch-gate --workspace backend
```

The advisory gate always exits successfully when the gate logic itself is healthy, but the payload can still show `gateStatus: "FAIL"` while real certification evidence is incomplete.

Run the enforced production gate:

```bash
npm run test:ndie-real-launch-gate --workspace backend -- --enforce
```

The enforced gate exits with code `1` when launch certification is blocked.

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

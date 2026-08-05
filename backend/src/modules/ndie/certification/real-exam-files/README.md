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

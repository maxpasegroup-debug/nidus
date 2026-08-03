# Golden Corpus Authoring Guide

Every corpus document must live under:

`golden-corpus/<Subject>/<Exam>/<document-id>/`

Required files:

- `manifest.json`
- `original/source.txt`, `original/source.pdf`, or `original/source.docx`
- `snapshots/ocr.expected.json`
- `snapshots/layout.expected.json`
- `snapshots/formula.expected.json`
- `snapshots/visual.expected.json`
- `snapshots/assessment.expected.json`
- `snapshots/evaluation.expected.json`
- `snapshots/validation.expected.json`
- `snapshots/publishing-package.expected.json`

Never mark a document as certified unless the original document file is present and all expected snapshots are authored.

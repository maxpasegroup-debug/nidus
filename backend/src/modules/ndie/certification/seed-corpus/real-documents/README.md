# Operational Real Corpus

This directory receives legitimate examination sources through `operationalCorpusIntakeService`.

Layout:

```text
real-documents/<partition>/<subject>/<document-id>/
  original/source.<extension>
  manifest.json
  provenance.json
  checksum.sha256
  annotations/
  evidence/
```

The original source is copied byte-for-byte, verified by SHA-256 and made read-only. Intake never changes source content. New records start blocked with `ANNOTATION_PENDING`; missing rights default to `RIGHTS_BASIS_PENDING`, privacy defaults to `NOT_REVIEWED`, and provenance must be independently verified before a record is valid.

Only `REAL_SOURCE` records with verified provenance, confirmed rights, completed privacy review, two independent expert payloads, measured agreement and completed adjudication may become certification ready.


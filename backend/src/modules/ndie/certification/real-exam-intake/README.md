# NDIE Real Exam Intake

Drop candidate real examination files here before assigning them to certification slots.

Run:

```bash
npm run test:ndie-real-intake --workspace backend
```

The intake scanner checks:

- PDF/DOCX/JPG/PNG/WEBP/TXT format support
- magic-byte signature safety
- extension/signature mismatch
- SHA-256 duplicate detection
- likely certification slot matches
- unsupported or manually reviewed files

This folder is only an intake area. Files are not production certified here. After review, place the chosen file into the correct slot under `real-exam-files/<slot-id>/source.<ext>`.

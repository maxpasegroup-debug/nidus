# NIDUS Universal Exam Engine Specification

Version: `nuee-spec-1.0.0`

This directory is the locked machine-readable Phase 1 contract for the final 18-phase Universal Exam Engine program. It defines supported document classes, subjects, assessment structures, scientific content, evidence requirements, safety behavior and certification thresholds.

The specification does not certify current engine capability. A declared capability becomes `CERTIFIED` only after real blind evidence passes the corresponding metric gate. Uncertain but reconstructable content is `CONTROLLED`; unsafe, corrupt or unsupported content is `BLOCKED`.

## Non-negotiable behavior

- Preserve the immutable original and its checksum.
- Ground every academic object in page-level source evidence.
- Never silently lose or invent academic content.
- Require teacher authority for controlled content.
- Publish only complete, integrity-checked packages.
- Keep all schema, pipeline, provider, revision and package versions traceable.

## Compatibility

This specification extends the existing NDIE contracts. It does not replace the current CBT, review, publishing or academy APIs in Phase 1.


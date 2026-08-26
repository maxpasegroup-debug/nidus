# Phase 1 Existing Capability Audit and Gap Matrix

Audit date: 2026-08-18

| Capability | Current implementation | Specification requirement | Gap | Future phase |
|---|---|---|---|---|
| Source preservation | `source-storage`, SHA-256, storage metadata and security controls | Immutable source for every accepted format with rights and provenance | Core exists; DOC, TIFF, HEIC and corpus-level rights evidence are incomplete | 2 |
| Document classification | Classifier contracts, page understanding and STEM classification | Mixed-document, source-role, subject and format classification | Mostly rule-based; real accuracy unproved | 2, 4 |
| PDF rendering | PDF.js renderer produces review/OCR/preview/thumbnail assets | Lossless, rotation-safe, large-document page assets | Good foundation; real 1–1000 page evidence absent | 2, 3 |
| DOC/DOCX | MIME intake and source preservation | Native DOC/DOCX, Office Math, drawings and relationship preservation | No certified native semantic pipeline; legacy DOC unsupported | 2 |
| OCR | Tesseract structured OCR, preprocessing and confidence | Multi-provider printed, handwriting and multilingual OCR | Default is Tesseract; provider ensemble and real thresholds absent | 3, 4 |
| Layout | Normalized layout contract and rule-based analyzer | Accurate mixed columns, reading order and multi-page relationships | Rule-based primary provider; real layout accuracy absent | 5 |
| Formula | Formula contract, rule-based analyzer, perfection service, LaTeX/MathML representations | Image-to-semantic mathematics with token evidence and equivalence | Detection is text-signal led; visual formula recognition unproved | 6 |
| Mathematics semantics | STEM intelligence, formula perfection and question integrity services | Full school, entrance, Olympiad, university and engineering mathematics | Heuristic coverage exists; blind semantic accuracy absent | 7 |
| Physics semantics | STEM intelligence and educational visual semantics | Units, dimensions, equations, circuits, graphs and scientific relationships | Partial semantic labels; no certified dimensional or diagram reasoning | 8 |
| Chemistry notation | Chemistry structure service and formula/visual contracts | Reactions, structures, mechanisms, charges and scientific notation | Rule-based inference; molecular and mechanism fidelity unproved | 9 |
| Visual understanding | Visual contract, detector and educational visual semantics | Required diagrams, graphs, tables, labels, axes and links preserved | Detection exists; pixel/object accuracy and orphan prevention unproved | 10 |
| Question detection | Assessment contract, rule-based question and option providers | Multimodal universal assessment structure without MCQ assumptions | Regex/rule-based primary detector; unknown/future type missing in legacy contract | 11 |
| Answer mapping | Answer-key mapper and normalized evaluation contracts | All key formats, versions, tolerances and evidence-grounded links | Rule-based mapper; real mapping precision absent | 12 |
| Solution mapping | Solution mapper, rubric and relationship contracts | Multi-question solutions, derivations, diagrams and model answers | Structural support exists; semantic mapping unproved | 12 |
| Validation | Rule-based and OpenAI validator providers, confidence and readiness contracts | Independent grounded verification and calibrated uncertainty | Provider path exists; hallucination and calibration evidence absent | 13 |
| AI reconstruction | Provider orchestrator and AI reconstruction fallback | Evidence-only multimodal reconstruction with independent verification | Conditional OpenAI path; default remains rule-based | 13 |
| Universal exam builder | Draft builder preserves incomplete questions and review flags | Professional complete draft with no silent loss | Useful safety layer; end-to-end fidelity unproved | 13 |
| Teacher review | Review engine, immutable decisions and review workspace | Source-aligned formula, visual and answer verification | Strong base; expert usability and defect-detection evidence absent | 14 |
| Publishing | Approved-only rich package, integrity blockers and versions | Exact approved content and 100% package integrity | Safety controls exist; real package parity unproved | 15 |
| Student delivery | Rich student-delivery service and CBT compatibility | Responsive, accessible, exact rendering of approved packages | Existing support; visual parity and accessibility certification absent | 15 |
| Evaluation | Evaluation model and CBT scoring paths | Complete deterministic and moderated evaluation types | Many future response modes are contracts only | 16 |
| Provider orchestration | Registry, routing, fallback, voting, health, cost | Evidence-driven subject/document routing | Architecture exists; real comparative benchmarks absent | 4, 13, 17 |
| Certification | Golden corpus, real-file baseline, launch gate, dossier and release archive | Progressive real corpus with blind certification and locked targets | Framework is strong; 0 real source documents currently present | 1, 17, 18 |
| Operations/security/scale | Queue, workers, security, performance and operations modules | International-scale audited reliability and isolation | Architecture/tests exist; independent real load/security proof absent | 17 |

The matrix records implementation presence, not production certification. Existing development fixtures are explicitly excluded from real-evidence counts.


# Synthetic Universal Exam Intelligence Benchmark

Version: `nuee-synthetic-universal-benchmark-1.0.0`

This deterministic benchmark generates structured development and stress-test cases. It is not a real-document corpus, does not contain copied examination papers, and must never be classified as `REAL_SOURCE`.

Hard boundaries:

- Every case has `sourceType = SYNTHETIC_BENCHMARK`.
- Every case has `certificationContribution = false`.
- Cases never contribute to the Phase 1 real-document count or certification status.
- Expected outputs are original generated development expectations, not expert evidence.
- Failure cases require preservation and review or blocking; academic invention is forbidden.

The generator creates cases in memory. It does not create thousands of fake document files or manifests.


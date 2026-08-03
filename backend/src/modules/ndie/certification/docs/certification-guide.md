# NDIE Certification Guide

Gate 17 turns NDIE correctness into a measurable release gate.

## Certification Inputs

- Golden corpus fixture catalogue
- Expected OCR, layout, formula, visual, question, answer, solution, confidence targets
- Current NDIE output snapshots
- Previous certified output snapshots
- Benchmark workload plans

## Certification Outputs

- Overall NDIE accuracy
- Subsystem accuracy scores
- Regression summary
- Benchmark summary
- Known failures
- PASS or FAIL recommendation

## Release Rule

A production release must not proceed when a subsystem drops below threshold, a regression exceeds the allowed delta, rendering failures exceed the threshold, or security tests fail.

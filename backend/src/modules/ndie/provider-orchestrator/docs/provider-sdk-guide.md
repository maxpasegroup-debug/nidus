# NDIE Provider SDK Guide

Every provider must declare:

- name
- version
- supported languages
- supported document types
- formula capability
- table capability
- diagram capability
- question capability
- estimated latency
- estimated cost
- health
- availability

Providers must return normalized NDIE contracts and must not leak vendor-specific response shapes into downstream stages.

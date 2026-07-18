# 20 - Open Questions

## Product Questions

1. Which modules are live with real users today?
2. Which roles actively use the platform daily?
3. What are the top five workflows currently causing staff confusion?
4. Which academy programs are active: NDA, CDS, AFCAT, Agniveer, SSB, AISSEE, RIMC, others?
5. What is the exact admission journey followed by the office today?
6. Which reports does the Director actually check every morning?
7. What WhatsApp messages are essential, and which can become daily summaries?
8. What should AI be allowed to decide automatically vs only recommend?

## Data Questions

1. How many production users, leads, students, payments, tests, attempts, and media files exist?
2. Are branch and institute columns populated consistently?
3. Which status values exist in production for key string status fields?
4. Are there duplicate student/parent/lead identities?
5. Are payment records reconciled with Razorpay exports?
6. What is the retention policy for AI logs and psychometric reports?

## Security Questions

1. Are production cookies `httpOnly`, `secure`, and `sameSite` configured correctly?
2. Are all admin/default passwords changed in production?
3. Are public lead endpoints protected by rate limits and spam controls in production?
4. Is document malware scanning required?
5. Are user exports/downloads audited?
6. Who can view psychometric reports?

## Operations Questions

1. Is Redis required in production or optional?
2. Are queue workers deployed as separate Railway workers?
3. Are backups tested by restore, not only created?
4. Where are Sentry alerts routed?
5. What is the rollback process after a bad schema migration?
6. What are the target uptime and recovery objectives?

## Engineering Questions

1. Should generated Prisma files remain committed under `backend/src/generated/prisma`?
2. Which routes are legacy and which are current?
3. Which frontend pages are unused but retained for deep links?
4. Which dashboard components are too large for safe maintenance?
5. What is the test coverage target before each modernization phase?
6. Which APIs are public contracts that must not change?

## Unknowns From Static Audit

This audit did not execute the full application or inspect production data. Unknown until runtime/staging validation:

- Actual DB query performance.
- Actual user journey friction.
- Real production environment values.
- Real queue reliability.
- Real webhook delivery behavior.
- Real Cloudinary/media volume.
- Real AI usage/cost.
- Real WhatsApp provider status and template approvals.


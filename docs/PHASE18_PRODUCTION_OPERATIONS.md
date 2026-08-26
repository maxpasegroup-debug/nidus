# Phase 18 Production Operations

Status: NOT READY FOR PRODUCTION

## Startup

1. Validate production environment with `node scripts/validate-production-env.mjs`.
2. Confirm PostgreSQL, authenticated Redis, media, notification, and telemetry dependencies.
3. Run Prisma migration status before deployment.
4. Start the backend only after strict health checks pass.

## Health Checks

Check `/api/health` and dependency readiness. Redis, workers, media, notifications, and backups are **NOT VERIFIED - ENVIRONMENT** in the current workspace.

## Migrations and Recovery

Take an off-host PostgreSQL backup before migration. Apply migrations with `npx prisma migrate deploy`, then run Prisma validation and the production smoke test. Prisma down-migrations are not available; rollback requires restoring the pre-migration backup.

## Redis and Workers

Redis/BullMQ recovery procedures are **NOT VERIFIED - ENVIRONMENT**. Required validation: queue enqueue/consume, bounded retry, worker restart, Redis restart, stale-job recovery, and duplicate-job safety.

## Media and Notifications

Cloudinary, Resend, Firebase, and WhatsApp operations are **NOT VERIFIED - ENVIRONMENT**. Provider failures must remain visible and must never be reported as successful delivery.

## Incident Response

Preserve request IDs and job IDs, inspect structured logs, stop publishing when a dependency is degraded, and keep unresolved academic content in review. Do not bypass tenant authorization or teacher approval.

## Safe Limits

- Validated student concurrency: 25.
- 50 users: previously passed but should remain controlled.
- 100 users: high login latency.
- 250 users: previously failed.
- STEM ingestion requires mandatory teacher verification.

## Go-Live Gate

Production launch remains blocked until Redis/workers, media, notifications, off-host backup/restore, telemetry, and production-like performance are validated.

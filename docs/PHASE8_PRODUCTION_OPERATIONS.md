# NIDUS Phase 8 Production Operations

## Release order

1. Put the application into maintenance mode.
2. Confirm a recent off-host PostgreSQL backup and Cloudinary export.
3. Restore both backups into an isolated database/storage target and run smoke checks.
4. Record migration status and inspect pending SQL for destructive operations.
5. Run `npm run validate:production-env`.
6. Deploy with `npx prisma migrate deploy --config backend/prisma.config.ts`.
7. Run database, queue, integration, security, and application smoke readiness commands.
8. Disable maintenance mode only after Director, teacher, student, exam, result, and media smoke checks pass.

## Recovery

Prisma migrations do not provide down migrations. Production rollback is restore-based:

1. Stop application and worker writes.
2. Preserve failed-deployment logs and the current database.
3. Restore the verified pre-release PostgreSQL dump into a clean database.
4. Restore the matching media manifest/export.
5. repoint the service to the restored database through deployment secrets.
6. Invalidate active sessions when authentication or authorization data may have changed.
7. Run database readiness, security readiness, queue readiness, and end-to-end smoke checks.
8. Reopen traffic only after record counts and exam/result integrity reconcile.

## Minimum schedule

- Daily encrypted database backup, retained for 14 days.
- Weekly backup, retained for 8 weeks.
- Monthly backup, retained for 12 months.
- Daily Cloudinary asset manifest/export matched to database references.
- Monthly restore rehearsal and a restore rehearsal before every destructive migration.
- Pre-release backup immediately before migration.

Backups are not considered operational until a restore has completed successfully and its checksum, record counts, and smoke tests have been recorded.

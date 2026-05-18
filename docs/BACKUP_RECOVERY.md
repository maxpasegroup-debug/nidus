# NIDUS Backup And Recovery

## Database Backup

Run from a trusted Railway shell or CI job:

```bash
npm run backup:database --workspace backend
pg_dump "$DATABASE_URL" --format=custom --file="nidus-YYYY-MM-DD.dump"
```

Store dumps outside Railway in the configured backup target. Keep daily backups for 14 days, weekly backups for 8 weeks, and monthly backups for 12 months.

To execute a local dump from a trusted environment with `pg_dump` installed:

```bash
npm run backup:database --workspace backend -- --execute
```

## Database Restore

1. Pause public traffic or enable `MAINTENANCE_MODE=true`.
2. Restore into a fresh PostgreSQL instance first.
3. Run `pg_restore --clean --if-exists --dbname="$DATABASE_URL" nidus-YYYY-MM-DD.dump`.
4. Run `npx prisma migrate status --config backend/prisma.config.ts`.
5. Run `npm run db:readiness --workspace backend`.
6. Run backend smoke checks before moving traffic.

## Media Backup

Run:

```bash
npm run backup:media --workspace backend
```

Export Cloudinary assets and metadata manifests by date into `MEDIA_BACKUP_PREFIX`.

## Queue Recovery

Use `/admin-center/operations` to inspect failed jobs. Requeue only idempotent jobs: PDF generation, notifications, reminders, Daily Intelligence publishing. Payment webhook jobs must be reconciled against Razorpay before retry.

## Rollback

Use Railway deployment rollback for web, worker, and frontend together. After rollback, run `npm run ops:smoke --workspace backend` with production URLs.

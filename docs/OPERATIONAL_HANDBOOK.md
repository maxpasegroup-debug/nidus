# NIDUS Operational Handbook

## Daily Checks

- Open `/admin-center/operations`.
- Confirm runtime is `READY`.
- Confirm database and Redis are connected.
- Review failed jobs, AI failures, payment failures, and audit event volume.
- Confirm Daily Intelligence generation and PDF jobs are moving.

## Production Smoke

Run after each deploy:

```bash
SMOKE_API_URL=https://nidusacademy.in SMOKE_APP_URL=https://nidusacademy.in npm run ops:smoke --workspace backend
```

## Deployment Flow

1. Run `npx prisma validate --config backend/prisma.config.ts`.
2. Run backend and frontend builds.
3. Deploy backend web.
4. Deploy backend worker.
5. Deploy frontend.
6. Run migrations.
7. Run production smoke.

## Incident Response

- Enable `MAINTENANCE_MODE=true` for user-impacting incidents.
- Stop worker service if queues are amplifying failures.
- For payments, reconcile with Razorpay before changing local transaction states.
- For AI failures, reduce worker concurrency and inspect Sentry events.

## Observability

- Sentry captures backend exceptions when `SENTRY_DSN` is present.
- Pino logs include request ids.
- Queue job outcomes are written to `QueueJobLog`.
- Admin operations shows platform usage, payments, AI, CBT, queues, and infrastructure health.

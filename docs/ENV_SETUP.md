# NIDUS Production Environment Checklist

## Core

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_APP_URL=https://nidusacademy.in`
- `BACKEND_PUBLIC_URL=https://nidusacademy.in`
- `APP_DOMAIN=nidusacademy.in`
- `API_DOMAIN=nidusacademy.in`
- `CORS_ORIGIN=https://nidusacademy.in`
- `TRUST_PROXY=true`

## Infrastructure

- `REDIS_URL`
- `REDIS_REQUIRED=true`
- `PROCESS_ROLE=web` for API service
- `PROCESS_ROLE=worker` for worker service
- `QUEUE_WORKERS_ENABLED=false` on API service
- `QUEUE_WORKERS_ENABLED=true` on worker service
- `QUEUE_CONCURRENCY=5`
- `HEALTHCHECK_STRICT=true`

## Integrations

- `OPENAI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE=0.05`

## Frontend

- `NEXT_PUBLIC_API_URL=`. Leave blank so `nidusacademy.in` calls its own same-origin `/api` route.
- `NEXT_PUBLIC_ENABLE_PWA=false`. Keep this false until authentication is stable in production.

## Backups

- `BACKUP_BUCKET`
- `MEDIA_BACKUP_PREFIX=nidus-media-backups`

## Validation

Before deployment, run:

```bash
npm run validate:production-env
```

The validator fails when core production values are unsafe or inconsistent, and warns when integration services like Redis, Sentry, Resend, Cloudinary, or Razorpay are still unset.

After Redis is configured, run:

```bash
npm run queue:readiness
```

After provider keys are configured, run:

```bash
npm run integrations:readiness
```

Use `npm run integrations:readiness --workspace backend -- --network` from a trusted environment when you want to verify live Cloudinary API connectivity.

Before opening traffic, run:

```bash
npm run security:readiness
```

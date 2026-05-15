# NIDUS Production Environment Checklist

## Core

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_APP_URL=https://app.nidusacademy.com`
- `BACKEND_PUBLIC_URL=https://api.nidusacademy.com`
- `APP_DOMAIN=app.nidusacademy.com`
- `API_DOMAIN=api.nidusacademy.com`
- `CORS_ORIGIN=https://app.nidusacademy.com`
- `TRUST_PROXY=true`

## Infrastructure

- `REDIS_URL`
- `REDIS_REQUIRED=true`
- `PROCESS_ROLE=web` for API service
- `PROCESS_ROLE=worker` for worker service
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

- `NEXT_PUBLIC_API_URL=https://api.nidusacademy.com`

## Backups

- `BACKUP_BUCKET`
- `MEDIA_BACKUP_PREFIX=nidus-media-backups`

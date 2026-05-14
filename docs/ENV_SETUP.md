# NIDUS Production Environment Checklist

## Core

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_APP_URL=https://app.nidusacademy.in`
- `BACKEND_PUBLIC_URL=https://api.nidusacademy.in`
- `APP_DOMAIN=app.nidusacademy.in`
- `API_DOMAIN=api.nidusacademy.in`
- `CORS_ORIGIN=https://app.nidusacademy.in`
- `COOKIE_DOMAIN=.nidusacademy.in`
- `COOKIE_SECURE=true`
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

- `NEXT_PUBLIC_API_URL=https://api.nidusacademy.in/api`
- `NEXT_PUBLIC_CSRF_COOKIE_NAME=nidus_csrf`

## Backups

- `BACKUP_BUCKET`
- `MEDIA_BACKUP_PREFIX=nidus-media-backups`

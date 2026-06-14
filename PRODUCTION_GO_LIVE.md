# NIDUS Production Go-Live Runbook

## DNS

- `nidusacademy.in` must be added as the custom domain on the single Railway service named `NIDUS`.
- Registrar DNS should use CNAME records pointing to the Railway-provided domains.
- Verify with:
  - `nslookup nidusacademy.in`
  - `curl https://nidusacademy.in/api/health`

## Railway

Service health check: `/api/health`

Backend required variables:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_APP_URL=https://nidusacademy.in`
- `CORS_ORIGIN=https://nidusacademy.in`
- `API_DOMAIN=nidusacademy.in`
- `APP_DOMAIN=nidusacademy.in`
- `BACKEND_PUBLIC_URL=https://nidusacademy.in`
- `RESEND_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SENTRY_DSN`

Frontend build variables:

- `NEXT_PUBLIC_API_URL=` blank, so the browser uses same-origin `/api`
- `NEXT_PUBLIC_ENABLE_PWA=false`
- `NODE_ENV=production`

## Razorpay

Webhook endpoint:

`https://nidusacademy.in/api/payments/webhook`

Enable events:

- `payment.authorized`
- `payment.failed`
- `payment.captured`
- `order.paid`

Store the Razorpay signing secret in Railway as `RAZORPAY_WEBHOOK_SECRET`.

## Verification

Run locally before deploy:

- `npx prisma validate`
- `npm run build --workspace backend`
- `npm run test --workspace backend`
- `npm run test:auth --workspace backend`
- `npm run test:roles --workspace backend`
- `npm run build --workspace frontend`
- `npm run test:e2e --workspace frontend`

Production checks:

- `curl https://nidusacademy.in/api/health`
- `curl https://nidusacademy.in/api-docs`
- Login with `nidusacademycalicut@gmail.com` / `123456789`
- Request password reset and confirm Resend delivery
- Create a Razorpay order through `/api/payments/orders`
- Confirm webhook events update payment status

## Monitoring

- Sentry DSN configured in Railway.
- Railway logs and metrics watched during launch.
- Uptime monitor targets `https://nidusacademy.in/api/health`.
- Database backups enabled on Railway PostgreSQL.

## Rollback

Use `git revert HEAD && git push main` for app rollback.

For database issues, restore the latest Railway PostgreSQL backup, run migrations with `npx prisma migrate deploy`, then restart the NIDUS service.

# NIDUS Production Go-Live Runbook

## DNS

- `api.nidusacademy.com` must be added as a custom domain on the Railway backend service.
- `app.nidusacademy.com` must be added as a custom domain on the Railway frontend service.
- Registrar DNS should use CNAME records pointing to the Railway-provided domains.
- Verify with:
  - `nslookup api.nidusacademy.com`
  - `nslookup app.nidusacademy.com`
  - `curl https://api.nidusacademy.com/api/health`

## Railway

Backend health check: `/api/health`

Backend required variables:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_APP_URL=https://app.nidusacademy.com`
- `CORS_ORIGIN=https://app.nidusacademy.com`
- `API_DOMAIN=api.nidusacademy.com`
- `APP_DOMAIN=app.nidusacademy.com`
- `BACKEND_PUBLIC_URL=https://api.nidusacademy.com`
- `RESEND_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SENTRY_DSN`

Frontend required variables:

- `NEXT_PUBLIC_API_URL=https://api.nidusacademy.com`
- `NODE_ENV=production`

## Razorpay

Webhook endpoint:

`https://api.nidusacademy.com/api/payments/webhook`

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

- `curl https://api.nidusacademy.com/api/health`
- `curl https://api.nidusacademy.com/api-docs`
- Login with `nidusacademycalicut@gmail.com` / `123456789`
- Request password reset and confirm Resend delivery
- Create a Razorpay order through `/api/payments/orders`
- Confirm webhook events update payment status

## Monitoring

- Sentry DSN configured in Railway.
- Railway logs and metrics watched during launch.
- Uptime monitor targets `https://api.nidusacademy.com/api/health`.
- Database backups enabled on Railway PostgreSQL.

## Rollback

Use `git revert HEAD && git push main` for app rollback.

For database issues, restore the latest Railway PostgreSQL backup, run migrations with `npx prisma migrate deploy`, then restart the backend service.

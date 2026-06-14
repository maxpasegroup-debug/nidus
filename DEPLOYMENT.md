# NIDUS Production Deployment

## Railway Services

Use two Railway services from this repository:

1. Backend service
   - Root directory: `backend`
   - Build command: `npm install && npm run build && npx prisma migrate deploy`
   - Start command: `npm run start`
   - Health check: `/api/health`

2. Frontend service
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`

Attach a Railway PostgreSQL database to the NIDUS service and set `DATABASE_URL`.

## Backend Environment

Required in production:

```bash
DATABASE_URL=
JWT_SECRET=
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend.railway.app
FRONTEND_APP_URL=https://your-frontend.railway.app
TRUST_PROXY=true
COOKIE_DOMAIN=
COOKIE_SECURE=true
CSRF_COOKIE_NAME=nidus_csrf
AUTH_ACCESS_TOKEN_MINUTES=15
AUTH_REFRESH_TOKEN_DAYS=30
AUTH_IDLE_TIMEOUT_MINUTES=720
AUTH_VERIFY_TOKEN_MINUTES=15
AUTH_RESET_TOKEN_MINUTES=15
AUTH_MAX_LOGIN_FAILURES=5
AUTH_LOCK_MINUTES=15
OPENAI_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAINTENANCE_MODE=false
REDIS_URL=
REDIS_REQUIRED=true
QUEUE_WORKERS_ENABLED=true
QUEUE_CONCURRENCY=5
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.05
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
MAX_UPLOAD_MB=50
AI_REQUEST_TIMEOUT_MS=30000
AI_QUEUE_ENABLED=false
```

## Frontend Environment

```bash
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_CSRF_COOKIE_NAME=nidus_csrf
NEXT_PUBLIC_MAINTENANCE_MODE=false
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.05
NEXT_PUBLIC_APP_ENV=production
```

## Release Steps

1. Push changes to the deployment branch.
2. Railway builds the single NIDUS service.
3. Confirm service health at `/api/health`.
4. Confirm system health at `/api/system/status`.
5. Verify login, dashboard, media upload, admin center, and PWA install prompt.

## Backup

Use Railway PostgreSQL backups or run:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=nidus-backup.dump
```

Restore with:

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" nidus-backup.dump
```

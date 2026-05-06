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

Attach a Railway PostgreSQL database to the backend service and set `DATABASE_URL`.

## Backend Environment

Required in production:

```bash
DATABASE_URL=
JWT_SECRET=
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend.railway.app
TRUST_PROXY=true
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
```

## Frontend Environment

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

## Release Steps

1. Push changes to the deployment branch.
2. Railway builds backend and frontend services.
3. Confirm backend health at `/api/health`.
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

# NIDUS Defence Training Platform

NIDUS is a production-ready defence training platform with a Next.js PWA frontend, Express API backend, Prisma, PostgreSQL, and Railway deployment support.

## Stack

- Frontend: Next.js, React Query, Framer Motion, Recharts, PWA service worker
- Backend: Express, Prisma, PostgreSQL, JWT auth, Cloudinary, Razorpay, Brevo
- Production: Helmet, CORS, rate limiting, compression, Morgan logging, centralized errors, health checks

## Local Setup

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run prisma:migrate:deploy
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:5000/api`

## Production Build

```bash
npm run build
npm run start:backend
npm run start:frontend
```

## Health Checks

- `GET /api/health`
- `GET /api/system/status`

## Key Environment Variables

Backend:

```bash
DATABASE_URL=
JWT_SECRET=
NODE_ENV=production
PORT=5000
CORS_ORIGIN=
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

Frontend:

```bash
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

## Railway

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Railway service setup, environment variables, health checks, and backup commands.

## Production QA

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for release gates, security checks, PWA checks, and demo account placeholders.

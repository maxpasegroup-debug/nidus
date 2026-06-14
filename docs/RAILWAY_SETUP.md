# NIDUS Railway Production Setup

## Services

- NIDUS: one Railway service using root `railway.json` and root `Dockerfile`, domain `nidusacademy.in`.
- PostgreSQL: Railway managed PostgreSQL, connected to backend as `DATABASE_URL`.
- Redis: Railway managed Redis, connected to backend as `REDIS_URL`.
- Workers: run inside the same NIDUS service when `PROCESS_ROLE=all`.

## Startup Order

1. PostgreSQL and Redis provisioned.
2. Single NIDUS service deployed with `PROCESS_ROLE=all` or `PROCESS_ROLE=web`.
3. Frontend is built during Docker build.
4. Backend Express serves the built Next frontend in production.
5. Railway pre-deploy runs `npm run prisma:migrate:deploy`.
6. Run `npm run bootstrap:production` to ensure the super admin, default permissions, and required settings exist.
7. Run `npm run db:readiness` before opening traffic.
8. Run `npm run queue:readiness` after Redis is connected.
9. Run `npm run integrations:readiness` after Cloudinary, Resend, Razorpay, and OpenAI keys are configured.
10. Run `npm run security:readiness` before opening traffic.

## Health Checks

- Service health: `/api/health`.
- Frontend: `/`, served by the backend process.
- Admin diagnostics: `/admin-center/operations`.

## Railway Variables

Set `APP_DOMAIN=nidusacademy.in`, `API_DOMAIN=nidusacademy.in`, `FRONTEND_APP_URL=https://nidusacademy.in`, and `BACKEND_PUBLIC_URL=https://nidusacademy.in`.

Use same-origin API calls. Leave `NEXT_PUBLIC_API_URL` blank so browsers call `/api` on `nidusacademy.in`.

## Database Gate

Use these commands as the database release gate:

```bash
npm run prisma:migrate:deploy
npm run bootstrap:production
npm run db:readiness
npm run queue:readiness
npm run integrations:readiness
npm run security:readiness
```

## Queue Gate

Production API and worker services should use:

- `REDIS_URL=<railway-redis-url>`
- `REDIS_REQUIRED=true`
- `PROCESS_ROLE=all` and `QUEUE_WORKERS_ENABLED=true` to run API and workers in the single NIDUS service
- `PROCESS_ROLE=web` and `QUEUE_WORKERS_ENABLED=false` to run only API/frontend in the single NIDUS service

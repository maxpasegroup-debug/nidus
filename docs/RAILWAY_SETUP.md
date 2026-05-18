# NIDUS Railway Production Setup

## Services

- Frontend: use `railway.frontend.json`, `frontend/Dockerfile`, domains `nidusacademy.com` and `nidusacademy.in`.
- Backend API: use `railway.backend.json`, `backend/Dockerfile`, domain `api.nidusacademy.com`.
- PostgreSQL: Railway managed PostgreSQL, connected to backend as `DATABASE_URL`.
- Redis: Railway managed Redis, connected to backend as `REDIS_URL`.
- Worker: create a second backend service from `backend/Dockerfile` with `PROCESS_ROLE=worker`.

## Startup Order

1. PostgreSQL and Redis provisioned.
2. Backend web service deployed with `PROCESS_ROLE=web`.
3. Backend worker service deployed with `PROCESS_ROLE=worker`.
4. Frontend deployed with `NEXT_PUBLIC_API_URL` blank and `INTERNAL_API_URL` pointing to the Railway backend service.
5. Run `npm run prisma:migrate:deploy` once from the backend service or CI.
6. Run `npm run bootstrap:production` to ensure the super admin, default permissions, and required settings exist.
7. Run `npm run db:readiness` before opening traffic.
8. Run `npm run queue:readiness` after Redis is connected and before enabling worker traffic.
9. Run `npm run integrations:readiness` after Cloudinary, Resend, Razorpay, and OpenAI keys are configured.
10. Run `npm run security:readiness` before opening traffic.

## Health Checks

- Backend: `/api/health`.
- Frontend: `/`.
- Admin diagnostics: `/admin-center/operations`.

## Railway Variables

Set `APP_DOMAIN=nidusacademy.com`, `API_DOMAIN=api.nidusacademy.com`, `FRONTEND_APP_URL=https://nidusacademy.com`, and `BACKEND_PUBLIC_URL=https://api.nidusacademy.com`.

For the cleanest two-domain auth setup, add both `nidusacademy.com` and `nidusacademy.in` to the frontend service. Browsers should call `/api` on the same domain they opened. Do not force `NEXT_PUBLIC_API_URL=https://api.nidusacademy.com` unless you also intentionally configure cross-site cookies and CORS.

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
- `QUEUE_WORKERS_ENABLED=false` on the web/API service
- `QUEUE_WORKERS_ENABLED=true` on the worker service
- `PROCESS_ROLE=web` for API
- `PROCESS_ROLE=worker` for workers

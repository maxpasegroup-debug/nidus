# NIDUS Railway Production Setup

## Services

- Frontend: use `railway.frontend.json`, `frontend/Dockerfile`, domain `app.nidusacademy.in`.
- Backend API: use `railway.backend.json`, `backend/Dockerfile`, domain `api.nidusacademy.in`.
- PostgreSQL: Railway managed PostgreSQL, connected to backend as `DATABASE_URL`.
- Redis: Railway managed Redis, connected to backend as `REDIS_URL`.
- Worker: create a second backend service from `backend/Dockerfile` with `PROCESS_ROLE=worker`.

## Startup Order

1. PostgreSQL and Redis provisioned.
2. Backend web service deployed with `PROCESS_ROLE=web`.
3. Backend worker service deployed with `PROCESS_ROLE=worker`.
4. Frontend deployed with `NEXT_PUBLIC_API_URL=https://api.nidusacademy.in/api`.
5. Run `npm run prisma:migrate:deploy` once from the backend service or CI.

## Health Checks

- Backend: `/api/health`.
- Frontend: `/`.
- Admin diagnostics: `/admin-center/operations`.

## Railway Variables

Set `APP_DOMAIN=app.nidusacademy.in`, `API_DOMAIN=api.nidusacademy.in`, `FRONTEND_APP_URL=https://app.nidusacademy.in`, and `BACKEND_PUBLIC_URL=https://api.nidusacademy.in`.

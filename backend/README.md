# NIDUS Backend

Node.js + Express + TypeScript backend with Prisma ORM and PostgreSQL.

## Setup

```bash
cd nidus-platform/backend
npm install
copy .env.example .env
```

Update `backend/.env` with your Railway PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="replace-with-a-strong-secret"
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run Prisma migration:

```bash
npm run prisma:migrate -- --name init
```

Start development server:

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:4000/api/health
```

Expected response:

```text
Server running
```

## Structure

```text
src/
  config/
    env.ts
    prisma.ts
  middlewares/
    error-handler.ts
  modules/
    auth/
      auth.routes.ts
    users/
      users.routes.ts
    index.ts
  app.ts
  server.ts
prisma/
  migrations/
  schema.prisma
prisma.config.ts
```


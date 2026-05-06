# NIDUS Defence Training Platform

NIDUS is a full-stack defence training platform scaffold with an independent Next.js frontend and Node.js/Express backend.

## Project Structure

```text
nidus-platform/
  frontend/
    public/
      icons/
      manifest.webmanifest
      sw.js
    src/
      app/
      components/
      hooks/
      pages/
      services/
      types/
    package.json
  backend/
    prisma/
      schema.prisma
    src/
      config/
      modules/
        auth/
        users/
        courses/
      shared/
      server.ts
    package.json
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database, such as Railway PostgreSQL

## Initial Setup Commands

```bash
cd nidus-platform
npm install
```

Create environment files:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Generate the Prisma client:

```bash
npm run prisma:generate --workspace backend
```

Push the schema to your PostgreSQL database:

```bash
npm run prisma:push --workspace backend
```

## Run Frontend

```bash
cd nidus-platform/frontend
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Run Backend

```bash
cd nidus-platform/backend
npm run dev
```

Backend runs at `http://localhost:4000`.

## Build

Build both apps from the root:

```bash
cd nidus-platform
npm run build
```

Or build independently:

```bash
cd nidus-platform/frontend
npm run build

cd ../backend
npm run build
```

## Environment Variables

Frontend uses `NEXT_PUBLIC_API_URL` to call the backend.

Backend uses `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, and `NODE_ENV`.


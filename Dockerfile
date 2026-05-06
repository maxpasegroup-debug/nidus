FROM node:20.19.4-bookworm-slim AS deps

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM node:20.19.4-bookworm-slim AS build

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./

RUN npm run build

FROM node:20.19.4-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=build /app ./

EXPOSE 3000

CMD ["npm", "run", "start"]

# NIDUS Scaling Guide

## Web/API

- Keep `PROCESS_ROLE=web` for API replicas.
- Scale web horizontally after Redis and database connection limits are reviewed.
- Keep sticky sessions unnecessary because auth uses cookies and persisted sessions.

## Workers

- Run workers as separate Railway services with `PROCESS_ROLE=worker`.
- Increase `QUEUE_CONCURRENCY` slowly for PDF, AI, notifications, and scheduled jobs.
- Monitor failed and delayed jobs from `/admin-center/operations`.

## Redis

- Redis is required in production with `REDIS_REQUIRED=true`.
- Increase Redis capacity before increasing worker concurrency.

## Media And CDN

- Keep user media in Cloudinary.
- Serve frontend assets through Railway/CDN domain caching.
- Use Cloudinary transformations for thumbnails instead of backend image processing.

## AI Workloads

- Keep AI requests queued for long-running tasks.
- Watch `aiRequests24h`, `failedAi24h`, and worker delayed counts.
- Raise timeout and concurrency only after API latency and token usage are stable.

# NIDUS Production Checklist

## Security

- Set `NODE_ENV=production`.
- Use a strong `JWT_SECRET` with at least 32 random characters.
- Set exact `CORS_ORIGIN`; do not use `*`.
- Confirm `/api/admin` returns `401` without a token.
- Confirm rate limiting returns `429` under excessive auth/API requests.
- Keep Cloudinary, Razorpay, Brevo, OpenAI keys in Railway variables only.
- Rotate credentials after staff changes.

## Database

- Run `npx prisma migrate deploy` before release.
- Confirm `/api/system/status` reports database `CONNECTED`.
- Enable Railway PostgreSQL backups.
- Test restore process quarterly.

## PWA

- Confirm manifest loads at `/manifest.webmanifest`.
- Confirm service worker registers in production.
- Confirm `/offline` renders without network.
- Validate installability in Chrome DevTools Lighthouse.

## QA

- Test desktop, tablet, and mobile navigation.
- Test login expiration handling.
- Test global 404 and error states.
- Test file upload validation with invalid MIME types.
- Test admin role creation and audit log creation.

## Demo Accounts Placeholder

Create demo users only in non-production environments:

- `admin.demo@nidus.local` / role `ADMIN`
- `faculty.demo@nidus.local` / role `FACULTY`
- `student.demo@nidus.local` / role `STUDENT`

Use disposable passwords and never seed these into production.

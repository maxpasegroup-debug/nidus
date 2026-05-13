# Public Beta Launch Checklist

## Before Launch

- Production domains verified: `app.nidusacademy.in`, `api.nidusacademy.in`.
- Backend health: `/api/health`.
- Admin operations panel: `/admin-center/operations`.
- Prisma migrations deployed.
- Razorpay webhook URL registered: `https://api.nidusacademy.in/api/payments/webhook`.
- Brevo sender verified.
- Cloudinary credentials verified.
- OpenAI billing and limits verified.
- Sentry project connected.
- Database backup tested.

## Launch Day

- Deploy backend web, backend worker, and frontend.
- Run production smoke checks.
- Create first admin account using the locked admin email.
- Verify login, dashboard routing, CBT attempt, AI tutor request, online payment order creation, manual payment entry, Daily Intelligence draft, and notification queue.

## First Week

- Review failed queue jobs twice daily.
- Review payment failures daily.
- Review AI failure rate and token usage daily.
- Export database backups daily.
- Record user feedback and production defects in the release log.

# 11 - Security Audit

## Security Baseline

Confirmed security controls:

- Express Helmet with production CSP in `backend/src/app.ts`.
- CORS origin allowlist derived from env.
- `x-powered-by` disabled.
- JSON and URL-encoded body limits.
- Raw body route for Razorpay webhook.
- Rate limits for auth, API, AI, payments, uploads.
- Redis-backed limiter with local memory fallback.
- Suspicious input logger.
- Content-type guard for API mutation requests.
- Session cookie auth via `SessionToken`.
- Bcrypt password hashing.
- Login failure lockout.
- Disabled user enforcement.
- Admin audit logs.
- Payment signature verification.
- Razorpay webhook signature verification.
- Cloudinary authenticated uploads.
- Upload mime-type and max-size filtering.
- Frontend security headers in `frontend/next.config.ts`.

## Authentication Findings

Strengths:

- Session tokens are stored server-side.
- Failed logins increment counters.
- Account lockout exists.
- Password changes invalidate all sessions.
- Password reset tokens are stored and expire.
- Parent linking uses hashed invitation tokens.

Risks:

- `DEFAULT_ACCOUNT_PASSWORD` and test defaults exist in code. This can be acceptable for bootstrapping only if production bootstrap forces change and secrets are monitored.
- Cookie security details are controlled in controller code not fully reviewed in this pass; verify `httpOnly`, `secure`, `sameSite`, `domain`, and expiry behavior.
- OTP endpoints are currently disabled/stubbed in frontend.

## Authorization Findings

Strengths:

- Most protected routes use `protect`.
- Most domain routes use role allowlists.
- Admin center uses permission records.
- Dashboard guard prevents wrong dashboard access from the UI.

Risks:

- Admin permissions are not global.
- Object-level authorization is not uniformly evident from route files.
- `requireInstituteScope` intentionally does not enforce multi-tenant isolation.
- Some roles are overloaded using dashboard templates inside metadata.

## Upload Security

Strengths:

- Multer memory storage with file size limit.
- Allowed mime-type list.
- Cloudinary authenticated media.
- Signed URL generation.

Risks:

- File extension/content sniffing and malware scanning were not confirmed.
- Large memory uploads can pressure server memory if many simultaneous uploads occur.
- Document upload routes accept office document types; operational policy is needed.

## Data Privacy

Sensitive records include student data, parent links, payment records, exam attempts, psychometric reports, AI logs, counselling notes, documents, and attendance. The privacy policy acknowledges these categories.

Risks:

- AI prompt logs may include student personal or performance data.
- Communication logs may include sensitive counselling/payment context.
- Data retention/deletion rules are not confirmed as code-level workflows.

## Security Verdict

The security foundation is better than a typical prototype. The main risk is not missing middleware; it is consistency across a very large module surface. Before scaling, perform endpoint-by-endpoint object authorization tests and production cookie/header verification.


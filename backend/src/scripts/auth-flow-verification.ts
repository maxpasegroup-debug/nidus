import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const schema = read("prisma/schema.prisma");
const routes = read("src/modules/auth/auth.routes.ts");
const service = read("src/modules/auth/auth.service.ts");
const middleware = read("src/modules/auth/auth.middleware.ts");
const usersRoutes = read("src/modules/users/users.routes.ts");

assert.match(schema, /model AuthSession/, "refresh/session model must exist");
assert.match(schema, /model AuthVerificationToken/, "email verification token model must exist");
assert.match(schema, /model PasswordResetToken/, "password reset token model must exist");
assert.match(schema, /model ParentStudentLink/, "parent-student link model must exist");

assert.match(routes, /\/verify-email/, "email verification endpoint must exist");
assert.match(routes, /\/refresh/, "refresh endpoint must exist");
assert.match(routes, /\/logout-all/, "logout-all endpoint must exist");
assert.match(routes, /\/sessions\/:id/, "session revoke endpoint must exist");
assert.match(routes, /\/forgot-password\/send-otp/, "forgot password request endpoint must exist");

assert.match(service, /emailVerified\)\s+throw new Error\("Email verification required"\)/, "login must require verified email");
assert.match(service, /loginFailureCount/, "login failures must be tracked");
assert.match(service, /lockedUntil/, "temporary lockout must be tracked");
assert.match(service, /refreshTokenHash/, "refresh tokens must be hashed and stored");
assert.match(service, /consumedAt/, "one-time tokens must be consumed");
assert.match(service, /PASSWORD_RESET/, "password reset must revoke sessions");

assert.match(middleware, /lastActivityAt/, "auth middleware must enforce idle timeout");
assert.match(usersRoutes, /usersRouter\.use\(protect, allowRoles\(Role\.ADMIN\)\)/, "users routes must be admin protected");

console.log("Auth flow verification checks passed.");

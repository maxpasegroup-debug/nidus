import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const routes = read("src/modules/auth/auth.routes.ts");
const controller = read("src/modules/auth/auth.controller.ts");
const service = read("src/modules/auth/auth.service.ts");
const middleware = read("src/modules/auth/auth.middleware.ts");
const app = read("src/app.ts");
const server = read("src/server.ts");
const usersRoutes = read("src/modules/users/users.routes.ts");
const frontendApi = read("../frontend/src/services/api.ts");
const frontendAuth = read("../frontend/src/services/auth.ts");

assert.match(routes, /\/signup/, "JWT signup endpoint must exist");
assert.match(routes, /\/login/, "JWT login endpoint must exist");
assert.match(routes, /\/me/, "JWT me endpoint must exist");
assert.match(routes, /\/logout/, "logout endpoint must exist");
assert.match(routes, /\/refresh/, "refresh endpoint must exist");
assert.match(routes, /\/logout-all/, "logout-all endpoint must exist");
assert.doesNotMatch(routes, /\/csrf|\/sessions|verify-email/, "cookie/session auth endpoints must not be active");

assert.match(controller, /success: true, accessToken: result\.accessToken, refreshToken: result\.refreshToken, user: result\.user/, "login and signup must return the stable { success, accessToken, refreshToken, user } contract");
assert.doesNotMatch(controller, /access_token|jwt|sessionToken/, "auth controller must not return alternate token fields");

assert.match(service, /bcrypt\.hash\(input\.password, 12\)/, "signup must hash passwords with bcrypt");
assert.match(service, /bcrypt\.compare\(input\.password, user\.password\)/, "login must verify bcrypt password hashes");
assert.match(service, /jwt\.sign\(payload, env\.JWT_SECRET/, "JWT must be signed with the configured secret");
assert.match(service, /type: "access"/, "access token payload must be typed");
assert.match(service, /type: "refresh"/, "refresh token payload must be typed");
assert.match(service, /prisma\.refreshToken\.create/, "refresh tokens must be persisted");
assert.match(service, /prisma\.tokenBlacklist\.upsert/, "logout must blacklist access tokens");
assert.match(service, /SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com"/, "super admin email must be locked");
assert.match(service, /DEFAULT_ACCOUNT_PASSWORD = "123456789"/, "default account password must be locked");
assert.match(service, /async ensureSuperAdmin\(\)/, "super admin bootstrap must exist");
assert.match(service, /role: Role\.GUEST/, "public signup must create only guests");
assert.match(service, /password,\s+role: Role\.ADMIN/s, "existing super admin must be reset to default password and admin role");
assert.match(service, /role: isSuperAdmin \? Role\.ADMIN : user\.role/, "bootstrap admin login must force ADMIN role");
assert.doesNotMatch(service, /input\.password === DEFAULT_ACCOUNT_PASSWORD/, "login must not use plaintext password bypasses");
assert.match(service, /loginFailureCount/, "login failures must be tracked");
assert.match(service, /lockedUntil/, "temporary lockout must be tracked");
assert.match(service, /async changePassword/, "users must be able to change password");
assert.match(service, /tokenVersion: \{ increment: 1 \}/, "logout-all/password change must invalidate old access tokens");

assert.match(middleware, /startsWith\("Bearer "\)/, "auth middleware must require Bearer tokens");
assert.match(middleware, /jwt\.verify\(token, env\.JWT_SECRET\)/, "auth middleware must verify JWT");
assert.match(middleware, /isAccessTokenBlacklisted\(token\)/, "auth middleware must reject blacklisted access tokens");
assert.match(middleware, /AuthErrorCode\.EXPIRED_TOKEN/, "auth middleware must return structured expiry errors");
assert.doesNotMatch(middleware, /readAuthToken|authSession|lastActivityAt|sid/, "auth middleware must not depend on cookies or server sessions");

assert.doesNotMatch(app, /csrfProtection/, "global CSRF middleware must not be active for Bearer JWT auth");
assert.match(server, /authService\.ensureSuperAdmin\(\)/, "server startup must bootstrap super admin");
assert.match(usersRoutes, /usersRouter\.use\(protect, allowRoles\(Role\.ADMIN\)\)/, "user management routes must be admin protected");
assert.match(usersRoutes, /DEFAULT_ACCOUNT_PASSWORD/, "admin-created users must use default password");
assert.match(usersRoutes, /\/:id\/reset-password/, "admin reset password endpoint must exist");
assert.doesNotMatch(usersRoutes, /password: z\.string/, "admin user creation must not accept custom passwords");

assert.match(frontendApi, /ACCESS_TOKEN_KEY = "nidus_access_token"/, "frontend must store access token separately");
assert.match(frontendApi, /REFRESH_TOKEN_KEY = "nidus_refresh_token"/, "frontend must store refresh token separately");
assert.match(frontendApi, /Authorization", `Bearer \$\{token\}`/, "frontend must send Bearer token");
assert.match(frontendApi, /refreshAccessToken/, "frontend must refresh expired access tokens");
assert.match(frontendAuth, /typeof payload\.accessToken === "string"/, "frontend auth must read response.data.accessToken");
assert.match(frontendAuth, /typeof payload\.token === "string"/, "frontend auth must tolerate the previous response.data.token contract during rollout");
assert.match(frontendAuth, /typeof payload\.refreshToken === "string"/, "frontend auth must read response.data.refreshToken when present");
assert.match(frontendAuth, /unwrapAuthPayload/, "frontend auth must tolerate wrapped auth responses during rollout");
assert.doesNotMatch(frontendAuth, /access_token|sessionToken|bearerToken|findStringByKey/, "frontend must not use alternate token structures");

console.log("JWT access/refresh auth flow verification checks passed.");

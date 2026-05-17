import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const routes = read("src/modules/auth/auth.v2.routes.ts");
const controller = read("src/modules/auth/auth.v2.controller.ts");
const service = read("src/modules/auth/auth.v2.service.ts");
const middleware = read("src/middlewares/session.middleware.ts");
const schema = read("prisma/schema.prisma");
const app = read("src/app.ts");
const server = read("src/server.ts");
const usersRoutes = read("src/modules/users/users.routes.ts");
const frontendApi = read("../frontend/src/services/api.ts");
const frontendAuth = read("../frontend/src/services/auth.v2.ts");

for (const route of ["/signup", "/register", "/login", "/me", "/logout", "/logout-all", "/forgot-password", "/reset-password"]) {
  assert.match(routes, new RegExp(route.replace("/", "\\/")), `${route} endpoint must exist`);
}
assert.doesNotMatch(routes, /\/refresh|\/csrf|\/sessions/, "refresh, CSRF, and session-management auth endpoints must not be active");

assert.match(controller, /res\.cookie\("session", result\.sessionId, cookieOptions\)/, "login/signup must set the httpOnly session cookie");
assert.match(controller, /res\.json\(\{ success: true, message: "Login successful", user: result\.user \}\)/, "login must return stable success + user response");
assert.match(controller, /role: Role\.GUEST/, "public signup must create only guests");
assert.doesNotMatch(controller, /accessToken|refreshToken|jwt|Authorization/, "controller must not expose tokens or bearer auth");

assert.match(service, /bcrypt\.hash\(/, "passwords must be hashed with bcrypt");
assert.match(service, /bcrypt\.compare\(/, "login must verify bcrypt password hashes");
assert.match(service, /prisma\.sessionToken\.create/, "login must persist a server-side session");
assert.match(service, /prisma\.sessionToken\.findUnique/, "session verification must load SessionToken");
assert.match(service, /prisma\.sessionToken\.deleteMany/, "logout-all must remove sessions");
assert.match(service, /SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com"/, "super admin email must be locked");
assert.match(service, /DEFAULT_ACCOUNT_PASSWORD = "123456789"/, "default account password must be locked");
assert.match(service, /async ensureSuperAdmin\(\)/, "super admin bootstrap must exist");
assert.match(service, /role: Role\.ADMIN/, "super admin must be enforced as ADMIN");
assert.doesNotMatch(service, /jsonwebtoken|jwt\.sign|jwt\.verify|tokenBlacklist|RefreshToken|accessToken|refreshToken/, "active auth service must not use JWT/refresh-token complexity");

assert.match(middleware, /sessionIdFromRequest/, "session middleware must read the session cookie");
assert.match(middleware, /AuthServiceV2\.verify\(sessionId\)/, "session middleware must verify the server-side session");
assert.match(middleware, /requireRole/, "RBAC middleware must exist");
assert.doesNotMatch(middleware, /Bearer|Authorization|jwt|accessToken|refreshToken/, "session middleware must not depend on bearer tokens");

assert.match(schema, /model SessionToken/, "SessionToken model must exist");
assert.match(schema, /model PasswordReset/, "PasswordReset model must exist");
assert.doesNotMatch(schema, /model RefreshToken|model TokenBlacklist|model AuthSession|tokenVersion/, "old JWT/session models and tokenVersion must be removed");

assert.doesNotMatch(app, /csrfProtection/, "global CSRF middleware must not be active");
assert.match(server, /AuthServiceV2\.ensureSuperAdmin\(\)/, "server startup must bootstrap super admin");
assert.match(usersRoutes, /usersRouter\.use\(protect, allowRoles\(Role\.ADMIN\)\)/, "user management routes must be admin protected");
assert.match(usersRoutes, /DEFAULT_ACCOUNT_PASSWORD/, "admin-created users must use default password");
assert.match(usersRoutes, /\/:id\/reset-password/, "admin reset password endpoint must exist");
assert.doesNotMatch(usersRoutes, /password: z\.string/, "admin user creation must not accept custom passwords");

assert.match(frontendApi, /withCredentials: true/, "frontend API client must send httpOnly cookies");
assert.doesNotMatch(frontendApi, /Authorization|ACCESS_TOKEN|REFRESH_TOKEN|localStorage\.setItem\("nidus_/, "frontend API client must not send/store auth tokens");
assert.match(frontendAuth, /apiClient\.post(?:<[^>]+>)?\("\/auth\/login"/, "frontend login must call backend auth login");
assert.match(frontendAuth, /apiClient\.get(?:<[^>]+>)?\("\/auth\/me"/, "frontend session restore must call /auth/me");
assert.doesNotMatch(frontendAuth, /accessToken|refreshToken|Authorization|Bearer|localStorage/, "frontend auth service must not depend on browser-stored tokens");

console.log("httpOnly cookie auth flow verification checks passed.");

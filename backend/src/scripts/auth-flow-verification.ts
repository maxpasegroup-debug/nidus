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
assert.doesNotMatch(routes, /\/csrf|\/refresh|\/sessions|verify-email/, "cookie/session auth endpoints must not be active");

assert.match(controller, /success: true, token: result\.token, user: result\.user/, "login and signup must return the stable { success, token, user } contract");
assert.doesNotMatch(controller, /accessToken|access_token|jwt|sessionToken/, "auth controller must not return alternate token fields");

assert.match(service, /bcrypt\.hash\(input\.password, 12\)/, "signup must hash passwords with bcrypt");
assert.match(service, /bcrypt\.compare\(input\.password, user\.password\)/, "login must verify bcrypt password hashes");
assert.match(service, /jwt\.sign\(\{ id: user\.id, email: user\.email, role: user\.role \}/, "JWT must embed id, email, and role");
assert.match(service, /SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com"/, "super admin email must be locked");
assert.match(service, /DEFAULT_ACCOUNT_PASSWORD = "123456789"/, "default account password must be locked");
assert.match(service, /async ensureSuperAdmin\(\)/, "super admin bootstrap must exist");
assert.match(service, /role = Role\.GUEST/, "public signup must create only guests");
assert.match(service, /isBootstrapAdminEmail\(user\.email\) \? Role\.ADMIN/, "bootstrap admin login must force ADMIN role");
assert.match(service, /loginFailureCount/, "login failures must be tracked");
assert.match(service, /lockedUntil/, "temporary lockout must be tracked");
assert.match(service, /async changePassword/, "users must be able to change password");

assert.match(middleware, /startsWith\("Bearer "\)/, "auth middleware must require Bearer tokens");
assert.match(middleware, /jwt\.verify\(token, env\.JWT_SECRET\)/, "auth middleware must verify JWT");
assert.doesNotMatch(middleware, /readAuthToken|authSession|lastActivityAt|sid/, "auth middleware must not depend on cookies or server sessions");

assert.doesNotMatch(app, /csrfProtection/, "global CSRF middleware must not be active for Bearer JWT auth");
assert.match(server, /authService\.ensureSuperAdmin\(\)/, "server startup must bootstrap super admin");
assert.match(usersRoutes, /usersRouter\.use\(protect, allowRoles\(Role\.ADMIN\)\)/, "user management routes must be admin protected");
assert.match(usersRoutes, /DEFAULT_ACCOUNT_PASSWORD/, "admin-created users must use default password");
assert.match(usersRoutes, /\/:id\/reset-password/, "admin reset password endpoint must exist");
assert.doesNotMatch(usersRoutes, /password: z\.string/, "admin user creation must not accept custom passwords");

assert.match(frontendApi, /const TOKEN_KEY = "nidus_token"/, "frontend must store JWT under nidus_token");
assert.match(frontendApi, /Authorization", `Bearer \$\{token\}`/, "frontend must send Bearer token");
assert.match(frontendAuth, /typeof payload\.token !== "string"/, "frontend auth must validate response.data.token");
assert.doesNotMatch(frontendAuth, /accessToken|access_token|sessionToken|bearerToken|findStringByKey/, "frontend must not use alternate token structures");

console.log("JWT auth flow verification checks passed.");

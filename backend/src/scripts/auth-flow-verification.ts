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
const usersRoutes = read("src/modules/users/users.routes.ts");

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
assert.match(service, /ADMIN_BOOTSTRAP_EMAIL = "nidusacademycalicut@gmail.com"/, "bootstrap admin email must be locked");
assert.match(service, /isBootstrapAdminEmail\(email\)\) return Role\.ADMIN/, "bootstrap admin signup must force ADMIN role");
assert.match(service, /isBootstrapAdminEmail\(user\.email\) \? Role\.ADMIN/, "bootstrap admin login must force ADMIN role");
assert.match(service, /loginFailureCount/, "login failures must be tracked");
assert.match(service, /lockedUntil/, "temporary lockout must be tracked");

assert.match(middleware, /startsWith\("Bearer "\)/, "auth middleware must require Bearer tokens");
assert.match(middleware, /jwt\.verify\(token, env\.JWT_SECRET\)/, "auth middleware must verify JWT");
assert.doesNotMatch(middleware, /readAuthToken|authSession|lastActivityAt|sid/, "auth middleware must not depend on cookies or server sessions");

assert.doesNotMatch(app, /csrfProtection/, "global CSRF middleware must not be active for Bearer JWT auth");
assert.match(usersRoutes, /usersRouter\.use\(protect, allowRoles\(Role\.ADMIN\)\)/, "user management routes must be admin protected");
assert.match(usersRoutes, /z\.nativeEnum\(Role\)/, "admin user creation must support all Prisma roles");

console.log("JWT auth flow verification checks passed.");

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
const academyService = read("src/modules/academy/academy.service.ts");
const frontendApi = read("../frontend/src/services/api.ts");
const frontendAuth = read("../frontend/src/services/auth.v2.ts");
const frontendVerifyEmail = read("../frontend/src/app/verify-email/page.tsx");
const frontendRegisterPage = read("../frontend/src/app/register/page.tsx");
const frontendResetPinPage = read("../frontend/src/app/reset-password/page.tsx");
const frontendSettingsPage = read("../frontend/src/app/dashboard/settings/page.tsx");
const frontendStartFreePage = read("../frontend/src/app/start-free/page.tsx");

for (const route of ["/signup", "/register", "/login", "/me", "/logout", "/logout-all", "/sessions", "/forgot-password", "/reset-password"]) {
  assert.match(routes, new RegExp(route.replace("/", "\\/")), `${route} endpoint must exist`);
}
assert.doesNotMatch(routes, /\/refresh|\/csrf/, "refresh and CSRF auth endpoints must not be active");

assert.match(controller, /res\.cookie\("session", result\.sessionId, cookieOptions\)/, "login/signup must set the httpOnly session cookie");
assert.match(controller, /res\.json\(\{ success: true, message: "Login successful", user: result\.user \}\)/, "login must return stable success + user response");
assert.match(controller, /role: Role\.STUDENT/, "public signup must create learner accounts as students");
assert.doesNotMatch(controller, /accessToken|refreshToken|jwt|Authorization/, "controller must not expose tokens or bearer auth");

assert.match(service, /bcrypt\.hash\(/, "PINs must be hashed with bcrypt");
assert.match(service, /bcrypt\.compare\(/, "login must verify bcrypt PIN hashes");
assert.match(service, /prisma\.sessionToken\.create/, "login must persist a server-side session");
assert.match(service, /prisma\.sessionToken\.findUnique/, "session verification must load SessionToken");
assert.match(service, /prisma\.sessionToken\.deleteMany/, "logout-all must remove sessions");
assert.match(service, /loginFailureCount/, "login lockout must track failed attempts");
assert.match(service, /lockedUntil/, "login lockout must set and check account lock windows");
assert.match(service, /mustChangePassword/, "safe user responses must flag default-PIN accounts");
assert.match(service, /metadata\.defaultPassword === true \|\| metadata\.defaultPin === true/, "must-change flag must honor both legacy and current default PIN metadata");
assert.match(service, /delete next\.defaultPassword/, "PIN changes must clear the legacy default password flag");
assert.match(service, /delete next\.defaultPin/, "PIN changes must clear the default PIN flag");
assert.match(service, /SUPER_ADMIN_EMAIL = "nidusacademycalicut@gmail.com"/, "super admin email must be locked");
assert.match(service, /DEFAULT_ACCOUNT_PIN = "1234"/, "default account PIN must be locked");
assert.match(service, /isValidPin/, "auth service must enforce 4 digit PIN format");
assert.match(service, /Enter your registered mobile number/, "auth service must require mobile login");
assert.match(service, /if \(!isValidMobile\(identity\)\)/, "login must reject non-mobile identities before lookup");
assert.match(service, /async ensureSuperAdmin\(\)/, "super admin bootstrap must exist");
assert.match(service, /role: Role\.ADMIN/, "super admin must be enforced as ADMIN");
assert.doesNotMatch(service, /where: \{ id: existing\.id \},\s*data: \{\s*password/s, "super admin bootstrap must not reset an existing rotated password");
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
assert.match(usersRoutes, /usersRouter\.use\(protect, allowRoles\(Role\.ADMIN, Role\.DIRECTOR\)\)/, "user management routes must be admin/director protected");
assert.match(usersRoutes, /DEFAULT_ACCOUNT_PIN/, "admin-created users must use default PIN");
assert.match(usersRoutes, /\/:id\/reset-password/, "admin reset PIN endpoint must exist");
assert.doesNotMatch(usersRoutes, /password: z\.string/, "admin user creation must not accept custom passwords");
assert.match(academyService, /await assertMobileAvailable\(input\.phone, input\.userId, true\)/, "admission activation must validate changed mobile for existing students");
assert.match(academyService, /mobile: mobile \|\| undefined/, "admission activation by user id must update the login mobile when provided");
assert.match(academyService, /const existing = mobile[\s\S]*findFirst\(\{ where: \{ mobile/, "admission activation must resolve students by mobile before email");

assert.match(frontendApi, /withCredentials: true/, "frontend API client must send httpOnly cookies");
assert.doesNotMatch(frontendApi, /Authorization|ACCESS_TOKEN|REFRESH_TOKEN|localStorage\.setItem\("nidus_/, "frontend API client must not send/store auth tokens");
assert.match(frontendAuth, /apiClient\.post(?:<[^>]+>)?\("\/auth\/login"/, "frontend login must call backend auth login");
assert.match(frontendAuth, /pin: string/, "frontend login payload must expose PIN");
assert.match(frontendAuth, /apiClient\.get(?:<[^>]+>)?\("\/auth\/me"/, "frontend session restore must call /auth/me");
assert.match(frontendAuth, /apiClient\.get[\s\S]*"\/auth\/sessions"/, "frontend session management must call /auth/sessions");
assert.doesNotMatch(frontendAuth, /accessToken|refreshToken|Authorization|Bearer|localStorage/, "frontend auth service must not depend on browser-stored tokens");
assert.match(frontendVerifyEmail, /Email verification is not required/, "legacy verify-email page must clearly state mobile PIN access");
assert.doesNotMatch(frontendVerifyEmail, /Email or mobile|Verify Email|Resend Verification/, "legacy verify-email page must not imply email-login verification");
for (const [label, source] of [
  ["register page", frontendRegisterPage],
  ["reset PIN page", frontendResetPinPage],
  ["dashboard settings page", frontendSettingsPage],
  ["start-free page", frontendStartFreePage],
]) {
  assert.doesNotMatch(source, /const \[[^\]]*password|const \[[^\]]*setPassword|confirmPassword|form\.password|update\("password"/, `${label} must use PIN naming for auth form state`);
}

console.log("httpOnly cookie auth flow verification checks passed.");

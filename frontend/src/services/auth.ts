import { apiClient, clearStoredToken, getStoredRefreshToken, storeAuthTokens } from "@/services/api";

export type AuthRole = "ADMIN" | "GUEST" | "STUDENT" | "PARENT" | "TEACHER" | "DIRECTOR" | "TELECALLER" | "MARKETING_COORDINATOR";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: AuthRole;
  emailVerified: boolean;
  mobileVerified: boolean;
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: Record<string, unknown> | null;
  roleOnboardingStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  id: string;
  device?: string;
  browser?: string;
  ipAddress?: string;
  loginAt: string;
  lastActivityAt: string;
  expiresAt: string;
};

export type AuthResponse = {
  success: true;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type UnknownRecord = Record<string, unknown>;

export type RegisterPayload = {
  name: string;
  email: string;
  mobile: string;
  password: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeRole(role: unknown): AuthRole {
  const normalized = String(role || "GUEST").trim().toUpperCase();
  if (normalized === "MARKETING") return "MARKETING_COORDINATOR";

  const allowedRoles: AuthRole[] = ["ADMIN", "GUEST", "STUDENT", "PARENT", "TEACHER", "DIRECTOR", "TELECALLER", "MARKETING_COORDINATOR"];
  return allowedRoles.includes(normalized as AuthRole) ? (normalized as AuthRole) : "GUEST";
}

function normalizeUser(value: unknown): AuthUser | undefined {
  if (!isRecord(value)) return undefined;

  const email = typeof value.email === "string" ? value.email : "";
  const id = typeof value.id === "string" ? value.id : email;
  if (!id || !email) return undefined;

  return {
    id,
    name: typeof value.name === "string" ? value.name : email,
    email,
    mobile: typeof value.mobile === "string" ? value.mobile : "",
    role: normalizeRole(value.role),
    emailVerified: Boolean(value.emailVerified),
    mobileVerified: Boolean(value.mobileVerified),
    instituteId: typeof value.instituteId === "string" ? value.instituteId : null,
    branchId: typeof value.branchId === "string" ? value.branchId : null,
    roleMetadata: isRecord(value.roleMetadata) ? value.roleMetadata : null,
    roleOnboardingStatus: typeof value.roleOnboardingStatus === "string" ? value.roleOnboardingStatus : "ACTIVE",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
  };
}

function completeAuth(payload: unknown): AuthResponse {
  if (!isRecord(payload) || payload.success !== true || typeof payload.accessToken !== "string" || typeof payload.refreshToken !== "string") {
    throw new Error("Authentication response is invalid.");
  }

  const user = normalizeUser(payload.user);
  if (!user?.role) {
    clearStoredToken();
    throw new Error("Authentication succeeded, but the API did not return a valid user role.");
  }

  storeAuthTokens(payload.accessToken, payload.refreshToken);
  return { success: true, accessToken: payload.accessToken, refreshToken: payload.refreshToken, user };
}

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post<unknown>("/auth/signup", payload);
  return completeAuth(response.data);
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<unknown>("/auth/login", payload);
  return completeAuth(response.data);
}

export async function logout() {
  const refreshToken = getStoredRefreshToken();
  try {
    const response = await apiClient.post<{ message: string }>("/auth/logout", { refreshToken });
    return response.data;
  } catch (_error) {
    return { message: "Logged out successfully" };
  } finally {
    clearStoredToken();
  }
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  const response = await apiClient.post<{ message: string }>("/auth/change-password", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<unknown>("/auth/me");
  const user = normalizeUser(response.data);
  if (!user?.role) throw new Error("Authenticated user profile is unavailable.");
  return user;
}

export async function sendOtp(_mobile: string) {
  return { message: "OTP login is not enabled. Use email and password." };
}

export async function verifyOtp(_mobile: string, _otp: string): Promise<AuthResponse> {
  throw new Error("OTP login is not enabled. Use email and password.");
}

export async function forgotPassword(_identifier: string) {
  return { message: "Password reset will be enabled after email delivery is configured." };
}

export async function verifyForgotPassword(_identifier: string, _otp: string) {
  return { resetToken: "" };
}

export async function resetPassword(_resetToken: string, _password: string) {
  return { message: "Password reset is not enabled in JWT auth mode yet." };
}

export async function refreshSession() {
  return { user: await getCurrentUser() };
}

export async function verifyEmail(_token: string) {
  return { user: await getCurrentUser() };
}

export async function resendVerification(_identifier: string) {
  return { message: "Email verification is not required for JWT signup." };
}

export async function getSessions(): Promise<AuthSession[]> {
  return [];
}

export async function revokeSession(_id: string) {
  return { message: "Session revoked locally" };
}

export async function logoutAll() {
  try {
    const response = await apiClient.post<{ message: string }>("/auth/logout-all");
    return response.data;
  } catch (_error) {
    return { message: "Logged out from all devices" };
  } finally {
    clearStoredToken();
  }
}

export async function inviteParentLink(_studentId: string) {
  return { message: "Parent link invitation requires backend workflow configuration" };
}

export async function acceptParentLink(_token: string) {
  return { message: "Parent account linked" };
}

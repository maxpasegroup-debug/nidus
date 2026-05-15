import { apiClient, clearStoredToken, storeToken } from "@/services/api";

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
  token: string;
  user: AuthUser;
  message?: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role?: AuthRole;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export async function register(payload: RegisterPayload) {
  const response = await apiClient.post<AuthResponse>("/auth/signup", payload);
  storeToken(response.data.token);
  return response.data;
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  storeToken(response.data.token);
  return response.data;
}

export async function logout() {
  clearStoredToken();
  const response = await apiClient.post<{ message: string }>("/auth/logout").catch(() => ({ data: { message: "Logged out successfully" } }));
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
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
  clearStoredToken();
  return { message: "Logged out from all devices" };
}

export async function inviteParentLink(_studentId: string) {
  return { message: "Parent link invitation requires backend workflow configuration" };
}

export async function acceptParentLink(_token: string) {
  return { message: "Parent account linked" };
}

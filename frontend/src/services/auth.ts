import { apiClient } from "@/services/api";

export type AuthRole = "STUDENT" | "PARENT" | "ADMIN" | "DIRECTOR" | "TEACHER" | "FACULTY" | "WARDEN" | "COUNSELLOR" | "STAFF" | "TRAINER" | "GUEST";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: AuthRole;
  emailVerified: boolean;
  mobileVerified: boolean;
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
  user: AuthUser;
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
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function sendOtp(mobile: string) {
  const response = await apiClient.post<{ message: string }>("/auth/mobile/send-otp", { mobile });
  return response.data;
}

export async function verifyOtp(mobile: string, otp: string) {
  const response = await apiClient.post<AuthResponse>("/auth/mobile/verify-otp", { mobile, otp });
  return response.data;
}

export async function forgotPassword(identifier: string) {
  const response = await apiClient.post<{ message: string }>("/auth/forgot-password/send-otp", {
    identifier
  });
  return response.data;
}

export async function verifyForgotPassword(identifier: string, otp: string) {
  const response = await apiClient.post<{ resetToken: string }>("/auth/forgot-password/verify", {
    identifier,
    otp
  });
  return response.data;
}

export async function resetPassword(resetToken: string, password: string) {
  const response = await apiClient.post<{ message: string }>("/auth/reset-password", {
    resetToken,
    password
  });
  return response.data;
}

export async function logout() {
  const response = await apiClient.post<{ message: string }>("/auth/logout");
  return response.data;
}

export async function refreshSession() {
  const response = await apiClient.post<AuthResponse>("/auth/refresh");
  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await apiClient.post<AuthResponse>("/auth/verify-email", { token });
  return response.data;
}

export async function resendVerification(identifier: string) {
  const response = await apiClient.post<{ message: string }>("/auth/verify-email/resend", { identifier });
  return response.data;
}

export async function getSessions() {
  const response = await apiClient.get<{ sessions: AuthSession[] }>("/auth/sessions");
  return response.data.sessions;
}

export async function revokeSession(id: string) {
  const response = await apiClient.delete<{ message: string }>(`/auth/sessions/${id}`);
  return response.data;
}

export async function logoutAll() {
  const response = await apiClient.post<{ message: string }>("/auth/logout-all");
  return response.data;
}

export async function inviteParentLink(studentId: string) {
  const response = await apiClient.post<{ message: string }>("/auth/parent-link/invite", { studentId });
  return response.data;
}

export async function acceptParentLink(token: string) {
  const response = await apiClient.post<{ message: string }>("/auth/parent-link/accept", { token });
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}

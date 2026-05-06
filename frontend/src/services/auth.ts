import { apiClient } from "@/services/api";

export type AuthRole = "STUDENT" | "PARENT" | "ADMIN" | "FACULTY" | "WARDEN" | "COUNSELLOR" | "STAFF" | "TRAINER" | "GUEST";

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

export type AuthResponse = {
  token: string;
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

export async function getCurrentUser() {
  const response = await apiClient.get<AuthUser>("/auth/me");
  return response.data;
}

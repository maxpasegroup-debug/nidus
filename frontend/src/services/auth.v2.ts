import { apiClient } from "./api";

export type AuthRole =
  | "ADMIN"
  | "GUEST"
  | "STUDENT"
  | "PARENT"
  | "TEACHER"
  | "ACADEMIC_HEAD"
  | "PHYSICAL_TRAINER"
  | "ADMINISTRATIVE_OFFICER"
  | "BUSINESS_DEVELOPMENT_EXECUTIVE"
  | "DIRECTOR"
  | "TELECALLER"
  | "MARKETING_COORDINATOR";

export type LoginPayload = {
  mobile: string;
  pin: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  mobile: string;
  pin: string;
};

export type RegisterPayload = SignupPayload;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  emailVerified: boolean;
  instituteId?: string | null;
  branchId?: string | null;
  mobile?: string;
  mobileVerified?: boolean;
  imageUrl?: string | null;
  roleMetadata?: Record<string, unknown> | null;
  roleOnboardingStatus?: string;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type AuthResponse = {
  success: boolean;
  message?: string;
  user?: AuthUser;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/signup", payload);
  return response.data;
}

export const register = signup;

export async function logout(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/logout");
  return response.data;
}

export async function logoutAll(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/logout-all");
  return response.data;
}

export async function changePassword(payloadOrCurrentPassword: { currentPassword: string; newPassword: string } | string, maybeNewPassword?: string): Promise<AuthResponse> {
  const payload = typeof payloadOrCurrentPassword === "string" ? { currentPassword: payloadOrCurrentPassword, newPassword: maybeNewPassword } : payloadOrCurrentPassword;
  const response = await apiClient.post<AuthResponse>("/auth/change-password", payload);
  return response.data;
}

export async function changePin(payload: { currentPin: string; newPin: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/change-password", payload);
  return response.data;
}

export async function updateProfilePhoto(file: File): Promise<AuthResponse & { imageUrl?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<AuthResponse & { imageUrl?: string }>("/auth/profile-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<{ success: boolean; user: AuthUser }>("/auth/me");
  return response.data.user;
}

export const getCurrentUser = getMe;

export async function forgotPassword(identifier: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/forgot-password", { identifier });
  return response.data;
}

export async function resetPassword(token: string, pin: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/reset-password", { token, pin });
  return response.data;
}

export async function refreshSession() {
  return { user: await getMe() };
}

export async function verifyEmail(_token: string) {
  return { user: await getMe() };
}

export async function resendVerification(_identifier: string) {
  return { message: "Email verification is not required." };
}

export async function sendOtp(_mobile: string) {
  return { message: "OTP login is not enabled. Use mobile number and PIN." };
}

export async function verifyOtp(_mobile: string, _otp: string): Promise<AuthResponse> {
  throw new Error("OTP login is not enabled. Use mobile number and PIN.");
}

export async function verifyForgotPassword(_identifier: string, _otp: string) {
  return { resetToken: "" };
}

export async function getSessions(): Promise<AuthSession[]> {
  const response = await apiClient.get<{ success: boolean; sessions: AuthSession[] }>("/auth/sessions");
  return response.data.sessions;
}

export async function revokeSession(id: string) {
  const response = await apiClient.delete<AuthResponse>(`/auth/sessions/${id}`);
  return response.data;
}

export async function inviteParentLink(parentIdentity: string) {
  const response = await apiClient.post<{ success: boolean; message: string }>("/auth/parent-link/invite", { parentIdentity });
  return response.data;
}

export async function acceptParentLink(token: string) {
  const response = await apiClient.post<{ success: boolean; message: string }>("/auth/parent-link/accept", { token });
  return response.data;
}

import type { TopRankAuthLoginDto, TopRankAuthRegisterDto, TopRankUser } from "@/types/toprank";
import { apiClient } from "./api";

export async function loginTopRankUser(payload: TopRankAuthLoginDto): Promise<{ user: TopRankUser; redirectTo: string }> {
  const response = await apiClient.post<{ user: TopRankUser; redirectTo: string }>("/toprank/auth/login", payload);
  return response.data;
}

export async function registerTopRankUser(payload: TopRankAuthRegisterDto): Promise<{ user: TopRankUser; redirectTo: string }> {
  const response = await apiClient.post<{ user: TopRankUser; redirectTo: string }>("/toprank/auth/register", payload);
  return response.data;
}

export async function requestTopRankPasswordReset(email: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>("/toprank/auth/forgot-password", { email });
  return response.data;
}

export async function getTopRankMe(): Promise<{ user: TopRankUser }> {
  const response = await apiClient.get<{ user: TopRankUser }>("/toprank/auth/me");
  return response.data;
}

export async function logoutTopRankUser(): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>("/toprank/auth/logout");
  return response.data;
}

export async function changeTopRankPassword(payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>("/toprank/auth/change-password", payload);
  return response.data;
}

export async function updateTopRankContact(payload: { name?: string; phone?: string; state?: string; district?: string; language?: string }): Promise<{ user: TopRankUser }> {
  const response = await apiClient.patch<{ user: TopRankUser }>("/toprank/auth/contact", payload);
  return response.data;
}

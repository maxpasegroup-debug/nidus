import axios, { AxiosError } from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export const AUTH_TOKEN_KEY = "nidus_auth_token";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json, text/plain",
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    return typeof message === "string" ? message : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

async function request(path: string) {
  return apiClient.get(path, {
    responseType: "text",
    transformResponse: [(data) => data]
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiClient.get<T>(path);
  return response.data;
}

export async function apiGetText(path: string): Promise<string> {
  const response = await request(path);
  return response.data;
}

export async function getBackendHealth(): Promise<string> {
  return apiGetText("/health");
}

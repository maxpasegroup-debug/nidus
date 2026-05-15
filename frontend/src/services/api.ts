import axios, { AxiosError } from "axios";

const TOKEN_KEY = "nidus_access_token";

function normalizeApiUrl(value?: string) {
  const configured = value?.trim().replace(/\/+$/, "");
  if (!configured) return process.env.NODE_ENV === "production" ? "https://api.nidusacademy.com/api" : "/api";
  if (configured === "/api" || configured.endsWith("/api")) return configured;
  if (configured.startsWith("http://") || configured.startsWith("https://")) return `${configured}/api`;
  return configured;
}

export const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
const publicAuthPaths = new Set(["/", "/login", "/register", "/contact", "/forgot-password", "/reset-password", "/verify-email"]);

export function getStoredToken() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY) ?? undefined;
}

export function storeToken(token: string, remember = true) {
  if (typeof window === "undefined") return;
  const primary = remember ? window.localStorage : window.sessionStorage;
  const secondary = remember ? window.sessionStorage : window.localStorage;
  primary.setItem(TOKEN_KEY, token);
  secondary.removeItem(TOKEN_KEY);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json, text/plain",
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set?.("Authorization", `Bearer ${token}`);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      clearStoredToken();
      if (!publicAuthPaths.has(window.location.pathname)) {
        window.dispatchEvent(new CustomEvent("nidus:session-expired"));
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data && typeof error.response.data === "object" && "message" in error.response.data ? error.response.data.message : undefined;
    if (typeof message === "string") return message;
    if (error.code === "ERR_NETWORK" || !error.response) return "Backend is unavailable. Please try again after the API is online.";
    return error.message;
  }

  if (error instanceof Error) return error.message;
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

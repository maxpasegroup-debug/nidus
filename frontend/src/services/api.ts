import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const ACCESS_TOKEN_KEY = "nidus_access_token";
const REFRESH_TOKEN_KEY = "nidus_refresh_token";
const LEGACY_TOKEN_KEY = "nidus_token";

function normalizeApiUrl(value?: string) {
  const configured = value?.trim().replace(/\/+$/, "");
  if (!configured) return process.env.NODE_ENV === "production" ? "https://api.nidusacademy.com/api" : "/api";
  if (configured === "/api" || configured.endsWith("/api")) return configured;
  if (configured.startsWith("http://") || configured.startsWith("https://")) return `${configured}/api`;
  return configured;
}

type RefreshResponse = {
  success: true;
  accessToken: string;
  refreshToken: string;
};

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
const publicAuthPaths = new Set(["/", "/login", "/register", "/contact", "/forgot-password", "/reset-password", "/verify-email"]);

let refreshPromise: Promise<string | undefined> | undefined;

function browserStorage() {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function decodeJwtPayload(token: string): { exp?: number } | undefined {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))) as { exp?: number };
  } catch (_error) {
    return undefined;
  }
}

export function getStoredToken() {
  const storage = browserStorage();
  if (!storage) return undefined;
  return storage.getItem(ACCESS_TOKEN_KEY) ?? storage.getItem(LEGACY_TOKEN_KEY) ?? undefined;
}

export function getStoredRefreshToken() {
  return browserStorage()?.getItem(REFRESH_TOKEN_KEY) ?? undefined;
}

export function storeAuthTokens(accessToken: string, refreshToken: string) {
  const storage = browserStorage();
  if (!storage) return;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function storeToken(token: string) {
  const storage = browserStorage();
  if (!storage) return;
  storage.setItem(ACCESS_TOKEN_KEY, token);
  storage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function clearStoredToken() {
  const storage = browserStorage();
  if (!storage) return;
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function validateTokenExpiry(token?: string, skewSeconds = 30) {
  if (!token) return false;
  const exp = decodeJwtPayload(token)?.exp;
  if (!exp) return false;
  return exp * 1000 > Date.now() + skewSeconds * 1000;
}

function emitSessionExpired() {
  if (typeof window === "undefined") return;
  clearStoredToken();
  if (!publicAuthPaths.has(window.location.pathname)) {
    window.dispatchEvent(new CustomEvent("nidus:session-expired"));
  }
}

export async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken || !validateTokenExpiry(refreshToken, 0)) {
    emitSessionExpired();
    return undefined;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>(`${API_URL}/auth/refresh`, { refreshToken }, { headers: { "Content-Type": "application/json", Accept: "application/json" } })
      .then((response) => {
        if (!response.data?.accessToken || !response.data?.refreshToken) throw new Error("Refresh response is invalid.");
        storeAuthTokens(response.data.accessToken, response.data.refreshToken);
        return response.data.accessToken;
      })
      .catch(() => {
        emitSessionExpired();
        return undefined;
      })
      .finally(() => {
        refreshPromise = undefined;
      });
  }

  return refreshPromise;
}

export function clearAllAuth() {
  clearStoredToken();
  emitSessionExpired();
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json, text/plain",
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(async (config) => {
  let token = getStoredToken();
  if (token && !validateTokenExpiry(token)) {
    token = await refreshAccessToken();
  }

  if (token) {
    config.headers.set?.("Authorization", `Bearer ${token}`);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh")) {
      originalRequest._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        originalRequest.headers.set?.("Authorization", `Bearer ${token}`);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }
    }

    if (typeof window !== "undefined" && error.response?.status === 401) {
      emitSessionExpired();
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const message = data && typeof data === "object" && "message" in data ? data.message : undefined;
    const code = data && typeof data === "object" && "code" in data ? data.code : undefined;
    if (typeof message === "string" && typeof code === "string") return `${message} (${code})`;
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

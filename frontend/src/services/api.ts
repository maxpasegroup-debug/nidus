import axios, { AxiosError } from "axios";

function normalizeApiUrl(value?: string) {
  const configured = value?.trim().replace(/\/+$/, "");
  if (!configured || (configured === "/api" && process.env.NODE_ENV === "production")) {
    return process.env.NODE_ENV === "production" ? "https://api.nidusacademy.com/api" : "/api";
  }
  if (configured === "/api" || configured.endsWith("/api")) return configured;
  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return `${configured.replace(/\/$/, "")}/api`;
  }
  return configured;
}

export const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME?.trim() || "nidus_csrf";
const publicAuthPaths = new Set(["/", "/login", "/register", "/contact", "/forgot-password", "/reset-password", "/verify-email"]);
const unsafeMethods = new Set(["post", "put", "patch", "delete"]);
let csrfBootstrapPromise: Promise<string | undefined> | null = null;

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json, text/plain",
    "Content-Type": "application/json"
  }
});

async function ensureCsrfToken() {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return decodeURIComponent(existing);

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = apiClient
      .get<{ csrfToken?: string }>("/auth/csrf")
      .then((response) => response.data.csrfToken ?? readCookie(CSRF_COOKIE_NAME))
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }

  const token = await csrfBootstrapPromise;
  return token ? decodeURIComponent(token) : undefined;
}

apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  if (typeof window !== "undefined" && method && unsafeMethods.has(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      config.headers.set?.("X-CSRF-Token", csrfToken);
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh")) {
      originalRequest._retry = true;
      try {
        await apiClient.post("/auth/refresh");
        return apiClient(originalRequest);
      } catch (_refreshError) {
        // Fall through to normal session-expired handling.
      }
    }

    if (typeof window !== "undefined" && error.response?.status === 401) {
      document.cookie = "nidus_auth=; path=/; max-age=0; samesite=lax";
      if (!publicAuthPaths.has(window.location.pathname)) {
        window.dispatchEvent(new CustomEvent("nidus:session-expired"));
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (error.code === "ERR_NETWORK" || !error.response) {
      return "Backend is unavailable. Start the API server and try again.";
    }

    return error.message;
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

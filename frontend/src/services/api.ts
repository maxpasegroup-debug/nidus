import axios, { AxiosError, type AxiosInstance } from "axios";

function resolveApiUrl() {
  if (typeof window !== "undefined") return "";
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl;
  return "";
}

export const API_URL = resolveApiUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL ? (API_URL.endsWith("/api") ? API_URL : `${API_URL.replace(/\/+$/, "")}/api`) : "/api",
  withCredentials: true,
  headers: {
    Accept: "application/json, text/plain",
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.dispatchEvent(new CustomEvent("nidus:session-expired"));
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const message = data && typeof data === "object" && "message" in data ? data.message : undefined;
    if (typeof message === "string") return message;
    if (error.code === "ERR_NETWORK" || !error.response) return "Backend is unavailable. Please try again after the API is online.";
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function clearStoredToken() {
  return undefined;
}

export async function storeToken(_token: string) {
  return undefined;
}

export function getStoredToken() {
  return undefined;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiClient.get<T>(path);
  return response.data;
}

export async function apiGetText(path: string): Promise<string> {
  const response = await apiClient.get(path, {
    responseType: "text",
    transformResponse: [(data) => data]
  });
  return response.data;
}

export async function getBackendHealth(): Promise<string> {
  return apiGetText("/health");
}

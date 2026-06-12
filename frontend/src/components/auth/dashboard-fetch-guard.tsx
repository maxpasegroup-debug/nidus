"use client";

import { ReactNode, useEffect } from "react";

const TOKEN_KEYS = ["token", "accessToken", "authToken", "nidus_token"];

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  return null;
}

function isInternalApiRequest(input: RequestInfo | URL) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return url.startsWith("/api/") || url.includes("/api/");
}

export function DashboardFetchGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isInternalApiRequest(input)) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers);
      const token = getStoredToken();

      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return originalFetch(input, {
        ...init,
        credentials: init?.credentials ?? "include",
        headers,
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return children;
}

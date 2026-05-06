"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AUTH_TOKEN_KEY, getApiErrorMessage } from "@/services/api";
import * as authApi from "@/services/auth";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@/services/auth";
import { useToast } from "@/components/providers/toast-provider";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  sendOtp: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  forgotPassword: (identifier: string) => Promise<void>;
  resetPassword: (resetToken: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function setAuthCookie(isAuthenticated: boolean) {
  if (isAuthenticated) {
    document.cookie = "nidus_auth=1; path=/; max-age=604800; samesite=lax";
    return;
  }

  document.cookie = "nidus_auth=; path=/; max-age=0; samesite=lax";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuth = useCallback(
    (response: AuthResponse, message: string) => {
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      setAuthCookie(true);
      setToken(response.token);
      setUser(response.user);
      showToast(message, "success");
      router.replace("/dashboard");
    },
    [router, showToast]
  );

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthCookie(false);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

      if (!storedToken) {
        setAuthCookie(false);
        setIsLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        setAuthCookie(true);
      } catch (_error) {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      async register(payload) {
        try {
          const response = await authApi.register(payload);
          applyAuth(response, "Account created successfully");
        } catch (error) {
          showToast(getApiErrorMessage(error), "error");
          throw error;
        }
      },
      async login(payload) {
        try {
          const response = await authApi.login(payload);
          applyAuth(response, "Login successful");
        } catch (error) {
          showToast(getApiErrorMessage(error), "error");
          throw error;
        }
      },
      async sendOtp(mobile) {
        try {
          const response = await authApi.sendOtp(mobile);
          showToast(response.message || "OTP sent successfully", "info");
        } catch (error) {
          showToast(getApiErrorMessage(error), "error");
          throw error;
        }
      },
      async verifyOtp(mobile, otp) {
        try {
          const response = await authApi.verifyOtp(mobile, otp);
          applyAuth(response, "OTP verified successfully");
        } catch (error) {
          showToast(getApiErrorMessage(error), "error");
          throw error;
        }
      },
      async forgotPassword(identifier) {
        try {
          const response = await authApi.forgotPassword(identifier);
          showToast(response.message || "OTP sent successfully", "info");
        } catch (error) {
          showToast(getApiErrorMessage(error), "error");
          throw error;
        }
      },
      async resetPassword(resetToken, password) {
        try {
          const response = await authApi.resetPassword(resetToken, password);
          showToast(response.message || "Password reset successfully", "success");
          router.replace("/login");
        } catch (error) {
          showToast(getApiErrorMessage(error), "error");
          throw error;
        }
      },
      logout() {
        clearAuth();
        showToast("Logged out successfully", "success");
        router.replace("/login");
      }
    }),
    [applyAuth, clearAuth, isLoading, router, showToast, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

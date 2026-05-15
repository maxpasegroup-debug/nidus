"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/services/api";
import * as authApi from "@/services/auth";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@/services/auth";
import { useToast } from "@/components/providers/toast-provider";
import { roleDashboardPath } from "@/lib/dashboard-data";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  sendOtp: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  forgotPassword: (identifier: string) => Promise<void>;
  resetPassword: (resetToken: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  const applyAuth = useCallback(
    (response: AuthResponse, message: string) => {
      setUser(response.user);
      setAuthCookie(true);
      showToast(message, "success");
      router.replace(roleDashboardPath[response.user.role]);
    },
    [router, showToast]
  );

  const clearAuth = useCallback(() => {
    setAuthCookie(false);
    setUser(null);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
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

  useEffect(() => {
    function handleSessionExpired() {
      clearAuth();
      showToast("Session expired. Please log in again.", "error");
      router.replace("/login");
    }

    window.addEventListener("nidus:session-expired", handleSessionExpired);
    return () => window.removeEventListener("nidus:session-expired", handleSessionExpired);
  }, [clearAuth, router, showToast]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      async register(payload) {
        try {
          const response = await authApi.register(payload);
          if (response.user.emailVerified) {
            setUser(response.user);
            setAuthCookie(true);
            showToast(response.message || "Account created", "success");
            router.replace(roleDashboardPath[response.user.role]);
            return;
          }
          clearAuth();
          showToast("Account created. Verify your email before logging in.", "success");
          router.replace(`/verify-email?identifier=${encodeURIComponent(payload.email)}`);
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
      async logout() {
        await authApi.logout().catch(() => undefined);
        clearAuth();
        showToast("Logged out successfully", "success");
        router.replace("/login");
      }
    }),
    [applyAuth, clearAuth, isLoading, router, showToast, user]
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

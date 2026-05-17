"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getMe, logout as logoutApi, type AuthUser } from "@/services/auth.v2";
import { useToast } from "@/components/providers/toast-provider";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getMe();
      setUser(currentUser);
      return currentUser;
    } catch (_error) {
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi().catch(() => undefined);
    setUser(null);
    showToast("Logged out successfully", "success");
    router.replace("/login");
  }, [router, showToast]);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      if (!["/", "/login", "/register", "/contact", "/forgot-password", "/reset-password"].includes(window.location.pathname)) {
        showToast("Session expired. Please log in again.", "error");
        router.replace("/login");
      }
    }

    window.addEventListener("nidus:session-expired", handleSessionExpired);
    return () => window.removeEventListener("nidus:session-expired", handleSessionExpired);
  }, [router, showToast]);

  const value = useMemo(
    () => ({ user, loading, isLoading: loading, isAuthenticated: Boolean(user), refreshUser, logout }),
    [loading, logout, refreshUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

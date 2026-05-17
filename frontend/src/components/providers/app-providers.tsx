"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider-v2";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ToastProvider>
  );
}

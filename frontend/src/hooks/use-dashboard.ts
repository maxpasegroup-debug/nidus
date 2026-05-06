"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminDashboard,
  getGuestDashboard,
  getParentDashboard,
  getStudentDashboard
} from "@/services/dashboard";

export function useStudentDashboard() {
  return useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: getStudentDashboard
  });
}

export function useParentDashboard() {
  return useQuery({
    queryKey: ["dashboard", "parent"],
    queryFn: getParentDashboard
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: getAdminDashboard
  });
}

export function useGuestDashboard() {
  return useQuery({
    queryKey: ["dashboard", "guest"],
    queryFn: getGuestDashboard
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminDashboard,
  getGuestDashboard,
  getDirectorDashboard,
  getMarketingDashboard,
  getParentDashboard,
  getStudentDashboard,
  getTeacherDashboard,
  getTelecallerDashboard
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

export function useTeacherDashboard() {
  return useQuery({ queryKey: ["dashboard", "teacher"], queryFn: getTeacherDashboard });
}

export function useDirectorDashboard() {
  return useQuery({ queryKey: ["dashboard", "director"], queryFn: getDirectorDashboard });
}

export function useTelecallerDashboard() {
  return useQuery({ queryKey: ["dashboard", "telecaller"], queryFn: getTelecallerDashboard });
}

export function useMarketingDashboard() {
  return useQuery({ queryKey: ["dashboard", "marketing"], queryFn: getMarketingDashboard });
}

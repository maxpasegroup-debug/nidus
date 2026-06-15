"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminDashboard,
  getDirectorDashboard,
  getParentDashboard,
  getStudentDashboard,
  getTeacherDashboard,
  getBusinessDevelopmentDashboard
} from "@/services/dashboard";

export function useStudentDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: getStudentDashboard,
    enabled
  });
}

export function useParentDashboard(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "parent"],
    queryFn: getParentDashboard,
    enabled
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: getAdminDashboard
  });
}

export function useTeacherDashboard() {
  return useQuery({ queryKey: ["dashboard", "teacher"], queryFn: getTeacherDashboard });
}

export function useDirectorDashboard() {
  return useQuery({ queryKey: ["dashboard", "director"], queryFn: getDirectorDashboard });
}

export function useBusinessDevelopmentDashboard() {
  return useQuery({ queryKey: ["dashboard", "business-development"], queryFn: getBusinessDevelopmentDashboard });
}

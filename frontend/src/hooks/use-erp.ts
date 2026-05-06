"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createAnnouncement, createFaculty, createPayroll, createTimetable, getAnnouncements, getClassAttendance, getFaculty, getPayroll, getTimetable, markAttendance } from "@/services/erp";

function useToastMutation<TPayload, TResult>(mutationFn: (payload: TPayload) => Promise<TResult>, key: string[], message: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: key }); showToast(message, "success"); },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useAttendance() {
  return { ...useQuery({ queryKey: ["erp", "attendance"], queryFn: getClassAttendance }), mark: useToastMutation(markAttendance, ["erp", "attendance"], "Attendance marked") };
}
export function useTimetable() {
  return { ...useQuery({ queryKey: ["erp", "timetable"], queryFn: getTimetable }), create: useToastMutation(createTimetable, ["erp", "timetable"], "Class scheduled") };
}
export function useFaculty() {
  return { ...useQuery({ queryKey: ["erp", "faculty"], queryFn: getFaculty }), create: useToastMutation(createFaculty, ["erp", "faculty"], "Faculty added") };
}
export function usePayroll() {
  return { ...useQuery({ queryKey: ["erp", "payroll"], queryFn: getPayroll }), create: useToastMutation(createPayroll, ["erp", "payroll"], "Payroll created") };
}
export function useAnnouncements() {
  return { ...useQuery({ queryKey: ["erp", "announcements"], queryFn: getAnnouncements }), create: useToastMutation(createAnnouncement, ["erp", "announcements"], "Announcement published") };
}

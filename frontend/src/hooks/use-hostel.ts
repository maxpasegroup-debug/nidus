"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import {
  allocateHostel,
  createDiscipline,
  createHostel,
  createInOut,
  createLeave,
  createMessMenu,
  createParadePerformance,
  createRoom,
  getDisciplineByStudent,
  getHostels,
  getInOutHistory,
  getLeaves,
  getMessMenu,
  getParadeByStudent,
  getRooms,
  updateLeave
} from "@/services/hostel";

function useToastMutation<TPayload, TResult>(mutationFn: (payload: TPayload) => Promise<TResult>, keys: unknown[][], message: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      showToast(message, "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useHostels() {
  return { ...useQuery({ queryKey: ["hostel", "hostels"], queryFn: getHostels }), create: useToastMutation(createHostel, [["hostel", "hostels"]], "Hostel created") };
}

export function useRooms(hostelId?: string) {
  return { ...useQuery({ queryKey: ["hostel", "rooms", hostelId], queryFn: () => getRooms(hostelId) }), create: useToastMutation(createRoom, [["hostel", "rooms", hostelId], ["hostel", "hostels"]], "Room added") };
}

export function useAllocations() {
  return { allocate: useToastMutation(allocateHostel, [["hostel", "rooms", undefined], ["hostel", "hostels"]], "Cadet allocated") };
}

export function useInOut(studentId?: string) {
  return { ...useQuery({ queryKey: ["hostel", "inout", studentId], queryFn: () => getInOutHistory(studentId) }), create: useToastMutation(createInOut, [["hostel", "inout", studentId]], "Movement logged") };
}

export function useHostelLeave() {
  return {
    ...useQuery({ queryKey: ["hostel", "leave"], queryFn: getLeaves }),
    create: useToastMutation(createLeave, [["hostel", "leave"]], "Leave request submitted"),
    update: useToastMutation(updateLeave, [["hostel", "leave"]], "Leave status updated")
  };
}

export function useMessMenu() {
  return { ...useQuery({ queryKey: ["hostel", "mess"], queryFn: getMessMenu }), create: useToastMutation(createMessMenu, [["hostel", "mess"]], "Mess menu saved") };
}

export function useDiscipline(studentId?: string) {
  return {
    ...useQuery({ queryKey: ["hostel", "discipline", studentId], queryFn: () => studentId ? getDisciplineByStudent(studentId) : Promise.resolve([]) }),
    create: useToastMutation(createDiscipline, [["hostel", "discipline", studentId]], "Discipline record added")
  };
}

export function useParadePerformance(studentId?: string) {
  return {
    ...useQuery({ queryKey: ["hostel", "parade", studentId], queryFn: () => studentId ? getParadeByStudent(studentId) : Promise.resolve([]) }),
    create: useToastMutation(createParadePerformance, [["hostel", "parade", studentId]], "Parade performance recorded")
  };
}

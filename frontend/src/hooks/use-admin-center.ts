"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createBranch, createRole, createUser, deleteRole, getAdminDashboard, getAdminOperations, getAuditLogs, getBranches, getPermissions, getRoles, getSettings, getUsers, updateRole, updateSettings } from "@/services/admin-center";

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

export function useAdminDashboard() {
  return useQuery({ queryKey: ["admin-center", "dashboard"], queryFn: getAdminDashboard });
}

export function useAdminOperations() {
  return useQuery({ queryKey: ["admin-center", "operations"], queryFn: getAdminOperations, refetchInterval: 30000 });
}

export function useRoles() {
  return {
    ...useQuery({ queryKey: ["admin-center", "roles"], queryFn: getRoles }),
    create: useToastMutation(createRole, [["admin-center", "roles"], ["admin-center", "dashboard"], ["admin-center", "audit-logs"]], "Role created"),
    update: useToastMutation(updateRole, [["admin-center", "roles"], ["admin-center", "audit-logs"]], "Role updated"),
    remove: useToastMutation(deleteRole, [["admin-center", "roles"], ["admin-center", "dashboard"], ["admin-center", "audit-logs"]], "Role deleted")
  };
}

export function usePermissions() {
  return useQuery({ queryKey: ["admin-center", "permissions"], queryFn: getPermissions });
}

export function useSettings() {
  return {
    ...useQuery({ queryKey: ["admin-center", "settings"], queryFn: getSettings }),
    update: useToastMutation(updateSettings, [["admin-center", "settings"], ["admin-center", "audit-logs"]], "Settings updated")
  };
}

export function useAuditLogs(filters?: { module?: string; action?: string; search?: string }) {
  return useQuery({ queryKey: ["admin-center", "audit-logs", filters], queryFn: () => getAuditLogs(filters) });
}

export function useBranches() {
  return {
    ...useQuery({ queryKey: ["admin-center", "branches"], queryFn: getBranches }),
    create: useToastMutation(createBranch, [["admin-center", "branches"], ["admin-center", "dashboard"], ["admin-center", "audit-logs"]], "Branch created")
  };
}

export function useUsers() {
  return {
    ...useQuery({ queryKey: ["admin-center", "users"], queryFn: getUsers }),
    create: useToastMutation(createUser, [["admin-center", "users"], ["admin-center", "dashboard"], ["admin-center", "audit-logs"]], "User created")
  };
}

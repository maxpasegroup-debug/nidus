"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createBranch, createRole, deleteRole, getAdminDashboard, getAuditLogs, getBranches, getPermissions, getRoles, getSettings, updateRole, updateSettings } from "@/services/admin-center";

function toastMutation<TPayload, TResult>(mutationFn: (payload: TPayload) => Promise<TResult>, keys: unknown[][], message: string) {
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

export function useRoles() {
  return {
    ...useQuery({ queryKey: ["admin-center", "roles"], queryFn: getRoles }),
    create: toastMutation(createRole, [["admin-center", "roles"], ["admin-center", "dashboard"], ["admin-center", "audit-logs"]], "Role created"),
    update: toastMutation(updateRole, [["admin-center", "roles"], ["admin-center", "audit-logs"]], "Role updated"),
    remove: toastMutation(deleteRole, [["admin-center", "roles"], ["admin-center", "dashboard"], ["admin-center", "audit-logs"]], "Role deleted")
  };
}

export function usePermissions() {
  return useQuery({ queryKey: ["admin-center", "permissions"], queryFn: getPermissions });
}

export function useSettings() {
  return {
    ...useQuery({ queryKey: ["admin-center", "settings"], queryFn: getSettings }),
    update: toastMutation(updateSettings, [["admin-center", "settings"], ["admin-center", "audit-logs"]], "Settings updated")
  };
}

export function useAuditLogs(filters?: { module?: string; action?: string; search?: string }) {
  return useQuery({ queryKey: ["admin-center", "audit-logs", filters], queryFn: () => getAuditLogs(filters) });
}

export function useBranches() {
  return {
    ...useQuery({ queryKey: ["admin-center", "branches"], queryFn: getBranches }),
    create: toastMutation(createBranch, [["admin-center", "branches"], ["admin-center", "dashboard"], ["admin-center", "audit-logs"]], "Branch created")
  };
}

import { apiClient } from "@/services/api";
import type { AdminDashboard, AdminRole, AuditLog, Branch, Permission, SystemSetting } from "@/types/admin-center";

export async function getAdminDashboard() {
  return (await apiClient.get<{ dashboard: AdminDashboard }>("/admin")).data.dashboard;
}

export async function getRoles() {
  return (await apiClient.get<{ roles: AdminRole[] }>("/admin/roles")).data.roles;
}

export async function createRole(payload: { name: string; description?: string; permissionIds?: string[] }) {
  return (await apiClient.post<{ role: AdminRole }>("/admin/roles", payload)).data.role;
}

export async function updateRole(payload: { id: string; name: string; description?: string; permissionIds?: string[] }) {
  const { id, ...body } = payload;
  return (await apiClient.put<{ role: AdminRole }>(`/admin/roles/${id}`, body)).data.role;
}

export async function deleteRole(id: string) {
  return (await apiClient.delete<{ message: string }>(`/admin/roles/${id}`)).data;
}

export async function getPermissions() {
  return (await apiClient.get<{ permissions: Permission[] }>("/admin/permissions")).data.permissions;
}

export async function assignUserRole(payload: { userId: string; roleId: string }) {
  return (await apiClient.post("/admin/user-role", payload)).data;
}

export async function getSettings() {
  return (await apiClient.get<{ settings: SystemSetting[] }>("/admin/settings")).data.settings;
}

export async function updateSettings(settings: Array<{ key: string; value: string; category: string }>) {
  return (await apiClient.put<{ settings: SystemSetting[] }>("/admin/settings", { settings })).data.settings;
}

export async function getAuditLogs(params?: { module?: string; action?: string; search?: string }) {
  return (await apiClient.get<{ auditLogs: AuditLog[] }>("/admin/audit-logs", { params })).data.auditLogs;
}

export async function getBranches() {
  return (await apiClient.get<{ branches: Branch[] }>("/admin/branches")).data.branches;
}

export async function createBranch(payload: { name: string; location: string; contactNumber: string }) {
  return (await apiClient.post<{ branch: Branch }>("/admin/branches", payload)).data.branch;
}

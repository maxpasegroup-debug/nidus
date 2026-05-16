export type Permission = {
  id: string;
  name: string;
  module: string;
  action: string;
  createdAt: string;
};

export type AdminRole = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  permissions: Array<{ id: string; permission: Permission }>;
  _count?: { users: number };
};

export type SystemSetting = {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  userId?: string | null;
  action: string;
  module: string;
  description: string;
  ipAddress?: string | null;
  createdAt: string;
  user?: { name: string; email: string; role: string } | null;
};

export type Branch = {
  id: string;
  name: string;
  location: string;
  contactNumber: string;
  createdAt: string;
};

export type AdminDashboard = {
  health: Record<string, string>;
  totals: {
    roles: number;
    permissions: number;
    settings: number;
    branches: number;
    users: number;
  };
  recentActions: AuditLog[];
};

export type AdminOperations = {
  runtime: {
    phase: string;
    ready: boolean;
    startedAt: string;
    uptimeSeconds: number;
    lastError?: string | null;
  };
  environment: Record<string, string | boolean | number>;
  infrastructure: Record<string, string | number>;
  queueHealth: Array<{
    queueName: string;
    status: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }>;
  analytics: Record<string, number>;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  instituteId?: string | null;
  branchId?: string | null;
  roleMetadata?: Record<string, unknown> | null;
  roleOnboardingStatus?: string;
  createdAt: string;
  updatedAt: string;
};

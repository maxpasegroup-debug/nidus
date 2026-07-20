import type { TopRankRole } from "../../generated/prisma/client.js";
import type { Request } from "express";

export type TopRankSafeUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TopRankRole;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type TopRankAuthenticatedRequest = Request & {
  topRankUser?: TopRankSafeUser;
};

export type TopRankRegisterInput = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  state?: string;
  district?: string;
  language?: string;
  acceptTerms?: boolean;
};

export type TopRankLoginInput = {
  email?: string;
  password?: string;
  rememberMe?: boolean;
};

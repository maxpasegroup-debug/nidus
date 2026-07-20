export const TOPRANK_ROLES = ["TOPRANK_STUDENT", "TOPRANK_MENTOR", "TOPRANK_ADMIN", "TOPRANK_SUPER_ADMIN"] as const;

export type TopRankRole = (typeof TOPRANK_ROLES)[number];

export type TopRankGatewayStatus = "ADMISSIONS_OPEN" | "COMING_SOON";

export type TopRankGateway = {
  id: string;
  title: string;
  slug: string;
  badge: string;
  description: string;
  status: TopRankGatewayStatus;
  href: string;
  symbol: string;
};

export type TopRankUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TopRankRole;
};

export type TopRankAuthLoginDto = {
  email: string;
  password: string;
};

export type TopRankAuthRegisterDto = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type TopRankProgram = {
  id: string;
  gatewayId: string;
  title: string;
  duration: string;
  fee: string;
  status: "DRAFT" | "ACTIVE" | "COMING_SOON";
};

export type TopRankDashboardCard = {
  title: string;
  description: string;
  status?: string;
  href?: string;
};

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import jwt from "jsonwebtoken";

type UserRole = "STUDENT" | "PARENT" | "ADMIN" | "DIRECTOR" | "TEACHER" | "FACULTY" | "WARDEN" | "COUNSELLOR" | "STAFF" | "TRAINER" | "GUEST";

type DemoUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: UserRole;
  emailVerified: boolean;
  mobileVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AuthUser = Omit<DemoUser, "password">;

type JwtPayload = {
  sub?: string;
  role?: string;
};

const backendEnv = loadBackendEnv();
const jwtSecret = process.env.JWT_SECRET ?? backendEnv.JWT_SECRET;
const seededAt = new Date("2026-05-06T00:00:00.000Z");
const updatedAt = new Date("2026-05-07T00:00:00.000Z");
const demoPassword = "Nidus@Demo2026";

const demoUsers: DemoUser[] = [
  { id: "demo-command-admin", name: "Command Admin", email: "command@nidusacademy.com", mobile: "+919900000001", role: "ADMIN", password: "Nidus@Command2026", emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-director-academics", name: "Col. Aditi Rao", email: "director.academics@nidusacademy.com", mobile: "+919900000002", role: "DIRECTOR", password: "Nidus@Director2026", emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-faculty-ssb", name: "Maj. Vikram SSB", email: "faculty.ssb@nidusacademy.com", mobile: "+919900000003", role: "TEACHER", password: "Nidus@Teacher2026", emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-cadet-arjun", name: "Cadet Arjun Mehra", email: "cadet.arjun@nidusacademy.com", mobile: "+919900000004", role: "STUDENT", password: "Nidus@Cadet2026", emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-parent-arjun", name: "Rajiv Mehra", email: "parent.arjun@nidusacademy.com", mobile: "+919900000005", role: "PARENT", password: "Nidus@Parent2026", emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-explorer", name: "NIDUS Explorer", email: "explore@nidusacademy.com", mobile: "+919900000006", role: "GUEST", password: "Nidus@Guest2026", emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-cadet-meera", name: "Cadet Meera Nair", email: "cadet.meera@nidusacademy.com", mobile: "+919900000007", role: "STUDENT", password: demoPassword, emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-cadet-kabir", name: "Cadet Kabir Singh", email: "cadet.kabir@nidusacademy.com", mobile: "+919900000008", role: "STUDENT", password: demoPassword, emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-cadet-zoya", name: "Cadet Zoya Khan", email: "cadet.zoya@nidusacademy.com", mobile: "+919900000009", role: "STUDENT", password: demoPassword, emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt },
  { id: "demo-cadet-rohan", name: "Cadet Rohan Iyer", email: "cadet.rohan@nidusacademy.com", mobile: "+919900000010", role: "STUDENT", password: demoPassword, emailVerified: true, mobileVerified: true, createdAt: seededAt, updatedAt }
];

function loadBackendEnv() {
  const envPath = join(process.cwd(), "..", "backend", ".env");

  if (!existsSync(envPath)) {
    return {} as Record<string, string>;
  }

  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      })
  );
}

function getJwtSecret() {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwtSecret;
}

function sanitizeUser(user: DemoUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    emailVerified: user.emailVerified,
    mobileVerified: user.mobileVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function signAuthToken(user: Pick<DemoUser, "id" | "role">) {
  return jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), {
    expiresIn: "8h"
  });
}

export async function loginWithPassword(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const user = demoUsers.find((account) => account.email.toLowerCase() === normalizedIdentifier || account.mobile === identifier.trim());

  if (!user || user.password !== password) {
    throw new Error("Invalid credentials");
  }

  return {
    token: signAuthToken(user),
    user: sanitizeUser(user)
  };
}

export async function getUserFromToken(token: string) {
  const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;

  if (!payload.sub) {
    throw new Error("Unauthorized");
  }

  const user = demoUsers.find((account) => account.id === payload.sub);

  if (!user) {
    throw new Error("User not found");
  }

  return sanitizeUser(user);
}

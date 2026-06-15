import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { Role } from "../../generated/prisma/client.js";
import { AuthServiceV2 } from "./auth.v2.service.js";
import { sessionIdFromRequest, type AuthenticatedRequest } from "../../middlewares/session.middleware.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
};

function clearSessionCookie(res: Response) {
  res.clearCookie("session", { path: "/" });
}

export const authControllerV2 = {
  async signup(req: Request, res: Response) {
    try {
      const { name, email, mobile, password } = req.body as { name?: string; email?: string; mobile?: string; password?: string };
      if (!name || !email || !mobile || !password || password.length < 8) {
        res.status(400).json({ success: false, message: "Name, email, mobile, and 8 character password are required" });
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedMobile = mobile.trim().replace(/[\s()-]/g, "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        res.status(400).json({ success: false, message: "Valid email is required" });
        return;
      }
      if (!/^\+?\d{7,15}$/.test(normalizedMobile)) {
        res.status(400).json({ success: false, message: "Valid mobile number is required" });
        return;
      }
      const mobileDigits = normalizedMobile.replace(/^\+/, "");
      const mobileMatches = new Set([normalizedMobile]);
      if (/^\d{10}$/.test(mobileDigits)) {
        mobileMatches.add(mobileDigits);
        mobileMatches.add(`+91${mobileDigits}`);
      }
      const existing = await prisma.user.findFirst({ where: { OR: [{ email: normalizedEmail }, { mobile: { in: Array.from(mobileMatches) } }] }, select: { email: true, mobile: true } });
      if (existing?.email === normalizedEmail) {
        res.status(409).json({ success: false, message: "Email is already registered" });
        return;
      }
      if (existing?.mobile && mobileMatches.has(existing.mobile)) {
        res.status(409).json({ success: false, message: "Mobile number is already registered" });
        return;
      }

      await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          mobile: normalizedMobile,
          password: await bcrypt.hash(password, 12),
          role: Role.STUDENT,
          emailVerified: true,
          mobileVerified: false,
          roleOnboardingStatus: "ACTIVE",
          roleActivatedAt: new Date(),
          lastRoleActivityAt: new Date()
        }
      });

      const result = await AuthServiceV2.login(normalizedEmail, password, req.ip || "", req.get("user-agent") || "");
      res.cookie("session", result.sessionId, cookieOptions);
      res.status(201).json({ success: true, message: "Account created", user: result.user });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Signup failed" });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { identifier, password } = req.body as { identifier?: string; password?: string };
      if (!identifier || !password) {
        res.status(400).json({ success: false, message: "Email/mobile and password are required" });
        return;
      }

      const result = await AuthServiceV2.login(identifier, password, req.ip || "", req.get("user-agent") || "");
      res.cookie("session", result.sessionId, cookieOptions);
      res.json({ success: true, message: "Login successful", user: result.user });
    } catch (error) {
      res.status(401).json({ success: false, message: error instanceof Error ? error.message : "Login failed" });
    }
  },

  async logout(req: Request, res: Response) {
    const sessionId = sessionIdFromRequest(req);
    if (sessionId) await AuthServiceV2.logout(sessionId);
    clearSessionCookie(res);
    res.json({ success: true, message: "Logged out" });
  },

  async logoutAll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }
      await AuthServiceV2.logoutAll(req.user.id);
      clearSessionCookie(res);
      res.json({ success: true, message: "Logged out from all devices" });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Logout failed" });
    }
  },

  async me(req: AuthenticatedRequest, res: Response) {
    res.json({ success: true, user: req.user });
  },

  async sessions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }
      res.json({ success: true, sessions: await AuthServiceV2.listSessions(req.user.id) });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Could not load sessions" });
    }
  },

  async revokeSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated" });
        return;
      }
      const sessionTokenId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      res.json({ success: true, ...(await AuthServiceV2.revokeSession(req.user.id, sessionTokenId)) });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Could not revoke session" });
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
      if (!req.user || !currentPassword || !newPassword || newPassword.length < 8) {
        res.status(400).json({ success: false, message: "Current password and 8 character new password are required" });
        return;
      }
      const result = await AuthServiceV2.changePassword(req.user.id, currentPassword, newPassword);
      clearSessionCookie(res);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Password change failed" });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email, identifier } = req.body as { email?: string; identifier?: string };
      const identity = identifier || email;
      if (!identity) {
        res.status(400).json({ success: false, message: "Email or mobile number is required" });
        return;
      }
      res.json({ success: true, ...(await AuthServiceV2.forgotPassword(identity)) });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Password reset request failed" });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body as { token?: string; password?: string };
      if (!token || !password || password.length < 8) {
        res.status(400).json({ success: false, message: "Reset token and 8 character password are required" });
        return;
      }
      res.json({ success: true, ...(await AuthServiceV2.resetPassword(token, password)) });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Password reset failed" });
    }
  },

  async inviteParentLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { parentIdentity } = req.body as { parentIdentity?: string };
      if (!req.user || !parentIdentity) {
        res.status(400).json({ success: false, message: "Parent email or mobile is required" });
        return;
      }
      res.json({ success: true, ...(await AuthServiceV2.inviteParentLink(req.user.id, parentIdentity)) });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Parent invitation failed" });
    }
  },

  async acceptParentLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { token } = req.body as { token?: string };
      if (!req.user || !token) {
        res.status(400).json({ success: false, message: "Parent invitation token is required" });
        return;
      }
      res.json({ success: true, ...(await AuthServiceV2.acceptParentLink(req.user.id, token)) });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Parent link failed" });
    }
  }
};

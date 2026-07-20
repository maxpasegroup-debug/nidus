import type { NextFunction, Request, Response } from "express";
import { TopRankRole } from "../../generated/prisma/client.js";
import { topRankAuthService } from "./toprank-auth.service.js";
import { topRankAssessmentService } from "./toprank-assessment.service.js";
import { topRankBatchService } from "./toprank-batch.service.js";
import { topRankEnrollmentService } from "./toprank-enrollment.service.js";
import { topRankProfileService } from "./toprank-profile.service.js";
import { TOPRANK_SESSION_COOKIE, topRankSessionFromRequest } from "./toprank.middleware.js";
import type { TopRankAuthenticatedRequest } from "./toprank.types.js";
import { topRankUserService } from "./toprank-user.service.js";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge,
    path: "/"
  };
}

function asyncHandler(fn: (req: TopRankAuthenticatedRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as TopRankAuthenticatedRequest, res).catch(next);
  };
}

export const topRankController = {
  register: asyncHandler(async (req, res) => {
    const result = await topRankAuthService.register(req.body, { ip: req.ip, userAgent: req.get("user-agent") });
    res.cookie(TOPRANK_SESSION_COOKIE, result.session.token, cookieOptions(result.session.maxAge));
    res.status(201).json({ success: true, user: result.user, verification: "placeholder", redirectTo: "/toprank/onboarding" });
  }),

  login: asyncHandler(async (req, res) => {
    const result = await topRankAuthService.login(req.body, { ip: req.ip, userAgent: req.get("user-agent") });
    res.cookie(TOPRANK_SESSION_COOKIE, result.session.token, cookieOptions(result.session.maxAge));
    const redirectTo = result.user.role === TopRankRole.TOPRANK_STUDENT ? "/toprank/onboarding" : result.user.role === TopRankRole.TOPRANK_MENTOR ? "/toprank/mentor" : "/toprank/admin";
    res.json({ success: true, user: result.user, redirectTo });
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ success: true, user: req.topRankUser });
  }),

  logout: asyncHandler(async (req, res) => {
    await topRankAuthService.logout(topRankSessionFromRequest(req));
    res.clearCookie(TOPRANK_SESSION_COOKIE, { path: "/" });
    res.json({ success: true, message: "Logged out from TopRank" });
  }),

  forgotPassword: asyncHandler(async (_req, res) => {
    res.json({ success: true, ...topRankAuthService.forgotPasswordMessage() });
  }),

  changePassword: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) throw new Error("Current password and new password are required");
    const result = await topRankAuthService.changePassword(req.topRankUser.id, currentPassword, newPassword);
    res.clearCookie(TOPRANK_SESSION_COOKIE, { path: "/" });
    res.json({ success: true, ...result });
  }),

  updateContact: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    res.json({ success: true, user: await topRankAuthService.updateContact(req.topRankUser.id, req.body) });
  }),

  batches: asyncHandler(async (_req, res) => {
    res.json({ success: true, batches: await topRankBatchService.listAvailableBatches() });
  }),

  onboarding: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    res.json({ success: true, ...(await topRankEnrollmentService.getStatus(req.topRankUser.id)) });
  }),

  saveProfile: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    const profile = await topRankProfileService.upsert(req.topRankUser.id, req.body);
    res.json({ success: true, profile });
  }),

  selectBatch: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    const { batchId } = req.body as { batchId?: string };
    if (!batchId) throw new Error("Select a TopRank batch");
    res.json({ success: true, enrollment: await topRankEnrollmentService.selectBatch(req.topRankUser.id, batchId) });
  }),

  acceptAgreement: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    const { accepted } = req.body as { accepted?: boolean };
    if (!accepted) throw new Error("Digital agreement acceptance is required");
    res.json({ success: true, agreement: await topRankEnrollmentService.acceptAgreement(req.topRankUser.id, { ip: req.ip, userAgent: req.get("user-agent") }) });
  }),

  completeEnrollment: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    res.json({ success: true, enrollment: await topRankEnrollmentService.complete(req.topRankUser.id) });
  }),

  students: asyncHandler(async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q : undefined;
    res.json({ success: true, students: await topRankUserService.listStudents(query) });
  }),

  mentorBatches: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    res.json({ success: true, batches: await topRankUserService.listMentorBatches(req.topRankUser.id) });
  }),

  assessmentStatus: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    const latest = await topRankAssessmentService.latest(req.topRankUser.id);
    res.json({ success: true, completed: Boolean(latest.assessment), ...latest });
  }),

  submitAssessment: asyncHandler(async (req, res) => {
    if (!req.topRankUser) throw new Error("TopRank login required");
    res.status(201).json({ success: true, ...(await topRankAssessmentService.submit(req.topRankUser.id, req.body)) });
  })
};

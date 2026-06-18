import { prisma } from "../../config/prisma.js";

export const assessmentReportVersionService = {
  async nextVersion(input: { attemptId: string; audience: string }) {
    const latest = await prisma.assessmentReportSnapshot.findUnique({
      where: { attemptId_audience: { attemptId: input.attemptId, audience: input.audience } },
      select: { report: true }
    });
    const report = latest?.report;
    const currentVersion = report && typeof report === "object" && !Array.isArray(report) && "metadata" in report
      ? Number((report.metadata as { version?: unknown } | undefined)?.version)
      : 0;
    return Number.isFinite(currentVersion) ? currentVersion + 1 : 1;
  },

  async versions(reportId: string) {
    const report = await prisma.assessmentReportSnapshot.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("Assessment report not found");
    const reportBody = report.report;
    const metadata = reportBody && typeof reportBody === "object" && !Array.isArray(reportBody) && "metadata" in reportBody
      ? reportBody.metadata as Record<string, unknown>
      : {};
    return [{
      id: report.id,
      version: Number(metadata.version ?? 1),
      audience: report.audience,
      assessmentVersion: Number(metadata.assessmentVersion ?? 1),
      scoringVersion: String(metadata.scoringVersion ?? "v2-foundation-1"),
      generatedAt: report.createdAt,
      createdAt: report.createdAt
    }];
  }
};

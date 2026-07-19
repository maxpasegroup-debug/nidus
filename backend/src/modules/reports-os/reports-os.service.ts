import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { enqueuePDF } from "../../queues/pdf.queue.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type ReportsActor = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  roleMetadata?: Record<string, unknown> | null;
};

type ReportPeriod = "DAILY" | "WEEKLY" | "MONTHLY";

type CalendarCountRow = {
  planned: bigint | number;
  completed: bigint | number;
};

type ReportSection = {
  title: string;
  metrics: Array<{ label: string; value: string | number; status: "GOOD" | "WATCH" | "ACTION" }>;
};

const reportRoles = new Set<Role>([
  Role.ADMIN,
  Role.DIRECTOR,
  Role.ACADEMIC_HEAD,
  Role.TEACHER,
  Role.ADMINISTRATIVE_OFFICER,
  Role.BUSINESS_DEVELOPMENT_EXECUTIVE,
  Role.TELECALLER,
  Role.MARKETING_COORDINATOR
]);

const framework = [
  { key: "DAILY_REPORT", label: "Daily Report", source: "Today operations, classes, admissions, fees, events and feedback" },
  { key: "WEEKLY_REPORT", label: "Weekly Report", source: "7-day trends across academics, admissions, finance and operations" },
  { key: "MONTHLY_REPORT", label: "Monthly Report", source: "Month-to-date academy health, revenue, student activity and risks" },
  { key: "WHATSAPP_SUMMARY", label: "WhatsApp Summary", source: "Short report text generated from the same report contract" },
  { key: "DASHBOARD_LINK", label: "Dashboard Link", source: "Stable drill-down route for detailed review" },
  { key: "PDF_QUEUE", label: "PDF Queue", source: "Existing PDF queue; optional when Redis is available" },
  { key: "DRILL_DOWN_COMMANDS", label: "Drill-down Commands", source: "Simple command labels for WhatsApp and Director review" },
  { key: "AI_RECOMMENDATIONS", label: "AI Recommendations", source: "Rule-based operating recommendations using current records" },
  { key: "APPROVAL_BUTTONS", label: "Approval Buttons", source: "Guarded suggested actions only; no automatic sensitive execution" }
] as const;

function requireReports(actor: ReportsActor) {
  const template = typeof actor.roleMetadata?.dashboardTemplate === "string" ? actor.roleMetadata.dashboardTemplate.toUpperCase() : "";
  if (!reportRoles.has(actor.role) && template !== "ACADEMIC_HEAD" && template !== "ADMINISTRATION") {
    throw Object.assign(new Error("Reports OS access required"), { statusCode: 403 });
  }
}

function periodWindow(period: ReportPeriod) {
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  if (period === "WEEKLY") {
    start.setDate(start.getDate() - 6);
  }
  if (period === "MONTHLY") {
    start.setDate(1);
  }
  return { start, end, period };
}

function formatMoney(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function num(value: bigint | number | null | undefined) {
  return Number(value ?? 0);
}

function statusFrom(value: number, good = 80, watch = 60): "GOOD" | "WATCH" | "ACTION" {
  if (value >= good) return "GOOD";
  if (value >= watch) return "WATCH";
  return "ACTION";
}

function parseFeedbackRating(description: string) {
  try {
    const parsed = JSON.parse(description) as { feedback?: { starRating?: number } };
    return typeof parsed.feedback?.starRating === "number" ? parsed.feedback.starRating : null;
  } catch {
    return null;
  }
}

function average(values: number[]) {
  const real = values.filter((value) => Number.isFinite(value));
  return real.length ? Math.round((real.reduce((sum, value) => sum + value, 0) / real.length) * 10) / 10 : 0;
}

async function classCounts(start: Date, end: Date) {
  const rows = await prisma.$queryRaw<CalendarCountRow[]>`
    SELECT
      COUNT(*)::int AS "planned",
      COUNT(*) FILTER (WHERE UPPER(COALESCE("completionStatus", "status", '')) = 'COMPLETED')::int AS "completed"
    FROM "AcademicCalendarItem"
    WHERE "plannedDate" >= ${start} AND "plannedDate" <= ${end}
  `;
  const row = rows[0] ?? { planned: 0, completed: 0 };
  return { planned: num(row.planned), completed: num(row.completed) };
}

async function audit(actor: ReportsActor, action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      module: "reports-os",
      action,
      description: JSON.stringify({ description: action, actorRole: actor.role, metadata })
    }
  }).catch(() => undefined);
  emitDomainEvent({
    category: "REPORT",
    eventName: action,
    title: action.replaceAll("_", " ").toLowerCase(),
    description: "Reports OS activity occurred.",
    actor,
    entityType: "ReportsOS",
    severity: "INFO",
    source: "API",
    metadata
  });
}

export const reportsOsService = {
  framework() {
    return {
      name: "NIDUS Reports Operating System",
      principle: "Reports must explain what happened, why it matters, what needs attention and what should be done next in simple language.",
      framework
    };
  },

  async generate(actor: ReportsActor, period: ReportPeriod = "DAILY") {
    requireReports(actor);
    const window = periodWindow(period);
    const [
      students,
      staff,
      classes,
      attendanceSessions,
      assignments,
      exams,
      feedbackLogs,
      leadsCreated,
      followUpsDue,
      admissionsCreated,
      pendingAdmissions,
      payments,
      overdueFees,
      events,
      automationActions,
      failedJobs,
      topLeaderboard
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT, isDisabled: false } }),
      prisma.user.count({ where: { role: { in: [Role.TEACHER, Role.ACADEMIC_HEAD, Role.PHYSICAL_TRAINER, Role.ADMINISTRATIVE_OFFICER, Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.TELECALLER, Role.MARKETING_COORDINATOR] }, isDisabled: false } }),
      classCounts(window.start, window.end),
      prisma.teacherAttendanceRecord.count({ where: { date: { gte: window.start, lte: window.end } } }),
      prisma.teacherAssignmentRecord.count({ where: { createdAt: { gte: window.start, lte: window.end }, status: { not: "ARCHIVED" } } }),
      prisma.teacherExamRecord.count({ where: { createdAt: { gte: window.start, lte: window.end }, status: { not: "ARCHIVED" } } }),
      prisma.auditLog.findMany({ where: { module: "class-rating-os", action: "CLASS_FEEDBACK_SUBMITTED", createdAt: { gte: window.start, lte: window.end } }, select: { description: true } }),
      prisma.lead.count({ where: { createdAt: { gte: window.start, lte: window.end } } }),
      prisma.followUp.count({ where: { followUpDate: { gte: window.start, lte: window.end }, status: { not: "COMPLETED" } } }),
      prisma.admission.count({ where: { createdAt: { gte: window.start, lte: window.end } } }),
      prisma.admission.count({ where: { status: { in: ["PENDING", "REVIEW", "SUBMITTED"] } } }).catch(() => 0),
      prisma.payment.aggregate({ where: { createdAt: { gte: window.start, lte: window.end }, paymentStatus: { in: ["SUCCESS", "PAID", "VERIFIED", "CAPTURED"] } }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.feeInstallment.aggregate({ where: { dueDate: { lte: window.end }, paidStatus: { not: "PAID" } }, _sum: { dueAmount: true }, _count: { _all: true } }),
      prisma.auditLog.count({ where: { module: { startsWith: "event:" }, createdAt: { gte: window.start, lte: window.end } } }),
      prisma.queueJobLog.count({ where: { jobName: { startsWith: "automation:" }, createdAt: { gte: window.start, lte: window.end } } }),
      prisma.queueJobLog.count({ where: { status: "FAILED", createdAt: { gte: window.start, lte: window.end } } }),
      prisma.leaderboard.findMany({ orderBy: [{ rank: "asc" }, { points: "desc" }], take: 3, include: { user: { select: { name: true } } } })
    ]);

    const classCompletion = pct(classes.completed, classes.planned);
    const attendanceCoverage = pct(attendanceSessions, classes.completed || classes.planned);
    const avgClassRating = average(feedbackLogs.map((log) => parseFeedbackRating(log.description)).filter((value): value is number => value !== null));
    const collectionAmount = payments._sum.amount ?? 0;
    const overdueAmount = overdueFees._sum.dueAmount ?? 0;
    const healthScore = Math.max(40, Math.min(98, Math.round(
      92
      - Math.min(followUpsDue, 40) * 0.35
      - Math.min(overdueFees._count._all, 60) * 0.25
      - Math.min(failedJobs, 12) * 1.2
      + Math.min(classCompletion, 100) * 0.04
    )));

    const sections: ReportSection[] = [
      {
        title: "Academics",
        metrics: [
          { label: "Classes completed", value: `${classes.completed}/${classes.planned}`, status: statusFrom(classCompletion) },
          { label: "Attendance sessions", value: attendanceSessions, status: statusFrom(attendanceCoverage) },
          { label: "Assignments published", value: assignments, status: assignments ? "GOOD" : "WATCH" },
          { label: "Tests published", value: exams, status: exams ? "GOOD" : "WATCH" },
          { label: "Class feedback", value: feedbackLogs.length ? `${feedbackLogs.length} ratings / ${avgClassRating} stars` : "No ratings", status: feedbackLogs.length ? "GOOD" : "WATCH" }
        ]
      },
      {
        title: "Admissions",
        metrics: [
          { label: "New leads", value: leadsCreated, status: leadsCreated ? "GOOD" : "WATCH" },
          { label: "Follow-ups due", value: followUpsDue, status: followUpsDue > 10 ? "ACTION" : followUpsDue ? "WATCH" : "GOOD" },
          { label: "Admissions created", value: admissionsCreated, status: admissionsCreated ? "GOOD" : "WATCH" },
          { label: "Pending reviews", value: pendingAdmissions, status: pendingAdmissions ? "ACTION" : "GOOD" }
        ]
      },
      {
        title: "Finance",
        metrics: [
          { label: "Collections", value: `${formatMoney(collectionAmount)} (${payments._count._all})`, status: payments._count._all ? "GOOD" : "WATCH" },
          { label: "Pending fees", value: `${formatMoney(overdueAmount)} (${overdueFees._count._all})`, status: overdueFees._count._all ? "ACTION" : "GOOD" }
        ]
      },
      {
        title: "Operations",
        metrics: [
          { label: "Students active", value: students, status: students ? "GOOD" : "WATCH" },
          { label: "Staff active", value: staff, status: staff ? "GOOD" : "WATCH" },
          { label: "Events recorded", value: events, status: "GOOD" },
          { label: "Automation actions", value: automationActions, status: automationActions ? "GOOD" : "WATCH" },
          { label: "Failed jobs", value: failedJobs, status: failedJobs ? "ACTION" : "GOOD" }
        ]
      }
    ];

    const attention = [
      followUpsDue ? `${followUpsDue} admission follow-up(s) need closure.` : "",
      pendingAdmissions ? `${pendingAdmissions} admission review(s) need approval.` : "",
      overdueFees._count._all ? `${overdueFees._count._all} fee item(s) pending worth ${formatMoney(overdueAmount)}.` : "",
      failedJobs ? `${failedJobs} background job(s) failed.` : "",
      classes.planned && classCompletion < 75 ? `Class completion is ${classCompletion}%.` : ""
    ].filter(Boolean);

    const aiRecommendations = [
      followUpsDue ? "Ask Admission Cell to finish pending follow-ups before the next review." : "",
      overdueFees._count._all ? "Ask Accounts to prioritize overdue parent calls and payment-link refresh." : "",
      pendingAdmissions ? "Review pending admissions before batch allocation delays students." : "",
      failedJobs ? "Check failed jobs before relying on scheduled automation." : "",
      !attention.length ? "Keep supervision light; no major operational blockage is visible." : ""
    ].filter(Boolean).slice(0, 5);

    const drillDownCommands = [
      { command: "ISSUES", label: "Only problems", target: "/api/reports-os/current?period=DAILY&view=issues" },
      { command: "ACADEMICS", label: "Academic details", target: "/api/academic-os/dashboard" },
      { command: "ADMISSIONS", label: "Admissions details", target: "/api/admissions-os/dashboard" },
      { command: "FEES", label: "Finance details", target: "/api/payments/analytics" },
      { command: "TEACHERS", label: "Teacher performance", target: "/api/performance-os/dashboard" },
      { command: "STUDENTS", label: "Student competition", target: "/api/student-competition-os/leaderboard" }
    ];

    const approvalButtons = [
      overdueFees._count._all ? { actionId: `fee-followup-${period.toLowerCase()}-${Date.now()}`, label: "Approve fee follow-up plan", approvalKeyword: "APPROVE", requiresApproval: true } : null,
      pendingAdmissions ? { actionId: `admission-review-${period.toLowerCase()}-${Date.now()}`, label: "Approve admission review queue", approvalKeyword: "APPROVE", requiresApproval: true } : null
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));

    const whatsappSummary = [
      `NIDUS ${period.toLowerCase()} report`,
      "",
      `Academy health: ${healthScore}%`,
      `Classes: ${classes.completed}/${classes.planned}`,
      `Admissions: ${admissionsCreated} new / ${pendingAdmissions} pending review`,
      `Collections: ${formatMoney(collectionAmount)}`,
      `Pending fees: ${formatMoney(overdueAmount)} (${overdueFees._count._all})`,
      `Class rating: ${feedbackLogs.length ? `${avgClassRating} stars from ${feedbackLogs.length}` : "not enough ratings"}`,
      "",
      "Needs attention:",
      ...(attention.length ? attention : ["No major issue visible."]).map((item) => `- ${item}`),
      "",
      "AI recommendation:",
      aiRecommendations[0] ?? "Continue normal operating rhythm.",
      "",
      "Reply: REPORT, ISSUES, ACADEMICS, ADMISSIONS, FEES, TEACHERS, STUDENTS"
    ].join("\n");

    const report = {
      name: "NIDUS Reports Operating System",
      period,
      generatedAt: new Date().toISOString(),
      dateRange: { start: window.start.toISOString(), end: window.end.toISOString() },
      academyHealth: healthScore,
      dashboardLink: `/dashboard/director/reports?period=${period.toLowerCase()}`,
      pdf: {
        available: true,
        queueRoute: `/api/reports-os/pdf?period=${period}`,
        status: "PDF_QUEUE_READY_WHEN_REDIS_IS_AVAILABLE"
      },
      whatsappSummary,
      sections,
      attention,
      aiRecommendations,
      drillDownCommands,
      approvalButtons,
      highlights: {
        topStudents: topLeaderboard.map((item) => ({ name: item.user.name, points: item.points, rank: item.rank })),
        classCompletion,
        attendanceCoverage,
        averageClassRating: avgClassRating
      }
    };
    await audit(actor, "REPORT_GENERATED", { period, academyHealth: healthScore, attention: attention.length });
    return report;
  },

  async queuePdf(actor: ReportsActor, period: ReportPeriod = "DAILY") {
    const report = await this.generate(actor, period);
    const lines = [
      `Academy health: ${report.academyHealth}%`,
      "",
      ...report.sections.flatMap((section) => [section.title, ...section.metrics.map((metric) => `${metric.label}: ${metric.value}`), ""]),
      "Needs attention:",
      ...(report.attention.length ? report.attention : ["No major issue visible."]),
      "",
      "AI recommendations:",
      ...report.aiRecommendations
    ];
    const job = await enqueuePDF({ title: `NIDUS ${period} Report`, lines, storageKey: `reports/${period.toLowerCase()}-${Date.now()}.pdf` });
    await audit(actor, "REPORT_PDF_QUEUED", { period, queued: Boolean(job) });
    return { status: job ? "QUEUED" : "QUEUE_UNAVAILABLE", period, dashboardLink: report.dashboardLink, whatsappSummary: report.whatsappSummary };
  }
};

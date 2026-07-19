import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type PilotActor = {
  id: string;
  role: Role;
  roleMetadata?: Record<string, unknown> | null;
};

type PilotStatus = "READY" | "PARTIAL" | "BLOCKED";

const allowedRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR]);

const pilotRoles = [
  { key: "DIRECTOR", label: "Director", required: 1, roles: [Role.DIRECTOR, Role.ADMIN] },
  { key: "ACADEMIC_HEAD", label: "Academic Head", required: 1, roles: [Role.ACADEMIC_HEAD] },
  { key: "TEACHERS", label: "Teachers", required: 2, roles: [Role.TEACHER, Role.PHYSICAL_TRAINER] },
  { key: "ADMISSION_CELL", label: "Admission Cell", required: 1, roles: [Role.TELECALLER, Role.BUSINESS_DEVELOPMENT_EXECUTIVE, Role.MARKETING_COORDINATOR] },
  { key: "ACCOUNTS", label: "Accounts function", required: 1, roles: [Role.ADMINISTRATIVE_OFFICER, Role.DIRECTOR, Role.ADMIN] },
  { key: "STUDENTS", label: "Students in one active batch", required: 1, roles: [Role.STUDENT] },
  { key: "PARENTS", label: "Selected parents", required: 1, roles: [Role.PARENT] }
] as const;

const framework = [
  { key: "PILOT_DURATION", label: "Pilot duration", requirement: "7 to 14 days" },
  { key: "PILOT_ROSTER", label: "Pilot roster", requirement: "Director, Academic Head, 2 teachers, Admission Cell, Accounts function, 1 batch, selected parents" },
  { key: "DAILY_RHYTHM", label: "Daily rhythm", requirement: "Morning report, live issue handling, evening report" },
  { key: "ACADEMIC_FLOW", label: "Academic flow", requirement: "Planner to class completion, attendance, feedback and report" },
  { key: "ADMISSION_FLOW", label: "Admission flow", requirement: "Lead to follow-up, application, fee and batch allocation" },
  { key: "COMMUNICATION_FLOW", label: "Communication flow", requirement: "WhatsApp, email, push and in-app summary controls" },
  { key: "GO_NO_GO", label: "Go/no-go", requirement: "Pilot starts only when required people, batch, reports and communication checks are present" }
] as const;

function requirePilot(actor: PilotActor) {
  if (!allowedRoles.has(actor.role)) throw Object.assign(new Error("Pilot launch access required"), { statusCode: 403 });
}

function status(count: number, required: number): PilotStatus {
  if (count >= required) return "READY";
  return count > 0 ? "PARTIAL" : "BLOCKED";
}

async function audit(actor: PilotActor, action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      module: "pilot-launch-os",
      action,
      description: JSON.stringify({ description: action, actorRole: actor.role, metadata })
    }
  }).catch(() => undefined);
  emitDomainEvent({
    category: "SYSTEM",
    eventName: action,
    title: action.replaceAll("_", " ").toLowerCase(),
    description: "Pilot Launch OS activity occurred.",
    actor,
    entityType: "PilotLaunchOS",
    severity: "INFO",
    source: "API",
    metadata
  });
}

export const pilotLaunchOsService = {
  framework() {
    return {
      name: "NIDUS Pilot Launch Operating System",
      principle: "Pilot launch must be controlled, measured and limited to a real academy group before full public rollout.",
      duration: { minimumDays: 7, maximumDays: 14 },
      framework,
      pilotRoles
    };
  },

  async readiness(actor: PilotActor) {
    requirePilot(actor);
    const [
      users,
      activeBatches,
      batchWithStudents,
      parentLinks,
      academicEvents,
      admissionEvents,
      reportDocs,
      communicationDocs,
      failedJobs24h
    ] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], where: { isDisabled: false }, _count: { _all: true } }),
      prisma.batch.count({ where: { status: "ACTIVE" } }),
      prisma.batch.findFirst({
        where: { status: "ACTIVE", students: { some: { status: "ACTIVE" } } },
        select: { id: true, name: true, _count: { select: { students: true, teachers: true, tests: true } } },
        orderBy: { createdAt: "asc" }
      }),
      prisma.parentStudentLink.count({ where: { status: "ACTIVE" } }),
      prisma.auditLog.count({ where: { module: "academic-os" } }),
      prisma.auditLog.count({ where: { module: "admissions-os" } }),
      prisma.auditLog.count({ where: { module: "reports-os" } }),
      prisma.auditLog.count({ where: { module: "communication-os" } }),
      prisma.queueJobLog.count({ where: { status: "FAILED", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    ]);
    const countsByRole = new Map(users.map((item) => [item.role, item._count._all]));
    const roster = pilotRoles.map((item) => {
      const count = item.key === "STUDENTS"
        ? batchWithStudents?._count.students ?? 0
        : item.key === "PARENTS"
          ? parentLinks
          : item.roles.reduce((sum, role) => sum + (countsByRole.get(role) ?? 0), 0);
      return { key: item.key, label: item.label, required: item.required, available: count, status: status(count, item.required) };
    });
    const operatingChecks = [
      { key: "ACTIVE_BATCH", label: "One active pilot batch", status: activeBatches && batchWithStudents ? "READY" as PilotStatus : activeBatches ? "PARTIAL" as PilotStatus : "BLOCKED" as PilotStatus, evidence: batchWithStudents ? `${batchWithStudents.name} has ${batchWithStudents._count.students} student(s), ${batchWithStudents._count.teachers} teacher(s), ${batchWithStudents._count.tests} test(s).` : `${activeBatches} active batch record(s), but no active batch with students was found.` },
      { key: "ACADEMIC_OS", label: "Academic operating flow", status: academicEvents ? "READY" as PilotStatus : "PARTIAL" as PilotStatus, evidence: `${academicEvents} Academic OS audit event(s).` },
      { key: "ADMISSIONS_OS", label: "Admissions operating flow", status: admissionEvents ? "READY" as PilotStatus : "PARTIAL" as PilotStatus, evidence: `${admissionEvents} Admissions OS audit event(s).` },
      { key: "REPORTS_OS", label: "Reports operating flow", status: reportDocs ? "READY" as PilotStatus : "PARTIAL" as PilotStatus, evidence: `${reportDocs} Reports OS audit event(s).` },
      { key: "COMMUNICATION_OS", label: "Communication operating flow", status: communicationDocs ? "READY" as PilotStatus : "PARTIAL" as PilotStatus, evidence: `${communicationDocs} Communication OS audit event(s).` },
      { key: "QUEUE_FAILURES", label: "Queue failures", status: failedJobs24h ? "PARTIAL" as PilotStatus : "READY" as PilotStatus, evidence: `${failedJobs24h} failed queue job(s) in the last 24 hours.` }
    ];
    const allChecks = [...roster, ...operatingChecks];
    const blocked = allChecks.filter((item) => item.status === "BLOCKED").length;
    const partial = allChecks.filter((item) => item.status === "PARTIAL").length;
    const ready = allChecks.filter((item) => item.status === "READY").length;
    const pilotScore = Math.round(((ready + partial * 0.5) / allChecks.length) * 100);
    const pendingExecutions = [
      roster.find((item) => item.key === "ACCOUNTS" && item.status !== "READY") ? "Create or assign a real Accounts function user. Current Prisma roles do not include a dedicated ACCOUNTS role." : "",
      roster.find((item) => item.key === "TEACHERS" && item.status !== "READY") ? "Assign at least 2 teachers/physical trainers to the pilot." : "",
      !batchWithStudents ? "Select one active pilot batch with students." : "",
      batchWithStudents && batchWithStudents._count.teachers < 1 ? "Assign teacher coverage to the pilot batch." : "",
      parentLinks < 1 ? "Link selected parent accounts to pilot students." : "",
      !reportDocs ? "Generate one Reports OS daily report during pilot rehearsal." : "",
      !communicationDocs ? "Send one Communication OS test dispatch during pilot rehearsal." : "",
      failedJobs24h ? "Clear failed queue jobs before go-live decision." : ""
    ].filter(Boolean);
    await audit(actor, "PILOT_READINESS_VIEWED", { ready, partial, blocked, pilotScore, pending: pendingExecutions.length });
    return {
      name: "NIDUS Pilot Launch Operating System",
      pilotDuration: "7 to 14 days",
      status: blocked ? "BLOCKED" : partial ? "PILOT_READY_WITH_PREP_ITEMS" : "PILOT_READY",
      pilotScore,
      roster,
      operatingChecks,
      goNoGoRule: "Start pilot only when no blocked checks remain and the Director approves the pilot window.",
      pilotDailyRhythm: [
        "Morning: Director receives report and urgent issues.",
        "During day: Academic Head, teachers, admissions and accounts operate normal workflows.",
        "Evening: Director reviews completion, feedback, fees, admissions and next-day risks."
      ],
      pendingExecutions,
      dashboardRule: "All pilot dashboards must remain grid styled, low content, neatly arranged, simple English and rural-area-friendly."
    };
  }
};

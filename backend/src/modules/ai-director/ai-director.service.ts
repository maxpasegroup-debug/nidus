import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type AiDirectorActor = {
  id?: string | null;
  role: Role | "DIRECTOR";
  instituteId?: string | null;
  branchId?: string | null;
};

type OperationalSnapshot = {
  generatedAt: string;
  students: number;
  staff: number;
  leadsDueToday: number;
  activeLeads: number;
  admissionsToday: number;
  pendingAdmissionReviews: number;
  overdueFeeItems: number;
  overdueFeeAmount: number;
  collectionsToday: number;
  paymentsToday: number;
  eventsToday: number;
  automationActionsToday: number;
  failedJobsToday: number;
  loginFailuresToday: number;
};

type SensitiveActionType =
  | "SEND_FEE_REMINDERS"
  | "ASSIGN_BATCH"
  | "FINALIZE_ADMISSION"
  | "EMPLOYEE_ACTION"
  | "PARENT_MESSAGE"
  | "STUDENT_DISCIPLINARY_MESSAGE";

type SensitiveAction = {
  actionId: string;
  type: SensitiveActionType;
  title: string;
  reason: string;
  requiresApproval: true;
  approvalKeyword: "APPROVE";
  executionStatus: "WAITING_FOR_DIRECTOR_APPROVAL";
};

const staffRoles = [
  Role.TEACHER,
  Role.ACADEMIC_HEAD,
  Role.PHYSICAL_TRAINER,
  Role.ADMINISTRATIVE_OFFICER,
  Role.BUSINESS_DEVELOPMENT_EXECUTIVE,
  Role.TELECALLER,
  Role.MARKETING_COORDINATOR
];

const directorRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR]);
const operationsRoles = new Set<Role>([
  Role.ADMIN,
  Role.DIRECTOR,
  Role.ACADEMIC_HEAD,
  Role.ADMINISTRATIVE_OFFICER,
  Role.BUSINESS_DEVELOPMENT_EXECUTIVE,
  Role.TELECALLER
]);

function todayWindow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const tomorrow = new Date(start);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { start, tomorrow };
}

function formatMoney(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roleName(actor: AiDirectorActor) {
  return String(actor.role);
}

function canViewOperations(actor: AiDirectorActor) {
  return operationsRoles.has(actor.role as Role);
}

function canApprove(actor: AiDirectorActor) {
  return directorRoles.has(actor.role as Role);
}

function academyHealth(snapshot: OperationalSnapshot) {
  const risk =
    Math.min(snapshot.overdueFeeItems, 40) * 0.35 +
    Math.min(snapshot.leadsDueToday, 30) * 0.45 +
    Math.min(snapshot.pendingAdmissionReviews, 15) * 0.8 +
    Math.min(snapshot.failedJobsToday, 10) * 1.2 +
    Math.min(snapshot.loginFailuresToday, 20) * 0.4;

  return clamp(Math.round(96 - risk), 40, 99);
}

function attention(snapshot: OperationalSnapshot) {
  const items: string[] = [];
  if (snapshot.leadsDueToday) items.push(`${snapshot.leadsDueToday} admission follow-up(s) are due today.`);
  if (snapshot.pendingAdmissionReviews) items.push(`${snapshot.pendingAdmissionReviews} admission review(s) need approval.`);
  if (snapshot.overdueFeeItems) items.push(`${snapshot.overdueFeeItems} fee item(s) are overdue worth ${formatMoney(snapshot.overdueFeeAmount)}.`);
  if (snapshot.failedJobsToday) items.push(`${snapshot.failedJobsToday} background job(s) failed today.`);
  if (snapshot.loginFailuresToday >= 5) items.push(`${snapshot.loginFailuresToday} login failures were recorded today.`);
  if (!items.length) items.push("No critical operational blockage detected right now.");
  return items.slice(0, 5);
}

function recommendations(snapshot: OperationalSnapshot) {
  const items: string[] = [];
  if (snapshot.leadsDueToday) items.push("Ask the admission cell to close today's due follow-ups before evening review.");
  if (snapshot.overdueFeeItems) items.push("Let Accounts prioritize parent calls and fresh payment links for overdue fee items.");
  if (snapshot.pendingAdmissionReviews) items.push("Review pending admissions before batch allocation so coaching can begin without delay.");
  if (snapshot.failedJobsToday) items.push("Check automation job failures before relying on scheduled reports.");
  if (!items.length) items.push("Keep today's supervision light: admissions, fees and automation are stable.");
  return items.slice(0, 5);
}

function buildWhatsAppSummary(snapshot: OperationalSnapshot) {
  const health = academyHealth(snapshot);
  const lines = [
    "NIDUS AI Director",
    "",
    `Academy health: ${health}%`,
    `Students active: ${snapshot.students}`,
    `Staff active: ${snapshot.staff}`,
    `Admissions today: ${snapshot.admissionsToday}`,
    `Collections today: ${formatMoney(snapshot.collectionsToday)} (${snapshot.paymentsToday})`,
    `Pending fees: ${formatMoney(snapshot.overdueFeeAmount)} (${snapshot.overdueFeeItems})`,
    "",
    "Needs attention:",
    ...attention(snapshot).map((item) => `- ${item}`),
    "",
    "AI recommendation:",
    recommendations(snapshot)[0],
    "",
    "Ask a question or reply APPROVE only when I request approval."
  ];
  return lines.join("\n");
}

function detectSensitiveAction(question: string, snapshot: OperationalSnapshot): SensitiveAction | null {
  const value = question.toLowerCase();
  if ((value.includes("send") || value.includes("message") || value.includes("remind")) && (value.includes("fee") || value.includes("payment"))) {
    return {
      actionId: `fee-reminder-${Date.now()}`,
      type: "SEND_FEE_REMINDERS",
      title: "Send fee reminders",
      reason: `${snapshot.overdueFeeItems} overdue fee item(s) may require parent communication.`,
      requiresApproval: true,
      approvalKeyword: "APPROVE",
      executionStatus: "WAITING_FOR_DIRECTOR_APPROVAL"
    };
  }
  if (value.includes("assign") && value.includes("batch")) {
    return {
      actionId: `batch-allocation-${Date.now()}`,
      type: "ASSIGN_BATCH",
      title: "Assign students to batch",
      reason: "Batch allocation affects student access, timetable and academic planner assignment.",
      requiresApproval: true,
      approvalKeyword: "APPROVE",
      executionStatus: "WAITING_FOR_DIRECTOR_APPROVAL"
    };
  }
  if (value.includes("approve") && value.includes("admission")) {
    return {
      actionId: `admission-approval-${Date.now()}`,
      type: "FINALIZE_ADMISSION",
      title: "Finalize admission approval",
      reason: "Admission approval can trigger profile activation, parent invitation and batch access.",
      requiresApproval: true,
      approvalKeyword: "APPROVE",
      executionStatus: "WAITING_FOR_DIRECTOR_APPROVAL"
    };
  }
  if (value.includes("warn") || value.includes("terminate") || value.includes("appraisal")) {
    return {
      actionId: `employee-action-${Date.now()}`,
      type: "EMPLOYEE_ACTION",
      title: "Employee action",
      reason: "Employee decisions require Director confirmation and audit trail.",
      requiresApproval: true,
      approvalKeyword: "APPROVE",
      executionStatus: "WAITING_FOR_DIRECTOR_APPROVAL"
    };
  }
  return null;
}

function answerQuestion(question: string, snapshot: OperationalSnapshot) {
  const value = question.toLowerCase();
  if (value.includes("fee") || value.includes("collection") || value.includes("payment")) {
    return [
      `Collections today are ${formatMoney(snapshot.collectionsToday)} from ${snapshot.paymentsToday} payment(s).`,
      `Overdue exposure is ${formatMoney(snapshot.overdueFeeAmount)} across ${snapshot.overdueFeeItems} fee item(s).`,
      snapshot.overdueFeeItems
        ? "Recommended action: ask Accounts to prioritize overdue parent follow-ups and resend payment links after Director approval."
        : "Recommended action: keep normal fee follow-up cadence; no urgent fee risk detected."
    ].join("\n\n");
  }
  if (value.includes("lead") || value.includes("admission") || value.includes("counselling")) {
    return [
      `${snapshot.leadsDueToday} admission follow-up(s) are due today.`,
      `${snapshot.pendingAdmissionReviews} admission review(s) are pending.`,
      "Recommended action: close follow-ups first, then review admissions ready for batch allocation."
    ].join("\n\n");
  }
  if (value.includes("automation") || value.includes("job") || value.includes("system")) {
    return [
      `${snapshot.automationActionsToday} automation action(s) were recorded today.`,
      `${snapshot.failedJobsToday} background job(s) failed today.`,
      snapshot.failedJobsToday ? "Recommended action: review failed jobs before trusting scheduled reports." : "Automation appears stable today."
    ].join("\n\n");
  }
  return [
    `Academy health is ${academyHealth(snapshot)}%.`,
    `Main attention points: ${attention(snapshot).join(" ")}`,
    `Recommendation: ${recommendations(snapshot)[0]}`
  ].join("\n\n");
}

async function logRequest(input: { prompt: string; output: string; status?: string; durationMs: number; error?: string }) {
  await prisma.aIRequestLog.create({
    data: {
      feature: "NIDUS_AI_DIRECTOR",
      model: "OPERATIONS_RULE_ENGINE",
      status: input.status ?? "COMPLETED",
      promptChars: input.prompt.length,
      outputChars: input.output.length,
      durationMs: input.durationMs,
      error: input.error
    }
  }).catch(() => undefined);
}

async function audit(input: { actor?: AiDirectorActor; action: string; description: string; metadata?: Record<string, unknown> }) {
  await prisma.auditLog.create({
    data: {
      userId: input.actor?.id ?? undefined,
      module: "ai-director",
      action: input.action,
      description: JSON.stringify({
        description: input.description,
        actorRole: input.actor ? roleName(input.actor) : undefined,
        metadata: input.metadata ?? {}
      })
    }
  }).catch(() => undefined);
}

export const aiDirectorService = {
  guardrails() {
    return {
      assistantName: "NIDUS AI Director",
      principle: "AI can recommend and prepare actions. Sensitive admissions, finance, parent, student discipline and employee actions require explicit Director approval.",
      sensitiveActions: [
        "Send parent fee reminders",
        "Finalize admission approval",
        "Allocate or change batch",
        "Employee warning, appraisal or HR action",
        "Student disciplinary communication",
        "Parent-sensitive academic or fee communication"
      ],
      approvalKeyword: "APPROVE",
      executionMode: "APPROVAL_RECORDED_ONLY_UNTIL_WORKFLOW_EXECUTION_IS_CONNECTED"
    };
  },

  async snapshot(): Promise<OperationalSnapshot> {
    const { start, tomorrow } = todayWindow();
    const [
      students,
      staff,
      leadsDueToday,
      activeLeads,
      admissionsToday,
      pendingAdmissionReviews,
      overdueFees,
      paymentsToday,
      eventsToday,
      automationActionsToday,
      failedJobsToday,
      loginFailuresToday
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT, isDisabled: false } }),
      prisma.user.count({ where: { role: { in: staffRoles }, isDisabled: false } }),
      prisma.followUp.count({ where: { followUpDate: { gte: start, lt: tomorrow }, status: { not: "COMPLETED" } } }),
      prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "COUNSELLING"] } } }),
      prisma.admission.count({ where: { createdAt: { gte: start } } }),
      prisma.admission.count({ where: { status: { in: ["PENDING", "REVIEW", "SUBMITTED"] } } }).catch(() => 0),
      prisma.feeInstallment.aggregate({ where: { dueDate: { lt: tomorrow }, paidStatus: { not: "PAID" } }, _sum: { dueAmount: true }, _count: { _all: true } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: start }, paymentStatus: { in: ["SUCCESS", "PAID", "VERIFIED", "CAPTURED"] } }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.auditLog.count({ where: { module: { startsWith: "event:" }, createdAt: { gte: start } } }),
      prisma.queueJobLog.count({ where: { jobName: { startsWith: "automation:" }, createdAt: { gte: start } } }),
      prisma.queueJobLog.count({ where: { status: "FAILED", createdAt: { gte: start } } }),
      prisma.auditLog.count({ where: { action: "LOGIN_FAILED", createdAt: { gte: start } } })
    ]);

    return {
      generatedAt: new Date().toISOString(),
      students,
      staff,
      leadsDueToday,
      activeLeads,
      admissionsToday,
      pendingAdmissionReviews,
      overdueFeeItems: overdueFees._count._all,
      overdueFeeAmount: overdueFees._sum.dueAmount ?? 0,
      collectionsToday: paymentsToday._sum.amount ?? 0,
      paymentsToday: paymentsToday._count._all,
      eventsToday,
      automationActionsToday,
      failedJobsToday,
      loginFailuresToday
    };
  },

  async summary(actor: AiDirectorActor) {
    if (!canViewOperations(actor)) throw new Error("NIDUS AI Director is not available for this role");
    const started = Date.now();
    const snapshot = await this.snapshot();
    const result = {
      assistantName: "NIDUS AI Director",
      academyHealth: academyHealth(snapshot),
      snapshot,
      attention: attention(snapshot),
      recommendations: recommendations(snapshot),
      whatsappText: buildWhatsAppSummary(snapshot),
      guardrails: this.guardrails()
    };
    await logRequest({ prompt: "director-summary", output: JSON.stringify(result), durationMs: Date.now() - started });
    await audit({ actor, action: "AI_DIRECTOR_SUMMARY_GENERATED", description: "NIDUS AI Director generated an operating summary.", metadata: { academyHealth: result.academyHealth } });
    emitDomainEvent({
      category: "SYSTEM",
      eventName: "AI_DIRECTOR_INSIGHT_GENERATED",
      title: "NIDUS AI Director summary generated",
      description: "The AI Director generated an operations summary.",
      entityType: "AIDirector",
      severity: "INFO",
      source: "AI",
      actor,
      metadata: { academyHealth: result.academyHealth }
    });
    return result;
  },

  async ask(actor: AiDirectorActor, question: string) {
    if (!canViewOperations(actor)) throw new Error("NIDUS AI Director is not available for this role");
    const started = Date.now();
    const cleanQuestion = question.trim();
    if (!cleanQuestion) throw new Error("Question is required");
    const snapshot = await this.snapshot();
    const answer = answerQuestion(cleanQuestion, snapshot);
    const sensitiveAction = detectSensitiveAction(cleanQuestion, snapshot);
    const output = {
      assistantName: "NIDUS AI Director",
      answer,
      academyHealth: academyHealth(snapshot),
      attention: attention(snapshot),
      recommendation: recommendations(snapshot)[0],
      sensitiveAction,
      guardrails: this.guardrails()
    };
    await logRequest({ prompt: cleanQuestion, output: JSON.stringify(output), durationMs: Date.now() - started });
    await audit({ actor, action: "AI_DIRECTOR_COMMAND_RECEIVED", description: "NIDUS AI Director answered an operations question.", metadata: { question: cleanQuestion, sensitiveAction } });
    emitDomainEvent({
      category: "SYSTEM",
      eventName: "AI_DIRECTOR_COMMAND_RECEIVED",
      title: "NIDUS AI Director command received",
      description: "The AI Director received and answered an operations question.",
      entityType: "AIDirector",
      severity: sensitiveAction ? "WARNING" : "INFO",
      source: "AI",
      actor,
      metadata: { question: cleanQuestion, sensitiveAction }
    });
    return output;
  },

  async answerWhatsAppCommand(command: string) {
    const result = await this.ask({ role: "DIRECTOR" }, command);
    const lines = [
      result.answer,
      "",
      `Academy health: ${result.academyHealth}%`,
      `Attention: ${result.attention[0]}`,
      "",
      result.sensitiveAction
        ? `Approval needed: ${result.sensitiveAction.title}. Reply APPROVE only after reviewing the action in Director controls.`
        : `Recommendation: ${result.recommendation}`
    ];
    return lines.join("\n");
  },

  async approve(actor: AiDirectorActor, input: { actionId: string; approvalText: string; note?: string }) {
    if (!canApprove(actor)) throw new Error("Only Director or Admin can approve NIDUS AI Director actions");
    if (input.approvalText.trim().toUpperCase() !== "APPROVE") throw new Error("Approval keyword must be APPROVE");
    await audit({
      actor,
      action: "AI_DIRECTOR_APPROVAL_RECORDED",
      description: "Director approval was recorded for a guarded AI action.",
      metadata: { actionId: input.actionId, note: input.note }
    });
    emitDomainEvent({
      category: "SYSTEM",
      eventName: "AI_DIRECTOR_APPROVAL_RECORDED",
      title: "NIDUS AI Director approval recorded",
      description: "A Director approval was recorded for a guarded AI action.",
      entityType: "AIDirectorApproval",
      entityId: input.actionId,
      severity: "SUCCESS",
      source: "AI",
      actor,
      metadata: { note: input.note }
    });
    return {
      status: "APPROVAL_RECORDED",
      actionId: input.actionId,
      executionStatus: "READY_FOR_WORKFLOW_EXECUTION",
      note: "Phase 6 records Director approval and protects sensitive actions. Actual execution remains delegated to the existing workflow/automation layer."
    };
  }
};

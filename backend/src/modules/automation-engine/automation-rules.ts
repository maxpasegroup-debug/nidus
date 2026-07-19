import type { EventCategory, EventSeverity } from "../event-engine/event-taxonomy.js";

export type AutomationAction =
  | {
      type: "NOTIFY";
      title: string;
      body: string;
      targetAudience: string;
      delayMs?: number;
    }
  | {
      type: "SIGNAL";
      title: string;
      body: string;
      delayMs?: number;
    };

export type AutomationRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    category: EventCategory;
    eventName?: string;
    minimumSeverity?: EventSeverity;
  };
  actions: AutomationAction[];
};

const severityRank: Record<EventSeverity, number> = {
  INFO: 1,
  SUCCESS: 1,
  WARNING: 2,
  CRITICAL: 3
};

export const automationRules: AutomationRule[] = [
  {
    id: "admission-lead-created-admission-cell",
    name: "New lead to admission cell",
    description: "When a lead is created, keep the admission team aware without involving the Director.",
    enabled: true,
    trigger: { category: "ADMISSION", eventName: "LEAD_CREATED" },
    actions: [
      { type: "NOTIFY", title: "New admission lead", body: "A new lead is ready for first contact.", targetAudience: "ADMISSION_CELL" }
    ]
  },
  {
    id: "admission-followup-created-admission-cell",
    name: "Follow-up reminder signal",
    description: "When a follow-up is created, prepare the admission team task signal.",
    enabled: true,
    trigger: { category: "ADMISSION", eventName: "FOLLOW_UP_CREATED" },
    actions: [
      { type: "SIGNAL", title: "Follow-up scheduled", body: "Admission follow-up has been scheduled and is ready for reminder automation." }
    ]
  },
  {
    id: "admission-reviewed-director",
    name: "Admission decision visibility",
    description: "When an admission is approved or rejected, keep Director command aware.",
    enabled: true,
    trigger: { category: "ADMISSION", eventName: "ADMISSION_REVIEWED" },
    actions: [
      { type: "NOTIFY", title: "Admission reviewed", body: "An admission decision was recorded.", targetAudience: "DIRECTOR" }
    ]
  },
  {
    id: "fee-payment-received-accounts",
    name: "Payment received to accounts",
    description: "When a payment is received, notify accounts for reconciliation awareness.",
    enabled: true,
    trigger: { category: "FEE", eventName: "PAYMENT_RECEIVED" },
    actions: [
      { type: "NOTIFY", title: "Payment received", body: "A fee payment has been received and logged.", targetAudience: "ACCOUNTS" }
    ]
  },
  {
    id: "fee-payment-failed-accounts",
    name: "Payment failure to accounts",
    description: "When a payment fails, notify accounts before escalating to Director.",
    enabled: true,
    trigger: { category: "FEE", eventName: "PAYMENT_FAILED" },
    actions: [
      { type: "NOTIFY", title: "Payment failed", body: "A payment failed and needs accounts follow-up.", targetAudience: "ACCOUNTS" },
      { type: "SIGNAL", title: "Payment failure escalation watch", body: "Escalate to Director only if unresolved in the next automation phase.", delayMs: 30 * 60 * 1000 }
    ]
  },
  {
    id: "security-warning-admin",
    name: "Security warning to admin",
    description: "Security warnings are routed to Admin/Director visibility.",
    enabled: true,
    trigger: { category: "AUTH", minimumSeverity: "WARNING" },
    actions: [
      { type: "NOTIFY", title: "Security attention needed", body: "A security-related login event needs review.", targetAudience: "ADMIN" }
    ]
  },
  {
    id: "academic-activity-academic-head",
    name: "Academic activity signal",
    description: "Academic events are kept visible to Academic Head for future class/planner automation.",
    enabled: true,
    trigger: { category: "ACADEMIC" },
    actions: [
      { type: "SIGNAL", title: "Academic event captured", body: "Academic workflow event is ready for rules and escalation." }
    ]
  }
];

export function matchesRule(rule: AutomationRule, event: { category: EventCategory; eventName: string; severity?: EventSeverity }) {
  if (!rule.enabled) return false;
  if (rule.trigger.category !== event.category) return false;
  if (rule.trigger.eventName && rule.trigger.eventName !== event.eventName) return false;
  if (rule.trigger.minimumSeverity && severityRank[event.severity ?? "INFO"] < severityRank[rule.trigger.minimumSeverity]) return false;
  return true;
}

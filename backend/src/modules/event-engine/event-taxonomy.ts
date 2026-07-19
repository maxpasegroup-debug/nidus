export const eventCategories = [
  "ADMISSION",
  "ACADEMIC",
  "ATTENDANCE",
  "CLASS",
  "ASSIGNMENT",
  "EXAM",
  "FEE",
  "HR",
  "COMMUNICATION",
  "STUDENT_FEEDBACK",
  "STUDENT_COMPETITION",
  "TEACHER_PERFORMANCE",
  "REPORT",
  "AUTH",
  "ADMIN",
  "SYSTEM"
] as const;

export const eventSeverities = ["INFO", "SUCCESS", "WARNING", "CRITICAL"] as const;
export const eventSources = ["WEB", "MOBILE", "SYSTEM", "WHATSAPP", "API", "QUEUE", "AI"] as const;

export type EventCategory = (typeof eventCategories)[number];
export type EventSeverity = (typeof eventSeverities)[number];
export type EventSource = (typeof eventSources)[number];

export type EventDefinition = {
  category: EventCategory;
  eventName: string;
  title: string;
  description: string;
  automationReady: boolean;
};

export const eventDefinitions: EventDefinition[] = [
  { category: "ADMISSION", eventName: "LEAD_CREATED", title: "Lead created", description: "A new admission lead was created.", automationReady: true },
  { category: "ADMISSION", eventName: "LEAD_UPDATED", title: "Lead updated", description: "An admission lead moved or changed.", automationReady: true },
  { category: "ADMISSION", eventName: "FOLLOW_UP_CREATED", title: "Follow-up created", description: "A follow-up was scheduled for a lead.", automationReady: true },
  { category: "ADMISSION", eventName: "COUNSELLING_BOOKED", title: "Counselling booked", description: "A counselling session was created.", automationReady: true },
  { category: "ADMISSION", eventName: "ADMISSION_CREATED", title: "Admission created", description: "An admission application was created.", automationReady: true },
  { category: "ADMISSION", eventName: "ADMISSION_REVIEWED", title: "Admission reviewed", description: "An admission was approved or rejected.", automationReady: true },
  { category: "ADMISSION", eventName: "ADMISSIONS_OS_VIEWED", title: "Admissions OS viewed", description: "A role opened the guided Admissions Operating System.", automationReady: true },
  { category: "ADMISSION", eventName: "ADMISSIONS_OS_LEAD_VIEWED", title: "Admissions OS lead viewed", description: "A role opened a lead journey inside the Admissions Operating System.", automationReady: true },
  { category: "FEE", eventName: "PAYMENT_ORDER_CREATED", title: "Payment order created", description: "A fee payment order was created.", automationReady: true },
  { category: "FEE", eventName: "PAYMENT_RECEIVED", title: "Payment received", description: "A fee payment was verified or manually recorded.", automationReady: true },
  { category: "FEE", eventName: "PAYMENT_FAILED", title: "Payment failed", description: "A payment failed or was marked failed.", automationReady: true },
  { category: "FEE", eventName: "REFUND_REQUESTED", title: "Refund requested", description: "A refund workflow was requested.", automationReady: true },
  { category: "AUTH", eventName: "LOGIN_SUCCESS", title: "Login success", description: "A user logged in successfully.", automationReady: false },
  { category: "AUTH", eventName: "LOGIN_FAILED", title: "Login failed", description: "A login attempt failed.", automationReady: false },
  { category: "AUTH", eventName: "ACCOUNT_LOCKED", title: "Account locked", description: "A user account was locked by security policy.", automationReady: true },
  { category: "ADMIN", eventName: "ADMIN_ACTION", title: "Admin action", description: "An admin or director completed a protected action.", automationReady: true },
  { category: "COMMUNICATION", eventName: "MESSAGE_QUEUED", title: "Message queued", description: "A communication item was queued or scheduled.", automationReady: true },
  { category: "COMMUNICATION", eventName: "COMMUNICATION_DISPATCHED", title: "Communication dispatched", description: "The Communication OS dispatched a message through one or more channels.", automationReady: true },
  { category: "COMMUNICATION", eventName: "COMMUNICATION_FREQUENCY_SKIPPED", title: "Communication skipped by frequency control", description: "A duplicate communication was skipped by frequency rules.", automationReady: true },
  { category: "COMMUNICATION", eventName: "COMMUNICATION_SUMMARY_BUNDLED", title: "Communication summary bundled", description: "The Communication OS prepared a communication summary bundle.", automationReady: true },
  { category: "COMMUNICATION", eventName: "COMMUNICATION_HEALTH_VIEWED", title: "Communication health viewed", description: "A role opened communication delivery health.", automationReady: true },
  { category: "ACADEMIC", eventName: "ACADEMIC_ACTIVITY", title: "Academic activity", description: "A planner, batch, class or syllabus activity occurred.", automationReady: true },
  { category: "ACADEMIC", eventName: "ACADEMIC_OS_VIEWED", title: "Academic OS viewed", description: "A role opened the unified Academic Operating System.", automationReady: true },
  { category: "ACADEMIC", eventName: "ACADEMIC_OS_BATCH_VIEWED", title: "Academic OS batch viewed", description: "A role opened a batch drill-down in the Academic Operating System.", automationReady: true },
  { category: "CLASS", eventName: "CLASS_ACTIVITY", title: "Class activity", description: "A class session activity occurred.", automationReady: true },
  { category: "ATTENDANCE", eventName: "ATTENDANCE_ACTIVITY", title: "Attendance activity", description: "Attendance was created or updated.", automationReady: true },
  { category: "ASSIGNMENT", eventName: "ASSIGNMENT_ACTIVITY", title: "Assignment activity", description: "An assignment activity occurred.", automationReady: true },
  { category: "EXAM", eventName: "EXAM_ACTIVITY", title: "Exam activity", description: "An exam, test, attempt or review activity occurred.", automationReady: true },
  { category: "HR", eventName: "HR_ACTIVITY", title: "HR activity", description: "An employee, leave, attendance or payroll event occurred.", automationReady: true },
  { category: "STUDENT_FEEDBACK", eventName: "CLASS_FEEDBACK_SUBMITTED", title: "Class feedback submitted", description: "A student submitted class feedback.", automationReady: true },
  { category: "STUDENT_FEEDBACK", eventName: "CLASS_RATING_PENDING_VIEWED", title: "Class rating pending viewed", description: "A student opened pending class ratings.", automationReady: true },
  { category: "STUDENT_FEEDBACK", eventName: "CLASS_RATING_SUMMARY_VIEWED", title: "Class rating summary viewed", description: "A role opened class feedback summaries.", automationReady: true },
  { category: "STUDENT_COMPETITION", eventName: "STUDENT_COMPETITION_SIGNAL", title: "Student competition signal", description: "A student completed a competition-worthy activity.", automationReady: true },
  { category: "STUDENT_COMPETITION", eventName: "STUDENT_COMPETITION_VIEWED", title: "Student Competition OS viewed", description: "A role opened the Student Competition Operating System.", automationReady: true },
  { category: "STUDENT_COMPETITION", eventName: "STUDENT_COMPETITION_PROFILE_VIEWED", title: "Student competition profile viewed", description: "A role opened a student competition profile.", automationReady: true },
  { category: "TEACHER_PERFORMANCE", eventName: "TEACHER_PERFORMANCE_SIGNAL", title: "Teacher performance signal", description: "A teacher performance signal was recorded.", automationReady: true },
  { category: "TEACHER_PERFORMANCE", eventName: "PERFORMANCE_OS_VIEWED", title: "Performance OS viewed", description: "A role opened the Teacher and HR Performance Operating System.", automationReady: true },
  { category: "TEACHER_PERFORMANCE", eventName: "PERFORMANCE_OS_STAFF_VIEWED", title: "Performance OS staff viewed", description: "A role opened a staff performance drill-down.", automationReady: true },
  { category: "REPORT", eventName: "REPORT_GENERATED", title: "Report generated", description: "A daily, weekly or monthly operating report was generated.", automationReady: true },
  { category: "REPORT", eventName: "REPORT_PDF_QUEUED", title: "Report PDF queued", description: "An operating report PDF job was queued or skipped gracefully.", automationReady: true },
  { category: "SYSTEM", eventName: "AI_DIRECTOR_INSIGHT_GENERATED", title: "AI Director insight generated", description: "NIDUS AI Director generated an operating insight.", automationReady: true },
  { category: "SYSTEM", eventName: "AI_DIRECTOR_COMMAND_RECEIVED", title: "AI Director command received", description: "NIDUS AI Director answered an operating command or question.", automationReady: true },
  { category: "SYSTEM", eventName: "AI_DIRECTOR_APPROVAL_RECORDED", title: "AI Director approval recorded", description: "A guarded AI Director action received Director approval.", automationReady: true },
  { category: "SYSTEM", eventName: "LAUNCH_READINESS_CHECKLIST_VIEWED", title: "Launch readiness checklist viewed", description: "A Director or Admin opened the launch readiness checklist.", automationReady: true },
  { category: "SYSTEM", eventName: "PILOT_READINESS_VIEWED", title: "Pilot readiness viewed", description: "A Director or Admin opened the controlled pilot readiness view.", automationReady: true },
  { category: "SYSTEM", eventName: "SYSTEM_ACTIVITY", title: "System activity", description: "A platform or operational event occurred.", automationReady: true }
];

export function isEventCategory(value: string): value is EventCategory {
  return eventCategories.includes(value as EventCategory);
}

export function eventModule(category: EventCategory) {
  return `event:${category.toLowerCase()}`;
}

export function categoryFromModule(module: string): EventCategory | null {
  if (!module.startsWith("event:")) return null;
  const value = module.slice("event:".length).toUpperCase();
  return isEventCategory(value) ? value : null;
}

import type { Course } from "@/types/course";

export type PlannerTopicType = "CLASS" | "ASSESSMENT" | "PRACTICAL" | "PROJECT" | "REVISION";

export type AcademicPlannerTopic = {
  id: string;
  title: string;
  type: PlannerTopicType;
  sessions: number;
  hours: number;
  facultyRole: string;
};

export type AcademicPlannerModule = {
  id: string;
  title: string;
  subject: string;
  milestone: string;
  topics: AcademicPlannerTopic[];
};

export type AcademicPlannerTemplate = {
  status: "DRAFT" | "PUBLISHED";
  version: number;
  updatedAt: string;
  modules: AcademicPlannerModule[];
};

export type CourseDescriptionMeta = {
  summary: string;
  deliveryMode?: string;
  source?: string;
  academicPlanner?: AcademicPlannerTemplate;
};

export type GeneratedPlannerSession = {
  sequence: number;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  moduleTitle: string;
  topic: string;
  type: PlannerTopicType;
  status: LivePlannerStatus;
  completionNote?: string;
  teacherName?: string;
};

export type LivePlannerStatus = "PLANNED" | "COMPLETED" | "DELAYED" | "RESCHEDULED" | "CANCELLED" | "EXTRA_CLASS" | "REVISION";

export type BatchAcademicPlanner = {
  source: string;
  templateVersion: number;
  templateStatus: string;
  generatedAt: string;
  syncedAt?: string;
  syncMode?: string;
  classDays: number[];
  classStartTime: string;
  sessionMinutes: number;
  holidays: string[];
  totals: ReturnType<typeof plannerTotals>;
  sessions: GeneratedPlannerSession[];
};

export const topicTypes: PlannerTopicType[] = ["CLASS", "ASSESSMENT", "PRACTICAL", "PROJECT", "REVISION"];
export const livePlannerStatuses: LivePlannerStatus[] = ["PLANNED", "COMPLETED", "DELAYED", "RESCHEDULED", "CANCELLED", "EXTRA_CLASS", "REVISION"];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function plannerId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseCourseDescription(course: Course): CourseDescriptionMeta {
  try {
    const parsed = JSON.parse(course.description) as Partial<CourseDescriptionMeta>;
    return {
      summary: parsed.summary || course.description,
      deliveryMode: parsed.deliveryMode,
      source: parsed.source,
      academicPlanner: isPlanner(parsed.academicPlanner) ? parsed.academicPlanner : undefined,
    };
  } catch {
    return { summary: course.description };
  }
}

export function courseDescriptionWithPlanner(course: Course, planner: AcademicPlannerTemplate, status: AcademicPlannerTemplate["status"]) {
  const meta = parseCourseDescription(course);
  return JSON.stringify({
    ...meta,
    summary: meta.summary,
    academicPlanner: {
      ...planner,
      status,
      version: Math.max(1, Number(planner.version || 0) + 1),
      updatedAt: new Date().toISOString(),
    },
  });
}

export function defaultPlannerTemplate(course: Course): AcademicPlannerTemplate {
  const meta = parseCourseDescription(course);
  if (meta.academicPlanner) return meta.academicPlanner;
  const subject = course.examType || course.category || "General";
  return {
    status: "DRAFT",
    version: 0,
    updatedAt: new Date().toISOString(),
    modules: [
      {
        id: plannerId("module"),
        title: "Foundation Module",
        subject,
        milestone: "25% completion",
        topics: [
          {
            id: plannerId("topic"),
            title: "Orientation and baseline assessment",
            type: "ASSESSMENT",
            sessions: 1,
            hours: 1,
            facultyRole: "Academic Head",
          },
          {
            id: plannerId("topic"),
            title: "Core concepts and guided practice",
            type: "CLASS",
            sessions: 6,
            hours: 6,
            facultyRole: "Subject Faculty",
          },
        ],
      },
    ],
  };
}

export function plannerTotals(planner?: AcademicPlannerTemplate) {
  const modules = planner?.modules ?? [];
  const topics = modules.flatMap((module) => module.topics);
  return {
    modules: modules.length,
    topics: topics.length,
    sessions: topics.reduce((total, topic) => total + Number(topic.sessions || 0), 0),
    hours: topics.reduce((total, topic) => total + Number(topic.hours || 0), 0),
    assessments: topics.filter((topic) => topic.type === "ASSESSMENT").length,
  };
}

export function generateBatchPlannerFromTemplate(input: {
  planner?: AcademicPlannerTemplate;
  startDate?: string;
  classDays: number[];
  startTime: string;
  sessionMinutes: number;
  holidays: string[];
}) {
  if (!input.planner?.modules.length || !input.startDate) return [];
  const allowedDays = new Set(input.classDays);
  const holidays = new Set(input.holidays);
  const start = new Date(`${input.startDate}T00:00:00.000`);
  const cursor = new Date(start);
  const sessions: GeneratedPlannerSession[] = [];
  const sessionMinutes = Number.isFinite(input.sessionMinutes) && input.sessionMinutes > 0 ? input.sessionMinutes : 60;

  for (const module of input.planner.modules) {
    for (const topic of module.topics) {
      const count = Math.max(1, Number(topic.sessions || 1));
      for (let index = 0; index < count; index += 1) {
        while (!allowedDays.has(cursor.getDay()) || holidays.has(dateKey(cursor))) {
          cursor.setDate(cursor.getDate() + 1);
        }
        sessions.push({
          sequence: sessions.length + 1,
          date: dateKey(cursor),
          day: dayNames[cursor.getDay()],
          startTime: input.startTime,
          endTime: addMinutes(input.startTime, sessionMinutes),
          subject: module.subject,
          moduleTitle: module.title,
          topic: count > 1 ? `${topic.title} (${index + 1}/${count})` : topic.title,
          type: topic.type,
          status: "PLANNED",
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    }
  }

  return sessions;
}

export function parseBatchAcademicPlanner(value: unknown): BatchAcademicPlanner | null {
  if (!value || typeof value !== "object" || !Array.isArray((value as BatchAcademicPlanner).sessions)) return null;
  return value as BatchAcademicPlanner;
}

export function livePlannerMetrics(sessions: GeneratedPlannerSession[]) {
  const active = sessions.filter((session) => session.status !== "CANCELLED");
  const completed = sessions.filter((session) => session.status === "COMPLETED").length;
  const delayed = sessions.filter((session) => session.status === "DELAYED" || session.status === "RESCHEDULED").length;
  const pending = sessions.filter((session) => session.status === "PLANNED" || session.status === "EXTRA_CLASS" || session.status === "REVISION").length;
  const completionPercentage = active.length ? Math.round((completed / active.length) * 100) : 0;
  return { total: sessions.length, active: active.length, completed, delayed, pending, completionPercentage };
}

export function mergeTemplateIntoLivePlanner(input: {
  current: BatchAcademicPlanner | null;
  template?: AcademicPlannerTemplate;
  startDate?: string;
  classDays: number[];
  startTime: string;
  sessionMinutes: number;
  holidays: string[];
  mode: "ADD_NEW_ONLY" | "REPLACE_PENDING";
}) {
  const generated = generateBatchPlannerFromTemplate({
    planner: input.template,
    startDate: input.startDate,
    classDays: input.classDays,
    startTime: input.startTime,
    sessionMinutes: input.sessionMinutes,
    holidays: input.holidays,
  });
  const currentSessions = input.current?.sessions ?? [];
  const completedOrTouched = currentSessions.filter((session) => session.status === "COMPLETED" || session.status === "CANCELLED");
  const editableExisting = input.mode === "REPLACE_PENDING"
    ? currentSessions.filter((session) => session.status === "COMPLETED" || session.status === "CANCELLED")
    : currentSessions;
  const existingKeys = new Set(editableExisting.map(templateSessionKey));
  const additions = generated.filter((session) => !existingKeys.has(templateSessionKey(session)));
  const sessions = input.mode === "REPLACE_PENDING"
    ? [...completedOrTouched, ...generated.filter((session) => !completedOrTouched.some((item) => templateSessionKey(item) === templateSessionKey(session)))]
    : [...currentSessions, ...additions];

  return {
    additions,
    sessions: sessions.map((session, index) => ({ ...session, sequence: index + 1 })),
  };
}

export function templateSessionKey(session: Pick<GeneratedPlannerSession, "subject" | "moduleTitle" | "topic" | "type">) {
  return [session.subject, session.moduleTitle, session.topic.replace(/\s+\(\d+\/\d+\)$/, ""), session.type].map((value) => String(value).trim().toLowerCase()).join("|");
}

function isPlanner(value: unknown): value is AcademicPlannerTemplate {
  return Boolean(value && typeof value === "object" && Array.isArray((value as AcademicPlannerTemplate).modules));
}

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMinutes(time: string, minutes: number) {
  const [hourRaw, minuteRaw] = time.split(":");
  const date = new Date(2000, 0, 1, Number(hourRaw || 0), Number(minuteRaw || 0));
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

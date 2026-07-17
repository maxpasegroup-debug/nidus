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
  pasteSource?: string;
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

export function samplePlannerText(programTitle: string) {
  return `Program: ${programTitle}
Duration: 180 days
Total Hours: 360

Subjects:
Maths - 120 hours
English - 60 hours
GK - 90 hours
Current Affairs - 30 hours

Maths:
- Number System - 10 classes - 20 hours
- Algebra - 15 classes - 30 hours
- Geometry - 20 classes - 40 hours

English:
- Grammar Basics - 12 classes - 18 hours
- Vocabulary - 10 classes - 12 hours
- Comprehension - 8 classes - 12 hours

GK:
- Indian History - 18 classes - 27 hours
- Geography - 16 classes - 24 hours
- Polity and Economy - 16 classes - 24 hours

Exams:
- Weekly Test - 24 tests
- Monthly Mock - 6 tests
- Full Length Mock - 10 tests
- Final Assessment - 1 test

Revision:
- Final Revision - 20 classes - 40 hours`;
}

export function parsePastedAcademicPlan(text: string, fallbackSubject = "General"): AcademicPlannerTemplate {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const modules: AcademicPlannerModule[] = [];
  const subjectHours = new Map<string, number>();
  let currentSubject = fallbackSubject;
  let currentModule: AcademicPlannerModule | null = null;
  let section: "SUBJECTS" | "MODULES" | "EXAMS" | "REVISION" | "NOTES" = "MODULES";

  const ensureModule = (title: string, subject = currentSubject, milestone = "") => {
    const normalizedTitle = cleanTitle(title) || subject || fallbackSubject;
    const existing = modules.find((module) => module.title.toLowerCase() === normalizedTitle.toLowerCase() && module.subject.toLowerCase() === subject.toLowerCase());
    if (existing) {
      currentModule = existing;
      return existing;
    }
    const plannerModule: AcademicPlannerModule = {
      id: plannerId("module"),
      title: normalizedTitle,
      subject: subject || fallbackSubject,
      milestone,
      topics: [],
    };
    modules.push(plannerModule);
    currentModule = plannerModule;
    return plannerModule;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[*-]\s*/, "").trim();
    const lower = line.toLowerCase();
    if (/^(program|duration|total\s*hours?|total\s*classes?|notes?)\s*:/i.test(line)) continue;
    if (/^subjects?\s*:?$/i.test(line)) {
      section = "SUBJECTS";
      currentModule = null;
      continue;
    }
    if (/^(modules?|syllabus|curriculum)\s*:?$/i.test(line)) {
      section = "MODULES";
      currentModule = null;
      continue;
    }
    if (/^(exams?|tests?|assessments?)\s*:?$/i.test(line)) {
      section = "EXAMS";
      currentSubject = "Exams";
      currentModule = ensureModule("Exams", "Exams", "Assessment plan");
      continue;
    }
    if (/^revision\s*:?$/i.test(line)) {
      section = "REVISION";
      currentSubject = "Revision";
      currentModule = ensureModule("Revision", "Revision", "Final preparation");
      continue;
    }
    if (/^[A-Za-z][\w\s/&+-]{1,60}:$/.test(line)) {
      const heading = line.replace(/:$/, "").trim();
      section = lower.includes("exam") || lower.includes("test") ? "EXAMS" : lower.includes("revision") ? "REVISION" : "MODULES";
      currentSubject = heading;
      currentModule = ensureModule(heading, heading);
      continue;
    }

    if (section === "SUBJECTS") {
      const subjectName = cleanTitle(line.split(/\s+-\s+|:/)[0] || line);
      const hours = numberNear(line, /(hours?|hrs?)/i);
      if (subjectName) {
        currentSubject = subjectName;
        if (hours > 0) subjectHours.set(subjectName, hours);
      }
      continue;
    }

    const type = inferTopicType(line, section);
    const subject = section === "EXAMS" ? "Exams" : section === "REVISION" ? "Revision" : currentSubject;
    const plannerModule = currentModule ?? ensureModule(subject, subject);
    const sessions = inferSessions(line, type);
    const hours = inferHours(line, sessions, subjectHours.get(subject));
    plannerModule.topics.push({
      id: plannerId("topic"),
      title: cleanTitle(removeCounts(line)) || line,
      type,
      sessions,
      hours,
      facultyRole: type === "ASSESSMENT" ? "Academic Head" : "Subject Faculty",
    });
  }

  for (const [subject, hours] of subjectHours.entries()) {
    const hasSubjectTopics = modules.some((module) => module.subject.toLowerCase() === subject.toLowerCase() && module.topics.length);
    if (!hasSubjectTopics) {
      ensureModule(`${subject} Plan`, subject).topics.push({
        id: plannerId("topic"),
        title: `${subject} syllabus coverage`,
        type: "CLASS",
        sessions: Math.max(1, Math.round(hours)),
        hours,
        facultyRole: "Subject Faculty",
      });
    }
  }

  return {
    status: "DRAFT",
    version: 0,
    updatedAt: new Date().toISOString(),
    pasteSource: text,
    modules: modules.length ? modules : [{
      id: plannerId("module"),
      title: "Pasted Academic Plan",
      subject: fallbackSubject,
      milestone: "",
      topics: [{
        id: plannerId("topic"),
        title: "Review pasted planner text",
        type: "CLASS",
        sessions: 1,
        hours: 1,
        facultyRole: "Academic Head",
      }],
    }],
  };
}

export function appendPlannerUpdates(current: AcademicPlannerTemplate, updates: AcademicPlannerTemplate) {
  return {
    ...current,
    status: "DRAFT" as const,
    updatedAt: new Date().toISOString(),
    pasteSource: updates.pasteSource || current.pasteSource,
    modules: [...current.modules, ...updates.modules],
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

  for (const plannerModule of input.planner.modules) {
    for (const topic of plannerModule.topics) {
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
          subject: plannerModule.subject,
          moduleTitle: plannerModule.title,
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

function cleanTitle(value: string) {
  return value
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/\s+-\s*$/g, "")
    .trim();
}

function removeCounts(value: string) {
  return value
    .replace(/\s+-\s*\d+\s*(classes|class|sessions|session|tests|test|exams|exam|hours|hour|hrs|hr|days|day)\b/gi, "")
    .replace(/\b\d+\s*(classes|class|sessions|session|tests|test|exams|exam|hours|hour|hrs|hr|days|day)\b/gi, "")
    .replace(/\s+-\s*(every|weekly|monthly|daily)\b.*$/gi, "")
    .trim();
}

function inferTopicType(line: string, section: "SUBJECTS" | "MODULES" | "EXAMS" | "REVISION" | "NOTES"): PlannerTopicType {
  const lower = line.toLowerCase();
  if (section === "EXAMS" || /\b(test|exam|mock|assessment|quiz)\b/.test(lower)) return "ASSESSMENT";
  if (section === "REVISION" || /\b(revision|revise|recap)\b/.test(lower)) return "REVISION";
  if (/\b(project|portfolio)\b/.test(lower)) return "PROJECT";
  if (/\b(practical|lab|workshop)\b/.test(lower)) return "PRACTICAL";
  return "CLASS";
}

function inferSessions(line: string, type: PlannerTopicType) {
  const specific = numberNear(line, /(classes|class|sessions|session|tests|test|exams|exam|mocks|mock|days|day)/i);
  if (specific > 0) return specific;
  const anyNumber = Number(line.match(/\b(\d+)\b/)?.[1] ?? 0);
  if (anyNumber > 0 && type === "ASSESSMENT") return anyNumber;
  return 1;
}

function inferHours(line: string, sessions: number, subjectHours?: number) {
  const explicit = numberNear(line, /(hours|hour|hrs|hr)/i);
  if (explicit > 0) return explicit;
  if (subjectHours && sessions <= 1) return subjectHours;
  return sessions;
}

function numberNear(line: string, unit: RegExp) {
  const matches = Array.from(line.matchAll(/(\d+(?:\.\d+)?)\s*([A-Za-z]+)/g));
  const found = matches.find((match) => unit.test(match[2]));
  return found ? Number(found[1]) : 0;
}

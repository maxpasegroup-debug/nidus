import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

type BatchRecord = {
  id: string;
  name: string;
  programSlug: string;
  batchType: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
};

type FacultyRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type CalendarSlot = {
  day: number;
  start: string;
  end: string;
  subject: string;
  topic: string;
  classType: "LECTURE" | "PRACTICE" | "REVISION" | "TEST" | "MOCK_TEST" | "DISCUSSION" | "LIVE_CLASS";
};

type AssignmentKeyRow = { teacherId: string; subject: string };
type ExistingCalendarRow = {
  subject: string | null;
  topic: string | null;
  plannedDate: Date | string | null;
  startTime: Date | string | null;
  classType: string | null;
};

type CalendarInsert = {
  id: string;
  batchId: string;
  batchName: string;
  programSlug: string;
  subject: string;
  topic: string;
  classType: string;
  plannedDate: Date;
  startTime: Date;
  endTime: Date;
  teacherId: string | null;
  teacherName: string | null;
  createdAt: Date;
  updatedAt: Date;
};
type CountRow = { count: bigint };

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const confirmed = args.has("--confirm") || process.env.CONFIRM_OFFICIAL_CALENDAR === "YES";

const officialStart = new Date("2026-06-01T00:00:00.000+05:30");
const defaultShortEnd = new Date("2026-12-31T23:59:59.000+05:30");
const ndaWeekendEnd = new Date("2027-09-11T23:59:59.000+05:30");
const schoolEnd = new Date("2027-03-31T23:59:59.000+05:30");

const targetBatchAliases: Record<string, string[]> = {
  "NDA Crash Course Online 2026": ["NDA Crash Course Online 2026"],
  "NDA Crash Course Offline 2026": ["NDA Crash Course Offline 2026"],
  "CDS Crash Course Online 2026": ["CDS Crash Course Online 2026"],
  "CDS Crash Course Offline 2026": ["CDS Crash Course Offline 2026"],
  "AFCAT Online 2026": ["AFCAT Online 2026"],
  "AFCAT Offline 2026": ["AFCAT Offline 2026"],
  "Agniveer Army": ["Agniveer Army"],
  "Agniveer Navy": ["Agniveer Navy"],
  "Agniveer Air Force": ["Agniveer Air Force"],
  "NDA F1 Offline 2026": ["NDA F1 Offline 2026"],
  "NDA F2 Offline 2026": ["NDA F2 Offline 2026"],
  "AISSEE Class 6 Offline 2026": ["AISSEE Class 6 Offline 2026", "AISSEE 6th Offline 2026"],
  "AISSEE Class 9 Offline 2026": ["AISSEE Class 9 Offline 2026", "AISSEE 9th Offline 2026"],
};

const facultySearchNames = [
  "Anjusha",
  "Sumitha",
  "Anjali",
  "Vidhya",
  "Nimisha",
  "Suma",
  "Silmiya",
  "SILMIYA",
  "Priyanka",
  "Ritwik",
];

const facultyPreferences: Record<string, string[]> = {
  Mathematics: ["Anjusha", "Sumitha"],
  English: ["Anjali"],
  Reasoning: ["Anjali"],
  Physics: ["Vidhya"],
  Chemistry: ["Nimisha"],
  Biology: ["Suma"],
  History: ["Ritwik"],
  Polity: ["Ritwik"],
  "Current Affairs": ["Ritwik"],
  "Defence Awareness": ["Ritwik"],
  Geography: ["Silmiya", "SILMIYA"],
  Economics: ["Silmiya", "SILMIYA"],
  "General Knowledge": ["Suma"],
  "General Science": ["Vidhya", "Suma"],
  Science: ["Vidhya", "Suma"],
  "Social Science": ["Silmiya", "Ritwik"],
  Test: ["Priyanka", "Ritwik"],
};

const agniveerSlots: CalendarSlot[] = [
  slot(1, "09:30", "10:30", "Mathematics"),
  slot(1, "10:30", "11:30", "Reasoning"),
  slot(1, "11:45", "12:45", "English"),
  slot(1, "13:30", "14:30", "Physics"),
  slot(1, "14:30", "15:30", "GK & Current Affairs", "General Knowledge", "LECTURE"),
  slot(1, "15:45", "16:30", "Daily Test", "Daily Test", "TEST"),
  slot(2, "09:30", "10:30", "Mathematics"),
  slot(2, "10:30", "11:30", "English"),
  slot(2, "11:45", "12:45", "Reasoning"),
  slot(2, "13:30", "14:30", "Chemistry"),
  slot(2, "14:30", "15:30", "History & Polity", "History", "LECTURE"),
  slot(2, "15:45", "16:30", "Daily Test", "Daily Test", "TEST"),
  slot(3, "09:30", "10:30", "Mathematics"),
  slot(3, "10:30", "11:30", "Reasoning"),
  slot(3, "11:45", "12:45", "English"),
  slot(3, "13:30", "14:30", "Physics"),
  slot(3, "14:30", "15:30", "Geography"),
  slot(3, "15:45", "16:30", "Daily Test", "Daily Test", "TEST"),
  slot(4, "09:30", "10:30", "Mathematics"),
  slot(4, "10:30", "11:30", "English"),
  slot(4, "11:45", "12:45", "Reasoning"),
  slot(4, "13:30", "14:30", "Biology"),
  slot(4, "14:30", "15:30", "GK & Defence", "Defence Awareness", "LECTURE"),
  slot(4, "15:45", "16:30", "Daily Test", "Daily Test", "TEST"),
  slot(5, "09:30", "10:30", "Mathematics"),
  slot(5, "10:30", "11:30", "Reasoning"),
  slot(5, "11:45", "12:45", "English"),
  slot(5, "13:30", "14:30", "Physics"),
  slot(5, "14:30", "15:30", "Current Affairs"),
  slot(5, "15:45", "16:30", "Daily Test", "Daily Test", "TEST"),
  slot(6, "09:30", "10:30", "Maths Revision", "Mathematics", "REVISION"),
  slot(6, "10:30", "11:30", "Reasoning Practice", "Reasoning", "PRACTICE"),
  slot(6, "11:45", "12:45", "English Practice", "English", "PRACTICE"),
  slot(6, "13:30", "14:30", "Science Practice", "General Science", "PRACTICE"),
  slot(6, "14:30", "15:30", "Weekly Mock Discussion", "General Knowledge", "DISCUSSION"),
  slot(6, "15:45", "16:30", "Grand Mock Test", "Grand Mock Test", "MOCK_TEST"),
];

const ndaWeekendSlots: CalendarSlot[] = [
  slot(6, "09:30", "10:30", "Mathematics"),
  slot(6, "10:30", "11:30", "English"),
  slot(6, "11:45", "12:45", "Physics/Chemistry", "Physics", "LECTURE"),
  slot(6, "13:30", "14:30", "Mathematics Practice", "Mathematics", "PRACTICE"),
  slot(6, "14:30", "15:30", "History/Geography/Polity", "History", "LECTURE"),
  slot(6, "15:45", "16:30", "Revision Test", "Revision Test", "TEST"),
  slot(0, "09:30", "10:30", "Mathematics"),
  slot(0, "10:30", "11:30", "Biology/Chemistry", "Biology", "LECTURE"),
  slot(0, "11:45", "12:45", "English"),
  slot(0, "13:30", "14:30", "Physics"),
  slot(0, "14:30", "15:30", "GA & Current Affairs", "Current Affairs", "LECTURE"),
  slot(0, "15:45", "16:30", "Weekly Test", "Weekly Test", "TEST"),
];

const cdsSlots: CalendarSlot[] = [
  ...weekdays([
    ["09:30", "10:30", "English"],
    ["10:30", "11:30", "General Knowledge"],
    ["11:45", "12:45", "History"],
    ["13:30", "14:30", "Polity"],
    ["14:30", "15:30", "Current Affairs"],
    ["15:45", "16:30", "Daily Practice Test", "Daily Practice Test", "TEST"],
  ]),
  slot(6, "09:30", "12:30", "Full Mock Test", "Full Mock Test", "MOCK_TEST"),
];

const afcatSlots: CalendarSlot[] = [
  ...weekdays([
    ["09:30", "10:30", "Mathematics"],
    ["10:30", "11:30", "Reasoning"],
    ["11:45", "12:45", "English"],
    ["13:30", "14:30", "General Science"],
    ["14:30", "15:30", "Current Affairs"],
    ["15:45", "16:30", "Daily Test", "Daily Test", "TEST"],
  ]),
  slot(6, "09:30", "12:30", "Full Mock Test", "Full Mock Test", "MOCK_TEST"),
];

const aissee6Slots: CalendarSlot[] = [
  ...weekdays([
    ["16:00", "17:00", "Mathematics"],
    ["17:00", "18:00", "English"],
    ["18:15", "19:15", "Science"],
    ["19:15", "20:00", "General Knowledge"],
  ]),
  slot(6, "16:00", "18:00", "Weekly Test", "Weekly Test", "TEST"),
];

const aissee9Slots: CalendarSlot[] = [
  ...weekdays([
    ["16:00", "17:00", "Mathematics"],
    ["17:00", "18:00", "English"],
    ["18:15", "19:15", "Science"],
    ["19:15", "20:00", "Social Science"],
  ]),
  slot(6, "16:00", "18:00", "Weekly Test", "Weekly Test", "TEST"),
];

const report = {
  dryRun,
  batches: {
    requested: Object.keys(targetBatchAliases).length,
    found: [] as string[],
    missing: [] as string[],
    withoutTimetable: [] as string[],
  },
  faculty: {
    found: {} as Record<string, string>,
    missing: [] as string[],
    subjectsWithoutFaculty: [] as string[],
    overload: [] as Array<{ faculty: string; date: string; sessions: number }>,
  },
  allocations: {
    prismaCreated: 0,
    prismaReused: 0,
    legacyCreated: 0,
    legacyReused: 0,
  },
  calendar: {
    eventsCreated: 0,
    eventsReused: 0,
    totalWeeklySessions: 0,
    totalMonthlySessions: 0,
    totalAnnualSessions: 0,
    distinctSubjects: 0,
  },
  students: {
    allocated: 0,
    batchesWithStudents: 0,
  },
  dashboardCoverage: {
    teacherDashboardCoveragePercent: 0,
    academicHeadCoveragePercent: 0,
    studentDashboardCoveragePercent: 0,
  },
};

function slot(
  day: number,
  start: string,
  end: string,
  topic: string,
  subject = topic,
  classType: CalendarSlot["classType"] = inferClassType(topic),
): CalendarSlot {
  return { day, start, end, subject, topic, classType };
}

function weekdays(rows: Array<[string, string, string, string?, CalendarSlot["classType"]?]>): CalendarSlot[] {
  const result: CalendarSlot[] = [];
  for (let day = 1; day <= 5; day += 1) {
    for (const [start, end, topic, subject, classType] of rows) {
      result.push(slot(day, start, end, topic, subject, classType));
    }
  }
  return result;
}

function inferClassType(topic: string): CalendarSlot["classType"] {
  const value = topic.toLowerCase();
  if (value.includes("mock")) return "MOCK_TEST";
  if (value.includes("test")) return "TEST";
  if (value.includes("practice")) return "PRACTICE";
  if (value.includes("revision")) return "REVISION";
  if (value.includes("discussion")) return "DISCUSSION";
  return "LECTURE";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pickDateRange(batch: BatchRecord) {
  const name = normalize(batch.name);
  const start = batch.startDate && batch.startDate > officialStart ? batch.startDate : officialStart;
  if (name.includes("nda f1") || name.includes("nda f2")) return { start, end: ndaWeekendEnd };
  if (name.includes("aissee") || name.includes("class 6") || name.includes("class 9")) return { start, end: batch.endDate ?? schoolEnd };
  return { start, end: batch.endDate ?? defaultShortEnd };
}

function getSlotsForBatch(batch: BatchRecord): CalendarSlot[] {
  const name = normalize(batch.name);
  const program = normalize(batch.programSlug);
  if (name.includes("agniveer") || program.includes("agniveer")) return agniveerSlots;
  if (name.includes("cds") || program.includes("cds")) return cdsSlots;
  if (name.includes("afcat") || program.includes("afcat")) return afcatSlots;
  if (name.includes("aissee") && (name.includes("6") || name.includes("class 6"))) return aissee6Slots;
  if (name.includes("aissee") && (name.includes("9") || name.includes("class 9"))) return aissee9Slots;
  if (name.includes("nda")) return ndaWeekendSlots;
  return [];
}

function combineDateTime(date: Date, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hour, minute, 0, 0);
  return combined;
}

function toDateKey(value: Date | string | null) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  return parsed.toISOString();
}

function calendarKey(subject: string, topic: string, plannedDate: Date, startTime: Date, classType: string) {
  return [subject, topic, plannedDate.toISOString(), startTime.toISOString(), classType].join("|");
}

function datesForSlot(start: Date, end: Date, day: number) {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  while (current.getDay() !== day) current.setDate(current.getDate() + 1);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return dates;
}

function topicKey(slotItem: CalendarSlot) {
  return slotItem.topic;
}

function subjectKey(subject: string) {
  const value = normalize(subject);
  if (value.includes("math")) return "Mathematics";
  if (value.includes("english")) return "English";
  if (value.includes("reasoning")) return "Reasoning";
  if (value.includes("physics")) return "Physics";
  if (value.includes("chemistry")) return "Chemistry";
  if (value.includes("biology")) return "Biology";
  if (value.includes("history")) return "History";
  if (value.includes("polity")) return "Polity";
  if (value.includes("current")) return "Current Affairs";
  if (value.includes("defence")) return "Defence Awareness";
  if (value.includes("geography")) return "Geography";
  if (value.includes("economics")) return "Economics";
  if (value.includes("gk") || value.includes("general knowledge") || value.includes("ga")) return "General Knowledge";
  if (value.includes("social")) return "Social Science";
  if (value.includes("science")) return "General Science";
  if (value.includes("test") || value.includes("mock")) return "Test";
  return subject;
}

async function findFaculty() {
  const users = await prisma.user.findMany({
    where: {
      OR: facultySearchNames.map((name) => ({ name: { contains: name, mode: "insensitive" } })),
      isDisabled: false,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const byName = new Map<string, FacultyRecord>();
  for (const requested of facultySearchNames) {
    const user = users.find((candidate) => normalize(candidate.name).includes(normalize(requested)));
    if (user && ["TEACHER", "ACADEMIC_HEAD", "PHYSICAL_TRAINER"].includes(user.role)) {
      byName.set(requested.toLowerCase(), user);
      report.faculty.found[requested] = `${user.name} (${user.role})`;
    }
  }

  for (const required of ["Anjusha", "Sumitha", "Anjali", "Vidhya", "Nimisha", "Suma", "Silmiya"]) {
    if (!byName.has(required.toLowerCase())) report.faculty.missing.push(required);
  }
  return byName;
}

function selectFaculty(subject: string, facultyByName: Map<string, FacultyRecord>) {
  const key = subjectKey(subject);
  const preferences = facultyPreferences[key] ?? facultyPreferences.Test;
  for (const preferred of preferences) {
    const faculty = facultyByName.get(preferred.toLowerCase());
    if (faculty) return faculty;
  }
  report.faculty.subjectsWithoutFaculty.push(key);
  return null;
}

async function loadAssignmentKeys(batchId: string) {
  const prismaRows = await prisma.teacherBatchAssignment.findMany({
    where: { batchId },
    select: { teacherId: true, subject: true },
  });
  const legacyRows = await prisma.$queryRaw<AssignmentKeyRow[]>`
    SELECT "teacherId", "subject"
    FROM "BatchTeacherAssignment"
    WHERE "batchId" = ${batchId}
  `;
  return {
    prismaKeys: new Set(prismaRows.map((row) => `${row.teacherId}|${row.subject}`)),
    legacyKeys: new Set(legacyRows.map((row) => `${row.teacherId}|${row.subject}`)),
  };
}

async function ensureTeacherAssignment(
  batch: BatchRecord,
  teacher: FacultyRecord,
  subject: string,
  prismaKeys: Set<string>,
  legacyKeys: Set<string>,
  role = "Subject Teacher",
) {
  const key = `${teacher.id}|${subject}`;
  const existingPrisma = prismaKeys.has(key);

  if (!dryRun) {
    if (existingPrisma) {
      await prisma.teacherBatchAssignment.updateMany({
        where: { batchId: batch.id, teacherId: teacher.id, subject },
        data: { status: "ACTIVE", role },
      });
    } else {
      await prisma.teacherBatchAssignment.create({
        data: { batchId: batch.id, teacherId: teacher.id, subject, role, status: "ACTIVE" },
      });
      prismaKeys.add(key);
    }
  }
  if (existingPrisma) report.allocations.prismaReused += 1;
  else report.allocations.prismaCreated += 1;

  const existingLegacy = legacyKeys.has(key);
  if (!dryRun) {
    if (existingLegacy) {
      await prisma.$executeRaw`
        UPDATE "BatchTeacherAssignment"
        SET "role" = ${role}, "status" = 'ACTIVE', "updatedAt" = ${new Date()}
        WHERE "batchId" = ${batch.id} AND "teacherId" = ${teacher.id} AND "subject" = ${subject}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "BatchTeacherAssignment"
        ("id", "batchId", "teacherId", "subject", "role", "status", "createdAt", "updatedAt")
        VALUES (${randomUUID()}, ${batch.id}, ${teacher.id}, ${subject}, ${role}, 'ACTIVE', ${new Date()}, ${new Date()})
      `;
      legacyKeys.add(key);
    }
  }
  if (existingLegacy) report.allocations.legacyReused += 1;
  else report.allocations.legacyCreated += 1;
}

async function loadExistingCalendarKeys(batchId: string) {
  const rows = await prisma.$queryRaw<ExistingCalendarRow[]>`
    SELECT "subject", "topic", "plannedDate", "startTime", "classType"
    FROM "AcademicCalendarItem"
    WHERE "batchId" = ${batchId}
  `;
  return new Set(
    rows.map((row) =>
      [row.subject ?? "", row.topic ?? "", toDateKey(row.plannedDate), toDateKey(row.startTime), row.classType ?? ""].join("|"),
    ),
  );
}

async function ensureCalendarItem(
  batch: BatchRecord,
  item: CalendarSlot,
  date: Date,
  teacher: FacultyRecord | null,
  existingKeys: Set<string>,
): Promise<CalendarInsert | null> {
  const plannedDate = combineDateTime(date, item.start);
  const startTime = combineDateTime(date, item.start);
  const endTime = combineDateTime(date, item.end);
  const key = calendarKey(item.subject, topicKey(item), plannedDate, startTime, item.classType);
  const exists = existingKeys.has(key);

  if (exists) report.calendar.eventsReused += 1;
  else {
    report.calendar.eventsCreated += 1;
    existingKeys.add(key);
    const now = new Date();
    return {
      id: randomUUID(),
      batchId: batch.id,
      batchName: batch.name,
      programSlug: batch.programSlug,
      subject: item.subject,
      topic: topicKey(item),
      classType: item.classType,
      plannedDate,
      startTime,
      endTime,
      teacherId: teacher?.id ?? null,
      teacherName: teacher?.name ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }
  return null;
}

async function insertCalendarRows(rows: CalendarInsert[]) {
  if (dryRun || rows.length === 0) return;
  const chunkSize = 500;
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    await prisma.$executeRaw`
      INSERT INTO "AcademicCalendarItem"
      ("id", "batchId", "batchName", "programSlug", "subject", "topic", "classType", "plannedDate", "startTime", "endTime", "teacherId", "teacherName", "status", "completionStatus", "teacherLog", "nextAction", "createdAt", "updatedAt")
      VALUES ${Prisma.join(
        chunk.map((row) => Prisma.sql`
          (${row.id}, ${row.batchId}, ${row.batchName}, ${row.programSlug}, ${row.subject}, ${row.topic}, ${row.classType}, ${row.plannedDate}, ${row.startTime}, ${row.endTime}, ${row.teacherId}, ${row.teacherName}, 'PLANNED', 'PENDING', null, 'Official NIDUS academic calendar', ${row.createdAt}, ${row.updatedAt})
        `),
      )}
    `;
  }
}

async function loadTargetBatches() {
  const aliasNames = Object.values(targetBatchAliases).flat();
  const exact = await prisma.batch.findMany({
    where: { name: { in: aliasNames }, status: "ACTIVE" },
    select: { id: true, name: true, programSlug: true, batchType: true, status: true, startDate: true, endDate: true },
  });
  const discovered = await prisma.batch.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { name: { contains: "Agniveer", mode: "insensitive" } },
        { programSlug: { contains: "agniveer", mode: "insensitive" } },
        { name: { contains: "AFCAT", mode: "insensitive" } },
        { programSlug: { contains: "afcat", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, programSlug: true, batchType: true, status: true, startDate: true, endDate: true },
  });

  const byId = new Map<string, BatchRecord>();
  for (const batch of [...exact, ...discovered]) byId.set(batch.id, batch);
  const batches = Array.from(byId.values());
  const foundNames = new Set(batches.map((batch) => batch.name));
  for (const [canonical, aliases] of Object.entries(targetBatchAliases)) {
    if (aliases.some((alias) => foundNames.has(alias))) report.batches.found.push(canonical);
    else report.batches.missing.push(canonical);
  }
  return batches;
}

async function getStudentCount(batchIds: string[]) {
  if (batchIds.length === 0) return 0;
  const count = await prisma.batchStudent.count({ where: { batchId: { in: batchIds }, status: "ACTIVE" } });
  const batchesWithStudents = await prisma.batchStudent.findMany({
    where: { batchId: { in: batchIds }, status: "ACTIVE" },
    distinct: ["batchId"],
    select: { batchId: true },
  });
  report.students.allocated = count;
  report.students.batchesWithStudents = batchesWithStudents.length;
  return count;
}

async function countTable(tableName: string) {
  const result = await prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*)::bigint AS count FROM "${tableName}"`);
  return Number(result[0]?.count ?? 0);
}

async function main() {
  if (!dryRun && !confirmed) {
    throw new Error("Official calendar generation requires --confirm or CONFIRM_OFFICIAL_CALENDAR=YES. Run --dry-run first.");
  }

  const facultyByName = await findFaculty();
  const batches = await loadTargetBatches();
  const generatedSubjects = new Set<string>();
  const facultyDailyLoad = new Map<string, number>();
  const batchIds = batches.map((batch) => batch.id);
  await getStudentCount(batchIds);

  for (const batch of batches) {
    const slots = getSlotsForBatch(batch);
    if (slots.length === 0) {
      report.batches.withoutTimetable.push(batch.name);
      continue;
    }
    const existingKeys = await loadExistingCalendarKeys(batch.id);
    const assignmentKeys = await loadAssignmentKeys(batch.id);
    const range = pickDateRange(batch);
    const calendarRows: CalendarInsert[] = [];
    report.calendar.totalWeeklySessions += slots.length;
    for (const timetableSlot of slots) {
      generatedSubjects.add(timetableSlot.subject);
      const teacher = selectFaculty(timetableSlot.subject, facultyByName);
      if (teacher) {
        await ensureTeacherAssignment(
          batch,
          teacher,
          timetableSlot.subject,
          assignmentKeys.prismaKeys,
          assignmentKeys.legacyKeys,
          timetableSlot.classType.includes("TEST") ? "Assessment Faculty" : "Subject Teacher",
        );
      }
      for (const date of datesForSlot(range.start, range.end, timetableSlot.day)) {
        const row = await ensureCalendarItem(batch, timetableSlot, date, teacher, existingKeys);
        if (row) calendarRows.push(row);
        if (teacher) {
          const loadKey = `${teacher.name}|${date.toISOString().slice(0, 10)}`;
          facultyDailyLoad.set(loadKey, (facultyDailyLoad.get(loadKey) ?? 0) + 1);
        }
      }
    }
    await insertCalendarRows(calendarRows);
  }

  for (const [key, sessions] of facultyDailyLoad.entries()) {
    if (sessions > 6) {
      const [faculty, date] = key.split("|");
      report.faculty.overload.push({ faculty, date, sessions });
    }
  }

  report.calendar.distinctSubjects = generatedSubjects.size;
  report.calendar.totalAnnualSessions = report.calendar.eventsCreated + report.calendar.eventsReused;
  report.calendar.totalMonthlySessions = Math.round(report.calendar.totalAnnualSessions / 12);

  const totalCalendarRows = dryRun ? report.calendar.totalAnnualSessions : await countTable("AcademicCalendarItem");
  const batchesWithEvents = batches.length === 0 ? 0 : batches.length - report.batches.withoutTimetable.length;
  report.dashboardCoverage.teacherDashboardCoveragePercent = batches.length ? Math.round((batchesWithEvents / batches.length) * 100) : 0;
  report.dashboardCoverage.academicHeadCoveragePercent = batches.length ? Math.round((batchesWithEvents / batches.length) * 100) : 0;
  report.dashboardCoverage.studentDashboardCoveragePercent = report.students.batchesWithStudents
    ? Math.round((Math.min(batchesWithEvents, report.students.batchesWithStudents) / report.students.batchesWithStudents) * 100)
    : 0;

  console.log(JSON.stringify({
    status: dryRun ? "DRY_RUN_COMPLETE" : "OFFICIAL_CALENDAR_GENERATED",
    message: dryRun
      ? "No records were written. Re-run with --confirm to seed the official calendar."
      : "Official NIDUS academic calendar records are now available to dashboards.",
    totals: {
      totalBatches: batches.length,
      totalCalendarEventsInTable: totalCalendarRows,
      totalFacultyAllocations: report.allocations.prismaCreated + report.allocations.prismaReused,
      totalStudentAllocations: report.students.allocated,
      totalSubjects: report.calendar.distinctSubjects,
      totalWeeklySessions: report.calendar.totalWeeklySessions,
      totalMonthlySessions: report.calendar.totalMonthlySessions,
      totalAnnualSessions: report.calendar.totalAnnualSessions,
    },
    report,
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

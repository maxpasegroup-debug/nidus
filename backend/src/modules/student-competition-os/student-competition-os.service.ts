import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { emitDomainEvent } from "../event-engine/event-engine.service.js";

type CompetitionActor = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  roleMetadata?: Record<string, unknown> | null;
};

type CompetitionPeriod = "DAILY" | "MONTHLY" | "FINAL" | "ALL_TIME";

type StudentScore = {
  userId: string;
  name: string;
  email: string;
  batchNames: string[];
  points: number;
  rank: number;
  attendancePoints: number;
  assignmentPoints: number;
  examPoints: number;
  quizBattlePoints: number;
  fitnessPoints: number;
  improvementPoints: number;
  attendanceStreak: number;
  assignmentStreak: number;
  examStreak: number;
  totalStreak: number;
  attendancePercentage: number;
  assignmentCompletionPercentage: number;
  averageExamScore: number;
  improvementScore: number;
  award: string | null;
};

const viewRoles = new Set<Role>([Role.ADMIN, Role.DIRECTOR, Role.ACADEMIC_HEAD, Role.TEACHER, Role.STUDENT, Role.PARENT]);

const framework = [
  { key: "DAILY_RANK", label: "Daily Rank", source: "Attendance, assignment submissions, test attempts, quiz battles and fitness logs for today" },
  { key: "MONTHLY_LEADERBOARD", label: "Monthly Leaderboard", source: "Current month competition score" },
  { key: "FINAL_LEADERBOARD", label: "Final Leaderboard", source: "Active batch lifetime competition score" },
  { key: "ALL_TIME_RECORDS", label: "All-time Records", source: "Existing Leaderboard table" },
  { key: "IMPROVEMENT_AWARDS", label: "Improvement Awards", source: "First-half to second-half exam improvement" },
  { key: "ATTENDANCE_STREAKS", label: "Attendance Streaks", source: "Attendance records" },
  { key: "ASSIGNMENT_STREAKS", label: "Assignment Streaks", source: "AssignmentSubmissionRecord" },
  { key: "EXAM_STREAKS", label: "Exam Streaks", source: "TestAttempt" }
] as const;

function requireCompetitionAccess(actor: CompetitionActor) {
  const template = typeof actor.roleMetadata?.dashboardTemplate === "string" ? actor.roleMetadata.dashboardTemplate.toUpperCase() : "";
  if (!viewRoles.has(actor.role) && template !== "ACADEMIC_HEAD") {
    throw Object.assign(new Error("Student Competition OS access required"), { statusCode: 403 });
  }
}

function periodWindow(period: CompetitionPeriod) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "MONTHLY") {
    start.setDate(1);
  }
  if (period === "FINAL" || period === "ALL_TIME") {
    start.setFullYear(2000, 0, 1);
  }
  return { start, end: now, period };
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number.isFinite(value) ? value : 0)));
}

function normalizedStatus(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function streakFromDates(dates: Date[], activeStatus = true) {
  if (!activeStatus || !dates.length) return 0;
  const unique = Array.from(new Set(dates.map((date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy.getTime();
  }))).sort((a, b) => b - a);
  let streak = 0;
  let expected = unique[0];
  for (const value of unique) {
    if (value !== expected) break;
    streak += 1;
    expected -= 24 * 60 * 60 * 1000;
  }
  return streak;
}

function awardFor(score: StudentScore) {
  if (score.points <= 0) return null;
  if (score.improvementScore >= 20) return "Most Improved";
  if (score.attendanceStreak >= 7) return "Attendance Streak";
  if (score.assignmentStreak >= 5) return "Assignment Streak";
  if (score.examStreak >= 4) return "Exam Streak";
  if (score.rank <= 3) return "Top Performer";
  return null;
}

async function auditView(actor: CompetitionActor, action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      module: "student-competition-os",
      action,
      description: JSON.stringify({ description: action, actorRole: actor.role, metadata })
    }
  }).catch(() => undefined);
  emitDomainEvent({
    category: "STUDENT_COMPETITION",
    eventName: action,
    title: action.replaceAll("_", " ").toLowerCase(),
    description: "Student Competition OS operating view was used.",
    actor,
    entityType: "StudentCompetitionOS",
    severity: "INFO",
    source: "API",
    metadata
  });
}

async function refreshAllTimeRanks() {
  const rows = await prisma.leaderboard.findMany({ orderBy: [{ points: "desc" }, { streak: "desc" }] });
  await Promise.all(rows.map((row, index) => prisma.leaderboard.update({ where: { id: row.id }, data: { rank: index + 1 } })));
}

export const studentCompetitionOsService = {
  framework() {
    return {
      name: "NIDUS Student Competition Operating System",
      principle: "Competition must reward consistency, improvement and disciplined completion, not only toppers. Rankings should motivate students without creating pressure or clutter.",
      framework
    };
  },

  async leaderboard(actor: CompetitionActor, period: CompetitionPeriod = "MONTHLY", batchId?: string) {
    requireCompetitionAccess(actor);
    const window = periodWindow(period);
    const batchWhere = batchId ? { batchId, status: "ACTIVE" } : { status: "ACTIVE" };
    const batchStudents = await prisma.batchStudent.findMany({
      where: batchWhere,
      include: { student: { select: { id: true, name: true, email: true, role: true, isDisabled: true } }, batch: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "asc" }
    });
    const uniqueStudentIds = Array.from(new Set(batchStudents.filter((item) => !item.student.isDisabled).map((item) => item.studentId)));
    const students = uniqueStudentIds.length
      ? await prisma.user.findMany({ where: { id: { in: uniqueStudentIds }, role: Role.STUDENT, isDisabled: false }, select: { id: true, name: true, email: true } })
      : [];
    const batchNamesByStudent = new Map<string, string[]>();
    for (const item of batchStudents) {
      const current = batchNamesByStudent.get(item.studentId) ?? [];
      if (!current.includes(item.batch.name)) current.push(item.batch.name);
      batchNamesByStudent.set(item.studentId, current);
    }

    const [attendance, submissions, attempts, quizBattleRows, fitnessLogs, allTimeRows] = await Promise.all([
      uniqueStudentIds.length ? prisma.attendance.findMany({ where: { userId: { in: uniqueStudentIds }, date: { gte: window.start, lte: window.end } } }) : [],
      uniqueStudentIds.length ? prisma.assignmentSubmissionRecord.findMany({ where: { studentId: { in: uniqueStudentIds }, submittedAt: { gte: window.start, lte: window.end } } }) : [],
      uniqueStudentIds.length ? prisma.testAttempt.findMany({ where: { userId: { in: uniqueStudentIds }, submittedAt: { gte: window.start, lte: window.end } }, include: { test: { select: { title: true } } } }) : [],
      uniqueStudentIds.length ? prisma.quizBattleParticipant.findMany({ where: { userId: { in: uniqueStudentIds }, battle: { startTime: { gte: window.start, lte: window.end } } } }) : [],
      uniqueStudentIds.length ? prisma.dailyFitnessLog.findMany({ where: { userId: { in: uniqueStudentIds }, createdAt: { gte: window.start, lte: window.end } } }) : [],
      uniqueStudentIds.length ? prisma.leaderboard.findMany({ where: { userId: { in: uniqueStudentIds } } }) : []
    ]);

    const allTimeByUser = new Map(allTimeRows.map((row) => [row.userId, row]));
    const scores = students.map((student) => {
      const studentAttendance = attendance.filter((row) => row.userId === student.id);
      const presentDates = studentAttendance.filter((row) => normalizedStatus(row.status) === "PRESENT").map((row) => row.date);
      const studentSubmissions = submissions.filter((row) => row.studentId === student.id);
      const scoredSubmissions = studentSubmissions.filter((row) => typeof row.score === "number");
      const studentAttempts = attempts.filter((row) => row.userId === student.id && row.submittedAt);
      const firstHalf = studentAttempts.slice(0, Math.ceil(studentAttempts.length / 2));
      const secondHalf = studentAttempts.slice(Math.ceil(studentAttempts.length / 2));
      const firstAverage = firstHalf.length ? firstHalf.reduce((sum, row) => sum + row.score, 0) / firstHalf.length : 0;
      const secondAverage = secondHalf.length ? secondHalf.reduce((sum, row) => sum + row.score, 0) / secondHalf.length : firstAverage;
      const improvementScore = clamp(secondAverage - firstAverage, 0, 50);
      const studentQuiz = quizBattleRows.filter((row) => row.userId === student.id);
      const studentFitness = fitnessLogs.filter((row) => row.userId === student.id);
      const attendancePercentage = pct(presentDates.length, studentAttendance.length);
      const assignmentCompletionPercentage = pct(studentSubmissions.length, Math.max(studentSubmissions.length, 1));
      const averageExamScore = studentAttempts.length ? Math.round(studentAttempts.reduce((sum, row) => sum + row.score, 0) / studentAttempts.length) : 0;
      const attendancePoints = period === "ALL_TIME" ? allTimeByUser.get(student.id)?.points ?? 0 : Math.round(attendancePercentage * 0.3);
      const assignmentPoints = period === "ALL_TIME" ? 0 : studentSubmissions.length * 10 + scoredSubmissions.reduce((sum, row) => sum + clamp(row.score ?? 0, 0, 100), 0);
      const examPoints = period === "ALL_TIME" ? 0 : studentAttempts.reduce((sum, row) => sum + clamp(row.score, 0, 100), 0);
      const quizBattlePoints = period === "ALL_TIME" ? 0 : studentQuiz.reduce((sum, row) => sum + row.score, 0);
      const fitnessPoints = period === "ALL_TIME" ? 0 : Math.min(studentFitness.length * 8, 120);
      const totalStreak = period === "ALL_TIME" ? allTimeByUser.get(student.id)?.streak ?? 0 : 0;
      const score: StudentScore = {
        userId: student.id,
        name: student.name,
        email: student.email,
        batchNames: batchNamesByStudent.get(student.id) ?? [],
        points: attendancePoints + assignmentPoints + examPoints + quizBattlePoints + fitnessPoints + improvementScore,
        rank: 0,
        attendancePoints,
        assignmentPoints,
        examPoints,
        quizBattlePoints,
        fitnessPoints,
        improvementPoints: improvementScore,
        attendanceStreak: streakFromDates(presentDates),
        assignmentStreak: streakFromDates(studentSubmissions.map((row) => row.submittedAt)),
        examStreak: streakFromDates(studentAttempts.map((row) => row.submittedAt).filter((date): date is Date => Boolean(date))),
        totalStreak,
        attendancePercentage,
        assignmentCompletionPercentage,
        averageExamScore,
        improvementScore,
        award: null
      };
      score.totalStreak = period === "ALL_TIME" ? score.totalStreak : score.attendanceStreak + score.assignmentStreak + score.examStreak;
      return score;
    }).sort((a, b) => b.points - a.points || b.totalStreak - a.totalStreak || b.averageExamScore - a.averageExamScore);

    const ranked = scores.map((score, index) => {
      const next = { ...score, rank: index + 1 };
      next.award = awardFor(next);
      return next;
    });
    if (period === "ALL_TIME") await refreshAllTimeRanks();
    await auditView(actor, "STUDENT_COMPETITION_VIEWED", { period, batchId: batchId ?? null, students: ranked.length });
    return {
      name: "NIDUS Student Competition Operating System",
      period,
      batchId: batchId ?? null,
      summary: {
        students: ranked.length,
        topScore: ranked[0]?.points ?? 0,
        averageScore: ranked.length ? Math.round(ranked.reduce((sum, item) => sum + item.points, 0) / ranked.length) : 0,
        awards: ranked.filter((item) => item.award).length,
        attendanceStreaks: ranked.filter((item) => item.attendanceStreak > 0).length,
        assignmentStreaks: ranked.filter((item) => item.assignmentStreak > 0).length,
        examStreaks: ranked.filter((item) => item.examStreak > 0).length
      },
      topStudents: ranked.slice(0, 10),
      improvementAwards: ranked.filter((item) => item.award === "Most Improved").slice(0, 10),
      streakAwards: ranked.filter((item) => ["Attendance Streak", "Assignment Streak", "Exam Streak"].includes(item.award ?? "")).slice(0, 10),
      leaderboard: ranked
    };
  },

  async student(actor: CompetitionActor, userId: string) {
    requireCompetitionAccess(actor);
    if (actor.role === Role.STUDENT && actor.id !== userId) {
      throw Object.assign(new Error("Students can view only their own competition profile"), { statusCode: 403 });
    }
    if (actor.role === Role.PARENT) {
      const link = await prisma.parentStudentLink.findFirst({ where: { parentId: actor.id, studentId: userId, status: "ACTIVE" }, select: { id: true } });
      if (!link) throw Object.assign(new Error("Parents can view only linked student competition profiles"), { statusCode: 403 });
    }
    const [daily, monthly, finalBoard, allTime] = await Promise.all([
      this.leaderboard(actor, "DAILY"),
      this.leaderboard(actor, "MONTHLY"),
      this.leaderboard(actor, "FINAL"),
      this.leaderboard(actor, "ALL_TIME")
    ]);
    const profile = {
      daily: daily.leaderboard.find((item) => item.userId === userId) ?? null,
      monthly: monthly.leaderboard.find((item) => item.userId === userId) ?? null,
      final: finalBoard.leaderboard.find((item) => item.userId === userId) ?? null,
      allTime: allTime.leaderboard.find((item) => item.userId === userId) ?? null
    };
    await auditView(actor, "STUDENT_COMPETITION_PROFILE_VIEWED", { userId });
    return { name: "NIDUS Student Competition Profile", userId, profile };
  }
};

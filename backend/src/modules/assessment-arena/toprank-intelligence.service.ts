import { prisma } from "../../config/prisma.js";
import { topRankGrowthService } from "./toprank-growth.service.js";
import { topRankPerformanceService } from "./toprank-performance.service.js";
import { topRankReadinessService } from "./toprank-readiness.service.js";
import { topRankRiskService } from "./toprank-risk.service.js";
import type { TopRankSignalBundle, TopRankSignalScope } from "./toprank-types.js";

const DEFAULT_WEIGHTS = {
  name: "DEFAULT_TOP_RANK_WEIGHTS",
  attendanceWeight: 20,
  assignmentWeight: 20,
  examWeight: 20,
  testWeight: 15,
  liveClassWeight: 10,
  fitnessWeight: 10,
  progressWeight: 5,
  disciplineWeight: 20
};

function average(numbers: number[]) {
  if (!numbers.length) return null;
  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

function normalizeStatus(status?: string | null) {
  return String(status || "").trim().toUpperCase();
}

function percent(part: number, total: number) {
  if (!total) return null;
  return Math.round((part / total) * 100);
}

function scoreFromAttempt(attempt: { score: number; test?: { totalMarks?: number | null } | null }) {
  const totalMarks = attempt.test?.totalMarks;
  if (typeof totalMarks === "number" && totalMarks > 0) return Math.round((attempt.score / totalMarks) * 100);
  return attempt.score;
}

export const topRankIntelligenceService = {
  async weights(programSlug?: string) {
    const existing = await prisma.topRankSignalWeightConfig.findFirst({
      where: {
        status: "ACTIVE",
        OR: [{ programSlug: programSlug ?? null }, { programSlug: null }]
      },
      orderBy: [{ programSlug: "desc" }, { createdAt: "desc" }]
    });
    return existing ?? DEFAULT_WEIGHTS;
  },

  async collectSignals(scope: TopRankSignalScope): Promise<TopRankSignalBundle> {
    const batchMemberships = await prisma.batchStudent.findMany({
      where: { studentId: scope.userId, ...(scope.batchId ? { batchId: scope.batchId } : {}) },
      include: { batch: true }
    });
    const batchIds = batchMemberships.map((item) => item.batchId);
    const selectedBatch = batchMemberships[0]?.batch;
    const effectiveBatchIds = scope.batchId ? [scope.batchId] : batchIds;

    const [
      attendance,
      teacherAttendance,
      assignments,
      submissions,
      exams,
      tests,
      attempts,
      liveClasses,
      fitnessProfile,
      fitnessLogs,
      ptAttendance,
      lectureProgress,
      guruProgress,
      enrollments,
      teacherAssignments
    ] = await Promise.all([
      prisma.attendance.findMany({ where: { userId: scope.userId } }),
      effectiveBatchIds.length
        ? prisma.teacherAttendanceRecord.findMany({ where: { batchId: { in: effectiveBatchIds } } })
        : prisma.teacherAttendanceRecord.findMany(),
      effectiveBatchIds.length
        ? prisma.teacherAssignmentRecord.findMany({ where: { batchId: { in: effectiveBatchIds } } })
        : prisma.teacherAssignmentRecord.findMany(),
      prisma.assignmentSubmissionRecord.findMany({
        where: { studentId: scope.userId, ...(effectiveBatchIds.length ? { batchId: { in: effectiveBatchIds } } : {}) }
      }),
      effectiveBatchIds.length
        ? prisma.teacherExamRecord.findMany({ where: { batchId: { in: effectiveBatchIds } } })
        : prisma.teacherExamRecord.findMany(),
      effectiveBatchIds.length
        ? prisma.test.findMany({ where: { batchId: { in: effectiveBatchIds } } })
        : prisma.test.findMany(),
      prisma.testAttempt.findMany({
        where: { userId: scope.userId, ...(effectiveBatchIds.length ? { test: { batchId: { in: effectiveBatchIds } } } : {}) },
        include: { test: true }
      }),
      effectiveBatchIds.length
        ? prisma.liveClass.findMany({ where: { batchId: { in: effectiveBatchIds } } })
        : prisma.liveClass.findMany(),
      prisma.fitnessProfile.findUnique({ where: { userId: scope.userId } }),
      prisma.dailyFitnessLog.findMany({ where: { userId: scope.userId } }),
      prisma.pTAttendance.findMany({ where: { studentId: scope.userId } }),
      prisma.lectureProgress.findMany({ where: { userId: scope.userId } }),
      prisma.guruProgress.findMany({ where: { userId: scope.userId } }),
      prisma.enrollment.findMany({ where: { userId: scope.userId } }),
      effectiveBatchIds.length
        ? prisma.teacherBatchAssignment.findMany({ where: { batchId: { in: effectiveBatchIds }, status: "ACTIVE" } })
        : prisma.teacherBatchAssignment.findMany({ where: { status: "ACTIVE" } })
    ]);

    const present = attendance.filter((item) => normalizeStatus(item.status) === "PRESENT").length;
    const absent = attendance.filter((item) => normalizeStatus(item.status) === "ABSENT").length;
    const submitted = submissions.length;
    const reviewed = submissions.filter((item) => normalizeStatus(item.reviewStatus).includes("REVIEWED") || item.score !== null).length;
    const submissionScores = submissions.map((item) => item.score).filter((score): score is number => typeof score === "number");
    const attemptScores = attempts.map(scoreFromAttempt).filter((score) => Number.isFinite(score));
    const publishedExams = exams.filter((item) => normalizeStatus(item.status) === "PUBLISHED").length;
    const assignmentCompletion = assignments.length ? percent(submitted, assignments.length) : null;
    const enrollmentProgress = average(enrollments.map((item) => item.progress));
    const fitnessAverage = average(
      fitnessLogs.map((item) =>
        Math.min(100, Math.round(item.workoutDuration * 2 + item.runningDistance * 10 + item.waterIntake * 5))
      )
    );
    const uniqueTeachers = new Set(teacherAssignments.map((item) => item.teacherId));
    const uniqueSubjects = new Set(teacherAssignments.map((item) => item.subject));

    return {
      userId: scope.userId,
      batchId: scope.batchId ?? selectedBatch?.id,
      programSlug: selectedBatch?.programSlug ?? undefined,
      attendance: {
        total: attendance.length,
        present,
        absent,
        percentage: percent(present, attendance.length),
        teacherSessions: teacherAttendance.length
      },
      assignments: {
        assigned: assignments.length,
        submitted,
        reviewed,
        averageScore: average(submissionScores),
        completionPercentage: assignmentCompletion
      },
      exams: {
        records: exams.length,
        published: publishedExams,
        teacherExamAverage: null
      },
      tests: {
        available: tests.length,
        attempts: attempts.length,
        submitted: attempts.filter((item) => normalizeStatus(item.status) === "SUBMITTED" || item.submittedAt).length,
        averageScore: average(attemptScores)
      },
      liveClasses: {
        scheduled: liveClasses.length,
        completed: liveClasses.filter((item) => normalizeStatus(item.status) === "COMPLETED").length,
        recordings: liveClasses.filter((item) => Boolean(item.recordingUrl)).length
      },
      fitness: {
        profileCount: fitnessProfile ? 1 : 0,
        logCount: fitnessLogs.length,
        ptAttendanceCount: ptAttendance.length,
        latestFitnessLevel: fitnessProfile?.fitnessLevel ?? undefined,
        averageDailyScore: fitnessAverage
      },
      progress: {
        lectureProgressCount: lectureProgress.length,
        lectureCompleted: lectureProgress.filter((item) => item.completed).length,
        guruProgressCount: guruProgress.length,
        enrollmentProgress
      },
      teachers: {
        allocatedTeachers: uniqueTeachers.size,
        allocatedSubjects: uniqueSubjects.size
      },
      sourceCounts: {
        batchMemberships: batchMemberships.length,
        attendance: attendance.length,
        teacherAttendance: teacherAttendance.length,
        assignments: assignments.length,
        submissions: submissions.length,
        exams: exams.length,
        tests: tests.length,
        attempts: attempts.length,
        liveClasses: liveClasses.length,
        fitnessLogs: fitnessLogs.length,
        lectureProgress: lectureProgress.length,
        guruProgress: guruProgress.length,
        teacherAssignments: teacherAssignments.length
      }
    };
  },

  async readiness(scope: TopRankSignalScope) {
    const signals = await this.collectSignals(scope);
    const weights = await this.weights(signals.programSlug);
    return { signals, weights, readiness: topRankReadinessService.calculate(signals) };
  },

  async performance(scope: TopRankSignalScope) {
    const signals = await this.collectSignals(scope);
    return { signals, performance: topRankPerformanceService.calculate(signals) };
  },

  async growth(scope: TopRankSignalScope, dayLabel = "DAY_30") {
    const signals = await this.collectSignals(scope);
    const readiness = topRankReadinessService.calculate(signals);
    return { signals, growth: await topRankGrowthService.calculate(signals, readiness.score, dayLabel) };
  },

  async risks(scope: TopRankSignalScope) {
    const signals = await this.collectSignals(scope);
    return { signals, risks: topRankRiskService.calculate(signals) };
  },

  async calculate(scope: TopRankSignalScope, dayLabel = "DAY_30") {
    const signals = await this.collectSignals(scope);
    const readiness = topRankReadinessService.calculate(signals);
    const performance = topRankPerformanceService.calculate(signals);
    const growth = await topRankGrowthService.calculate(signals, readiness.score, dayLabel);
    const risks = topRankRiskService.calculate(signals);

    const snapshot = await prisma.topRankSignalSnapshot.create({
      data: {
        userId: signals.userId,
        batchId: signals.batchId,
        programSlug: signals.programSlug,
        attendanceSignals: signals.attendance,
        assignmentSignals: signals.assignments,
        examSignals: signals.exams,
        testSignals: signals.tests,
        liveClassSignals: signals.liveClasses,
        fitnessSignals: signals.fitness,
        progressSignals: signals.progress,
        teacherSignals: signals.teachers,
        sourceCounts: signals.sourceCounts
      }
    });

    const readinessRecord = await prisma.topRankReadinessScore.create({
      data: {
        userId: signals.userId,
        batchId: signals.batchId,
        snapshotId: snapshot.id,
        readinessScore: readiness.score,
        readinessBand: readiness.band,
        readinessExplanation: readiness.explanation,
        academicScore: readiness.academicScore,
        disciplineScore: readiness.disciplineScore,
        performanceScore: readiness.performanceScore,
        growthScore: readiness.growthScore,
        riskScore: readiness.riskScore,
        componentScores: readiness.components
      }
    });

    const performanceRecord = await prisma.topRankPerformanceTrend.create({
      data: {
        userId: signals.userId,
        batchId: signals.batchId,
        snapshotId: snapshot.id,
        performanceTrend: performance.performanceTrend,
        completionTrend: performance.completionTrend,
        improvementTrend: performance.improvementTrend,
        studyTrend: performance.studyTrend,
        score: performance.score,
        metrics: performance.metrics
      }
    });

    const growthRecord = await prisma.topRankGrowthTrend.create({
      data: {
        userId: signals.userId,
        batchId: signals.batchId,
        snapshotId: snapshot.id,
        dayLabel: growth.dayLabel,
        growthScore: growth.growthScore,
        growthClassification: growth.growthClassification,
        baselineScore: growth.baselineScore,
        currentScore: growth.currentScore,
        comparisonData: growth.comparisonData
      }
    });

    const riskRecords = await Promise.all(
      risks.map((risk) =>
        prisma.topRankRiskTrend.create({
          data: {
            userId: signals.userId,
            batchId: signals.batchId,
            snapshotId: snapshot.id,
            riskType: risk.riskType,
            riskLevel: risk.riskLevel,
            riskScore: risk.riskScore,
            reason: risk.reason,
            metadata: { generatedBy: "TOP_RANK_INTELLIGENCE_FOUNDATION" }
          }
        })
      )
    );

    return {
      snapshot,
      readiness: readinessRecord,
      performance: performanceRecord,
      growth: growthRecord,
      risks: riskRecords,
      rule: "TOP RANK Intelligence reads LMS data only. It does not predict AIR, selection, or final rank."
    };
  }
};

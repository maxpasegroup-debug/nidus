import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import type { AuthenticatedRequest } from "../../middlewares/session.middleware.js";

type Actor = NonNullable<AuthenticatedRequest["user"]>;

const REQUIRED_PROGRAMS = ["NDA", "CDS", "AFCAT", "SSB", "Agniveer", "MNS", "TES", "TGC", "SSC Technical", "AFMC", "RIMC"];
const KNOWLEDGE_AREAS = ["Eligibility", "Exam Pattern", "Syllabus", "Cutoffs", "Physical Standards", "Medical Standards", "Interview Process", "Previous Trends", "Question Banks"];

function metadata(actor: Actor) {
  return actor.roleMetadata && typeof actor.roleMetadata === "object" ? actor.roleMetadata : {};
}

function isAcademicHead(actor: Actor) {
  const template = metadata(actor).dashboardTemplate;
  return actor.role === Role.ACADEMIC_HEAD || (typeof template === "string" && template.toUpperCase() === "ACADEMIC_HEAD");
}

function isDirector(actor: Actor) {
  return actor.role === Role.ADMIN || actor.role === Role.DIRECTOR;
}

function isTeacher(actor: Actor) {
  return actor.role === Role.TEACHER || isAcademicHead(actor);
}

function percent(done: number, total: number) {
  if (!total) return null;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

function scoreFromSignals(values: Array<number | null | undefined>) {
  const usable = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!usable.length) return null;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function statusFromScore(score: number | null) {
  if (score === null) return "NO_DATA";
  if (score >= 75) return "HEALTHY";
  if (score >= 50) return "ATTENTION";
  return "CRITICAL";
}

function jsonArray(value: unknown): Array<Record<string, any>> {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object") as Array<Record<string, any>>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function includesText(value: string | null | undefined, token: string) {
  return String(value ?? "").toLowerCase().includes(token.toLowerCase());
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

async function accessibleBatchIds(actor: Actor) {
  if (isDirector(actor) || isAcademicHead(actor)) {
    const batches = await prisma.batch.findMany({ where: { status: { not: "ARCHIVED" } }, select: { id: true } });
    return batches.map((batch) => batch.id);
  }

  if (actor.role === Role.STUDENT) {
    const enrollments = await prisma.batchStudent.findMany({ where: { studentId: actor.id, status: "ACTIVE" }, select: { batchId: true } });
    return enrollments.map((item) => item.batchId);
  }

  if (isTeacher(actor)) {
    const normalized = await prisma.teacherBatchAssignment.findMany({
      where: { teacherId: actor.id, status: "ACTIVE" },
      select: { batchId: true }
    }).catch(() => []);
    const legacy = await prisma.$queryRaw<Array<{ batchId: string }>>`
      SELECT "batchId" FROM "BatchTeacherAssignment"
      WHERE "teacherId" = ${actor.id}
      AND "status" = 'ACTIVE'
    `.catch(() => []);
    return unique([...normalized.map((item) => item.batchId), ...legacy.map((item) => item.batchId)]);
  }

  return [];
}

async function knowledgeBrain() {
  const [courses, questionItems, feedbackCount] = await Promise.all([
    prisma.course.findMany({ select: { id: true, title: true, slug: true, category: true, examType: true } }),
    prisma.questionBankItem.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, category: true, subCategory: true, topic: true, subTopic: true, difficulty: true }
    }),
    prisma.aiWorkflowFeedback.count().catch(() => 0)
  ]);

  const programs = REQUIRED_PROGRAMS.map((program) => {
    const courseMatches = courses.filter((course) => includesText(course.title, program) || includesText(course.slug, program) || includesText(course.examType, program));
    const bankMatches = questionItems.filter((item) => includesText(item.category, program) || includesText(item.subCategory, program) || courseMatches.some((course) => includesText(item.category, course.title)));
    const topics = unique(bankMatches.map((item) => item.topic).filter(Boolean));
    return {
      program,
      courses: courseMatches.length,
      questionBankItems: bankMatches.length,
      topics: topics.slice(0, 12),
      difficultyMix: {
        easy: bankMatches.filter((item) => item.difficulty?.toUpperCase() === "EASY").length,
        medium: bankMatches.filter((item) => item.difficulty?.toUpperCase() === "MEDIUM").length,
        hard: bankMatches.filter((item) => item.difficulty?.toUpperCase() === "HARD").length
      },
      coverageStatus: courseMatches.length || bankMatches.length ? "PARTIAL" : "MISSING",
      missingKnowledgeAreas: KNOWLEDGE_AREAS.filter((area) => {
        if (area === "Question Banks") return bankMatches.length === 0;
        if (area === "Syllabus") return topics.length === 0;
        return true;
      })
    };
  });

  return {
    status: programs.some((item) => item.coverageStatus === "PARTIAL") ? "PARTIAL" : "FAIL",
    programs,
    totals: {
      courses: courses.length,
      questionBankItems: questionItems.length,
      feedbackSignals: feedbackCount
    },
    rule: "NIDUS GURU retrieves stored course/question-bank/workflow knowledge and reports missing knowledge instead of inventing it."
  };
}

async function scopedAcademicData(batchIds: string[]) {
  if (!batchIds.length) {
    return {
      batches: [],
      students: [],
      attendance: [],
      assignments: [],
      submissions: [],
      exams: [],
      attempts: [],
      materials: [],
      syllabus: [],
      calendarLogs: [],
      liveClasses: [],
      fitnessProfiles: [],
      fitnessLogs: [],
      workflows: []
    };
  }

  const [batches, students, attendance, assignments, exams, materials, syllabus, calendarLogs, liveClasses, workflows] = await Promise.all([
    prisma.batch.findMany({
      where: { id: { in: batchIds } },
      include: {
        course: { select: { title: true, slug: true } },
        students: { where: { status: "ACTIVE" }, select: { studentId: true, student: { select: { id: true, name: true, email: true } } } }
      }
    }),
    prisma.batchStudent.findMany({
      where: { batchId: { in: batchIds }, status: "ACTIVE" },
      select: { batchId: true, studentId: true, student: { select: { id: true, name: true, email: true } } }
    }),
    prisma.teacherAttendanceRecord.findMany({ where: { batchId: { in: batchIds } }, orderBy: { date: "desc" }, take: 500 }),
    prisma.teacherAssignmentRecord.findMany({ where: { batchId: { in: batchIds }, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.teacherExamRecord.findMany({ where: { batchId: { in: batchIds }, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.teacherStudyMaterialRecord.findMany({ where: { batchId: { in: batchIds }, status: { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.teacherSyllabusProgressRecord.findMany({ where: { batchId: { in: batchIds } }, orderBy: { updatedAt: "desc" }, take: 500 }),
    prisma.teacherCalendarLogRecord.findMany({ where: { batchId: { in: batchIds } }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.liveClass.findMany({ where: { batchId: { in: batchIds } }, orderBy: { scheduledAt: "desc" }, take: 500 }),
    prisma.aiWorkflowRequest.findMany({ where: { targetId: { in: batchIds }, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 200 }).catch(() => [])
  ]);

  const assignmentIds = assignments.map((item) => item.id);
  const testIds = exams.map((item) => item.testId).filter((id): id is string => Boolean(id));
  const studentIds = unique(students.map((item) => item.studentId));

  const [submissions, attempts, fitnessProfiles, fitnessLogs] = await Promise.all([
    assignmentIds.length ? prisma.assignmentSubmissionRecord.findMany({ where: { assignmentId: { in: assignmentIds } } }) : Promise.resolve([]),
    testIds.length ? prisma.testAttempt.findMany({ where: { testId: { in: testIds }, userId: { in: studentIds }, submittedAt: { not: null } }, select: { userId: true, testId: true, score: true } }) : Promise.resolve([]),
    studentIds.length ? prisma.fitnessProfile.findMany({ where: { userId: { in: studentIds } } }) : Promise.resolve([]),
    studentIds.length ? prisma.dailyFitnessLog.findMany({ where: { userId: { in: studentIds } }, orderBy: { createdAt: "desc" }, take: 500 }) : Promise.resolve([])
  ]);

  return { batches, students, attendance, assignments, submissions, exams, attempts, materials, syllabus, calendarLogs, liveClasses, fitnessProfiles, fitnessLogs, workflows };
}

function studentBrain(data: Awaited<ReturnType<typeof scopedAcademicData>>, actor: Actor) {
  const byStudent = new Map<string, { id: string; name: string; batchIds: string[] }>();
  for (const enrollment of data.students) {
    byStudent.set(enrollment.studentId, {
      id: enrollment.studentId,
      name: enrollment.student?.name || enrollment.student?.email || "Student",
      batchIds: unique([...(byStudent.get(enrollment.studentId)?.batchIds ?? []), enrollment.batchId])
    });
  }

  const cards = Array.from(byStudent.values()).map((student) => {
    const attendanceRecords = data.attendance.flatMap((row) => jsonArray(row.records).filter((record) => record.studentId === student.id || record.studentName === student.name));
    const present = attendanceRecords.filter((record) => String(record.status).toUpperCase() === "PRESENT").length;
    const studentAssignments = data.assignments.filter((assignment) => student.batchIds.includes(assignment.batchId));
    const submitted = data.submissions.filter((submission) => submission.studentId === student.id && studentAssignments.some((assignment) => assignment.id === submission.assignmentId)).length;
    const studentAttempts = data.attempts.filter((attempt) => attempt.userId === student.id);
    const examAverage = studentAttempts.length ? Math.round(studentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / studentAttempts.length) : null;
    const fitness = data.fitnessProfiles.find((profile) => profile.userId === student.id);
    const attendanceScore = percent(present, attendanceRecords.length);
    const assignmentScore = percent(submitted, studentAssignments.length);
    const engagementScore = scoreFromSignals([assignmentScore, data.fitnessLogs.some((log) => log.userId === student.id) ? 75 : null]);
    const riskScore = 100 - (scoreFromSignals([attendanceScore, assignmentScore, examAverage, engagementScore]) ?? 100);

    return {
      studentId: student.id,
      studentName: student.name,
      healthScore: scoreFromSignals([attendanceScore, assignmentScore, examAverage, engagementScore]),
      academicScore: scoreFromSignals([assignmentScore, examAverage]),
      engagementScore,
      riskScore,
      status: riskScore >= 50 ? "CRITICAL" : riskScore >= 25 ? "ATTENTION" : "HEALTHY",
      signals: {
        attendancePercentage: attendanceScore,
        assignmentCompletionPercentage: assignmentScore,
        examAveragePercentage: examAverage,
        fitnessScore: fitness?.staminaScore ?? null,
        missingAssignments: Math.max(studentAssignments.length - submitted, 0)
      }
    };
  });

  const scoped = actor.role === Role.STUDENT ? cards.filter((card) => card.studentId === actor.id) : cards;
  return {
    status: scoped.length ? "PASS" : "PARTIAL",
    students: scoped.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0)).slice(0, 25),
    summary: {
      totalStudents: scoped.length,
      atRisk: scoped.filter((item) => item.status === "CRITICAL").length,
      attentionNeeded: scoped.filter((item) => item.status === "ATTENTION").length
    }
  };
}

function batchBrain(data: Awaited<ReturnType<typeof scopedAcademicData>>) {
  const cards = data.batches.map((batch) => {
    const studentIds = batch.students.map((item) => item.studentId);
    const attendanceRecords = data.attendance.filter((row) => row.batchId === batch.id).flatMap((row) => jsonArray(row.records));
    const present = attendanceRecords.filter((record) => String(record.status).toUpperCase() === "PRESENT").length;
    const assignments = data.assignments.filter((item) => item.batchId === batch.id);
    const submitted = data.submissions.filter((submission) => assignments.some((assignment) => assignment.id === submission.assignmentId)).length;
    const expectedSubmissions = assignments.length * studentIds.length;
    const testIds = data.exams.filter((item) => item.batchId === batch.id).map((item) => item.testId).filter(Boolean);
    const attempts = data.attempts.filter((attempt) => testIds.includes(attempt.testId));
    const examAverage = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length) : null;
    const liveClassCount = data.liveClasses.filter((item) => item.batchId === batch.id).length;
    const libraryCount = data.materials.filter((item) => item.batchId === batch.id).length;
    const healthScore = scoreFromSignals([percent(present, attendanceRecords.length), percent(submitted, expectedSubmissions), examAverage, libraryCount ? 75 : null, liveClassCount ? 75 : null]);
    return {
      batchId: batch.id,
      batchName: batch.name,
      program: batch.course?.title || batch.programSlug,
      studentCount: studentIds.length,
      healthScore,
      performanceScore: scoreFromSignals([examAverage, percent(submitted, expectedSubmissions)]),
      riskScore: healthScore === null ? null : 100 - healthScore,
      status: statusFromScore(healthScore),
      signals: {
        attendancePercentage: percent(present, attendanceRecords.length),
        assignmentCompletionPercentage: percent(submitted, expectedSubmissions),
        examAveragePercentage: examAverage,
        liveClasses: liveClassCount,
        libraryMaterials: libraryCount
      }
    };
  });
  return { status: cards.length ? "PASS" : "PARTIAL", batches: cards };
}

function teacherBrain(data: Awaited<ReturnType<typeof scopedAcademicData>>, actor: Actor) {
  const teacherIds = unique([
    ...data.attendance.map((item) => item.teacherId).filter(Boolean),
    ...data.assignments.map((item) => item.teacherId).filter(Boolean),
    ...data.exams.map((item) => item.teacherId).filter(Boolean),
    ...data.materials.map((item) => item.teacherId).filter(Boolean),
    ...data.syllabus.map((item) => item.teacherId).filter(Boolean),
    ...data.calendarLogs.map((item) => item.teacherId).filter(Boolean)
  ]) as string[];

  const cards = teacherIds.map((teacherId) => {
    const teacherName = data.attendance.find((item) => item.teacherId === teacherId)?.teacherName
      || data.assignments.find((item) => item.teacherId === teacherId)?.teacherName
      || data.exams.find((item) => item.teacherId === teacherId)?.teacherName
      || data.materials.find((item) => item.teacherId === teacherId)?.teacherName
      || "Teacher";
    const planned = data.calendarLogs.filter((item) => item.teacherId === teacherId);
    const completedSyllabus = data.syllabus.filter((item) => item.teacherId === teacherId && item.completionStatus === "COMPLETED").length;
    const syllabusScore = percent(completedSyllabus, data.syllabus.filter((item) => item.teacherId === teacherId).length);
    const deliveryScore = scoreFromSignals([
      percent(data.attendance.filter((item) => item.teacherId === teacherId).length, planned.length),
      syllabusScore,
      data.materials.filter((item) => item.teacherId === teacherId).length ? 75 : null
    ]);
    const consistencyScore = scoreFromSignals([
      data.attendance.filter((item) => item.teacherId === teacherId).length ? 80 : null,
      data.assignments.filter((item) => item.teacherId === teacherId).length ? 75 : null,
      data.exams.filter((item) => item.teacherId === teacherId).length ? 75 : null
    ]);
    const performanceScore = scoreFromSignals([deliveryScore, consistencyScore, syllabusScore]);
    return {
      teacherId,
      teacherName,
      performanceScore,
      consistencyScore,
      deliveryScore,
      status: statusFromScore(performanceScore),
      signals: {
        attendanceMarked: data.attendance.filter((item) => item.teacherId === teacherId).length,
        assignmentsPublished: data.assignments.filter((item) => item.teacherId === teacherId).length,
        examsPublished: data.exams.filter((item) => item.teacherId === teacherId).length,
        materialsUploaded: data.materials.filter((item) => item.teacherId === teacherId).length,
        syllabusCompletionPercentage: syllabusScore,
        delayedTopics: data.syllabus.filter((item) => item.teacherId === teacherId && ["RED", "ORANGE"].includes(item.progressColor)).length
      }
    };
  });

  const scoped = actor.role === Role.TEACHER && !isAcademicHead(actor) ? cards.filter((card) => card.teacherId === actor.id) : cards;
  return { status: scoped.length ? "PASS" : "PARTIAL", teachers: scoped };
}

function academicHeadBrain(student: ReturnType<typeof studentBrain>, batch: ReturnType<typeof batchBrain>, teacher: ReturnType<typeof teacherBrain>, data: Awaited<ReturnType<typeof scopedAcademicData>>) {
  const pendingReviews = data.submissions.filter((item) => item.reviewStatus === "PENDING_REVIEW").length;
  const delayedTeachers = teacher.teachers.filter((item) => item.status !== "HEALTHY").length;
  const riskyBatches = batch.batches.filter((item) => item.status === "CRITICAL" || item.status === "ATTENTION").length;
  const riskyStudents = student.summary.atRisk + student.summary.attentionNeeded;
  const recommendations = [
    delayedTeachers ? `${delayedTeachers} teacher(s) need syllabus or delivery follow-up.` : null,
    riskyBatches ? `${riskyBatches} batch(es) are below healthy academic range.` : null,
    pendingReviews ? `${pendingReviews} assignment submission(s) are pending review.` : null,
    riskyStudents ? `${riskyStudents} student(s) need mentor attention.` : null
  ].filter(Boolean);
  return {
    status: recommendations.length ? "PASS" : "PARTIAL",
    todayAttention: recommendations.length ? recommendations : ["No urgent academic attention found from current records."],
    recommendations: recommendations.map((text) => ({ priority: text?.includes("student") || text?.includes("batch") ? "HIGH" : "MEDIUM", action: text })),
    safety: "NIDUS GURU recommends only. Human approval is required for exams, assignments, records, scores and fees."
  };
}

async function directorBrain(data: Awaited<ReturnType<typeof scopedAcademicData>>, student: ReturnType<typeof studentBrain>, batch: ReturnType<typeof batchBrain>, teacher: ReturnType<typeof teacherBrain>) {
  const [leads, admissions, payments] = await Promise.all([
    prisma.lead.count().catch(() => 0),
    prisma.admission.count().catch(() => 0),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paymentStatus: { in: ["SUCCESS", "PAID", "CAPTURED", "VERIFIED"] } } }).catch(() => ({ _sum: { amount: null } }))
  ]);
  return {
    status: "PASS",
    academyHealth: scoreFromSignals([
      scoreFromSignals(batch.batches.map((item) => item.healthScore)),
      scoreFromSignals(teacher.teachers.map((item) => item.performanceScore)),
      student.summary.totalStudents ? 100 - percent(student.summary.atRisk, student.summary.totalStudents)! : null
    ]),
    admissionsHealth: admissions || leads ? "DATA_AVAILABLE" : "NO_DATA",
    academicHealth: statusFromScore(scoreFromSignals(batch.batches.map((item) => item.healthScore))),
    teacherHealth: statusFromScore(scoreFromSignals(teacher.teachers.map((item) => item.performanceScore))),
    studentHealth: student.summary.atRisk ? "ATTENTION" : "HEALTHY",
    batchHealth: statusFromScore(scoreFromSignals(batch.batches.map((item) => item.healthScore))),
    financialSignals: {
      collectedFees: payments._sum?.amount ?? 0,
      source: "Payment records only"
    }
  };
}

async function memoryEngine(actor: Actor) {
  const requests = await prisma.aiWorkflowRequest.findMany({
    where: isDirector(actor) || isAcademicHead(actor) ? { deletedAt: null } : { actorUserId: actor.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100
  }).catch(() => []);
  const feedback = await prisma.aiWorkflowFeedback.findMany({
    where: isDirector(actor) || isAcademicHead(actor) ? { deletedAt: null } : { userId: actor.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50
  }).catch(() => []);
  return {
    status: requests.length || feedback.length ? "PARTIAL" : "PARTIAL",
    storedSignals: {
      workflowRequests: requests.length,
      feedbackItems: feedback.length,
      examCreatorRequests: requests.filter((item) => item.agentType === "EXAM_CREATOR").length,
      assignmentCreatorRequests: requests.filter((item) => item.agentType === "ASSIGNMENT_CREATOR").length
    },
    rule: "Memory uses AI workflow requests, review corrections and feedback. No autonomous publishing."
  };
}

export const nidusGuruService = {
  async academicHead(actor: Actor) {
    const batchIds = await accessibleBatchIds(actor);
    const data = await scopedAcademicData(batchIds);
    const knowledge = await knowledgeBrain();
    const students = studentBrain(data, actor);
    const batches = batchBrain(data);
    const teachers = teacherBrain(data, actor);
    const academicHead = academicHeadBrain(students, batches, teachers, data);
    const director = isDirector(actor) ? await directorBrain(data, students, batches, teachers) : null;
    const memory = await memoryEngine(actor);
    const permissions = {
      role: actor.role,
      scope: isDirector(actor) ? "ACADEMY_WIDE" : isAcademicHead(actor) ? "ACADEMIC_DEPARTMENT" : actor.role === Role.STUDENT ? "OWN_STUDENT_DATA" : "OWN_ASSIGNED_BATCHES",
      accessibleBatchCount: batchIds.length,
      canPublishWithoutApproval: false
    };
    const safetyRules = {
      publishExams: "BLOCKED_WITHOUT_HUMAN_APPROVAL",
      publishAssignments: "BLOCKED_WITHOUT_HUMAN_APPROVAL",
      modifyAttendance: "NEVER_AUTONOMOUS",
      modifyScores: "NEVER_AUTONOMOUS",
      modifyStudentRecords: "NEVER_AUTONOMOUS",
      modifyFees: "NEVER_AUTONOMOUS"
    };

    return {
      generatedAt: new Date().toISOString(),
      status: "PASS",
      identity: "NIDUS GURU AI Academic Head",
      permissions,
      knowledgeBrain: knowledge,
      examCreatorAgent: { status: "PASS", workflow: "AI Workflow Engine / EXAM_CREATOR / human approval mandatory" },
      assignmentCreatorAgent: { status: "PASS", workflow: "AI Workflow Engine / ASSIGNMENT_CREATOR / human approval mandatory" },
      libraryIntelligence: {
        status: data.materials.length ? "PARTIAL" : "PARTIAL",
        readableMaterials: data.materials.length,
        supportedSignals: ["PDF metadata", "DOCX metadata", "PPTX metadata", "Notes metadata", "Question bank references"],
        limitation: "Deep file text extraction is not enabled yet; NIDUS GURU uses stored metadata and source snapshots."
      },
      studentBrain: students,
      batchBrain: batches,
      teacherBrain: teachers,
      academicHeadBrain: academicHead,
      directorBrain: director,
      memoryEngine: memory,
      safetyRules
    };
  }
};

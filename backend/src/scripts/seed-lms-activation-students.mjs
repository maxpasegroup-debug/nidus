import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "../../dist/config/prisma.js";

const DEFAULT_PASSWORD = "123456789";

const batchesInput = [
  {
    name: "NDA F1 Offline 2026",
    programSlug: "nda-f1",
    mode: "OFFLINE",
    programType: "Foundation",
    subjects: "NDA",
    students: [
      ["Dhanwin S Cherott", "9446645862"],
      ["Nanda G", "8089791891"],
      ["Surya Sankar", "9846282492"],
      ["Sathwik P", "7736807747"],
    ],
  },
  {
    name: "NDA F2 Offline 2026",
    programSlug: "nda-f2",
    mode: "OFFLINE",
    programType: "Foundation",
    subjects: "NDA",
    students: [
      ["Goury Nandha PV", "6282337099"],
      ["Sree Hari", "9061522211"],
      ["Siva Nandan", "8714147515"],
    ],
  },
  {
    name: "AISSEE 6th Offline 2026",
    programSlug: "aissee-class-6",
    mode: "OFFLINE",
    programType: "Regular",
    subjects: "AISSEE",
    students: [
      ["Vinayak", "7012262241"],
      ["Sreya", "7012814681"],
    ],
  },
  {
    name: "AISSEE 9th Offline 2026",
    programSlug: "aissee-class-9",
    mode: "OFFLINE",
    programType: "Regular",
    subjects: "AISSEE",
    students: [["Saikrishna", "8086158601"]],
  },
];

const teacherBySubject = {
  NDA: [
    ["Mathematics", "Sumitha", "Subject Teacher"],
    ["Mathematics", "Anjusha", "Subject Teacher"],
    ["English", "Anjali", "Subject Teacher"],
    ["Reasoning", "Nimisha", "Subject Teacher"],
    ["General Knowledge", "Suma", "Subject Teacher"],
    ["Current Affairs", "Suma", "Subject Teacher"],
    ["General Science", "Surya", "Subject Teacher"],
    ["Physical Training", "Santhosh", "Physical Trainer"],
    ["Physical Training", "Vinod", "Physical Trainer"],
    ["SSB Guidance", "Maj. Vikram SSB", "SSB Trainer"],
    ["Interview Training", "Maj. Vikram SSB", "SSB Trainer"],
    ["Personality Development", "Maj. Vikram SSB", "SSB Trainer"],
    ["Academic Coordination", "Priyanka", "ACADEMIC_HEAD"],
    ["Academic Coordination", "Ritwik", "ACADEMIC_HEAD"],
  ],
  AISSEE: [
    ["Mathematics", "Sumitha", "Subject Teacher"],
    ["Mathematics", "Anjusha", "Subject Teacher"],
    ["English", "Anjali", "Subject Teacher"],
    ["Reasoning", "Nimisha", "Subject Teacher"],
    ["Intelligence", "Nimisha", "Subject Teacher"],
    ["General Knowledge", "Suma", "Subject Teacher"],
    ["Current Affairs", "Suma", "Subject Teacher"],
    ["General Science", "Surya", "Subject Teacher"],
    ["Interview Training", "Maj. Vikram SSB", "Mentor"],
    ["Personality Development", "Maj. Vikram SSB", "Mentor"],
    ["Academic Coordination", "Priyanka", "ACADEMIC_HEAD"],
    ["Academic Coordination", "Ritwik", "ACADEMIC_HEAD"],
  ],
};

const starterSubjects = {
  NDA: [
    ["Mathematics", "Number System"],
    ["Mathematics", "Ratio and Proportion"],
    ["English", "Grammar Essentials"],
    ["General Knowledge", "Indian Polity Basics"],
    ["Reasoning", "Series and Analogy"],
  ],
  AISSEE: [
    ["Mathematics", "Number System"],
    ["English", "Grammar Essentials"],
    ["Intelligence", "Verbal Reasoning"],
    ["General Knowledge", "India and the World"],
    ["General Science", "Science Basics"],
  ],
};

const report = {
  batchesCreated: [],
  batchesReused: [],
  studentsCreated: [],
  studentsReused: [],
  accountsConverted: [],
  studentsAssigned: [],
  teacherAllocationsCreated: 0,
  teacherAllocationsReused: 0,
  legacyTeacherAllocationsCreated: 0,
  lmsRecordsCreated: {
    liveClasses: 0,
    assignments: 0,
    exams: 0,
    attendanceSessions: 0,
    calendarEvents: 0,
    libraryLessons: 0,
  },
  visibility: [],
  blockers: [],
};

function normalizeName(value) {
  return String(value || "").trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

function studentEmail(phone) {
  return `student.${phone}@nidusacademy.in`;
}

function addDays(days, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function attendanceDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(9, 0, 0, 0);
  return date;
}

async function findUserByPhone(phone) {
  return prisma.user.findFirst({
    where: { OR: [{ mobile: phone }, { mobile: `+91${phone}` }] },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      roleMetadata: true,
      roleOnboardingStatus: true,
    },
  });
}

async function ensureStudent(name, phone, passwordHash) {
  const existing = await findUserByPhone(phone);
  if (existing) {
    if (existing.role !== "STUDENT" && existing.role !== "GUEST") {
      throw new Error(`Phone ${phone} belongs to non-student role ${existing.role}`);
    }

    const metadata = typeof existing.roleMetadata === "object" && existing.roleMetadata !== null ? existing.roleMetadata : {};
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "STUDENT",
        roleOnboardingStatus: "ACTIVE",
        roleActivatedAt: new Date(),
        lastRoleActivityAt: new Date(),
        mobileVerified: true,
        roleMetadata: {
          ...metadata,
          seededBy: "lms-activation-sprint",
          reusedExistingAccount: true,
          passwordPolicy: "default-hash-no-plaintext-metadata",
        },
      },
      select: { id: true, name: true, email: true, mobile: true, role: true },
    });

    report.studentsReused.push({ id: updated.id, requestedName: name, keptName: updated.name, phone, role: updated.role });
    if (existing.role === "GUEST") report.accountsConverted.push({ id: updated.id, name: updated.name, phone, from: "GUEST", to: "STUDENT" });
    return updated;
  }

  const created = await prisma.user.create({
    data: {
      name,
      email: studentEmail(phone),
      mobile: phone,
      password: passwordHash,
      role: "STUDENT",
      roleOnboardingStatus: "ACTIVE",
      roleActivatedAt: new Date(),
      lastRoleActivityAt: new Date(),
      emailVerified: true,
      mobileVerified: true,
      roleMetadata: {
        defaultPassword: true,
        seededBy: "lms-activation-sprint",
        passwordPolicy: "default-hash-no-plaintext-metadata",
      },
    },
    select: { id: true, name: true, email: true, mobile: true, role: true },
  });

  report.studentsCreated.push({ id: created.id, name: created.name, phone });
  return created;
}

async function ensureBatch(input, course) {
  const existing = await prisma.batch.findUnique({
    where: { name_programSlug: { name: input.name, programSlug: input.programSlug } },
    select: { id: true, name: true, programSlug: true, batchType: true, status: true },
  });

  if (existing) {
    const updated = await prisma.batch.update({
      where: { id: existing.id },
      data: {
        batchType: input.mode,
        courseId: course.id,
        status: "ACTIVE",
        schedule: { learningMode: input.mode, programType: input.programType, seededBy: "lms-activation-sprint" },
      },
    });
    report.batchesReused.push({ id: updated.id, name: updated.name });
    return updated;
  }

  const created = await prisma.batch.create({
    data: {
      name: input.name,
      batchType: input.mode,
      programSlug: input.programSlug,
      courseId: course.id,
      startDate: new Date(),
      status: "ACTIVE",
      schedule: { learningMode: input.mode, programType: input.programType, seededBy: "lms-activation-sprint" },
    },
  });
  report.batchesCreated.push({ id: created.id, name: created.name });
  return created;
}

async function ensureBatchStudent(batch, student) {
  await prisma.batchStudent.upsert({
    where: { batchId_studentId: { batchId: batch.id, studentId: student.id } },
    update: { status: "ACTIVE" },
    create: { batchId: batch.id, studentId: student.id, status: "ACTIVE", remarks: "Seeded LMS activation student" },
  });
  report.studentsAssigned.push({ batchId: batch.id, batchName: batch.name, studentId: student.id, studentName: student.name });
}

async function ensureTeacherAllocation(batch, teacher, subject, role) {
  const existing = await prisma.teacherBatchAssignment.findUnique({
    where: { batchId_teacherId_subject: { batchId: batch.id, teacherId: teacher.id, subject } },
    select: { id: true },
  });
  await prisma.teacherBatchAssignment.upsert({
    where: { batchId_teacherId_subject: { batchId: batch.id, teacherId: teacher.id, subject } },
    update: { role, status: "ACTIVE" },
    create: { batchId: batch.id, teacherId: teacher.id, subject, role, status: "ACTIVE" },
  });
  if (existing) report.teacherAllocationsReused += 1;
  else report.teacherAllocationsCreated += 1;

  const legacy = await prisma.$queryRaw`
    SELECT "id" FROM "BatchTeacherAssignment"
    WHERE "batchId" = ${batch.id} AND "teacherId" = ${teacher.id} AND "subject" = ${subject}
    LIMIT 1
  `;
  if (!legacy.length) {
    await prisma.$executeRaw`
      INSERT INTO "BatchTeacherAssignment"
      ("id", "batchId", "teacherId", "subject", "role", "status", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${batch.id}, ${teacher.id}, ${subject}, ${role}, 'ACTIVE', ${new Date()}, ${new Date()})
    `;
    report.legacyTeacherAllocationsCreated += 1;
  }
}

async function createLiveClass(batch, teacher, subject, topic) {
  const title = `${batch.name} - ${subject} Live Starter Class`;
  const exists = await prisma.liveClass.findFirst({ where: { batchId: batch.id, title }, select: { id: true } });
  if (exists) return;
  await prisma.liveClass.create({
    data: {
      title,
      description: `Starter live class for ${topic}.`,
      examType: "CLASS",
      instructorName: teacher.name,
      scheduledAt: addDays(1, 10),
      duration: 60,
      meetingLink: `https://meet.google.com/nidus-${batch.id.slice(-6)}`,
      thumbnail: "https://nidusacademy.in/top-rank-og.png",
      batchId: batch.id,
      programSlug: batch.programSlug,
      subject,
      topic,
      teacherId: teacher.id,
      status: "SCHEDULED",
    },
  });
  report.lmsRecordsCreated.liveClasses += 1;
}

async function createAssignments(batch, teacher, courseTitle, subject, topic) {
  for (let index = 1; index <= 2; index += 1) {
    const title = `${subject} Homework ${index} - ${topic}`;
    const exists = await prisma.teacherAssignmentRecord.findFirst({ where: { batchId: batch.id, title }, select: { id: true } });
    if (exists) continue;
    await prisma.teacherAssignmentRecord.create({
      data: {
        batchId: batch.id,
        batchName: batch.name,
        subject,
        course: courseTitle,
        teacherId: teacher.id,
        teacherName: teacher.name,
        title,
        topic,
        instructions: `Complete the practice questions for ${topic}. Submit before the due date.`,
        dueDate: addDays(3 + index, 23),
        attachmentName: `${topic.replace(/\s+/g, "-").toLowerCase()}-worksheet-${index}.pdf`,
        link: "https://nidusacademy.in",
        status: "PUBLISHED",
      },
    });
    report.lmsRecordsCreated.assignments += 1;
  }
}

async function createExams(batch, teacher, courseTitle, subject, topic) {
  for (let index = 1; index <= 2; index += 1) {
    const title = `${subject} Class Test ${index} - ${topic}`;
    const exists = await prisma.teacherExamRecord.findFirst({ where: { batchId: batch.id, title }, select: { id: true } });
    if (exists) continue;
    const test = await prisma.test.create({
      data: {
        title,
        description: `Starter test for ${topic}.`,
        examType: "CLASS_TEST",
        category: "Defence",
        subject,
        topic,
        batchId: batch.id,
        teacherId: teacher.id,
        publishAt: new Date(),
        status: "PUBLISHED",
        reviewedAt: new Date(),
        approvedAt: new Date(),
        approvedById: teacher.id,
        duration: 30,
        totalMarks: 5,
        isMockTest: false,
        isLive: true,
      },
    });
    await prisma.question.createMany({
      data: Array.from({ length: 5 }, (_, questionIndex) => ({
        testId: test.id,
        questionText: `${topic} starter question ${questionIndex + 1}`,
        optionA: "Option A",
        optionB: "Option B",
        optionC: "Option C",
        optionD: "Option D",
        correctAnswer: "A",
        explanation: `Revision explanation for ${topic}.`,
        marks: 1,
        negativeMarks: 0,
        difficultyLevel: "EASY",
        topic,
      })),
    });
    await prisma.teacherExamRecord.create({
      data: {
        batchId: batch.id,
        batchName: batch.name,
        testId: test.id,
        subject,
        course: courseTitle,
        teacherId: teacher.id,
        teacherName: teacher.name,
        title,
        topic,
        questionCount: 5,
        durationMinutes: 30,
        difficulty: "EASY",
        instructions: "Attempt all questions.",
        status: "PUBLISHED",
        approvedBy: teacher.name,
        approvedAt: new Date(),
        draft: { source: "lms-activation-sprint", questions: 5 },
      },
    });
    report.lmsRecordsCreated.exams += 1;
  }
}

async function createAttendance(batch, teacher, students, subject) {
  for (let index = 0; index < 5; index += 1) {
    const date = attendanceDate(index);
    const exists = await prisma.teacherAttendanceRecord.findFirst({
      where: { batchId: batch.id, teacherId: teacher.id, subject, date },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.teacherAttendanceRecord.create({
      data: {
        batchId: batch.id,
        batchName: batch.name,
        subject,
        teacherId: teacher.id,
        teacherName: teacher.name,
        date,
        status: "SAVED",
        records: students.map((student, studentIndex) => ({
          studentId: student.id,
          studentName: student.name,
          status: studentIndex === index % Math.max(students.length, 1) && students.length > 2 ? "ABSENT" : "PRESENT",
          remarks: "",
        })),
      },
    });
    report.lmsRecordsCreated.attendanceSessions += 1;
  }
}

async function createCalendarEvents(batch, teacher, subjectTopicPairs) {
  for (let index = 0; index < 5; index += 1) {
    const [subject, topic] = subjectTopicPairs[index % subjectTopicPairs.length];
    const plannedDate = addDays(index + 1, 9 + index);
    const existing = await prisma.$queryRaw`
      SELECT "id" FROM "AcademicCalendarItem"
      WHERE "batchId" = ${batch.id} AND "subject" = ${subject} AND "topic" = ${topic} AND "plannedDate" = ${plannedDate}
      LIMIT 1
    `;
    if (existing.length) continue;
    await prisma.$executeRaw`
      INSERT INTO "AcademicCalendarItem"
      ("id", "batchId", "batchName", "programSlug", "subject", "topic", "classType", "plannedDate", "startTime", "endTime", "teacherId", "teacherName", "status", "completionStatus", "teacherLog", "nextAction", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${batch.id}, ${batch.name}, ${batch.programSlug}, ${subject}, ${topic}, 'Live Class', ${plannedDate}, ${plannedDate}, ${addDays(index + 1, 10 + index)}, ${teacher.id}, ${teacher.name}, 'PLANNED', 'PENDING', NULL, 'Prepare lesson and attendance', ${new Date()}, ${new Date()})
    `;
    report.lmsRecordsCreated.calendarEvents += 1;
  }
}

async function createLibraryLessons(batch, teacher, courseTitle, subjectTopicPairs) {
  for (let index = 0; index < 5; index += 1) {
    const [subject, topic] = subjectTopicPairs[index % subjectTopicPairs.length];
    const title = `${topic} Recorded Class ${index + 1}`;
    const exists = await prisma.teacherStudyMaterialRecord.findFirst({ where: { batchId: batch.id, title }, select: { id: true } });
    if (exists) continue;
    await prisma.teacherStudyMaterialRecord.create({
      data: {
        batchId: batch.id,
        batchName: batch.name,
        course: courseTitle,
        folder: subject,
        subject,
        topic,
        teacherId: teacher.id,
        teacherName: teacher.name,
        title,
        description: `Starter recorded lesson for ${topic}.`,
        type: "VIDEO",
        url: "https://nidusacademy.in",
        fileName: `${topic.replace(/\s+/g, "-").toLowerCase()}-${index + 1}.mp4`,
        thumbnailUrl: "https://nidusacademy.in/top-rank-og.png",
        durationSeconds: 1800,
        lessonName: title,
        status: "PUBLISHED",
        reviewStatus: "APPROVED",
        reviewedBy: "LMS Activation",
        reviewedAt: new Date(),
      },
    });
    report.lmsRecordsCreated.libraryLessons += 1;
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const slugs = batchesInput.map((batch) => batch.programSlug);
  const courses = await prisma.course.findMany({ where: { slug: { in: slugs } } });
  const courseBySlug = new Map(courses.map((course) => [course.slug, course]));
  const teacherNames = [...new Set(Object.values(teacherBySubject).flat().map((entry) => entry[1]))];
  const teachers = await prisma.user.findMany({ where: { name: { in: teacherNames } } });
  const teacherByName = new Map(teachers.map((teacher) => [teacher.name, teacher]));

  for (const slug of slugs) {
    if (!courseBySlug.has(slug)) throw new Error(`Missing course ${slug}`);
  }
  for (const name of teacherNames) {
    if (!teacherByName.has(name)) throw new Error(`Missing teacher ${name}`);
  }

  for (const input of batchesInput) {
    const course = courseBySlug.get(input.programSlug);
    const batch = await ensureBatch(input, course);
    const students = [];
    for (const [name, phone] of input.students) {
      const student = await ensureStudent(name, phone, passwordHash);
      students.push(student);
      await ensureBatchStudent(batch, student);
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: student.id, courseId: course.id } },
        update: {},
        create: { userId: student.id, courseId: course.id, progress: 0 },
      });
    }

    for (const [subject, teacherName, role] of teacherBySubject[input.subjects]) {
      await ensureTeacherAllocation(batch, teacherByName.get(teacherName), subject, role);
    }

    const subjectTopicPairs = starterSubjects[input.subjects];
    const [primarySubject, primaryTopic] = subjectTopicPairs[0];
    const primaryTeacher = teacherByName.get(input.subjects === "AISSEE" ? "Sumitha" : "Sumitha");
    await createLiveClass(batch, primaryTeacher, primarySubject, primaryTopic);
    await createAssignments(batch, primaryTeacher, course.title, primarySubject, primaryTopic);
    await createExams(batch, primaryTeacher, course.title, primarySubject, primaryTopic);
    await createAttendance(batch, primaryTeacher, students, primarySubject);
    await createCalendarEvents(batch, primaryTeacher, subjectTopicPairs);
    await createLibraryLessons(batch, primaryTeacher, course.title, subjectTopicPairs);
  }

  const activatedBatchNames = batchesInput.map((batch) => batch.name);
  const batches = await prisma.batch.findMany({
    where: { name: { in: activatedBatchNames } },
    include: {
      students: { where: { status: "ACTIVE" }, include: { student: { select: { id: true, name: true, mobile: true, role: true } } } },
      teachers: { where: { status: "ACTIVE" }, include: { teacher: { select: { id: true, name: true, role: true } } } },
    },
    orderBy: { name: "asc" },
  });

  for (const batch of batches) {
    const [assignments, exams, attendance, lessons, liveClasses, calendar] = await Promise.all([
      prisma.teacherAssignmentRecord.count({ where: { batchId: batch.id } }),
      prisma.teacherExamRecord.count({ where: { batchId: batch.id } }),
      prisma.teacherAttendanceRecord.count({ where: { batchId: batch.id } }),
      prisma.teacherStudyMaterialRecord.count({ where: { batchId: batch.id } }),
      prisma.liveClass.count({ where: { batchId: batch.id } }),
      prisma.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "AcademicCalendarItem" WHERE "batchId" = ${batch.id}`,
    ]);
    report.visibility.push({
      batchId: batch.id,
      batchName: batch.name,
      students: batch.students.length,
      teachers: batch.teachers.length,
      subjects: [...new Set(batch.teachers.map((assignment) => assignment.subject))],
      academicHeads: batch.teachers.filter((assignment) => assignment.role === "ACADEMIC_HEAD").map((assignment) => assignment.teacher.name),
      directorVisible: true,
      academicHeadVisible: batch.teachers.some((assignment) => assignment.role === "ACADEMIC_HEAD"),
      teacherVisible: batch.teachers.some((assignment) => assignment.role !== "ACADEMIC_HEAD"),
      studentVisible: batch.students.length > 0,
      lms: {
        liveClasses,
        assignments,
        exams,
        attendanceSessions: attendance,
        calendarEvents: Number(calendar[0]?.count || 0),
        libraryLessons: lessons,
      },
    });
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

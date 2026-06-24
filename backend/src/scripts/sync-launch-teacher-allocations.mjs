import { randomUUID } from "node:crypto";
import { prisma } from "../../dist/config/prisma.js";

const crashBatchNames = [
  "NDA Crash Course Online 2026",
  "NDA Crash Course Offline 2026",
  "CDS Crash Course Online 2026",
  "CDS Crash Course Offline 2026",
];

const aisseeBatchNames = ["AISSEE 6th Offline 2026", "AISSEE 9th Offline 2026"];

const requiredFaculty = ["Priyanka", "Ritwik", "Sumitha", "Suma", "Anjali", "Nimisha", "Santhosh", "Vidhya", "Silmiya", "Anjusha"];

const ndaDesired = [
  ["Mathematics", "Anjusha", "Subject Teacher"],
  ["Mathematics", "Sumitha", "Subject Teacher"],
  ["Mathematics", "Priyanka", "Subject Teacher"],
  ["Mathematics", "Ritwik", "Subject Teacher"],
  ["English", "Anjali", "Subject Teacher"],
  ["Physics", "Vidhya", "Subject Teacher"],
  ["Chemistry", "Nimisha", "Subject Teacher"],
  ["Biology", "Suma", "Subject Teacher"],
  ["Geography / Economics", "Silmiya", "Subject Teacher"],
  ["Geography / Economics", "Ritwik", "Subject Teacher"],
  ["History / Polity / Current Affairs", "Ritwik", "Subject Teacher"],
  ["Academic Coordination", "Priyanka", "ACADEMIC_HEAD"],
  ["Academic Coordination", "Ritwik", "ACADEMIC_HEAD"],
];

const cdsDesired = [
  ["Mathematics", "Sumitha", "Subject Teacher"],
  ["Mathematics", "Ritwik", "Subject Teacher"],
  ["English", "Anjali", "Subject Teacher"],
  ["Geography / Economics", "Silmiya", "Subject Teacher"],
  ["Geography / Economics", "Ritwik", "Subject Teacher"],
  ["History / Polity / Current Affairs", "Ritwik", "Subject Teacher"],
  ["Chemistry", "Nimisha", "Subject Teacher"],
  ["Physics", "Vidhya", "Subject Teacher"],
  ["Biology", "Suma", "Subject Teacher"],
  ["Academic Coordination", "Priyanka", "ACADEMIC_HEAD"],
  ["Academic Coordination", "Ritwik", "ACADEMIC_HEAD"],
];

const aisseeDesired = [
  ["Mathematics", "Sumitha", "Subject Teacher"],
  ["General Knowledge", "Suma", "Subject Teacher"],
  ["Academic Coordination", "Priyanka", "ACADEMIC_HEAD"],
  ["Academic Coordination", "Ritwik", "ACADEMIC_HEAD"],
];

const agniveerDesired = [
  ["Physical Training", "Santhosh", "Physical Trainer"],
  ["Academic Coordination", "Ritwik", "ACADEMIC_HEAD"],
  ["Mathematics", "Sumitha", "Subject Teacher"],
  ["Academic Coordination", "Priyanka", "ACADEMIC_HEAD"],
  ["Physics", "Vidhya", "Subject Teacher"],
];

const report = {
  faculty: {},
  missingFacultyAccounts: [],
  roleNotFaculty: [],
  batchesFound: [],
  missingBatches: [],
  agniveerBatchesFound: [],
  afcatBatchesFound: [],
  existingAllocationsFound: 0,
  newAllocationsAdded: [],
  duplicateAllocationsSkipped: [],
  allocationsRemoved: [],
  blockedAllocations: [],
  finalAllocationMatrix: [],
};

function facultyStatus(name, user) {
  if (!user) return "MISSING";
  if (user.role !== "TEACHER" && user.role !== "ACADEMIC_HEAD" && user.role !== "PHYSICAL_TRAINER") return `FOUND_AS_${user.role}_NOT_ALLOCATED`;
  return "FOUND";
}

function getDesiredForBatch(batch) {
  if (batch.name.startsWith("NDA Crash")) return ndaDesired;
  if (batch.name.startsWith("CDS Crash")) return cdsDesired;
  if (batch.name.startsWith("AISSEE")) return aisseeDesired;
  if (batch.name.toLowerCase().includes("agniveer") || batch.programSlug.toLowerCase().includes("agniveer")) return agniveerDesired;
  if (batch.name.toLowerCase().includes("afcat") || batch.programSlug.toLowerCase().includes("afcat")) return cdsDesired;
  return [];
}

async function upsertLegacy(batchId, teacherId, subject, role) {
  const existing = await prisma.$queryRaw`
    SELECT "id" FROM "BatchTeacherAssignment"
    WHERE "batchId" = ${batchId} AND "teacherId" = ${teacherId} AND "subject" = ${subject}
    LIMIT 1
  `;
  if (existing.length) {
    await prisma.$executeRaw`
      UPDATE "BatchTeacherAssignment"
      SET "role" = ${role}, "status" = 'ACTIVE', "updatedAt" = ${new Date()}
      WHERE "id" = ${existing[0].id}
    `;
    return false;
  }
  await prisma.$executeRaw`
    INSERT INTO "BatchTeacherAssignment"
    ("id", "batchId", "teacherId", "subject", "role", "status", "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${batchId}, ${teacherId}, ${subject}, ${role}, 'ACTIVE', ${new Date()}, ${new Date()})
  `;
  return true;
}

async function archiveLegacy(batchId, teacherId, subject) {
  await prisma.$executeRaw`
    UPDATE "BatchTeacherAssignment"
    SET "status" = 'ARCHIVED', "updatedAt" = ${new Date()}
    WHERE "batchId" = ${batchId} AND "teacherId" = ${teacherId} AND "subject" = ${subject} AND "status" = 'ACTIVE'
  `;
}

async function main() {
  const facultyMatches = await prisma.user.findMany({
    where: { OR: requiredFaculty.map((name) => ({ name: { contains: name, mode: "insensitive" } })) },
    select: { id: true, name: true, email: true, role: true },
  });

  const teacherByKey = new Map();
  for (const requested of requiredFaculty) {
    const matches = facultyMatches.filter((user) => user.name.toLowerCase().includes(requested.toLowerCase()));
    const preferred = matches.find((user) => user.role === "TEACHER" || user.role === "ACADEMIC_HEAD" || user.role === "PHYSICAL_TRAINER") ?? matches[0];
    report.faculty[requested] = preferred ? { status: facultyStatus(requested, preferred), ...preferred } : { status: "MISSING" };
    if (!preferred) report.missingFacultyAccounts.push(requested);
    else if (facultyStatus(requested, preferred) !== "FOUND") report.roleNotFaculty.push({ requested, ...preferred });
    if (preferred && facultyStatus(requested, preferred) === "FOUND") teacherByKey.set(requested, preferred);
  }

  const targetBatches = await prisma.batch.findMany({
    where: {
      OR: [
        { name: { in: [...crashBatchNames, ...aisseeBatchNames] } },
        { name: { contains: "Agniveer", mode: "insensitive" }, status: "ACTIVE" },
        { programSlug: { contains: "agniveer", mode: "insensitive" }, status: "ACTIVE" },
        { name: { contains: "AFCAT", mode: "insensitive" }, status: "ACTIVE" },
        { programSlug: { contains: "afcat", mode: "insensitive" }, status: "ACTIVE" },
      ],
    },
    include: {
      teachers: { where: { status: "ACTIVE" }, include: { teacher: { select: { id: true, name: true, role: true } } } },
      students: { where: { status: "ACTIVE" } },
    },
    orderBy: { name: "asc" },
  });

  const foundNames = new Set(targetBatches.map((batch) => batch.name));
  for (const name of [...crashBatchNames, ...aisseeBatchNames]) {
    if (!foundNames.has(name)) report.missingBatches.push(name);
  }

  report.agniveerBatchesFound = targetBatches.filter((batch) => batch.name.toLowerCase().includes("agniveer") || batch.programSlug.toLowerCase().includes("agniveer")).map((batch) => batch.name);
  report.afcatBatchesFound = targetBatches.filter((batch) => batch.name.toLowerCase().includes("afcat") || batch.programSlug.toLowerCase().includes("afcat")).map((batch) => batch.name);

  for (const batch of targetBatches) {
    const desiredRaw = getDesiredForBatch(batch);
    if (!desiredRaw.length) continue;
    report.batchesFound.push({ id: batch.id, name: batch.name, programSlug: batch.programSlug, students: batch.students.length });
    report.existingAllocationsFound += batch.teachers.length;

    const desired = [];
    for (const [subject, teacherKey, role] of desiredRaw) {
      const teacher = teacherByKey.get(teacherKey);
      if (!teacher) {
        report.blockedAllocations.push({ batch: batch.name, subject, teacher: teacherKey, reason: "Faculty account missing or not a faculty role" });
        continue;
      }
      desired.push({ subject, teacher, role });
      const existing = await prisma.teacherBatchAssignment.findUnique({
        where: { batchId_teacherId_subject: { batchId: batch.id, teacherId: teacher.id, subject } },
        select: { id: true, role: true, status: true },
      });
      await prisma.teacherBatchAssignment.upsert({
        where: { batchId_teacherId_subject: { batchId: batch.id, teacherId: teacher.id, subject } },
        update: { role, status: "ACTIVE" },
        create: { batchId: batch.id, teacherId: teacher.id, subject, role, status: "ACTIVE" },
      });
      await upsertLegacy(batch.id, teacher.id, subject, role);
      if (existing) report.duplicateAllocationsSkipped.push({ batch: batch.name, subject, teacher: teacher.name, role });
      else report.newAllocationsAdded.push({ batch: batch.name, subject, teacher: teacher.name, role });
    }

    if (crashBatchNames.includes(batch.name)) {
      const desiredKeys = new Set(desired.map((item) => `${item.teacher.id}::${item.subject}`));
      const activeAssignments = await prisma.teacherBatchAssignment.findMany({ where: { batchId: batch.id, status: "ACTIVE" }, include: { teacher: { select: { name: true } } } });
      for (const assignment of activeAssignments) {
        const keep = desiredKeys.has(`${assignment.teacherId}::${assignment.subject}`);
        if (keep) continue;
        await prisma.teacherBatchAssignment.update({ where: { id: assignment.id }, data: { status: "ARCHIVED" } });
        await archiveLegacy(batch.id, assignment.teacherId, assignment.subject);
        report.allocationsRemoved.push({ batch: batch.name, subject: assignment.subject, teacher: assignment.teacher.name, previousRole: assignment.role });
      }
    }
  }

  const finalBatches = await prisma.batch.findMany({
    where: { name: { in: [...crashBatchNames, ...aisseeBatchNames] } },
    include: {
      teachers: { where: { status: "ACTIVE" }, include: { teacher: { select: { name: true, role: true } } }, orderBy: [{ subject: "asc" }, { role: "asc" }] },
      students: { where: { status: "ACTIVE" } },
    },
    orderBy: { name: "asc" },
  });

  report.finalAllocationMatrix = finalBatches.map((batch) => ({
    batchId: batch.id,
    batchName: batch.name,
    students: batch.students.length,
    academicHeadVisible: batch.teachers.some((assignment) => assignment.role === "ACADEMIC_HEAD"),
    teacherVisible: batch.teachers.some((assignment) => assignment.role !== "ACADEMIC_HEAD"),
    subjects: [...new Set(batch.teachers.map((assignment) => assignment.subject))],
    allocations: batch.teachers.map((assignment) => ({
      subject: assignment.subject,
      teacher: assignment.teacher.name,
      role: assignment.role,
    })),
  }));

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

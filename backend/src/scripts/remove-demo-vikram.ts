import { prisma } from "../config/prisma.js";

const shouldDelete = process.argv.includes("--confirm") || process.env.CONFIRM_REMOVE_VIKRAM === "YES";

type CountRow = { count: bigint };

async function rawCount(sql: string, ...values: unknown[]) {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql, ...values);
  return Number(rows[0]?.count ?? 0);
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "Vikram", mode: "insensitive" } },
        { email: { contains: "faculty.ssb", mode: "insensitive" } },
        { mobile: { contains: "9000000003" } },
      ],
    },
    select: { id: true, name: true, email: true, mobile: true, role: true },
  });

  const userIds = users.map((user) => user.id);
  const report = {
    dryRun: !shouldDelete,
    users,
    counts: {
      teacherBatchAssignments: userIds.length ? await prisma.teacherBatchAssignment.count({ where: { teacherId: { in: userIds } } }) : 0,
      legacyBatchTeacherAssignments: 0,
      academicCalendarItems: 0,
      testsCreated: userIds.length ? await prisma.test.count({ where: { teacherId: { in: userIds } } }) : 0,
      testsApproved: userIds.length ? await prisma.test.count({ where: { approvedById: { in: userIds } } }) : 0,
      questionBankItems: userIds.length ? await prisma.questionBankItem.count({ where: { createdById: { in: userIds } } }) : 0,
    },
    deleted: {
      users: 0,
      teacherBatchAssignments: 0,
      legacyBatchTeacherAssignments: 0,
      academicCalendarItemsRemoved: 0,
      academicCalendarItemsUnassigned: 0,
      testsUnassigned: 0,
      questionBankItemsUnassigned: 0,
    },
  };

  for (const userId of userIds) {
    report.counts.legacyBatchTeacherAssignments += await rawCount(
      `SELECT COUNT(*)::bigint AS count FROM "BatchTeacherAssignment" WHERE "teacherId" = $1`,
      userId,
    );
    report.counts.academicCalendarItems += await rawCount(
      `SELECT COUNT(*)::bigint AS count FROM "AcademicCalendarItem" WHERE "teacherId" = $1 OR "teacherName" ILIKE '%Vikram%'`,
      userId,
    );
  }

  if (!shouldDelete) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  for (const userId of userIds) {
    const legacyDeleted = await prisma.$executeRaw`
      DELETE FROM "BatchTeacherAssignment" WHERE "teacherId" = ${userId}
    `;
    report.deleted.legacyBatchTeacherAssignments += Number(legacyDeleted);

    const calendarRemoved = await prisma.$executeRaw`
      DELETE FROM "AcademicCalendarItem"
      WHERE "teacherId" = ${userId} OR "teacherName" ILIKE '%Vikram%'
    `;
    report.deleted.academicCalendarItemsRemoved += Number(calendarRemoved);
  }

  const assignmentDelete = await prisma.teacherBatchAssignment.deleteMany({ where: { teacherId: { in: userIds } } });
  report.deleted.teacherBatchAssignments = assignmentDelete.count;

  const testsUnassigned = await prisma.test.updateMany({
    where: { OR: [{ teacherId: { in: userIds } }, { approvedById: { in: userIds } }] },
    data: { teacherId: null, approvedById: null },
  });
  report.deleted.testsUnassigned = testsUnassigned.count;

  const qbUnassigned = await prisma.questionBankItem.updateMany({
    where: { createdById: { in: userIds } },
    data: { createdById: null },
  });
  report.deleted.questionBankItemsUnassigned = qbUnassigned.count;

  for (const userId of userIds) {
    await prisma.user.delete({ where: { id: userId } });
    report.deleted.users += 1;
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

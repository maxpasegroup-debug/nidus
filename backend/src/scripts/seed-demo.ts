import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { CounsellingMode, HostelType, InOutType, LeadStatus, Role, type User } from "../generated/prisma/client.js";

const DEMO_PASSWORDS = {
  command: "Nidus@Command2026",
  director: "Nidus@Academics2026",
  teacher: "Nidus@Faculty2026",
  cadet: "Nidus@Cadet2026",
  parent: "Nidus@Parent2026",
  guest: "Nidus@Explore2026",
  demo: "Nidus@Demo2026"
} as const;

const demoUsers = [
  { name: "Command Admin", email: "command@nidusacademy.com", mobile: "+919900000001", role: Role.ADMIN, password: DEMO_PASSWORDS.command },
  { name: "Col. Aditi Rao", email: "director.academics@nidusacademy.com", mobile: "+919900000002", role: Role.DIRECTOR, password: DEMO_PASSWORDS.director },
  { name: "Maj. Vikram SSB", email: "faculty.ssb@nidusacademy.com", mobile: "+919900000003", role: Role.TEACHER, password: DEMO_PASSWORDS.teacher },
  { name: "Cadet Arjun Mehra", email: "cadet.arjun@nidusacademy.com", mobile: "+919900000004", role: Role.STUDENT, password: DEMO_PASSWORDS.cadet },
  { name: "Rajiv Mehra", email: "parent.arjun@nidusacademy.com", mobile: "+919900000005", role: Role.PARENT, password: DEMO_PASSWORDS.parent },
  { name: "NIDUS Explorer", email: "explore@nidusacademy.com", mobile: "+919900000006", role: Role.GUEST, password: DEMO_PASSWORDS.guest },
  { name: "Cadet Meera Nair", email: "cadet.meera@nidusacademy.com", mobile: "+919900000007", role: Role.STUDENT, password: DEMO_PASSWORDS.demo },
  { name: "Cadet Kabir Singh", email: "cadet.kabir@nidusacademy.com", mobile: "+919900000008", role: Role.STUDENT, password: DEMO_PASSWORDS.demo },
  { name: "Cadet Zoya Khan", email: "cadet.zoya@nidusacademy.com", mobile: "+919900000009", role: Role.STUDENT, password: DEMO_PASSWORDS.demo },
  { name: "Cadet Rohan Iyer", email: "cadet.rohan@nidusacademy.com", mobile: "+919900000010", role: Role.STUDENT, password: DEMO_PASSWORDS.demo }
];

const permissionMatrix = [
  ["dashboard", "read"],
  ["users", "manage"],
  ["courses", "manage"],
  ["tests", "manage"],
  ["crm", "manage"],
  ["finance", "manage"],
  ["hostel", "read"],
  ["analytics", "read"],
  ["documents", "manage"],
  ["ai", "operate"],
  ["audit", "read"],
  ["settings", "manage"]
] as const;

function daysFromNow(days: number) {
  return new Date(new Date("2026-05-06T08:00:00.000Z").getTime() + days * 24 * 60 * 60 * 1000);
}

function uniquePaymentId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function upsertDemoUsers() {
  const users = new Map<string, User>();

  for (const account of demoUsers) {
    const password = await bcrypt.hash(account.password, 12);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        mobile: account.mobile,
        password,
        role: account.role,
        emailVerified: true,
        mobileVerified: true
      },
      create: {
        name: account.name,
        email: account.email,
        mobile: account.mobile,
        password,
        role: account.role,
        emailVerified: true,
        mobileVerified: true
      }
    });

    users.set(account.email, user);
  }

  return users;
}

async function resetDemoData(userIds: string[]) {
  await prisma.answer.deleteMany({ where: { attempt: { userId: { in: userIds } } } });
  await prisma.testAttempt.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.psychometricAnswer.deleteMany({ where: { attempt: { userId: { in: userIds } } } });
  await prisma.psychometricAttempt.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.lectureProgress.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.enrollment.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.attendance.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { markedBy: { in: userIds } }] } });
  await prisma.followUp.deleteMany({ where: { createdBy: { in: userIds } } });
  await prisma.counsellingBooking.deleteMany({ where: { lead: { assignedTo: { in: userIds } } } });
  await prisma.lead.deleteMany({ where: { assignedTo: { in: userIds } } });
  await prisma.admission.deleteMany({ where: { studentId: { in: userIds } } });
  await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.subscription.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.feeInstallment.deleteMany({ where: { studentId: { in: userIds } } });
  await prisma.invoice.deleteMany({ where: { studentId: { in: userIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] } });
  await prisma.messageThread.deleteMany({ where: { createdBy: { in: userIds } } });
  await prisma.announcement.deleteMany({ where: { createdBy: { in: userIds } } });
  await prisma.aIInterviewQuestion.deleteMany({ where: { session: { userId: { in: userIds } } } });
  await prisma.aIInterviewSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.doubtQuery.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.aIRecommendation.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.officerPotential.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.fitnessProfile.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.pTAttendance.deleteMany({ where: { studentId: { in: userIds } } });
  await prisma.physicalEligibility.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.dailyFitnessLog.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.quizBattleParticipant.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.leaderboard.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.hostelLeave.deleteMany({ where: { OR: [{ studentId: { in: userIds } }, { approvedBy: { in: userIds } }] } });
  await prisma.inOutEntry.deleteMany({ where: { studentId: { in: userIds } } });
  await prisma.hostelAllocation.deleteMany({ where: { studentId: { in: userIds } } });
  await prisma.disciplineRecord.deleteMany({ where: { OR: [{ studentId: { in: userIds } }, { recordedBy: { in: userIds } }] } });
  await prisma.paradePerformance.deleteMany({ where: { studentId: { in: userIds } } });
  await prisma.mediaFile.deleteMany({ where: { uploadedBy: { in: userIds } } });
  await prisma.document.deleteMany({ where: { uploadedBy: { in: userIds } } });
  await prisma.mediaFolder.deleteMany({ where: { createdBy: { in: userIds } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
}

async function seedPermissions(users: Map<string, User>) {
  const permissions = [];

  for (const [module, action] of permissionMatrix) {
    permissions.push(
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: { name: `${module}.${action}` },
        create: { module, action, name: `${module}.${action}` }
      })
    );
  }

  const roleDefinitions = [
    { name: "Command Admin", description: "Full institutional command permissions.", email: "command@nidusacademy.com", modules: permissionMatrix.map(([module]) => module) },
    { name: "Academic Director", description: "Academic, analytics, faculty, course, test, and AI oversight.", email: "director.academics@nidusacademy.com", modules: ["dashboard", "courses", "tests", "analytics", "documents", "ai", "crm"] },
    { name: "Defence Faculty", description: "Teaching, notes, classes, attendance, tests, and student feedback.", email: "faculty.ssb@nidusacademy.com", modules: ["dashboard", "courses", "tests", "documents", "ai"] }
  ];

  for (const definition of roleDefinitions) {
    const adminRole = await prisma.adminRole.upsert({
      where: { name: definition.name },
      update: { description: definition.description },
      create: { name: definition.name, description: definition.description }
    });

    const allowed = permissions.filter((permission) => definition.modules.includes(permission.module));
    await prisma.rolePermission.createMany({
      data: allowed.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })),
      skipDuplicates: true
    });

    const user = users.get(definition.email);
    if (user) {
      await prisma.userRole.createMany({
        data: [{ userId: user.id, roleId: adminRole.id }],
        skipDuplicates: true
      });
    }
  }
}

async function seedLearning(adminId: string, teacherId: string) {
  await prisma.recordedLecture.deleteMany({ where: { instructorName: { in: ["Maj. Vikram SSB", "NIDUS AI Mentor"] } } });

  const courseSeeds = [
    {
      title: "NDA Command Foundation 2026",
      slug: "demo-nda-command-foundation-2026",
      description: "Premium NDA academic, fitness, current affairs, and SSB orientation track for officer aspirants.",
      thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
      category: "Foundation",
      examType: "NDA",
      duration: "28 weeks",
      price: 42000,
      isPremium: true
    },
    {
      title: "SSB Officer Psychology Lab",
      slug: "demo-ssb-officer-psychology-lab",
      description: "WAT, TAT, SRT, self-description, interview structure, GTO readiness, and conference discipline.",
      thumbnail: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80",
      category: "SSB",
      examType: "SSB",
      duration: "10 weeks",
      price: 36000,
      isPremium: true
    },
    {
      title: "AFCAT Air Warrior Accelerator",
      slug: "demo-afcat-air-warrior-accelerator",
      description: "Reasoning, English, military aptitude, numerical ability, and speed strategy for AFCAT.",
      thumbnail: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80",
      category: "Accelerator",
      examType: "AFCAT",
      duration: "14 weeks",
      price: 28000,
      isPremium: true
    }
  ];

  const courses = [];
  for (const seed of courseSeeds) {
    await prisma.course.deleteMany({ where: { slug: seed.slug } });
    courses.push(
      await prisma.course.create({
        data: {
          ...seed,
          modules: {
            create: [
              {
                title: `${seed.examType} Mission Briefing`,
                order: 1,
                lessons: {
                  create: [
                    {
                      title: "Strategic orientation",
                      description: "Program outcomes, exam pattern, discipline expectations, and weekly mission rhythm.",
                      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                      duration: "34 min",
                      isPreview: true,
                      order: 1
                    },
                    {
                      title: "High-yield revision protocol",
                      description: "Daily recall method, mock review structure, and AI correction workflow.",
                      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                      duration: "46 min",
                      isPreview: false,
                      order: 2
                    }
                  ]
                }
              }
            ]
          }
        }
      })
    );
  }

  for (const course of courses) {
    await prisma.recordedLecture.createMany({
      data: [
        {
          title: `${course.examType} Weekly Command Class`,
          description: "Faculty-led recorded class with premium visual briefing notes.",
          courseId: course.id,
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          thumbnail: course.thumbnail,
          duration: 54,
          instructorName: "Maj. Vikram SSB"
        },
        {
          title: `${course.examType} AI Revision Debrief`,
          description: "AI-assisted mock analysis and next-week readiness plan.",
          courseId: course.id,
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          thumbnail: course.thumbnail,
          duration: 31,
          instructorName: "NIDUS AI Mentor"
        }
      ]
    });
  }

  await prisma.liveClass.deleteMany({ where: { instructorName: { in: ["Maj. Vikram SSB", "Col. Aditi Rao"] } } });
  await prisma.liveClass.createMany({
    data: [
      {
        title: "SSB Personal Interview Simulation",
        description: "Live board-room style interview drills for confidence, structure, and officer presence.",
        examType: "SSB",
        instructorName: "Maj. Vikram SSB",
        scheduledAt: daysFromNow(1),
        duration: 75,
        meetingLink: "https://meet.nidusacademy.com/ssb-demo",
        thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
        isLive: false
      },
      {
        title: "Director's NDA Strategy Briefing",
        description: "Academic director session on timetable discipline, parent alignment, and test strategy.",
        examType: "NDA",
        instructorName: "Col. Aditi Rao",
        scheduledAt: daysFromNow(3),
        duration: 60,
        meetingLink: "https://meet.nidusacademy.com/nda-command",
        thumbnail: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
        isLive: false
      }
    ]
  });

  await prisma.document.createMany({
    data: [
      {
        title: "SSB Interview Officer Response Framework",
        description: "Premium faculty note for leadership, responsibility, and pressure-response answers.",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        category: "Faculty Notes",
        uploadedBy: teacherId
      },
      {
        title: "NDA Weekly Academic Command Plan",
        description: "Director-approved weekly planner for mathematics, GAT, current affairs, and fitness.",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        category: "Training Material",
        uploadedBy: adminId
      }
    ]
  });

  return courses;
}

async function seedTestsAndContent() {
  await prisma.test.deleteMany({ where: { title: { in: ["Demo NDA Full Spectrum Mock", "Demo SSB OIR Screening Drill"] } } });
  const ndaTest = await prisma.test.create({
    data: {
      title: "Demo NDA Full Spectrum Mock",
      description: "Premium demo mock covering NDA mathematics, GAT, and defence current affairs.",
      examType: "NDA",
      category: "Full Mock",
      duration: 150,
      totalMarks: 300,
      isMockTest: true,
      isLive: true,
      questions: {
        create: [
          {
            questionText: "If a cadet improves his 2.4 km run by 12%, what does this primarily indicate in NIDUS analytics?",
            optionA: "Reduced study consistency",
            optionB: "Improved stamina trend",
            optionC: "Lower OLQ score",
            optionD: "Lower attendance quality",
            correctAnswer: "B",
            explanation: "Running improvement contributes to stamina and physical consistency.",
            marks: 4,
            negativeMarks: 1.33,
            difficultyLevel: "Easy",
            topic: "Fitness Analytics"
          },
          {
            questionText: "Which quality is most directly linked with taking timely responsibility during a group task?",
            optionA: "Liveliness",
            optionB: "Sense of responsibility",
            optionC: "Stamina",
            optionD: "Vocabulary",
            correctAnswer: "B",
            explanation: "Taking ownership under pressure reflects sense of responsibility.",
            marks: 4,
            negativeMarks: 1.33,
            difficultyLevel: "Medium",
            topic: "OLQ"
          }
        ]
      }
    }
  });

  await prisma.pYQCategory.upsert({
    where: { name_examType: { name: "NDA Mathematics 2025", examType: "NDA" } },
    update: {},
    create: {
      name: "NDA Mathematics 2025",
      examType: "NDA",
      questions: {
        create: [
          {
            year: 2025,
            subject: "Mathematics",
            topic: "Trigonometry",
            questionText: "If tan A = 1, find A for acute A.",
            optionA: "30 degrees",
            optionB: "45 degrees",
            optionC: "60 degrees",
            optionD: "90 degrees",
            correctAnswer: "B",
            explanation: "tan 45 degrees equals 1.",
            difficultyLevel: "Easy"
          }
        ]
      }
    }
  });

  await prisma.currentAffair.deleteMany({ where: { title: "Integrated Theatre Command Readiness Brief" } });
  const affair = await prisma.currentAffair.create({
    data: {
      title: "Integrated Theatre Command Readiness Brief",
      description: "A concise defence-current-affairs briefing on jointness, theatre commands, and officer awareness.",
      category: "Defence",
      imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      publishedDate: daysFromNow(-2),
      quizzes: {
        create: [
          {
            question: "What does jointness primarily improve in armed forces operations?",
            optionA: "Fragmentation",
            optionB: "Inter-service coordination",
            optionC: "Administrative delay",
            optionD: "Lower readiness",
            correctAnswer: "B"
          }
        ]
      }
    }
  });

  return { ndaTest, affair };
}

async function seedStudentWorld(users: Map<string, User>, courseIds: string[], testId: string) {
  const admin = users.get("command@nidusacademy.com")!;
  const teacher = users.get("faculty.ssb@nidusacademy.com")!;
  const students = [...users.values()].filter((user) => user.role === Role.STUDENT);
  const arjun = users.get("cadet.arjun@nidusacademy.com")!;

  for (const [index, student] of students.entries()) {
    await prisma.enrollment.createMany({
      data: courseIds.map((courseId, courseIndex) => ({ userId: student.id, courseId, progress: Math.max(38, 88 - index * 7 - courseIndex * 6) })),
      skipDuplicates: true
    });

    await prisma.attendance.createMany({
      data: Array.from({ length: 18 }).map((_, day) => ({
        userId: student.id,
        date: daysFromNow(-day),
        status: day % (index + 5) === 0 ? "ABSENT" : "PRESENT",
        markedBy: teacher.id
      }))
    });

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: student.id,
        testId,
        score: 238 - index * 11,
        totalCorrect: 62 - index * 3,
        totalWrong: 12 + index,
        timeTaken: 7100 + index * 260,
        submittedAt: daysFromNow(-index - 1)
      }
    });

    const questions = await prisma.question.findMany({ where: { testId }, take: 2 });
    await prisma.answer.createMany({
      data: questions.map((question, questionIndex) => ({
        attemptId: attempt.id,
        questionId: question.id,
        selectedAnswer: questionIndex === 0 || index < 2 ? question.correctAnswer : "A",
        isCorrect: questionIndex === 0 || index < 2
      })),
      skipDuplicates: true
    });

    await prisma.oLQScore.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        effectiveIntelligence: 76 - index * 2,
        reasoningAbility: 82 - index * 2,
        organizingAbility: 74 - index,
        socialAdaptability: 79 - index,
        cooperation: 84 - index,
        senseOfResponsibility: 88 - index,
        initiative: 78 - index,
        selfConfidence: 81 - index,
        speedOfDecision: 73 - index,
        abilityToInfluence: 77 - index,
        liveliness: 80 - index,
        determination: 86 - index,
        courage: 82 - index,
        stamina: 75 - index,
        emotionalStability: 83 - index
      }
    });

    await prisma.performanceAnalytics.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        testAccuracy: 82 - index * 2,
        weakTopics: ["Trigonometry speed", "Current affairs retention", "SRT brevity"],
        strongTopics: ["Leadership examples", "Reasoning", "Discipline consistency"],
        averageScore: 78 - index * 2,
        studyConsistency: 86 - index,
        revisionRate: 74 - index,
        aiSuggestions: [
          "Complete one timed OIR drill before dinner.",
          "Use STAR structure for interview leadership answers.",
          "Revise maritime security brief for tomorrow's current affairs quiz."
        ]
      }
    });

    await prisma.aIRecommendation.createMany({
      data: [
        { userId: student.id, category: "SSB", priority: "HIGH", recommendation: "Practice 3 pressure-based personal interview answers using responsibility-first framing." },
        { userId: student.id, category: "Academics", priority: "MEDIUM", recommendation: "Revise trigonometry identities with a 25-minute spaced recall cycle." },
        { userId: student.id, category: "Fitness", priority: "MEDIUM", recommendation: "Add 400m interval runs twice this week to improve stamina score." }
      ]
    });

    await prisma.officerPotential.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        leadershipScore: 84 - index,
        communicationScore: 78 - index,
        disciplineScore: 91 - index,
        confidenceScore: 80 - index,
        officerReadiness: 82 - index,
        aiSummary: "Displays strong discipline and responsibility. Needs sharper examples in interview responses and faster decision articulation in SRT drills."
      }
    });

    await prisma.fitnessProfile.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        height: 174 + index,
        weight: 68 + index,
        bmi: 22.4 + index * 0.2,
        runningTime: 9.8 + index * 0.3,
        pushups: 42 - index,
        pullups: 9 - Math.min(index, 4),
        situps: 58 - index * 2,
        staminaScore: 78 - index,
        fitnessLevel: index < 2 ? "Officer Ready" : "Improving"
      }
    });

    await prisma.dailyFitnessLog.createMany({
      data: Array.from({ length: 7 }).map((_, day) => ({
        userId: student.id,
        runningDistance: 2.4 + day * 0.2,
        caloriesBurned: 320 + day * 18,
        waterIntake: 3.1,
        workoutDuration: 55 + day,
        notes: "Morning PT completed with sprint intervals and core conditioning.",
        createdAt: daysFromNow(-day)
      }))
    });

    await prisma.leaderboard.upsert({
      where: { userId: student.id },
      update: { points: 1840 - index * 130, streak: 12 - index, rank: index + 1 },
      create: { userId: student.id, points: 1840 - index * 130, streak: 12 - index, rank: index + 1 }
    });
  }

  const session = await prisma.aIInterviewSession.create({
    data: {
      userId: arjun.id,
      examType: "SSB",
      interviewType: "Personal Interview",
      status: "COMPLETED",
      startedAt: daysFromNow(-2),
      completedAt: daysFromNow(-2),
      overallScore: 84,
      aiFeedback: "Arjun is composed and disciplined. He should add sharper decision points and quantify outcomes in leadership answers.",
      questions: {
        create: [
          {
            question: "Tell me about a time you led a team under pressure.",
            userAnswer: "I organised my school house team during an inter-school drill competition after our captain fell sick.",
            aiAnalysis: "Strong ownership. Improve by stating the decision timeline and final measurable outcome.",
            score: 82
          },
          {
            question: "Why do you want to join the armed forces?",
            userAnswer: "I want a career built on service, discipline, leadership, and national responsibility.",
            aiAnalysis: "Clear motivation. Add a personal experience to make the answer memorable.",
            score: 86
          }
        ]
      }
    }
  });

  await prisma.doubtQuery.create({
    data: {
      userId: arjun.id,
      subject: "SSB Psychology",
      question: "How do I keep SRT answers short but officer-like?",
      aiResponse: "Use action-first sentences: identify risk, take responsibility, coordinate help, and close the task. Avoid over-explaining."
    }
  });

  return session;
}

async function seedOperations(users: Map<string, User>, courseId: string) {
  const admin = users.get("command@nidusacademy.com")!;
  const director = users.get("director.academics@nidusacademy.com")!;
  const teacher = users.get("faculty.ssb@nidusacademy.com")!;
  const arjun = users.get("cadet.arjun@nidusacademy.com")!;
  const meera = users.get("cadet.meera@nidusacademy.com")!;

  await prisma.faculty.upsert({
    where: { userId: teacher.id },
    update: { designation: "Senior SSB Mentor", department: "SSB Psychology", salary: 110000, status: "ACTIVE" },
    create: {
      userId: teacher.id,
      department: "SSB Psychology",
      designation: "Senior SSB Mentor",
      joiningDate: daysFromNow(-180),
      salary: 110000,
      status: "ACTIVE",
      payrolls: {
        create: [{ month: "May 2026", basicSalary: 110000, incentives: 18000, deductions: 2500, totalSalary: 125500, paidStatus: "PAID" }]
      }
    }
  });

  await prisma.timetable.deleteMany({ where: { instructor: { in: ["Maj. Vikram SSB", "Col. Aditi Rao"] } } });
  await prisma.timetable.createMany({
    data: [
      { title: "NDA Mathematics War Room", batch: "NDA Alpha", subject: "Mathematics", instructor: "Col. Aditi Rao", startTime: daysFromNow(1), endTime: daysFromNow(1.08), classroom: "Command Hall A" },
      { title: "SSB Psychology Lab", batch: "SSB Bravo", subject: "Psychology", instructor: "Maj. Vikram SSB", startTime: daysFromNow(2), endTime: daysFromNow(2.08), classroom: "Interview Studio 2" }
    ]
  });

  const leads = await Promise.all(
    [
      ["Ishaan Malhotra", "NDA", "Website", LeadStatus.COUNSELLING],
      ["Ananya Bose", "AFCAT", "Instagram Campaign", LeadStatus.CONTACTED],
      ["Dev Patel", "SSB", "Parent Referral", LeadStatus.ENROLLED]
    ].map(([fullName, targetExam, source, status], index) =>
      prisma.lead.create({
        data: {
          fullName: String(fullName),
          mobile: `+91880000000${index + 1}`,
          email: `${String(fullName).toLowerCase().replace(/\s+/g, ".")}@demo.nidusacademy.com`,
          targetExam: String(targetExam),
          source: String(source),
          status: status as LeadStatus,
          assignedTo: director.id,
          notes: "High-intent management demo lead with parent follow-up scheduled.",
          followUps: {
            create: [{ followUpDate: daysFromNow(index + 1), remarks: "Share premium NIDUS command platform demo and scholarship options.", status: "SCHEDULED", createdBy: director.id }]
          }
        }
      })
    )
  );

  await prisma.counsellingBooking.createMany({
    data: leads.map((lead, index) => ({
      leadId: lead.id,
      counsellorName: index === 0 ? "Col. Aditi Rao" : "Maj. Vikram SSB",
      bookingDate: daysFromNow(index + 1),
      mode: index === 1 ? CounsellingMode.ONLINE : CounsellingMode.OFFLINE,
      status: index === 2 ? "COMPLETED" : "CONFIRMED"
    }))
  });

  await prisma.admission.createMany({
    data: [
      { studentId: arjun.id, courseId, admissionDate: daysFromNow(-45), paymentStatus: "PAID", batch: "NDA Alpha 2026" },
      { studentId: meera.id, courseId, admissionDate: daysFromNow(-28), paymentStatus: "PARTIAL", batch: "NDA Alpha 2026" }
    ],
    skipDuplicates: true
  });

  await prisma.payment.createMany({
    data: [
      { userId: arjun.id, courseId, amount: 42000, currency: "INR", razorpayOrderId: uniquePaymentId("order_demo_arjun"), razorpayPaymentId: uniquePaymentId("pay_demo_arjun"), paymentStatus: "PAID", paymentMethod: "UPI" },
      { userId: meera.id, courseId, amount: 21000, currency: "INR", razorpayOrderId: uniquePaymentId("order_demo_meera"), razorpayPaymentId: uniquePaymentId("pay_demo_meera"), paymentStatus: "PAID", paymentMethod: "CARD" }
    ]
  });

  await prisma.subscription.createMany({
    data: [
      { userId: arjun.id, planName: "NIDUS Officer Elite", startDate: daysFromNow(-45), endDate: daysFromNow(320), status: "ACTIVE", amount: 42000 },
      { userId: meera.id, planName: "NIDUS NDA Premium", startDate: daysFromNow(-28), endDate: daysFromNow(240), status: "ACTIVE", amount: 28000 }
    ]
  });

  await prisma.feeInstallment.createMany({
    data: [
      { studentId: arjun.id, title: "NDA Alpha Complete Fee", amount: 42000, dueDate: daysFromNow(-40), paidStatus: "PAID", paidAt: daysFromNow(-39) },
      { studentId: meera.id, title: "NDA Alpha Installment 2", amount: 21000, dueDate: daysFromNow(18), paidStatus: "PENDING" }
    ]
  });

  await prisma.invoice.createMany({
    data: [
      { studentId: arjun.id, invoiceNumber: "NIDUS-DEMO-INV-ARJUN-2026", amount: 42000, status: "PAID" },
      { studentId: meera.id, invoiceNumber: "NIDUS-DEMO-INV-MEERA-2026", amount: 21000, status: "PENDING" }
    ],
    skipDuplicates: true
  });

  await prisma.hostel.deleteMany({ where: { name: "NIDUS Officer Cadet Residence" } });
  const hostel = await prisma.hostel.create({
    data: {
      name: "NIDUS Officer Cadet Residence",
      type: HostelType.BOYS,
      totalRooms: 80,
      wardenName: "Sub. R. Menon",
      rooms: {
        create: [
          { roomNumber: "A-101", floor: 1, capacity: 2, occupiedCount: 1, status: "PARTIAL" },
          { roomNumber: "A-102", floor: 1, capacity: 2, occupiedCount: 1, status: "PARTIAL" }
        ]
      }
    },
    include: { rooms: true }
  });

  await prisma.hostelAllocation.create({ data: { studentId: arjun.id, hostelId: hostel.id, roomId: hostel.rooms[0].id, status: "ACTIVE" } });
  await prisma.inOutEntry.createMany({
    data: [
      { studentId: arjun.id, type: InOutType.OUT, entryTime: daysFromNow(-1), remarks: "Evening supervised sports practice" },
      { studentId: arjun.id, type: InOutType.IN, entryTime: daysFromNow(-0.9), remarks: "Returned on time" }
    ]
  });
  await prisma.disciplineRecord.create({ data: { studentId: arjun.id, category: "Discipline Excellence", description: "Led morning fall-in and assisted two junior cadets.", severity: "POSITIVE", actionTaken: "Commendation noted", recordedBy: teacher.id } });
  await prisma.paradePerformance.create({ data: { studentId: arjun.id, attendance: 96, discipline: 94, leadership: 88, fitness: 82, remarks: "Strong command voice and improving stamina." } });

  await prisma.announcement.createMany({
    data: [
      { title: "Management Demo Environment Ready", description: "All NIDUS premium demo personas, dashboards, AI reports, and CRM records are active.", targetAudience: "ALL", audience: "ALL", createdBy: admin.id },
      { title: "SSB Interview Lab Scheduled", description: "Cadets report to Interview Studio 2 for AI-assisted PI simulation.", targetAudience: "STUDENT", audience: "NDA Alpha", createdBy: teacher.id }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "DEMO_SEED", module: "system", description: "Seeded premium NIDUS demo command environment.", ipAddress: "127.0.0.1" },
      { userId: director.id, action: "ACADEMIC_REVIEW", module: "analytics", description: "Reviewed NDA Alpha readiness reports.", ipAddress: "127.0.0.1" }
    ]
  });
}

async function main() {
  const users = await upsertDemoUsers();
  const userIds = [...users.values()].map((user) => user.id);

  await resetDemoData(userIds);
  await seedPermissions(users);

  const admin = users.get("command@nidusacademy.com")!;
  const teacher = users.get("faculty.ssb@nidusacademy.com")!;
  const courses = await seedLearning(admin.id, teacher.id);
  const { ndaTest } = await seedTestsAndContent();
  await seedStudentWorld(users, courses.map((course) => course.id), ndaTest.id);
  await seedOperations(users, courses[0].id);

  console.log("NIDUS professional demo environment seeded successfully.");
  console.table([
    ["COMMAND ADMIN", "command@nidusacademy.com", DEMO_PASSWORDS.command, "ADMIN"],
    ["ACADEMIC DIRECTOR", "director.academics@nidusacademy.com", DEMO_PASSWORDS.director, "DIRECTOR"],
    ["DEFENCE FACULTY", "faculty.ssb@nidusacademy.com", DEMO_PASSWORDS.teacher, "TEACHER"],
    ["OFFICER ASPIRANT", "cadet.arjun@nidusacademy.com", DEMO_PASSWORDS.cadet, "STUDENT"],
    ["PARENT ACCESS", "parent.arjun@nidusacademy.com", DEMO_PASSWORDS.parent, "PARENT"],
    ["PUBLIC DEMO ACCESS", "explore@nidusacademy.com", DEMO_PASSWORDS.guest, "GUEST"]
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

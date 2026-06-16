import { fileURLToPath } from "node:url";
import { prisma } from "../config/prisma.js";

type AcademyProgramSeed = {
  slug: string;
  title: string;
  vertical: string;
  level: string;
  targetStudents: string;
  duration: string;
  format: string;
  outcome: string;
  modules: string[];
  pathways?: string[];
};

const academyPrograms: AcademyProgramSeed[] = [
  {
    slug: "aissee-class-6",
    title: "AISSEE Class 6",
    vertical: "NIDUS Defence Schools",
    level: "School Foundation Programs",
    targetStudents: "Class 5 students",
    duration: "Class 6 entrance track",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Sainik School Class 6 entrance preparation.",
    modules: ["Mathematics", "English", "Intelligence & Reasoning", "General Knowledge", "Weekly Tests", "Interview Orientation"]
  },
  {
    slug: "aissee-class-9",
    title: "AISSEE Class 9",
    vertical: "NIDUS Defence Schools",
    level: "School Foundation Programs",
    targetStudents: "Class 8 students",
    duration: "Class 9 entrance track",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Sainik School Class 9 entrance preparation.",
    modules: ["Mathematics", "English", "Intelligence & Reasoning", "General Knowledge", "Weekly Tests", "Interview Orientation"]
  },
  {
    slug: "rimc-preparation",
    title: "RIMC Preparation",
    vertical: "NIDUS Defence Schools",
    level: "School Foundation Programs",
    targetStudents: "Class 7 students",
    duration: "Focused entrance preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Preparation for Rashtriya Indian Military College.",
    modules: ["English", "Mathematics", "General Knowledge", "Interview Preparation", "Personality Development", "Reading Habits", "Test Practice"]
  },
  {
    slug: "foundation-nda-civil-services",
    title: "Foundation NDA & Civil Services",
    vertical: "NIDUS Foundation",
    level: "School Foundation Programs",
    targetStudents: "Classes 8, 9 and 10 students",
    duration: "Long-term foundation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Long-term foundation for NDA, Civil Services and leadership careers.",
    modules: ["Foundation Mathematics", "English", "General Knowledge", "Current Affairs", "Communication Skills", "Personality Development", "Discipline Training", "Physical Awareness", "Periodic Assessments"]
  },
  {
    slug: "nda-f1",
    title: "NDA F1",
    vertical: "NIDUS Officer Academy",
    level: "NDA Foundation",
    targetStudents: "NDA foundation aspirants",
    duration: "Foundation level 1",
    format: "Available as offline classroom program and online learning program.",
    outcome: "First-stage NDA foundation preparation.",
    modules: ["NDA Mathematics", "GAT", "English", "Current Affairs", "Mock Tests", "SSB Orientation"]
  },
  {
    slug: "nda-f2",
    title: "NDA F2",
    vertical: "NIDUS Officer Academy",
    level: "NDA Foundation",
    targetStudents: "NDA foundation aspirants",
    duration: "Foundation level 2",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Second-stage NDA foundation preparation.",
    modules: ["NDA Mathematics", "GAT", "English", "Current Affairs", "Advanced Practice", "Mock Tests", "SSB Orientation"]
  },
  {
    slug: "nda-crash-course",
    title: "NDA Crash Course",
    vertical: "NIDUS Officer Academy",
    level: "NDA Crash",
    targetStudents: "Plus Two and NDA exam aspirants",
    duration: "Fast-track crash preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Fast-track NDA exam preparation.",
    modules: ["NDA Mathematics", "GAT", "English", "Current Affairs", "Revision", "Mock Tests", "Doubt Clearing Sessions"]
  },
  {
    slug: "cds-f1",
    title: "CDS F1",
    vertical: "NIDUS Officer Academy",
    level: "CDS Foundation",
    targetStudents: "College students and graduates",
    duration: "Foundation level 1",
    format: "Available as offline classroom program and online learning program.",
    outcome: "First-stage CDS officer entry preparation.",
    modules: ["English", "General Knowledge", "Current Affairs", "Mathematics", "Mock Tests", "SSB Orientation"]
  },
  {
    slug: "cds-f2",
    title: "CDS F2",
    vertical: "NIDUS Officer Academy",
    level: "CDS Foundation",
    targetStudents: "College students and graduates",
    duration: "Foundation level 2",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Second-stage CDS officer entry preparation.",
    modules: ["English", "General Knowledge", "Current Affairs", "Mathematics", "Exam Strategy", "SSB Orientation"]
  },
  {
    slug: "cds-f3",
    title: "CDS F3",
    vertical: "NIDUS Officer Academy",
    level: "CDS Foundation",
    targetStudents: "College students and graduates",
    duration: "Foundation level 3",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Advanced CDS officer entry preparation.",
    modules: ["English", "General Knowledge", "Current Affairs", "Mathematics", "Advanced Mock Tests", "SSB Orientation"]
  },
  {
    slug: "afcat",
    title: "AFCAT",
    vertical: "NIDUS Officer Academy",
    level: "AFCAT Program",
    targetStudents: "Graduates and final-year students",
    duration: "Air Force officer preparation track",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Indian Air Force officer entry preparation.",
    modules: ["English", "Numerical Ability", "Reasoning", "Military Aptitude", "Current Affairs", "Mock Tests", "AFSB Guidance"]
  },
  {
    slug: "cdse-afcat-crash-course",
    title: "CDSE / AFCAT Crash Course",
    vertical: "NIDUS Officer Academy",
    level: "Crash Course",
    targetStudents: "Graduates and final-year students",
    duration: "Rapid exam preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Rapid preparation for CDS and AFCAT.",
    modules: ["English", "General Knowledge", "Mathematics", "Reasoning", "Current Affairs", "Military Aptitude", "Mock Tests", "SSB Guidance"]
  },
  {
    slug: "tes-guidance",
    title: "TES Guidance",
    vertical: "NIDUS Officer Academy",
    level: "Technical Entry",
    targetStudents: "Plus Two PCM students",
    duration: "Application and SSB guidance track",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Indian Army Technical Entry Scheme guidance.",
    modules: ["TES Guidance", "Application Support", "SSB Preparation", "Interview Skills", "Documentation Support", "Officer Personality Development"]
  },
  {
    slug: "tgc-ssc-technical",
    title: "TGC / SSC Technical",
    vertical: "NIDUS Officer Academy",
    level: "Technical Entry",
    targetStudents: "Engineering students",
    duration: "Technical officer guidance track",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Technical officer entry guidance in the Indian Army.",
    modules: ["Notification Guidance", "Eligibility Mapping", "SSB Training", "Personal Interview Practice", "Officer-Like Qualities Development", "Documentation Support"]
  },
  {
    slug: "territorial-army-coast-guard",
    title: "Territorial Army & Coast Guard",
    vertical: "NIDUS Officer Academy",
    level: "Officer Entry",
    targetStudents: "Graduates and working professionals",
    duration: "Officer entry guidance track",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Territorial Army and Coast Guard officer entry guidance.",
    modules: ["Aptitude Training", "General Knowledge", "Reasoning", "English", "Physical Guidance", "Documentation Support", "Interview Skills", "Personality Development"]
  },
  {
    slug: "afmc",
    title: "AFMC",
    vertical: "NIDUS Defence Medical",
    level: "Defence Medical",
    targetStudents: "PCB and NEET students",
    duration: "Medical defence guidance track",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Defence medical career direction through AFMC.",
    modules: ["NEET-Oriented Support", "AFMC Process Guidance", "Interview Preparation", "Personality Development", "Medical Officer Career Guidance"]
  },
  {
    slug: "mns",
    title: "MNS",
    vertical: "NIDUS Defence Medical",
    level: "Defence Medical",
    targetStudents: "Female PCB students",
    duration: "Defence nursing guidance track",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Military Nursing Service preparation.",
    modules: ["Eligibility Guidance", "Biology & General Science", "English", "Aptitude Training", "Interview Guidance", "Defence Nursing Career Orientation"]
  },
  {
    slug: "agniveer-army",
    title: "Agniveer Army",
    vertical: "NIDUS Agniveer Academy",
    level: "Agniveer Division",
    targetStudents: "Agniveer Army aspirants",
    duration: "Written plus physical preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Agniveer Army recruitment preparation.",
    modules: ["Written Exam Coaching", "Physical Fitness Training", "Running Programs", "Test Series", "Medical Awareness", "Documentation Guidance", "Discipline & Motivation"]
  },
  {
    slug: "agniveer-navy",
    title: "Agniveer Navy",
    vertical: "NIDUS Agniveer Academy",
    level: "Agniveer Division",
    targetStudents: "Agniveer Navy aspirants",
    duration: "Written plus physical preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Agniveer Navy recruitment preparation.",
    modules: ["Written Exam Coaching", "Physical Fitness Training", "Running Programs", "Test Series", "Medical Awareness", "Documentation Guidance", "Discipline & Motivation"]
  },
  {
    slug: "ssr",
    title: "SSR",
    vertical: "NIDUS Agniveer Academy",
    level: "Navy Entry",
    targetStudents: "Navy SSR aspirants",
    duration: "Focused written plus physical preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Senior Secondary Recruit written, physical and documentation preparation.",
    modules: ["Science", "Mathematics", "English", "Physical Fitness Training", "Running Programs", "Mock Tests", "Documentation Guidance"]
  },
  {
    slug: "mr",
    title: "MR",
    vertical: "NIDUS Agniveer Academy",
    level: "Navy Entry",
    targetStudents: "Navy MR aspirants",
    duration: "Focused written plus physical preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Matric Recruit written, physical and documentation preparation.",
    modules: ["General Awareness", "Science", "Mathematics", "Physical Fitness Training", "Running Programs", "Mock Tests", "Documentation Guidance"]
  },
  {
    slug: "agniveer-air-force",
    title: "Agniveer Air Force",
    vertical: "NIDUS Agniveer Academy",
    level: "Agniveer Division",
    targetStudents: "Agniveer Air Force aspirants",
    duration: "Written plus physical preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Agniveer Air Force recruitment preparation.",
    modules: ["Written Exam Coaching", "Physical Fitness Training", "Running Programs", "Test Series", "Medical Awareness", "Documentation Guidance", "Discipline & Motivation"]
  },
  {
    slug: "navik",
    title: "Navik",
    vertical: "NIDUS Agniveer Academy",
    level: "Coast Guard Entry",
    targetStudents: "Indian Coast Guard Navik aspirants",
    duration: "Focused written plus physical preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Coast Guard Navik written, physical and documentation preparation.",
    modules: ["Mathematics", "Science", "Reasoning", "English", "Physical Fitness Training", "Running Programs", "Mock Tests", "Documentation Guidance"]
  },
  {
    slug: "ssb-interview-guidance",
    title: "SSB Interview Guidance",
    vertical: "NIDUS Leadership & SSB Lab",
    level: "Officer Development Division",
    targetStudents: "Candidates preparing for SSB screening, psychology, GTO and interview",
    duration: "Intensive SSB preparation",
    format: "Available as offline classroom program and online learning program.",
    outcome: "Officer-like qualities development and SSB success preparation.",
    modules: ["OIR Tests", "PPDT", "Psychological Assessments", "GTO Tasks", "Group Discussions", "Lecturette", "Command Task", "Personal Interview", "Conference Preparation", "Individual Feedback"]
  }
];

const imageTones = [
  "from-[#071d36] via-[#1f3d5a] to-[#b9913f]",
  "from-[#0d2b45] via-[#3f4a32] to-[#d7bd6d]",
  "from-[#14213d] via-[#52605a] to-[#c9a449]",
  "from-[#102a43] via-[#31572c] to-[#e0c36a]"
];

const facultyBySubject: Record<string, string[]> = {
  Maths: ["anjushae1997@gmail.com", "sumithavinod40378@gmail.com"],
  Mathematics: ["anjushae1997@gmail.com", "sumithavinod40378@gmail.com"],
  English: ["anjaliack2@gmail.com"],
  GK: ["sumasooryakantham@gmail.com"],
  "General Knowledge": ["sumasooryakantham@gmail.com"],
  "Current Affairs": ["sumasooryakantham@gmail.com"],
  Reasoning: ["sumasooryakantham@gmail.com"],
  Intelligence: ["sumasooryakantham@gmail.com"],
  Aptitude: ["sumasooryakantham@gmail.com", "anjushae1997@gmail.com"],
  Biology: ["suryasmathew22@gmail.com"],
  Chemistry: ["nimishamanoharan555@gmail.com"],
  Science: ["suryasmathew22@gmail.com", "nimishamanoharan555@gmail.com"],
  Physical: ["vaniyamkulam68@gmail.com", "vinuchirakkal01@gmail.com"],
  Fitness: ["vaniyamkulam68@gmail.com", "vinuchirakkal01@gmail.com"],
  Running: ["vaniyamkulam68@gmail.com", "vinuchirakkal01@gmail.com"],
  SSB: ["priyankaraveendran87@gmail.com", "ritwikvyshnav@gmail.com"],
  Interview: ["priyankaraveendran87@gmail.com", "ritwikvyshnav@gmail.com"],
  Personality: ["priyankaraveendran87@gmail.com", "ritwikvyshnav@gmail.com"],
  Communication: ["priyankaraveendran87@gmail.com", "ritwikvyshnav@gmail.com"],
  Leadership: ["priyankaraveendran87@gmail.com", "ritwikvyshnav@gmail.com"],
  Documentation: ["admisioncell@nidusacademy.in"],
  Counselling: ["admisioncell@nidusacademy.in"]
};

const academicHeadEmails = ["priyankaraveendran87@gmail.com", "ritwikvyshnav@gmail.com"];

type BatchTemplate = {
  suffix: string;
  type: string;
  deliveryMode: string;
  cadence: string;
  status: string;
};

function batchTemplatesFor(program: AcademyProgramSeed): BatchTemplate[] {
  const templates: BatchTemplate[] = [
    { suffix: "Offline Regular", type: "REGULAR_OFFLINE", deliveryMode: "OFFLINE", cadence: "Classroom schedule", status: "PLANNING" },
    { suffix: "Online Live", type: "ONLINE_LIVE", deliveryMode: "ONLINE", cadence: "Live online schedule", status: "PLANNING" },
    { suffix: "Recorded Support", type: "RECORDED_SUPPORT", deliveryMode: "RECORDED_SUPPORT", cadence: "Recorded lesson library", status: "PLANNING" }
  ];

  if (program.title.toLowerCase().includes("crash") || program.duration.toLowerCase().includes("rapid") || program.duration.toLowerCase().includes("12-day")) {
    templates.push({ suffix: "Crash Intensive", type: "CRASH_COURSE", deliveryMode: "HYBRID", cadence: "Daily intensive timetable", status: "PLANNING" });
  }

  if (program.title.toLowerCase().includes("agniveer") || program.modules.some((moduleTitle) => moduleTitle.toLowerCase().includes("physical") || moduleTitle.toLowerCase().includes("running"))) {
    templates.push({ suffix: "Physical Training", type: "PHYSICAL_TRAINING", deliveryMode: "OFFLINE", cadence: "Ground training schedule", status: "PLANNING" });
  }

  if (program.targetStudents.toLowerCase().includes("working professionals") || program.targetStudents.toLowerCase().includes("college")) {
    templates.push({ suffix: "Weekend Batch", type: "WEEKEND", deliveryMode: "HYBRID", cadence: "Saturday and Sunday schedule", status: "PLANNING" });
  }

  return templates;
}

function pickFacultyEmails(subject: string) {
  const lower = subject.toLowerCase();
  for (const [keyword, emails] of Object.entries(facultyBySubject)) {
    if (lower.includes(keyword.toLowerCase())) return emails;
  }
  return academicHeadEmails;
}

function academicSubject(moduleTitle: string) {
  if (moduleTitle.toLowerCase().includes("general ability")) return "GAT";
  if (moduleTitle.toLowerCase().includes("mathematics")) return "Mathematics";
  if (moduleTitle.toLowerCase().includes("maths")) return "Mathematics";
  if (moduleTitle.toLowerCase().includes("general knowledge")) return "General Knowledge";
  if (moduleTitle.toLowerCase().includes("current affairs")) return "Current Affairs";
  if (moduleTitle.toLowerCase().includes("physical") || moduleTitle.toLowerCase().includes("running") || moduleTitle.toLowerCase().includes("fitness")) return "Physical Training";
  if (moduleTitle.toLowerCase().includes("interview")) return "Interview Guidance";
  if (moduleTitle.toLowerCase().includes("ssb") || moduleTitle.toLowerCase().includes("gto") || moduleTitle.toLowerCase().includes("olq")) return "SSB Guidance";
  return moduleTitle;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function timetableStart(index: number) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + (index % 6));
  date.setHours(9 + (index % 6), index % 2 === 0 ? 0 : 30, 0, 0);
  return date;
}

function buildDescription(program: AcademyProgramSeed) {
  return JSON.stringify({
    summary: program.outcome,
    deliveryMode: "BOTH",
    vertical: program.vertical,
    level: program.level,
    targetStudents: program.targetStudents,
    format: program.format,
    pathways: program.pathways ?? [],
    modules: program.modules,
    source: "NIDUS Academy Master Course Architecture"
  });
}

export async function seedAcademyArchitecture() {
  let courseCount = 0;
  let moduleCount = 0;
  let lessonCount = 0;
  let batchCount = 0;
  const teacherAssignmentRows: Array<{ batchId: string; teacherId: string; subject: string; role: string; status: string }> = [];

  const facultyUsers = await prisma.user.findMany({
    where: {
      email: {
        in: Array.from(new Set([...Object.values(facultyBySubject).flat(), ...academicHeadEmails]))
      }
    },
    select: { id: true, email: true }
  });
  const facultyByEmail = new Map(facultyUsers.map((user) => [user.email, user.id]));

  for (const [index, program] of academyPrograms.entries()) {
    const course = await prisma.course.upsert({
      where: { slug: program.slug },
      update: {
        title: program.title,
        description: buildDescription(program),
        thumbnail: `/images/academy/${program.slug}.jpg`,
        category: program.vertical,
        examType: program.level,
        duration: program.duration,
        price: 0,
        isPremium: false
      },
      create: {
        title: program.title,
        slug: program.slug,
        description: buildDescription(program),
        thumbnail: `/images/academy/${program.slug}.jpg`,
        category: program.vertical,
        examType: program.level,
        duration: program.duration,
        price: 0,
        isPremium: false
      }
    });
    courseCount += 1;

    await prisma.module.deleteMany({ where: { courseId: course.id } });

    const overviewModule = await prisma.module.create({
      data: {
        courseId: course.id,
        title: "Program Overview",
        order: 1
      }
    });
    moduleCount += 1;

    await prisma.lesson.createMany({
      data: [
        {
          moduleId: overviewModule.id,
          title: "Who this program is for",
          description: program.targetStudents,
          videoUrl: "",
          pdfUrl: "",
          duration: "Counselling note",
          isPreview: true,
          order: 1
        },
        {
          moduleId: overviewModule.id,
          title: "Training format",
          description: program.format,
          videoUrl: "",
          pdfUrl: "",
          duration: "Counselling note",
          isPreview: true,
          order: 2
        },
        {
          moduleId: overviewModule.id,
          title: "Outcome",
          description: program.outcome,
          videoUrl: "",
          pdfUrl: "",
          duration: "Counselling note",
          isPreview: true,
          order: 3
        }
      ]
    });
    lessonCount += 3;

    const subjectModule = await prisma.module.create({
      data: {
        courseId: course.id,
        title: "Subjects & Training Modules",
        order: 2
      }
    });
    moduleCount += 1;

    await prisma.lesson.createMany({
      data: program.modules.map((moduleTitle, moduleIndex) => ({
        moduleId: subjectModule.id,
        title: moduleTitle,
        description: `${moduleTitle} for ${program.title}`,
        videoUrl: "",
        pdfUrl: "",
        duration: "To be scheduled",
        isPreview: false,
        order: moduleIndex + 1
      }))
    });
    lessonCount += program.modules.length;

    if (program.pathways?.length) {
      const pathwayModule = await prisma.module.create({
        data: {
          courseId: course.id,
          title: "Available Pathways",
          order: 3
        }
      });
      moduleCount += 1;

      await prisma.lesson.createMany({
        data: program.pathways.map((pathway, pathwayIndex) => ({
          moduleId: pathwayModule.id,
          title: pathway,
          description: `${pathway} under ${program.title}`,
          videoUrl: "",
          pdfUrl: "",
          duration: "Batch option",
          isPreview: false,
          order: pathwayIndex + 1
        }))
      });
      lessonCount += program.pathways.length;
    }

    for (const template of batchTemplatesFor(program)) {
      const batch = await prisma.batch.upsert({
        where: {
          name_programSlug: {
            name: `${program.title} - ${template.suffix}`,
            programSlug: program.slug
          }
        },
        update: {
          batchType: template.type,
          courseId: course.id,
          schedule: {
            vertical: program.vertical,
            level: program.level,
            deliveryMode: template.deliveryMode,
            cadence: template.cadence,
            subjects: program.modules.map(academicSubject),
            pathways: program.pathways ?? [],
            imageTone: imageTones[index % imageTones.length],
            planningStatus: "READY_FOR_DIRECTOR_ALLOCATION",
            flow: ["Director planning", "Academic Head coordination", "Teacher execution", "Student reporting"]
          },
          status: template.status
        },
        create: {
          name: `${program.title} - ${template.suffix}`,
          batchType: template.type,
          programSlug: program.slug,
          courseId: course.id,
          schedule: {
            vertical: program.vertical,
            level: program.level,
            deliveryMode: template.deliveryMode,
            cadence: template.cadence,
            subjects: program.modules.map(academicSubject),
            pathways: program.pathways ?? [],
            imageTone: imageTones[index % imageTones.length],
            planningStatus: "READY_FOR_DIRECTOR_ALLOCATION",
            flow: ["Director planning", "Academic Head coordination", "Teacher execution", "Student reporting"]
          },
          status: template.status
        }
      });
      batchCount += 1;

      for (const headEmail of academicHeadEmails) {
        const teacherId = facultyByEmail.get(headEmail);
        if (!teacherId) continue;
        teacherAssignmentRows.push({ batchId: batch.id, teacherId, subject: "Academic Coordination", role: "ACADEMIC_HEAD", status: "ACTIVE" });
      }

      const subjects = Array.from(new Set(program.modules.map(academicSubject)));
      for (const subject of subjects) {
        for (const email of pickFacultyEmails(subject)) {
          const teacherId = facultyByEmail.get(email);
          if (!teacherId) continue;
          teacherAssignmentRows.push({ batchId: batch.id, teacherId, subject, role: subject === "Physical Training" ? "PHYSICAL_TRAINER" : "FACULTY", status: "ACTIVE" });
        }
      }
    }
  }

  const teacherAssignments = teacherAssignmentRows.length
    ? await prisma.teacherBatchAssignment.createMany({
        data: teacherAssignmentRows,
        skipDuplicates: true
      })
    : { count: 0 };
  const totalActiveTeacherAssignments = await prisma.teacherBatchAssignment.count({ where: { status: "ACTIVE" } });
  const activeAssignments = await prisma.teacherBatchAssignment.findMany({
    where: { status: "ACTIVE", subject: { not: "Academic Coordination" } },
    include: {
      teacher: { select: { name: true, email: true } },
      batch: { include: { course: { select: { title: true, examType: true, category: true } } } }
    },
    orderBy: [{ batchId: "asc" }, { subject: "asc" }, { createdAt: "asc" }]
  });
  const uniqueClassSlots = new Map<string, (typeof activeAssignments)[number]>();
  for (const assignment of activeAssignments) {
    const key = `${assignment.batchId}:${assignment.subject}`;
    if (!uniqueClassSlots.has(key)) uniqueClassSlots.set(key, assignment);
  }

  await prisma.timetable.deleteMany({ where: { classroom: { startsWith: "NIDUS-AUTO" } } });
  const timetableRows = Array.from(uniqueClassSlots.values()).map((assignment, index) => {
    const startTime = timetableStart(index);
    const isRecordedSupport = assignment.batch.batchType === "RECORDED_SUPPORT";
    const isPhysical = assignment.batch.batchType === "PHYSICAL_TRAINING";
    return {
      title: `${assignment.subject} - ${assignment.batch.course?.title ?? assignment.batch.name}`,
      batch: assignment.batch.name,
      subject: assignment.subject,
      instructor: assignment.teacher.name,
      startTime,
      endTime: addMinutes(startTime, isPhysical ? 75 : isRecordedSupport ? 45 : 60),
      classroom: `NIDUS-AUTO-${assignment.batch.batchType}`
    };
  });

  const timetable = timetableRows.length ? await prisma.timetable.createMany({ data: timetableRows }) : { count: 0 };
  const firstAssignmentByBatch = new Map<string, (typeof activeAssignments)[number]>();
  for (const assignment of activeAssignments) {
    if (assignment.subject === "Academic Coordination") continue;
    if (!firstAssignmentByBatch.has(assignment.batchId)) firstAssignmentByBatch.set(assignment.batchId, assignment);
  }

  const previousAutoTests = await prisma.test.findMany({ where: { title: { startsWith: "NIDUS-AUTO" } }, select: { id: true } });
  if (previousAutoTests.length) {
    await prisma.question.deleteMany({ where: { testId: { in: previousAutoTests.map((test) => test.id) } } });
    await prisma.test.deleteMany({ where: { id: { in: previousAutoTests.map((test) => test.id) } } });
  }
  let autoTests = 0;
  let autoQuestions = 0;
  for (const [index, assignment] of Array.from(firstAssignmentByBatch.values()).entries()) {
    const test = await prisma.test.create({
      data: {
        title: `NIDUS-AUTO ${assignment.batch.name} Quick Practice`,
        description: "Auto-created quick practice draft from Academy architecture. Faculty can review, edit, approve and publish.",
        examType: assignment.batch.course?.examType ?? assignment.batch.programSlug,
        category: assignment.batch.course?.category ?? "Academy",
        subject: assignment.subject,
        topic: "Foundation practice",
        batchId: assignment.batchId,
        teacherId: assignment.teacherId,
        publishAt: addMinutes(new Date(), 24 * 60 + index * 10),
        status: "DRAFT_REVIEW",
        duration: 20,
        totalMarks: 10,
        isMockTest: false,
        isLive: false
      }
    });
    autoTests += 1;

    await prisma.question.createMany({
      data: Array.from({ length: 10 }, (_unused, questionIndex) => ({
        testId: test.id,
        questionText: `${assignment.subject} practice question ${questionIndex + 1} for ${assignment.batch.course?.title ?? assignment.batch.name}`,
        optionA: "A",
        optionB: "B",
        optionC: "C",
        optionD: "D",
        correctAnswer: ["A", "B", "C", "D"][questionIndex % 4],
        explanation: "Faculty should review and replace this draft with final approved question content before publishing.",
        marks: 1,
        negativeMarks: 0,
        difficultyLevel: questionIndex < 4 ? "EASY" : questionIndex < 8 ? "MEDIUM" : "HARD",
        topic: "Foundation practice"
      }))
    });
    autoQuestions += 10;
  }

  return { courseCount, moduleCount, lessonCount, batchTemplates: batchCount, teacherAssignments: teacherAssignments.count, totalActiveTeacherAssignments, timetableSlots: timetable.count, autoTests, autoQuestions };
}

async function main() {
  const result = await seedAcademyArchitecture();
  console.log("NIDUS Academy architecture seeded", result);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  main()
    .catch((error) => {
      console.error("Failed to seed NIDUS Academy architecture", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

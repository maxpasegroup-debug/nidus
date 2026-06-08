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
    slug: "aissee-sainik-school-entrance",
    title: "AISSEE - Sainik School Entrance",
    vertical: "NIDUS Defence Schools",
    level: "School Foundation Programs",
    targetStudents: "Class 5 and Class 8 students",
    duration: "Class 6 and Class 9 entry tracks",
    format: "Offline classes, online support, weekly tests, interview orientation, and parent progress tracking",
    outcome: "Admission preparation for Sainik Schools.",
    pathways: ["AISSEE Class 6", "AISSEE Class 9"],
    modules: [
      "Mathematics",
      "English",
      "Intelligence & Reasoning",
      "General Knowledge",
      "Previous Year Questions",
      "Weekly Tests",
      "Interview Orientation",
      "Parent Progress Tracking"
    ]
  },
  {
    slug: "rimc-preparation",
    title: "RIMC Preparation",
    vertical: "NIDUS Defence Schools",
    level: "School Foundation Programs",
    targetStudents: "Class 7 students",
    duration: "Focused entrance preparation",
    format: "Offline and online classes with test practice, reading habits, personality development, and interview preparation",
    outcome: "Preparation for Rashtriya Indian Military College.",
    modules: ["English", "Mathematics", "General Knowledge", "Interview Preparation", "Personality Development", "Reading Habits", "Test Practice"]
  },
  {
    slug: "foundation-nda-civil-services",
    title: "Foundation NDA & Civil Services",
    vertical: "NIDUS Foundation",
    level: "School Foundation Programs",
    targetStudents: "Classes 8, 9, and 10 students",
    duration: "Long-term foundation",
    format: "Academic foundation, current affairs, communication, discipline training, physical awareness, and periodic assessments",
    outcome: "Long-term foundation for NDA, Civil Services, and leadership careers.",
    modules: [
      "Foundation Mathematics",
      "English",
      "General Knowledge",
      "Current Affairs",
      "Communication Skills",
      "Personality Development",
      "Discipline Training",
      "Physical Awareness",
      "Periodic Assessments"
    ]
  },
  {
    slug: "mission-nda-2-year-program",
    title: "Mission NDA - 2 Year Program",
    vertical: "NIDUS Officer Academy",
    level: "Plus One & Plus Two Career Tracks",
    targetStudents: "After 10th pass students",
    duration: "2 years",
    format: "Classroom training, physical fitness support, regular mock tests, SSB orientation, analytics, and mentor review",
    outcome: "Officer entry preparation through NDA.",
    modules: ["NDA Mathematics", "General Ability Test", "English", "Current Affairs", "Regular Mock Tests", "SSB Orientation", "Physical Fitness Support", "Performance Analytics"]
  },
  {
    slug: "nda-crash-course",
    title: "NDA Crash Course",
    vertical: "NIDUS Officer Academy",
    level: "Plus One & Plus Two Career Tracks",
    targetStudents: "Plus Two students",
    duration: "Fast-track crash preparation",
    format: "High-intensity classes, mock tests, doubt clearing, revision plans, and exam strategy",
    outcome: "Fast-track NDA exam preparation.",
    modules: ["NDA Mathematics", "General Ability Test", "English", "Current Affairs", "Mock Tests", "Doubt Clearing Sessions", "Revision Plans"]
  },
  {
    slug: "tes-technical-entry-scheme",
    title: "TES - Technical Entry Scheme",
    vertical: "NIDUS Officer Academy",
    level: "Plus One & Plus Two Career Tracks",
    targetStudents: "Plus Two PCM students",
    duration: "Application and SSB guidance track",
    format: "Eligibility guidance, documentation support, SSB preparation, interview skills, and officer personality development",
    outcome: "Indian Army technical officer entry guidance.",
    modules: ["TES Guidance", "Application Support", "SSB Preparation", "Interview Skills", "Documentation Support", "Officer Personality Development"]
  },
  {
    slug: "afmc-preparation",
    title: "AFMC Preparation",
    vertical: "NIDUS Defence Medical",
    level: "Plus One & Plus Two Career Tracks",
    targetStudents: "PCB and NEET students",
    duration: "Medical defence guidance track",
    format: "NEET-oriented support, AFMC process guidance, interview preparation, and medical officer career guidance",
    outcome: "Defence medical career direction through AFMC.",
    modules: ["NEET-Oriented Support", "AFMC Process Guidance", "Interview Preparation", "Personality Development", "Medical Officer Career Guidance"]
  },
  {
    slug: "mns-military-nursing-service",
    title: "MNS - Military Nursing Service",
    vertical: "NIDUS Defence Medical",
    level: "Plus One & Plus Two Career Tracks",
    targetStudents: "Female PCB students",
    duration: "Defence nursing guidance track",
    format: "Eligibility guidance, biology support, aptitude, English, interview guidance, and defence nursing orientation",
    outcome: "Military Nursing Officer career guidance.",
    modules: ["Eligibility Guidance", "Biology & General Science", "English", "Aptitude Training", "Interview Guidance", "Defence Nursing Career Orientation"]
  },
  {
    slug: "cdse-long-term-coaching",
    title: "CDSE Long-Term Coaching",
    vertical: "NIDUS Officer Academy",
    level: "College & Graduate Officer Programs",
    targetStudents: "College students",
    duration: "1 year, 2 year, and 3 year tracks",
    format: "English, GK, mathematics, mock tests, exam strategy, SSB orientation, and personality development",
    outcome: "Officer entry preparation through CDS examination.",
    pathways: ["1 Year", "2 Years", "3 Years"],
    modules: ["English", "General Knowledge", "Current Affairs", "Mathematics", "Mock Tests", "Exam Strategy", "SSB Orientation", "Personality Development"]
  },
  {
    slug: "cdse-afcat-crash-course",
    title: "CDSE / AFCAT Crash Course",
    vertical: "NIDUS Officer Academy",
    level: "College & Graduate Officer Programs",
    targetStudents: "Graduates",
    duration: "Rapid exam preparation",
    format: "English, GK, mathematics, reasoning, military aptitude, mock tests, and SSB guidance",
    outcome: "Rapid preparation for CDS and AFCAT.",
    modules: ["English", "General Knowledge", "Mathematics", "Reasoning", "Current Affairs", "Military Aptitude", "Mock Tests", "SSB Guidance"]
  },
  {
    slug: "afcat-program",
    title: "AFCAT Program",
    vertical: "NIDUS Officer Academy",
    level: "College & Graduate Officer Programs",
    targetStudents: "Graduates and final year students",
    duration: "Air Force officer preparation track",
    format: "AFCAT subject training, military aptitude, mock tests, current affairs, and AFSB/SSB guidance",
    outcome: "Indian Air Force officer entry preparation.",
    modules: ["English", "Numerical Ability", "Reasoning", "Military Aptitude", "Current Affairs", "Mock Tests", "AFSB / SSB Guidance"]
  },
  {
    slug: "tgc-ssc-technical",
    title: "TGC / SSC Technical",
    vertical: "NIDUS Officer Academy",
    level: "College & Graduate Officer Programs",
    targetStudents: "Engineering students",
    duration: "Technical officer guidance track",
    format: "Notification guidance, eligibility mapping, documentation, SSB training, and interview practice",
    outcome: "Technical officer entry guidance in the Indian Army.",
    modules: ["Notification Guidance", "Eligibility Mapping", "SSB Training", "Personal Interview Practice", "Officer-Like Qualities Development", "Documentation Support"]
  },
  {
    slug: "territorial-army-coast-guard-ac",
    title: "Territorial Army & Coast Guard Assistant Commandant",
    vertical: "NIDUS Officer Academy",
    level: "College & Graduate Officer Programs",
    targetStudents: "Graduates and working professionals",
    duration: "Officer entry guidance track",
    format: "Aptitude, GK, reasoning, English, physical guidance, documentation, interview skills, and personality development",
    outcome: "Territorial Army and Coast Guard officer entry guidance.",
    modules: ["Aptitude Training", "General Knowledge", "Reasoning", "English", "Physical Guidance", "Documentation Support", "Interview Skills", "Personality Development"]
  },
  {
    slug: "agniveer-army",
    title: "Agniveer Army",
    vertical: "NIDUS Agniveer Academy",
    level: "Agniveer Division",
    targetStudents: "Agniveer Army aspirants",
    duration: "Test series, physical training, and 6-month comprehensive tracks",
    format: "Written coaching, physical fitness training, running programs, test series, documentation, and motivation",
    outcome: "Agniveer Army recruitment preparation.",
    pathways: ["Test Series", "Physical Training Program", "6-Month Comprehensive Program"],
    modules: ["Written Exam Coaching", "Physical Fitness Training", "Running Programs", "Test Series", "Medical Awareness", "Documentation Guidance", "Discipline & Motivation"]
  },
  {
    slug: "agniveer-navy",
    title: "Agniveer Navy",
    vertical: "NIDUS Agniveer Academy",
    level: "Agniveer Division",
    targetStudents: "Agniveer Navy aspirants",
    duration: "Test series, physical training, and 6-month comprehensive tracks",
    format: "Written coaching, physical fitness training, running programs, test series, documentation, and motivation",
    outcome: "Agniveer Navy recruitment preparation.",
    pathways: ["Test Series", "Physical Training Program", "6-Month Comprehensive Program"],
    modules: ["Written Exam Coaching", "Physical Fitness Training", "Running Programs", "Test Series", "Medical Awareness", "Documentation Guidance", "Discipline & Motivation"]
  },
  {
    slug: "agniveer-air-force",
    title: "Agniveer Air Force",
    vertical: "NIDUS Agniveer Academy",
    level: "Agniveer Division",
    targetStudents: "Agniveer Air Force aspirants",
    duration: "Test series, physical training, and 6-month comprehensive tracks",
    format: "Written coaching, physical fitness training, running programs, test series, documentation, and motivation",
    outcome: "Agniveer Air Force recruitment preparation.",
    pathways: ["Test Series", "Physical Training Program", "6-Month Comprehensive Program"],
    modules: ["Written Exam Coaching", "Physical Fitness Training", "Running Programs", "Test Series", "Medical Awareness", "Documentation Guidance", "Discipline & Motivation"]
  },
  {
    slug: "ssb-interview-guidance",
    title: "SSB Interview Guidance Program",
    vertical: "NIDUS Leadership & SSB Lab",
    level: "Officer Development Division",
    targetStudents: "Candidates preparing for SSB screening, psychology, GTO, and interview",
    duration: "12-day intensive program",
    format: "OIR, PPDT, psychology, GTO, group tasks, lecturette, interview practice, conference preparation, and individual feedback",
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

function buildDescription(program: AcademyProgramSeed) {
  return JSON.stringify({
    summary: program.outcome,
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

    await prisma.batch.upsert({
      where: {
        name_programSlug: {
          name: `${program.title} - Planning Batch`,
          programSlug: program.slug
        }
      },
      update: {
        batchType: "PLANNING",
        courseId: course.id,
        schedule: {
          vertical: program.vertical,
          level: program.level,
          deliveryModes: ["OFFLINE", "ONLINE", "RECORDED_SUPPORT"],
          imageTone: imageTones[index % imageTones.length],
          status: "READY_FOR_ALLOCATION"
        },
        status: "PLANNING"
      },
      create: {
        name: `${program.title} - Planning Batch`,
        batchType: "PLANNING",
        programSlug: program.slug,
        courseId: course.id,
        schedule: {
          vertical: program.vertical,
          level: program.level,
          deliveryModes: ["OFFLINE", "ONLINE", "RECORDED_SUPPORT"],
          imageTone: imageTones[index % imageTones.length],
          status: "READY_FOR_ALLOCATION"
        },
        status: "PLANNING"
      }
    });
  }

  return { courseCount, moduleCount, lessonCount, batchTemplates: academyPrograms.length };
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

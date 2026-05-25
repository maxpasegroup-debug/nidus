export type AcademyProgram = {
  slug: string;
  title: string;
  category: string;
  targetStudents: string;
  duration: string;
  format: string;
  summary: string;
  benefits: string[];
  careerOpportunities: string[];
  imageTone: string;
};

type AcademyProgramEntry = Omit<AcademyProgram, "category">;

export const academyCategories = [
  {
    title: "Foundation & Long Term Programs",
    description: "Early discipline, academic strength, defence awareness, and long-term officer preparation.",
    programs: [
      {
        slug: "mission-2028-after-10th",
        title: "Mission 2028 (After 10th)",
        targetStudents: "Class 10 completed students targeting NDA and long-term defence careers",
        duration: "Long-term integrated track",
        format: "Classroom, physical routine, mentoring, tests, and AI-supported study planning",
        summary: "A disciplined long-range pathway that starts early and builds academics, stamina, confidence, and officer mindset.",
        benefits: ["Early NDA direction", "School-to-defence roadmap", "Discipline and study rhythm", "Parent-visible progress"],
        careerOpportunities: ["NDA", "Defence foundation", "Leadership-oriented higher studies"],
        imageTone: "from-[#071d36] via-[#3f4a32] to-[#b9913f]"
      },
      {
        slug: "after-plus-one-program",
        title: "After Plus One Program",
        targetStudents: "Plus One students preparing for NDA, SSB confidence, and academic improvement",
        duration: "One-year structured pathway",
        format: "Academic coaching, weekend discipline missions, tests, and mentoring",
        summary: "A focused bridge from school academics to defence readiness before Plus Two pressure begins.",
        benefits: ["NDA foundation", "Maths and GAT direction", "Confidence building", "Time discipline"],
        careerOpportunities: ["NDA", "AISSEE mentoring support", "Defence entrance readiness"],
        imageTone: "from-[#172033] via-[#52605a] to-[#d7c078]"
      },
      {
        slug: "foundation-nda-civil-services",
        title: "Foundation NDA / Civil Services",
        targetStudents: "Students who want a strong academic foundation with defence and civil service awareness",
        duration: "Foundation track",
        format: "Classroom learning, current affairs, aptitude, writing, mentoring, and tests",
        summary: "A serious academic foundation for students who need clarity, confidence, and structured preparation.",
        benefits: ["Concept foundation", "Current affairs habit", "Communication improvement", "Career clarity"],
        careerOpportunities: ["NDA", "Civil Services foundation", "Uniformed services awareness"],
        imageTone: "from-[#1d2430] via-[#566779] to-[#dcc47a]"
      },
      {
        slug: "yearly-foundation-plan",
        title: "Yearly Foundation Plan",
        targetStudents: "Students seeking one full year of disciplined academic and personality development",
        duration: "12 months",
        format: "Year plan with academic classes, tests, PT habits, progress reports, and counselling",
        summary: "A full-year development plan for students who need consistency, guidance, and measurable improvement.",
        benefits: ["Year-long structure", "Performance tracking", "Routine building", "Mentor feedback"],
        careerOpportunities: ["Defence entrance readiness", "School improvement", "Leadership growth"],
        imageTone: "from-[#1f2d26] via-[#607452] to-[#eadfba]"
      }
    ]
  },
  {
    title: "Defence Entrance & Academic Preparation",
    description: "Exam-focused training for school-level and national defence entrance pathways.",
    programs: [
      {
        slug: "aissee-class-6",
        title: "AISSEE Class 6",
        targetStudents: "Class 5 students targeting Sainik School Class 6 entry",
        duration: "Exam-oriented batch",
        format: "Concept classes, practice tests, interview readiness, parent tracking",
        summary: "A structured Sainik School preparation path for younger aspirants and parents.",
        benefits: ["Child-friendly discipline", "Maths and language basics", "Practice tests", "Parent clarity"],
        careerOpportunities: ["Sainik School", "RMS awareness", "Long-term defence foundation"],
        imageTone: "from-[#25334f] via-[#566fa3] to-[#d9c27b]"
      },
      {
        slug: "aissee-class-9",
        title: "AISSEE Class 9",
        targetStudents: "Class 8 students targeting Sainik School Class 9 entry",
        duration: "Exam-oriented batch",
        format: "Subject training, test series, interview support, and progress review",
        summary: "A sharper Sainik School track for students who need academic command and exam discipline.",
        benefits: ["Subject depth", "Timed practice", "Confidence support", "Progress visibility"],
        careerOpportunities: ["Sainik School", "Defence schooling", "NDA foundation"],
        imageTone: "from-[#19273c] via-[#365f7c] to-[#d6b85c]"
      },
      {
        slug: "rimc",
        title: "RIMC",
        targetStudents: "Students targeting Rashtriya Indian Military College entrance",
        duration: "Focused preparation track",
        format: "Written exam support, interview orientation, discipline habits, and mentoring",
        summary: "A premium preparation track for one of India&apos;s most respected defence school pathways.",
        benefits: ["RIMC exam focus", "Interview confidence", "Academic discipline", "Parent guidance"],
        careerOpportunities: ["RIMC", "NDA pathway", "Military leadership education"],
        imageTone: "from-[#071d36] via-[#3f4a32] to-[#b9913f]"
      },
      {
        slug: "nda-crash-course",
        title: "NDA Crash Course",
        targetStudents: "NDA aspirants needing high-intensity revision and exam execution",
        duration: "Crash course",
        format: "Timed classes, mock tests, PYQ analysis, speed drills, and AI study support",
        summary: "A high-pressure NDA revision track for students who need clarity, speed, and exam confidence.",
        benefits: ["Fast revision", "Mock intelligence", "Speed and accuracy", "Exam strategy"],
        careerOpportunities: ["NDA Army", "NDA Navy", "NDA Air Force", "Naval Academy"],
        imageTone: "from-[#071d36] via-[#6e8faf] to-[#b9913f]"
      },
      {
        slug: "cds-afcat-inet",
        title: "CDS / AFCAT / INET",
        targetStudents: "Graduates and college students targeting officer-level defence exams",
        duration: "Exam preparation track",
        format: "Aptitude, English, GK, mock tests, interview orientation, and mentor support",
        summary: "A graduate-level defence pathway for serious aspirants targeting multiple officer entries.",
        benefits: ["Multi-exam strategy", "Aptitude clarity", "English and GK support", "Interview direction"],
        careerOpportunities: ["CDS", "AFCAT", "INET", "SSB"],
        imageTone: "from-[#0f172a] via-[#2f4a78] to-[#c3a24b]"
      }
    ]
  },
  {
    title: "Specialized Modules",
    description: "Targeted modules for Agniveer, AFMC, physical readiness, and SSB officer guidance.",
    programs: [
      {
        slug: "agniveer-test-series",
        title: "Agniveer Test Series",
        targetStudents: "Agniveer aspirants needing repeated exam practice and performance tracking",
        duration: "Test series",
        format: "CBT-style tests, analytics, review, and speed improvement",
        summary: "A focused test system for students who need repeated practice and measurable exam readiness.",
        benefits: ["Exam practice", "Speed tracking", "Weak-area review", "Rank confidence"],
        careerOpportunities: ["Agniveer written exam", "Defence entry preparation"],
        imageTone: "from-[#13231c] via-[#52715a] to-[#d9c27b]"
      },
      {
        slug: "agniveer-physical-training",
        title: "Agniveer Physical Training",
        targetStudents: "Agniveer aspirants who need physical routine, stamina, and selection discipline",
        duration: "Physical training module",
        format: "Ground training, attendance, logs, stamina tracking, and mentor supervision",
        summary: "A practical physical-readiness module for discipline, stamina, and selection confidence.",
        benefits: ["Running routine", "Strength discipline", "Attendance tracking", "Energy and confidence"],
        careerOpportunities: ["Agniveer physical test", "Uniformed services fitness"],
        imageTone: "from-[#071d36] via-[#3f4a32] to-[#b9913f]"
      },
      {
        slug: "agniveer-full-program",
        title: "Agniveer Full Program",
        targetStudents: "Agniveer aspirants needing written exam and physical preparation together",
        duration: "Integrated program",
        format: "Classroom, test series, physical training, progress review, and counselling",
        summary: "An integrated Agniveer pathway combining study, discipline, test readiness, and physical training.",
        benefits: ["Written + physical integration", "Progress tracking", "Selection discipline", "Mentor review"],
        careerOpportunities: ["Agniveer Army", "Agniveer Navy", "Agniveer Air Force"],
        imageTone: "from-[#171717] via-[#3f4d3f] to-[#c8aa52]"
      },
      {
        slug: "afmc-preparation",
        title: "AFMC Preparation",
        targetStudents: "Medical defence aspirants seeking AFMC direction and interview confidence",
        duration: "Focused module",
        format: "Academic orientation, interview readiness, defence awareness, and mentoring",
        summary: "A specialized support module for students exploring the medical defence pathway.",
        benefits: ["AFMC orientation", "Interview confidence", "Career clarity", "Mentor support"],
        careerOpportunities: ["AFMC", "Defence medical services awareness"],
        imageTone: "from-[#14213d] via-[#3d5a80] to-[#e0c36a]"
      },
      {
        slug: "ssb-interview-guidance",
        title: "SSB Interview Guidance",
        targetStudents: "Candidates preparing for SSB screening, psychology, GTO, and interview",
        duration: "SSB guidance module",
        format: "Psychology practice, interview guidance, communication drills, OLQ review, and mentor feedback",
        summary: "A personality and officer-readiness module for students who need structured SSB confidence.",
        benefits: ["OLQ clarity", "Interview confidence", "Story-thinking practice", "Group behaviour improvement"],
        careerOpportunities: ["SSB", "NDA", "CDS", "AFCAT", "INET"],
        imageTone: "from-[#0b1424] via-[#34415f] to-[#b99c4b]"
      }
    ]
  }
] satisfies Array<{ title: string; description: string; programs: AcademyProgramEntry[] }>;

export const academyPrograms = academyCategories.flatMap((category) => category.programs.map((program) => ({ ...program, category: category.title })));

const academyProgramAliases: Record<string, string> = {
  nda: "nda-crash-course",
  cds: "cds-afcat-inet",
  afcat: "cds-afcat-inet",
  inet: "cds-afcat-inet",
  ssb: "ssb-interview-guidance",
  aissee: "aissee-class-6",
  agniveer: "agniveer-full-program",
  foundation: "mission-2028-after-10th",
  "foundation-programs": "mission-2028-after-10th",
  "physical-training": "agniveer-physical-training",
  "interview-guidance": "ssb-interview-guidance"
};

export function getAcademyProgram(slug: string) {
  const normalizedSlug = academyProgramAliases[slug] ?? slug;
  return academyPrograms.find((program) => program.slug === normalizedSlug);
}

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

const commonLeadershipBenefits = ["Clear career direction", "Regular practice", "Mentor guidance", "Progress tracking"];

export const academyCategories = [
  {
    title: "Level 1: School Foundation Programs",
    description: "Early defence-school preparation, academic confidence, discipline, and parent-visible progress.",
    programs: [
      {
        slug: "aissee-sainik-school-entrance",
        title: "AISSEE - Sainik School Entrance",
        targetStudents: "Class 5 and Class 8 students",
        duration: "Class 6 and Class 9 entry tracks",
        format: "Offline classes, online support, weekly tests, interview orientation, and parent progress tracking",
        summary: "A simple, structured pathway for Sainik School entrance preparation.",
        benefits: ["Maths, English, reasoning, and GK support", "Previous year question practice", "Weekly tests", "Interview orientation"],
        careerOpportunities: ["AISSEE Class 6", "AISSEE Class 9", "Sainik School pathway", "Long-term defence foundation"],
        imageTone: "from-[#071d36] via-[#1f3d5a] to-[#b9913f]"
      },
      {
        slug: "rimc-preparation",
        title: "RIMC Preparation",
        targetStudents: "Class 7 students",
        duration: "Focused entrance preparation",
        format: "English, mathematics, GK, test practice, reading habit building, and interview preparation",
        summary: "Focused preparation for Rashtriya Indian Military College entrance.",
        benefits: ["Written exam support", "Interview preparation", "Reading habit building", "Personality development"],
        careerOpportunities: ["RIMC", "NDA pathway", "Military leadership education", "Defence school foundation"],
        imageTone: "from-[#0d2b45] via-[#3f4a32] to-[#d7bd6d]"
      },
      {
        slug: "foundation-nda-civil-services",
        title: "Foundation NDA & Civil Services",
        targetStudents: "Classes 8, 9, and 10 students",
        duration: "Long-term foundation",
        format: "Foundation academics, current affairs, communication skills, discipline training, and periodic assessments",
        summary: "A long-term foundation for students who need discipline, clarity, academics, and leadership habits.",
        benefits: ["Foundation mathematics", "Current affairs habit", "Communication skills", "Discipline and physical awareness"],
        careerOpportunities: ["NDA foundation", "Civil Services foundation", "Uniformed services awareness", "Leadership careers"],
        imageTone: "from-[#14213d] via-[#52605a] to-[#c9a449]"
      }
    ]
  },
  {
    title: "Level 2: Plus One & Plus Two Career Tracks",
    description: "Focused officer, technical, and defence medical guidance for senior school students.",
    programs: [
      {
        slug: "mission-nda-2-year-program",
        title: "Mission NDA - 2 Year Program",
        targetStudents: "After 10th pass students",
        duration: "2 years",
        format: "Classroom training, physical fitness support, mock tests, SSB orientation, analytics, and mentor review",
        summary: "A full NDA journey that connects academics, discipline, physical routine, and officer mindset.",
        benefits: ["NDA Mathematics and GAT", "Regular mock tests", "SSB orientation", "Physical fitness support"],
        careerOpportunities: ["NDA Army", "NDA Navy", "NDA Air Force", "Naval Academy"],
        imageTone: "from-[#102a43] via-[#31572c] to-[#e0c36a]"
      },
      {
        slug: "nda-crash-course",
        title: "NDA Crash Course",
        targetStudents: "Plus Two students",
        duration: "Fast-track crash preparation",
        format: "High-intensity revision, mock tests, doubt clearing sessions, and exam strategy",
        summary: "A sharp NDA preparation track for students who need quick revision and exam confidence.",
        benefits: ["Fast revision", "Mock test practice", "Doubt clearing", "Speed and accuracy improvement"],
        careerOpportunities: ["NDA", "Naval Academy", "SSB preparation", "Defence entrance readiness"],
        imageTone: "from-[#071d36] via-[#6e8faf] to-[#b9913f]"
      },
      {
        slug: "tes-technical-entry-scheme",
        title: "TES - Technical Entry Scheme",
        targetStudents: "Plus Two PCM students",
        duration: "Application and SSB guidance track",
        format: "TES guidance, application support, documentation, SSB preparation, and interview skills",
        summary: "Guidance for PCM students aiming for the Indian Army technical officer pathway.",
        benefits: ["Eligibility clarity", "Application support", "Documentation support", "Officer personality development"],
        careerOpportunities: ["TES", "Indian Army technical officer entry", "SSB", "Engineering defence career"],
        imageTone: "from-[#0b1424] via-[#34415f] to-[#b99c4b]"
      },
      {
        slug: "afmc-preparation",
        title: "AFMC Preparation",
        targetStudents: "PCB and NEET students",
        duration: "Medical defence guidance track",
        format: "NEET-oriented support, AFMC process guidance, interview preparation, and career counselling",
        summary: "A defence medical career pathway for students exploring AFMC and medical officer roles.",
        benefits: ["AFMC process guidance", "Interview preparation", "NEET-oriented support", "Medical officer career clarity"],
        careerOpportunities: ["AFMC", "Defence medical services", "Medical officer pathway", "Interview readiness"],
        imageTone: "from-[#14213d] via-[#3d5a80] to-[#e0c36a]"
      },
      {
        slug: "mns-military-nursing-service",
        title: "MNS - Military Nursing Service",
        targetStudents: "Female PCB students",
        duration: "Defence nursing guidance track",
        format: "Eligibility guidance, biology and general science, English, aptitude, and interview preparation",
        summary: "A clear pathway for students interested in Military Nursing Service.",
        benefits: ["Eligibility guidance", "Biology and science support", "Aptitude training", "Defence nursing orientation"],
        careerOpportunities: ["Military Nursing Service", "Defence nursing officer pathway", "Interview readiness", "Medical defence career"],
        imageTone: "from-[#1d2430] via-[#566779] to-[#dcc47a]"
      }
    ]
  },
  {
    title: "Level 3: College & Graduate Officer Programs",
    description: "Officer-entry preparation for college students, graduates, engineers, and working professionals.",
    programs: [
      {
        slug: "cdse-long-term-coaching",
        title: "CDSE Long-Term Coaching",
        targetStudents: "College students",
        duration: "1 year, 2 year, and 3 year tracks",
        format: "English, GK, current affairs, mathematics, mock tests, SSB orientation, and personality development",
        summary: "A long-term CDS pathway for students who want steady officer-entry preparation.",
        benefits: ["English and GK", "Mathematics", "Mock tests", "SSB orientation"],
        careerOpportunities: ["CDS", "IMA", "OTA", "Indian Navy and Air Force officer pathways"],
        imageTone: "from-[#0f172a] via-[#2f4a78] to-[#c3a24b]"
      },
      {
        slug: "cdse-afcat-crash-course",
        title: "CDSE / AFCAT Crash Course",
        targetStudents: "Graduates",
        duration: "Rapid exam preparation",
        format: "English, GK, mathematics, reasoning, current affairs, military aptitude, mock tests, and SSB guidance",
        summary: "A rapid preparation track for graduate defence aspirants.",
        benefits: ["Multi-exam strategy", "Reasoning and aptitude", "Mock tests", "SSB guidance"],
        careerOpportunities: ["CDS", "AFCAT", "SSB", "AFSB"],
        imageTone: "from-[#171717] via-[#3f4d3f] to-[#c8aa52]"
      },
      {
        slug: "afcat-program",
        title: "AFCAT Program",
        targetStudents: "Graduates and final year students",
        duration: "Air Force officer preparation track",
        format: "English, numerical ability, reasoning, military aptitude, current affairs, mock tests, and AFSB guidance",
        summary: "A focused Indian Air Force officer-entry preparation pathway.",
        benefits: ["AFCAT subject support", "Military aptitude", "Mock tests", "AFSB / SSB guidance"],
        careerOpportunities: ["AFCAT", "Indian Air Force officer entry", "AFSB", "Flying and ground duty branches"],
        imageTone: "from-[#25334f] via-[#566fa3] to-[#d9c27b]"
      },
      {
        slug: "tgc-ssc-technical",
        title: "TGC / SSC Technical",
        targetStudents: "Engineering students",
        duration: "Technical officer guidance track",
        format: "Notification guidance, eligibility mapping, SSB training, personal interview practice, and documentation support",
        summary: "A technical officer-entry guidance path for engineering students.",
        benefits: ["Notification guidance", "Eligibility mapping", "SSB training", "Documentation support"],
        careerOpportunities: ["TGC", "SSC Technical", "Indian Army technical officer entry", "SSB"],
        imageTone: "from-[#19273c] via-[#365f7c] to-[#d6b85c]"
      },
      {
        slug: "territorial-army-coast-guard-ac",
        title: "Territorial Army & Coast Guard Assistant Commandant",
        targetStudents: "Graduates and working professionals",
        duration: "Officer entry guidance track",
        format: "Aptitude, GK, reasoning, English, physical guidance, documentation support, interview skills, and personality development",
        summary: "Guidance for aspirants aiming at Territorial Army and Coast Guard officer pathways.",
        benefits: ["Aptitude and reasoning", "Documentation support", "Physical guidance", "Interview skills"],
        careerOpportunities: ["Territorial Army", "Coast Guard Assistant Commandant", "Officer interview", "Uniformed service leadership"],
        imageTone: "from-[#1f2d26] via-[#607452] to-[#eadfba]"
      }
    ]
  },
  {
    title: "Level 4: Agniveer Division",
    description: "Separate Army, Navy, and Air Force Agniveer pathways with written, physical, and comprehensive tracks.",
    programs: [
      {
        slug: "agniveer-army",
        title: "Agniveer Army",
        targetStudents: "Agniveer Army aspirants",
        duration: "Test series, physical training, and 6-month comprehensive tracks",
        format: "Written exam coaching, physical training, running programs, test series, documentation, and discipline support",
        summary: "A dedicated Agniveer Army preparation pathway.",
        benefits: ["Written exam coaching", "Physical fitness training", "Running programs", "Medical and documentation awareness"],
        careerOpportunities: ["Agniveer Army", "Physical test readiness", "Written exam readiness", "Defence discipline"],
        imageTone: "from-[#13231c] via-[#52715a] to-[#d9c27b]"
      },
      {
        slug: "agniveer-navy",
        title: "Agniveer Navy",
        targetStudents: "Agniveer Navy aspirants",
        duration: "Test series, physical training, and 6-month comprehensive tracks",
        format: "Written exam coaching, physical training, running programs, test series, documentation, and discipline support",
        summary: "A dedicated Agniveer Navy preparation pathway.",
        benefits: ["Written exam coaching", "Physical fitness training", "Test series", "Documentation guidance"],
        careerOpportunities: ["Agniveer Navy", "Physical test readiness", "Written exam readiness", "Naval service pathway"],
        imageTone: "from-[#071d36] via-[#3f4a32] to-[#b9913f]"
      },
      {
        slug: "agniveer-air-force",
        title: "Agniveer Air Force",
        targetStudents: "Agniveer Air Force aspirants",
        duration: "Test series, physical training, and 6-month comprehensive tracks",
        format: "Written exam coaching, physical training, running programs, test series, documentation, and discipline support",
        summary: "A dedicated Agniveer Air Force preparation pathway.",
        benefits: ["Written exam coaching", "Physical fitness training", "Test series", "Motivation and discipline"],
        careerOpportunities: ["Agniveer Air Force", "Physical test readiness", "Written exam readiness", "Air Force pathway"],
        imageTone: "from-[#071d36] via-[#6e8faf] to-[#b9913f]"
      }
    ]
  },
  {
    title: "Level 5: Officer Development Division",
    description: "A common leadership and SSB lab across NIDUS programs.",
    programs: [
      {
        slug: "ssb-interview-guidance",
        title: "SSB Interview Guidance Program",
        targetStudents: "Candidates preparing for SSB screening, psychology, GTO, and interview",
        duration: "12-day intensive program",
        format: "OIR, PPDT, psychology, GTO, group tasks, lecturette, interview practice, conference preparation, and individual feedback",
        summary: "A practical officer-like qualities and SSB confidence development program.",
        benefits: ["OIR and PPDT", "Psychological assessment practice", "GTO task preparation", "Personal interview feedback"],
        careerOpportunities: ["SSB", "NDA", "CDS", "AFCAT", "TES", "TGC", "SSC Technical"],
        imageTone: "from-[#0b1424] via-[#34415f] to-[#b99c4b]"
      }
    ]
  }
] satisfies Array<{ title: string; description: string; programs: AcademyProgramEntry[] }>;

export const academyPrograms = academyCategories.flatMap((category) => category.programs.map((program) => ({ ...program, category: category.title })));

const academyProgramAliases: Record<string, string> = {
  nda: "mission-nda-2-year-program",
  cds: "cdse-long-term-coaching",
  cdse: "cdse-long-term-coaching",
  afcat: "afcat-program",
  ssb: "ssb-interview-guidance",
  aissee: "aissee-sainik-school-entrance",
  rimc: "rimc-preparation",
  agniveer: "agniveer-army",
  foundation: "foundation-nda-civil-services",
  "foundation-programs": "foundation-nda-civil-services",
  "physical-training": "agniveer-army",
  "interview-guidance": "ssb-interview-guidance",
  afmc: "afmc-preparation",
  mns: "mns-military-nursing-service",
  tes: "tes-technical-entry-scheme",
  "tgc-ssc": "tgc-ssc-technical",
  "coast-guard": "territorial-army-coast-guard-ac"
};

export const academyVerticals = [
  "NIDUS Defence Schools",
  "NIDUS Foundation",
  "NIDUS Officer Academy",
  "NIDUS Defence Medical",
  "NIDUS Agniveer Academy",
  "NIDUS Leadership & SSB Lab"
];

export const academyCommonLab = [
  "Personality Development",
  "Communication Skills",
  "Leadership Training",
  "Interview Skills",
  "Officer Like Qualities",
  "Physical Discipline",
  "Career Guidance"
];

export function getAcademyProgram(slug: string) {
  const normalizedSlug = academyProgramAliases[slug] ?? slug;
  return academyPrograms.find((program) => program.slug === normalizedSlug);
}

export function getAcademyBenefits() {
  return commonLeadershipBenefits;
}

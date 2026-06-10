export type AcademyProgram = {
  title: string;
  slug: string;
  audience: string;
  outcome: string;
  modules: string[];
};

export type AcademyProgramGroup = {
  title: string;
  subtitle: string;
  programs: AcademyProgram[];
};

export const academyProgramGroups: AcademyProgramGroup[] = [
  {
    title: "Defence School Entry",
    subtitle: "For younger students preparing for military school pathways.",
    programs: [
      {
        title: "AISSEE Class 6",
        slug: "aissee-class-6",
        audience: "Class 5 students",
        outcome: "Sainik School Class 6 entrance preparation.",
        modules: ["Mathematics", "English", "Intelligence", "General Knowledge", "Weekly Tests"],
      },
      {
        title: "AISSEE Class 9",
        slug: "aissee-class-9",
        audience: "Class 8 students",
        outcome: "Sainik School Class 9 entrance preparation.",
        modules: ["Mathematics", "English", "Intelligence", "General Knowledge", "Interview Orientation"],
      },
      {
        title: "RIMC Preparation",
        slug: "rimc-preparation",
        audience: "Class 7 students",
        outcome: "Preparation for Rashtriya Indian Military College entry.",
        modules: ["English", "Mathematics", "General Knowledge", "Interview Preparation", "Personality Development"],
      },
    ],
  },
  {
    title: "Foundation & Long-Term",
    subtitle: "Early discipline, academics and leadership foundation.",
    programs: [
      {
        title: "Foundation NDA & Civil Services",
        slug: "foundation-nda-civil-services",
        audience: "Classes 8, 9 and 10",
        outcome: "Long-term foundation for NDA, Civil Services and leadership careers.",
        modules: ["Foundation Mathematics", "English", "GK", "Current Affairs", "Communication", "Discipline Training"],
      },
      {
        title: "Mission NDA",
        slug: "mission-nda",
        audience: "After 10th students",
        outcome: "Two-year officer entry preparation through NDA.",
        modules: ["NDA Mathematics", "GAT", "English", "Current Affairs", "Mock Tests", "SSB Orientation"],
      },
      {
        title: "NDA Crash Course",
        slug: "nda-crash-course",
        audience: "Plus Two students",
        outcome: "Fast-track NDA exam preparation.",
        modules: ["NDA Mathematics", "GAT", "English", "Current Affairs", "Revision", "Mock Tests"],
      },
    ],
  },
  {
    title: "Officer Entry Programs",
    subtitle: "For college students, graduates and technical officer aspirants.",
    programs: [
      {
        title: "CDSE Long-Term Coaching",
        slug: "cdse-long-term-coaching",
        audience: "College students",
        outcome: "Officer entry preparation through CDS examination.",
        modules: ["English", "General Knowledge", "Current Affairs", "Mathematics", "SSB Orientation"],
      },
      {
        title: "CDSE / AFCAT Crash Course",
        slug: "cdse-afcat-crash-course",
        audience: "Graduates",
        outcome: "Rapid preparation for CDS and AFCAT.",
        modules: ["English", "GK", "Mathematics", "Reasoning", "Military Aptitude", "Mock Tests"],
      },
      {
        title: "AFCAT Program",
        slug: "afcat-program",
        audience: "Graduates and final-year students",
        outcome: "Indian Air Force officer entry preparation.",
        modules: ["English", "Numerical Ability", "Reasoning", "Military Aptitude", "AFSB Guidance"],
      },
      {
        title: "TES Guidance",
        slug: "tes-guidance",
        audience: "Plus Two PCM students",
        outcome: "Indian Army Technical Entry Scheme guidance.",
        modules: ["Application Support", "SSB Preparation", "Documentation", "Officer Personality Development"],
      },
      {
        title: "TGC / SSC Technical",
        slug: "tgc-ssc-technical",
        audience: "Engineering students",
        outcome: "Technical officer entry guidance for Indian Army.",
        modules: ["Eligibility Mapping", "Notification Guidance", "SSB Training", "Interview Practice"],
      },
      {
        title: "Territorial Army & Coast Guard",
        slug: "territorial-army-coast-guard",
        audience: "Graduates and working professionals",
        outcome: "Officer entry guidance for Territorial Army and Coast Guard AC.",
        modules: ["Aptitude", "GK", "Reasoning", "English", "Physical Guidance", "Interview Skills"],
      },
    ],
  },
  {
    title: "Defence Medical",
    subtitle: "Medical and nursing pathways inside defence careers.",
    programs: [
      {
        title: "AFMC Preparation",
        slug: "afmc-preparation",
        audience: "PCB / NEET students",
        outcome: "Defence medical career guidance through AFMC.",
        modules: ["NEET Support", "AFMC Process Guidance", "Interview Preparation", "Medical Officer Career Guidance"],
      },
      {
        title: "MNS Preparation",
        slug: "mns-preparation",
        audience: "Female PCB students",
        outcome: "Military Nursing Service preparation.",
        modules: ["Eligibility Guidance", "Biology", "General Science", "English", "Aptitude", "Interview Guidance"],
      },
    ],
  },
  {
    title: "Agniveer Division",
    subtitle: "Army, Navy and Air Force recruitment preparation.",
    programs: [
      {
        title: "Agniveer Army",
        slug: "agniveer-army",
        audience: "Agniveer Army aspirants",
        outcome: "Written, physical and documentation support for Army recruitment.",
        modules: ["Written Exam", "Physical Training", "Running", "Medical Awareness", "Test Series"],
      },
      {
        title: "Agniveer Navy",
        slug: "agniveer-navy",
        audience: "Agniveer Navy aspirants",
        outcome: "Written, physical and documentation support for Navy recruitment.",
        modules: ["Science", "Mathematics", "English", "Physical Training", "Test Series"],
      },
      {
        title: "Agniveer Air Force",
        slug: "agniveer-air-force",
        audience: "Agniveer Air Force aspirants",
        outcome: "Written, physical and documentation support for Air Force recruitment.",
        modules: ["Science", "Reasoning", "English", "Physical Training", "Mock Tests"],
      },
    ],
  },
  {
    title: "SSB & Leadership Lab",
    subtitle: "Officer-like qualities, communication and interview readiness.",
    programs: [
      {
        title: "SSB Interview Guidance",
        slug: "ssb-interview-guidance",
        audience: "Officer entry candidates",
        outcome: "Structured SSB preparation with feedback.",
        modules: ["OIR", "PPDT", "Psychology", "GTO", "Lecturette", "Personal Interview", "Conference"],
      },
    ],
  },
];

export const academyDropdownGroups = academyProgramGroups.map((group) => ({
  title: group.title,
  programs: group.programs.map((program) => ({
    title: program.title,
    href: `/programs/${program.slug}`,
  })),
}));

export const allAcademyPrograms = academyProgramGroups.flatMap((group) =>
  group.programs.map((program) => ({ ...program, groupTitle: group.title })),
);

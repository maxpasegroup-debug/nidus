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
    title: "Foundation & NDA",
    subtitle: "Foundation, NDA F1/F2 and NDA crash preparation.",
    programs: [
      {
        title: "Foundation NDA & Civil Services",
        slug: "foundation-nda-civil-services",
        audience: "Classes 8, 9 and 10",
        outcome: "Long-term foundation for NDA, Civil Services and leadership careers.",
        modules: ["Foundation Mathematics", "English", "GK", "Current Affairs", "Communication", "Discipline Training"],
      },
      {
        title: "NDA F1",
        slug: "nda-f1",
        audience: "NDA foundation aspirants",
        outcome: "First-stage NDA foundation preparation.",
        modules: ["NDA Mathematics", "GAT", "English", "Current Affairs", "Mock Tests", "SSB Orientation"],
      },
      {
        title: "NDA F2",
        slug: "nda-f2",
        audience: "NDA foundation aspirants",
        outcome: "Second-stage NDA foundation preparation.",
        modules: ["NDA Mathematics", "GAT", "English", "Current Affairs", "Advanced Practice", "Mock Tests"],
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
        title: "CDS F1",
        slug: "cds-f1",
        audience: "College students",
        outcome: "First-stage CDS officer entry preparation.",
        modules: ["English", "General Knowledge", "Current Affairs", "Mathematics", "SSB Orientation"],
      },
      {
        title: "CDS F2",
        slug: "cds-f2",
        audience: "College students and graduates",
        outcome: "Second-stage CDS officer entry preparation.",
        modules: ["English", "General Knowledge", "Current Affairs", "Mathematics", "Exam Strategy", "SSB Orientation"],
      },
      {
        title: "CDS F3",
        slug: "cds-f3",
        audience: "College students and graduates",
        outcome: "Advanced CDS officer entry preparation.",
        modules: ["English", "General Knowledge", "Current Affairs", "Mathematics", "Advanced Mock Tests", "SSB Orientation"],
      },
      {
        title: "AFCAT",
        slug: "afcat",
        audience: "Graduates and final-year students",
        outcome: "Indian Air Force officer entry preparation.",
        modules: ["English", "Numerical Ability", "Reasoning", "Military Aptitude", "AFSB Guidance"],
      },
      {
        title: "CDSE / AFCAT Crash Course",
        slug: "cdse-afcat-crash-course",
        audience: "Graduates",
        outcome: "Rapid preparation for CDS and AFCAT.",
        modules: ["English", "GK", "Mathematics", "Reasoning", "Military Aptitude", "Mock Tests"],
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
        title: "AFMC",
        slug: "afmc",
        audience: "PCB / NEET students",
        outcome: "Defence medical career guidance through AFMC.",
        modules: ["NEET Support", "AFMC Process Guidance", "Interview Preparation", "Medical Officer Career Guidance"],
      },
      {
        title: "MNS",
        slug: "mns",
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
        title: "SSR",
        slug: "ssr",
        audience: "Navy SSR aspirants",
        outcome: "Senior Secondary Recruit written, physical and documentation preparation.",
        modules: ["Science", "Mathematics", "English", "Physical Training", "Mock Tests"],
      },
      {
        title: "MR",
        slug: "mr",
        audience: "Navy MR aspirants",
        outcome: "Matric Recruit written, physical and documentation preparation.",
        modules: ["General Awareness", "Science", "Mathematics", "Physical Training", "Mock Tests"],
      },
      {
        title: "Agniveer Air Force",
        slug: "agniveer-air-force",
        audience: "Agniveer Air Force aspirants",
        outcome: "Written, physical and documentation support for Air Force recruitment.",
        modules: ["Science", "Reasoning", "English", "Physical Training", "Mock Tests"],
      },
      {
        title: "Navik",
        slug: "navik",
        audience: "Indian Coast Guard Navik aspirants",
        outcome: "Coast Guard Navik written, physical and documentation preparation.",
        modules: ["Mathematics", "Science", "Reasoning", "English", "Physical Training", "Mock Tests"],
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

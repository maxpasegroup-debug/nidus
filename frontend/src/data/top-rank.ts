import { allAcademyPrograms } from "@/data/academy-programs";

export type TopRankProgram = {
  title: string;
  slug: string;
  category: "army" | "navy" | "air-force" | "coast-guard" | "officer-entry";
  summary: string;
  eligibility: string;
  careerPaths: string[];
  physicalRequirements: string;
  selectionProcess: string[];
  academySlug?: string;
};

export type TopRankDivision = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  programs: string[];
};

function academyProgram(slug: string) {
  return allAcademyPrograms.find((program) => program.slug === slug);
}

function fromAcademy(input: Omit<TopRankProgram, "summary"> & { academySlug: string; fallback: string }): TopRankProgram {
  const program = academyProgram(input.academySlug);
  return {
    ...input,
    summary: program?.outcome ?? input.fallback
  };
}

export const topRankPrograms: TopRankProgram[] = [
  fromAcademy({
    title: "NDA",
    slug: "nda",
    academySlug: "nda-crash-course",
    fallback: "NDA Army, Navy and Air Force officer-entry preparation.",
    category: "officer-entry",
    eligibility: "Plus Two students and appearing candidates as per UPSC NDA notification.",
    careerPaths: ["Indian Army officer", "Indian Navy officer", "Indian Air Force officer", "Naval Academy"],
    physicalRequirements: "Medical and physical standards as per NDA/NA notification.",
    selectionProcess: ["Written exam", "SSB interview", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "CDS",
    slug: "cds",
    academySlug: "cds-f1",
    fallback: "Combined Defence Services officer-entry preparation.",
    category: "officer-entry",
    eligibility: "Graduates and final-year students as per UPSC CDS notification.",
    careerPaths: ["IMA", "OTA", "Indian Naval Academy", "Air Force Academy"],
    physicalRequirements: "Service-specific medical and physical standards apply.",
    selectionProcess: ["Written exam", "SSB interview", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "AFCAT",
    slug: "afcat",
    academySlug: "afcat",
    fallback: "Indian Air Force officer-entry preparation.",
    category: "air-force",
    eligibility: "Graduates and final-year students as per AFCAT branch eligibility.",
    careerPaths: ["Flying Branch", "Ground Duty Technical", "Ground Duty Non-Technical"],
    physicalRequirements: "Air Force medical and branch-specific physical standards apply.",
    selectionProcess: ["AFCAT written exam", "AFSB", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "SSB Interview Guidance",
    slug: "ssb",
    academySlug: "ssb-interview-guidance",
    fallback: "Officer-like qualities, interview and personality preparation.",
    category: "officer-entry",
    eligibility: "Candidates shortlisted for SSB through NDA, CDS, AFCAT, TES, TGC, SSC Technical or other officer entries.",
    careerPaths: ["Army officer", "Navy officer", "Air Force officer", "Technical officer"],
    physicalRequirements: "Medical standards depend on the final service entry.",
    selectionProcess: ["Screening", "Psychology", "GTO", "Personal interview", "Conference"]
  }),
  fromAcademy({
    title: "Agniveer Army",
    slug: "agniveer-army",
    academySlug: "agniveer-army",
    fallback: "Army Agniveer written and physical preparation.",
    category: "army",
    eligibility: "Candidates meeting Agniveer Army age, education and category requirements.",
    careerPaths: ["Agniveer General Duty", "Agniveer Technical", "Agniveer Clerk", "Agniveer Tradesman"],
    physicalRequirements: "Running, height, weight, chest and medical standards as per latest recruitment notification.",
    selectionProcess: ["Online written exam", "Physical fitness test", "Medical test", "Document verification"]
  }),
  fromAcademy({
    title: "Agniveer Navy",
    slug: "agniveer-navy",
    academySlug: "agniveer-navy",
    fallback: "Navy Agniveer preparation for written and physical stages.",
    category: "navy",
    eligibility: "Candidates meeting Navy Agniveer SSR/MR education and age requirements.",
    careerPaths: ["Agniveer SSR", "Agniveer MR", "Naval service pathway"],
    physicalRequirements: "Navy PFT and medical standards as per notification.",
    selectionProcess: ["Computer-based exam", "PFT", "Medical examination", "Final merit"]
  }),
  fromAcademy({
    title: "Agniveer Air Force",
    slug: "agniveer-air-force",
    academySlug: "agniveer-air-force",
    fallback: "Air Force Agniveer written, reasoning and physical preparation.",
    category: "air-force",
    eligibility: "Candidates meeting Agniveer Vayu science or non-science group eligibility.",
    careerPaths: ["Agniveer Vayu Science", "Agniveer Vayu Non-Science", "Air Force service pathway"],
    physicalRequirements: "Air Force PFT, height, weight and medical standards as per notification.",
    selectionProcess: ["Online test", "CASB phase process", "PFT", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "SSR",
    slug: "ssr",
    academySlug: "ssr",
    fallback: "Navy Senior Secondary Recruit preparation.",
    category: "navy",
    eligibility: "Plus Two science stream candidates as per latest Navy SSR notification.",
    careerPaths: ["Navy SSR", "Agniveer Navy technical pathway"],
    physicalRequirements: "Navy PFT and medical standards as per notification.",
    selectionProcess: ["Computer-based exam", "PFT", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "MR",
    slug: "mr",
    academySlug: "mr",
    fallback: "Navy Matric Recruit preparation.",
    category: "navy",
    eligibility: "Class 10 qualified candidates as per latest Navy MR notification.",
    careerPaths: ["Navy MR", "Agniveer Navy support pathway"],
    physicalRequirements: "Navy PFT and medical standards as per notification.",
    selectionProcess: ["Computer-based exam", "PFT", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "Navik",
    slug: "navik",
    academySlug: "navik",
    fallback: "Indian Coast Guard Navik preparation.",
    category: "coast-guard",
    eligibility: "Class 10/Plus Two candidates as per Navik GD/DB notification.",
    careerPaths: ["Navik General Duty", "Navik Domestic Branch", "Coast Guard service pathway"],
    physicalRequirements: "Coast Guard PFT and medical standards as per notification.",
    selectionProcess: ["Stage I written exam", "Stage II assessment", "Medical examination", "Document verification"]
  }),
  fromAcademy({
    title: "TES Guidance",
    slug: "tes",
    academySlug: "tes-guidance",
    fallback: "Technical Entry Scheme application and SSB guidance.",
    category: "army",
    eligibility: "Plus Two PCM candidates meeting TES notification criteria.",
    careerPaths: ["Indian Army technical officer", "Engineering officer pathway"],
    physicalRequirements: "Army officer medical standards apply.",
    selectionProcess: ["Application shortlisting", "SSB interview", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "TGC / SSC Technical",
    slug: "tgc-ssc-technical",
    academySlug: "tgc-ssc-technical",
    fallback: "Technical graduate officer-entry guidance.",
    category: "army",
    eligibility: "Engineering graduates/final-year candidates as per TGC/SSC Technical notification.",
    careerPaths: ["TGC", "SSC Technical", "Army technical officer"],
    physicalRequirements: "Army officer medical standards apply.",
    selectionProcess: ["Application shortlisting", "SSB interview", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "MNS",
    slug: "mns",
    academySlug: "mns",
    fallback: "Military Nursing Service guidance.",
    category: "officer-entry",
    eligibility: "Female PCB candidates meeting MNS/defence nursing eligibility.",
    careerPaths: ["Military Nursing Service", "Defence nursing officer pathway"],
    physicalRequirements: "Medical standards as per defence nursing process.",
    selectionProcess: ["Written/shortlisting process", "Interview", "Medical examination", "Merit list"]
  }),
  fromAcademy({
    title: "AFMC",
    slug: "afmc",
    academySlug: "afmc",
    fallback: "Armed Forces Medical College career guidance.",
    category: "officer-entry",
    eligibility: "NEET/PCB candidates exploring defence medical careers.",
    careerPaths: ["AFMC", "Defence medical officer pathway"],
    physicalRequirements: "AFMC and defence medical fitness requirements apply.",
    selectionProcess: ["NEET", "AFMC process", "Interview", "Medical screening"]
  }),
  fromAcademy({
    title: "RIMC Preparation",
    slug: "rimc",
    academySlug: "rimc-preparation",
    fallback: "Rashtriya Indian Military College entrance preparation.",
    category: "officer-entry",
    eligibility: "Eligible school students as per RIMC admission notification.",
    careerPaths: ["RIMC", "Defence school foundation", "NDA pathway"],
    physicalRequirements: "School-entry medical and fitness expectations apply.",
    selectionProcess: ["Written exam", "Interview", "Medical examination"]
  }),
  fromAcademy({
    title: "AISSEE",
    slug: "aissee",
    academySlug: "aissee-class-6",
    fallback: "Sainik School entrance preparation.",
    category: "officer-entry",
    eligibility: "Class 6 and Class 9 aspirants as per AISSEE notification.",
    careerPaths: ["Sainik School", "Defence school foundation", "NDA pathway"],
    physicalRequirements: "School-entry medical requirements apply.",
    selectionProcess: ["AISSEE written exam", "Medical examination", "Admission process"]
  })
];

export const topRankDivisions: TopRankDivision[] = [
  {
    title: "Army",
    slug: "army",
    tagline: "Ground discipline, officer mindset and soldier-entry readiness.",
    description: "Preparation for Army officer entries, technical entries, Agniveer Army, Territorial Army and SSB pathways.",
    programs: ["agniveer-army", "nda", "cds", "tes", "tgc-ssc-technical", "ssb"]
  },
  {
    title: "Navy",
    slug: "navy",
    tagline: "Naval service preparation from school dreams to technical careers.",
    description: "Navy-focused preparation for NDA Naval Academy, Agniveer Navy, SSR, MR and SSB pathways.",
    programs: ["agniveer-navy", "ssr", "mr", "nda", "ssb"]
  },
  {
    title: "Air Force",
    slug: "air-force",
    tagline: "Air warrior preparation for AFCAT, NDA and Agniveer Vayu.",
    description: "Air Force officer and airman pathways with written exam, aptitude, physical and interview guidance.",
    programs: ["afcat", "agniveer-air-force", "nda", "cds", "ssb"]
  },
  {
    title: "Coast Guard",
    slug: "coast-guard",
    tagline: "Maritime security career preparation.",
    description: "Coast Guard pathway support for Navik, Assistant Commandant awareness and physical readiness.",
    programs: ["navik"]
  },
  {
    title: "Officer Entry",
    slug: "officer-entry",
    tagline: "NDA, CDS, AFCAT, SSB and technical officer-entry preparation.",
    description: "A complete officer-entry hub for students, graduates, engineers and defence medical aspirants.",
    programs: ["nda", "cds", "afcat", "ssb", "tes", "tgc-ssc-technical", "mns", "afmc", "rimc", "aissee"]
  }
];

export const topRankSeoAliases: Record<string, string> = {
  "nda-coaching-kerala": "nda",
  "cds-coaching-kerala": "cds",
  "afcat-coaching-kerala": "afcat",
  "ssb-interview-coaching-kerala": "ssb",
  "agniveer-coaching-kerala": "agniveer-army",
  "rimc-coaching-kerala": "rimc",
  "aissee-coaching-kerala": "aissee"
};

export function getTopRankProgram(slug: string) {
  const normalized = topRankSeoAliases[slug] ?? slug;
  return topRankPrograms.find((program) => program.slug === normalized);
}

export function getTopRankDivision(slug: string) {
  return topRankDivisions.find((division) => division.slug === slug);
}

export function topRankApplyHref(program?: string) {
  const params = new URLSearchParams({ intent: "top-rank" });
  if (program) params.set("program", program);
  return `/start-free?${params.toString()}`;
}

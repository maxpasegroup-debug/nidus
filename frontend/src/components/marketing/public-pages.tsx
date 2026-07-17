import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, CheckCircle2, GraduationCap, HelpCircle, ImageIcon, Medal, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { academyProgramGroups } from "@/data/academy-programs";
import { publicImages } from "@/components/marketing/public-modules";

type PublicPageSection = {
  title: string;
  text: string;
  icon: LucideIcon;
};

type PublicPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  primaryCta?: [string, string];
  secondaryCta?: [string, string];
  sections: PublicPageSection[];
};

export const publicSiteLinks = [
  ["Home", "/"],
  ["About NIDUS", "/about-nidus"],
  ["Courses", "/programs"],
  ["Admissions", "/admissions"],
  ["Why NIDUS", "/why-choose-nidus"],
  ["Faculty", "/faculty"],
  ["Success Stories", "/success-stories"],
  ["Facilities", "/facilities"],
  ["Gallery", "/gallery"],
  ["Events", "/events"],
  ["Blog / News", "/blog"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
] as const;

export const publicPageContent = {
  about: {
    eyebrow: "About NIDUS",
    title: "A defence career academy built around discipline, clarity and personal guidance.",
    description: "NIDUS Academy helps Indian parents and students choose the right defence pathway with classroom coaching, physical training, mentoring, assessments and structured progress tracking.",
    image: publicImages.cadets,
    primaryCta: ["Explore Courses", "/programs"],
    secondaryCta: ["Contact Admissions", "/contact"],
    sections: [
      { title: "Officer mindset", text: "Students are trained for confidence, routine, communication and responsibility, not only marks.", icon: ShieldCheck },
      { title: "Parent clarity", text: "Parents get a simple pathway: eligibility, program choice, counselling, admission and progress updates.", icon: Users },
      { title: "Integrated preparation", text: "Written exams, interviews, physical preparation and practice tests are planned together.", icon: GraduationCap },
    ],
  },
  admissions: {
    eyebrow: "Admissions",
    title: "A simple admission journey from inquiry to welcome.",
    description: "The public website connects every enquiry to the existing Admission CRM. The team follows up, verifies the application and guides families into the right batch.",
    image: publicImages.army,
    primaryCta: ["Start Admission Enquiry", "/start-free?intent=admission"],
    secondaryCta: ["Call Admissions", "tel:+919020905655"],
    sections: [
      { title: "Inquiry", text: "Submit interest through the website or call the admission team.", icon: Phone },
      { title: "Counselling", text: "A counsellor explains eligibility, course fit, fee plan and batch options.", icon: Users },
      { title: "Application to welcome", text: "Application, verification, admission, batch allocation and welcome are handled in the existing CRM workflow.", icon: CheckCircle2 },
    ],
  },
  why: {
    eyebrow: "Why Choose NIDUS",
    title: "Premium defence preparation with academy discipline and modern systems.",
    description: "NIDUS combines personal mentoring, practice culture, faculty accountability and structured academic planning for serious defence aspirants.",
    image: publicImages.republic,
    primaryCta: ["Book Free Counselling", "/start-free?intent=counselling"],
    secondaryCta: ["View Programs", "/programs"],
    sections: [
      { title: "Written plus physical", text: "Exam preparation is supported by fitness discipline and officer-like qualities.", icon: Medal },
      { title: "Progress visibility", text: "Students and parents can see the path, not just attend classes.", icon: Sparkles },
      { title: "Defence focused", text: "NDA, CDS, AFCAT, SSB, AISSEE, RIMC and Agniveer pathways are handled with clarity.", icon: ShieldCheck },
    ],
  },
  faculty: {
    eyebrow: "Faculty",
    title: "Mentors for academics, fitness, communication and officer readiness.",
    description: "The faculty experience is built around subject clarity, regular practice, discipline and individual student support.",
    image: publicImages.airforceMarch,
    primaryCta: ["Meet Admissions", "/contact"],
    secondaryCta: ["Explore Courses", "/programs"],
    sections: [
      { title: "Subject mentors", text: "Mathematics, English, GK, reasoning, science and exam-specific faculty support.", icon: GraduationCap },
      { title: "Fitness mentors", text: "Physical training support for defence recruitment and discipline building.", icon: Medal },
      { title: "Interview guidance", text: "Communication, confidence and SSB orientation are treated as core preparation.", icon: Users },
    ],
  },
  success: {
    eyebrow: "Success Stories",
    title: "Student progress is measured through consistency, confidence and readiness.",
    description: "Success at NIDUS is built through class attendance, test practice, parent support, mentoring and continuous improvement.",
    image: publicImages.navy,
    primaryCta: ["Start Your Journey", "/start-free?intent=general"],
    secondaryCta: ["View Programs", "/programs"],
    sections: [
      { title: "Discipline wins", text: "Students learn to follow a study rhythm and fitness routine.", icon: ShieldCheck },
      { title: "Test confidence", text: "Practice tests and feedback help students understand their real preparation level.", icon: CheckCircle2 },
      { title: "Parent trust", text: "Families get a clearer view of preparation and next steps.", icon: Users },
    ],
  },
  facilities: {
    eyebrow: "Facilities",
    title: "A focused learning environment for serious defence aspirants.",
    description: "NIDUS facilities support classroom learning, counselling, practice, physical preparation and student progress review.",
    image: publicImages.hero,
    primaryCta: ["Visit Campus", "/contact"],
    secondaryCta: ["Ask Admission Team", "/start-free?intent=campus-visit"],
    sections: [
      { title: "Classrooms", text: "Focused academic spaces for written exam preparation and doubt clearing.", icon: GraduationCap },
      { title: "Counselling desk", text: "Admission and career clarity support for parents and students.", icon: Users },
      { title: "Training culture", text: "Routine, punctuality and performance tracking support the academy environment.", icon: ShieldCheck },
    ],
  },
  gallery: {
    eyebrow: "Gallery",
    title: "A glimpse of defence inspiration, training culture and student ambition.",
    description: "Explore the visual identity of NIDUS: discipline, uniforms, campus energy, national service and the journey from aspirant to officer.",
    image: publicImages.para,
    primaryCta: ["Contact NIDUS", "/contact"],
    secondaryCta: ["View Events", "/events"],
    sections: [
      { title: "Academy moments", text: "Classroom, counselling and student activity highlights.", icon: ImageIcon },
      { title: "Defence inspiration", text: "Visual references that keep the dream clear for aspirants.", icon: ShieldCheck },
      { title: "Campus updates", text: "New gallery updates can be published as events and news grow.", icon: CalendarDays },
    ],
  },
  events: {
    eyebrow: "Events",
    title: "Workshops, counselling sessions and defence career awareness programs.",
    description: "NIDUS events help students and parents understand exams, eligibility, physical readiness, interviews and career options.",
    image: publicImages.customs,
    primaryCta: ["Book Event Seat", "/start-free?intent=event"],
    secondaryCta: ["Contact Team", "/contact"],
    sections: [
      { title: "Career seminars", text: "Defence career awareness sessions for students and parents.", icon: CalendarDays },
      { title: "Mock test days", text: "Practice, review and strategy sessions for exam readiness.", icon: CheckCircle2 },
      { title: "Counselling drives", text: "One-to-one program guidance and eligibility mapping.", icon: Users },
    ],
  },
  blog: {
    eyebrow: "Blog / News",
    title: "Defence exam updates, academy news and preparation guidance.",
    description: "A public knowledge space for parents and students to understand defence exams, admission windows, preparation strategy and academy announcements.",
    image: publicImages.drdo,
    primaryCta: ["Read Programs", "/programs"],
    secondaryCta: ["Ask a Question", "/contact"],
    sections: [
      { title: "Exam guidance", text: "Simple articles on eligibility, syllabus, preparation and common mistakes.", icon: HelpCircle },
      { title: "Academy news", text: "Admission updates, events, batches and student milestones.", icon: CalendarDays },
      { title: "Parent resources", text: "Clear explainers for parents supporting defence aspirants.", icon: Users },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Answers for parents and students before admission.",
    description: "Understand courses, eligibility, admission steps, counselling, class modes, tests and parent communication.",
    image: publicImages.airforce,
    primaryCta: ["Talk to Counsellor", "/contact"],
    secondaryCta: ["Start Free", "/start-free?intent=faq"],
    sections: [
      { title: "Which course should I choose?", text: "The admission counsellor maps class, age, qualification and goal to the right program.", icon: HelpCircle },
      { title: "Are physical and interview training included?", text: "Relevant programs include physical guidance, communication and interview orientation.", icon: ShieldCheck },
      { title: "How does admission work?", text: "Inquiry, counselling, application, verification, admission, batch allocation and welcome.", icon: CheckCircle2 },
    ],
  },
} satisfies Record<string, PublicPageContent>;

export function publicMetadata(key: keyof typeof publicPageContent): Metadata {
  const page = publicPageContent[key];
  return {
    title: `${page.eyebrow} | NIDUS Academy`,
    description: page.description,
    openGraph: {
      title: `${page.eyebrow} | NIDUS Academy`,
      description: page.description,
      images: [{ url: page.image }],
      type: "website",
    },
  };
}

export function PublicInfoPage({ pageKey }: { pageKey: keyof typeof publicPageContent }) {
  const page = publicPageContent[pageKey];

  return (
    <main className="bg-[#f7f3ea] text-[#071d36]">
      <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(185,145,63,0.22),transparent_26rem),linear-gradient(180deg,#fbf8f1_0%,#f7f3ea_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8a6426]">{page.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{page.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">{page.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {page.primaryCta ? <ActionLink href={page.primaryCta[1]} label={page.primaryCta[0]} primary /> : null}
              {page.secondaryCta ? <ActionLink href={page.secondaryCta[1]} label={page.secondaryCta[0]} /> : null}
            </div>
          </div>
          <div className="relative min-h-80 overflow-hidden rounded-[28px] border border-[#071d36]/10 bg-white shadow-[0_24px_90px_rgba(7,29,54,0.12)]">
            <Image src={page.image} alt={page.eyebrow} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071d36]/50 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {page.sections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="rounded-[22px] border border-[#071d36]/10 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f7f3ea] text-[#8a6426]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-xl font-black">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#40516a]">{section.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {pageKey === "admissions" ? <AdmissionsJourney /> : null}
      {pageKey === "gallery" ? <GalleryGrid /> : null}
      {pageKey === "faq" ? <FaqList /> : null}

      <section className="bg-[#071d36] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#e7c873]">Admissions Open</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">Ready to choose the right defence path?</h2>
          </div>
          <ActionLink href="/start-free?intent=public-site" label="Book Free Counselling" primary />
        </div>
      </section>
    </main>
  );
}

function ActionLink({ href, label, primary = false }: { href: string; label: string; primary?: boolean }) {
  const external = href.startsWith("tel:");
  const className = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${primary ? "border border-[#b58b35]/45 bg-[linear-gradient(135deg,#fff3bf_0%,#e7c873_34%,#b9913f_72%,#8a6426_100%)] text-[#071d36] shadow-[0_18px_46px_rgba(185,145,63,0.24)]" : "border border-[#071d36]/14 bg-white text-[#071d36]"}`;
  const content = <>{label} <ArrowRight className="h-4 w-4" /></>;
  return external ? <a href={href} className={className}>{content}</a> : <Link href={href} className={className}>{content}</Link>;
}

function AdmissionsJourney() {
  const steps = ["Inquiry", "Counselling", "Application", "Verification", "Admission", "Welcome"];
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-[#071d36]/10 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8a6426]">Admission Journey</p>
        <div className="mt-6 grid gap-3 md:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-[#071d36]/10 bg-[#f7f3ea] p-4">
              <p className="text-sm font-black text-[#8a6426]">0{index + 1}</p>
              <h3 className="mt-2 font-black">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryGrid() {
  const images = [publicImages.hero, publicImages.army, publicImages.cadets, publicImages.navy, publicImages.airforceMarch, publicImages.para];
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
        {images.map((image, index) => (
          <div key={image} className="relative min-h-64 overflow-hidden rounded-[24px] border border-[#071d36]/10 bg-white shadow-sm">
            <Image src={image} alt={`NIDUS gallery image ${index + 1}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqList() {
  const faqs = [
    ["Do you help choose the right course?", "Yes. The counsellor maps age, class, qualification and defence goal before admission."],
    ["Are classes online or offline?", "Program mode depends on the course and batch. The admission team explains mode clearly during counselling."],
    ["Do parents get updates?", "NIDUS is designed to support parent visibility through student progress, attendance, fees and communication workflows."],
    ["Which exams are covered?", "NDA, CDS, AFCAT, SSB, AISSEE, RIMC, Agniveer and related defence pathways."],
  ];
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-3">
        {faqs.map(([question, answer]) => (
          <article key={question} className="rounded-2xl border border-[#071d36]/10 bg-white p-5 shadow-sm">
            <h2 className="font-black">{question}</h2>
            <p className="mt-2 text-sm leading-7 text-[#40516a]">{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CoursesPublicPage() {
  return (
    <main className="bg-[#f7f3ea] px-4 pb-20 pt-32 text-[#071d36] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8a6426]">Courses</p>
        <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight md:text-6xl">Defence programs grouped by student goal.</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[#40516a]">Choose by eligibility, duration, mode and outcome. For exact batch dates and fee plans, book free counselling.</p>
        <div className="mt-10 grid gap-5">
          {academyProgramGroups.map((group) => (
            <section key={group.title} className="rounded-[28px] border border-[#071d36]/10 bg-white p-5 shadow-sm md:p-7">
              <h2 className="text-2xl font-black">{group.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#40516a]">{group.subtitle}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.programs.map((program) => (
                  <Link key={program.slug} href={`/programs/${program.slug}`} className="rounded-2xl border border-[#071d36]/10 bg-[#f7f3ea] p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md">
                    <h3 className="text-lg font-black">{program.title}</h3>
                    <div className="mt-4 grid gap-2 text-sm text-[#40516a]">
                      <p><b>Eligibility:</b> {program.audience}</p>
                      <p><b>Duration:</b> Batch based</p>
                      <p><b>Mode:</b> Offline / Hybrid guidance</p>
                      <p><b>Outcome:</b> {program.outcome}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

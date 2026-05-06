"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Award, BrainCircuit, CheckCircle2, ChevronRight, GraduationCap, LineChart, MessageSquare, Phone, Radar, Shield, ShieldCheck, Smartphone, Sparkles, Target, Users, Video } from "lucide-react";

const exams = ["NDA", "CDS", "AFCAT", "Agniveer", "SSB", "AISSEE", "RIMC", "RMS"];
const features = [
  ["AI Interview Simulator", BrainCircuit],
  ["Psychometric Analysis", Radar],
  ["OLQ Tracking", LineChart],
  ["Mock Tests", Target],
  ["Live Classes", Video],
  ["CRM & Admissions", Users],
  ["Hostel System", Shield],
  ["Executive Analytics", Award]
] as const;
const stories = [
  ["Aarav Singh", "Recommended, NDA", "The AI interview drills made my answers sharper and calmer."],
  ["Meera Nair", "AFCAT Selected", "NIDUS connected my mocks, lectures, and mentor feedback in one loop."],
  ["Rohan Verma", "SSB Conference Out", "OLQ tracking finally showed me what to improve every week."]
];
const faculty = ["Ex-Armed Forces Mentors", "SSB Psychologists", "Defence Exam Faculty", "Fitness & Drill Coaches"];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-muted sm:text-base">{copy}</p>
    </Reveal>
  );
}

function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className={`group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent opacity-70" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-gold/8 blur-3xl transition group-hover:bg-gold/14" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function MarketingHome() {
  const { scrollYProgress } = useScroll();
  const heroShift = useTransform(scrollYProgress, [0, 0.4], [0, -80]);

  return (
    <main className="bg-[#030812] text-ink">
      <section className="relative min-h-screen overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,18,0.42),#030812_88%),url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2200&q=80')] bg-cover bg-center opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_22%,rgba(201,166,70,0.28),transparent_24rem),radial-gradient(circle_at_20%_32%,rgba(59,130,246,0.20),transparent_28rem)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
        <motion.div style={{ y: heroShift }} className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl gap-12 lg:grid-cols-[1fr_30rem] lg:items-center">
          <div>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold uppercase tracking-[0.32em] text-gold-soft">India's Next Defence Intelligence Platform</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.98] text-ink sm:text-7xl lg:text-8xl">
              Train Like An Officer.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-7 max-w-2xl text-base leading-8 text-muted sm:text-xl">
              NIDUS combines AI mentorship, SSB psychology, defence academics, mock tests, live classes, parent visibility, and academy operations into one premium command ecosystem.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded bg-gold px-6 py-4 text-sm font-semibold text-navy-deep shadow-[0_24px_70px_rgba(201,166,70,0.25)] transition hover:bg-gold-soft">
                Start Your Mission <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#ai-platform" className="inline-flex items-center justify-center gap-2 rounded border border-white/15 bg-white/7 px-6 py-4 text-sm font-semibold text-ink backdrop-blur-xl transition hover:border-gold/45 hover:bg-gold/10">
                Explore Academy <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <div className="mt-8 flex flex-wrap gap-2">
              {["NDA", "CDS", "AFCAT", "SSB", "AISSEE", "RIMC", "RMS"].map((item) => (
                <span key={item} className="rounded border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold-soft">{item}</span>
              ))}
            </div>
          </div>

          <motion.aside initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }} className="relative">
            <div className="absolute -inset-8 rounded-full bg-gold/12 blur-3xl" />
            <GlowCard className="p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gold-soft">NIDUS AI Mentor</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">Mission Readiness</h2>
                </div>
                <Sparkles className="h-8 w-8 text-gold-soft" />
              </div>
              <div className="mt-6 space-y-4">
                {[
                  ["Interview confidence", "82%"],
                  ["OLQ development", "74%"],
                  ["Mock test accuracy", "88%"],
                  ["Physical consistency", "69%"]
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm"><span>{label}</span><span className="text-gold-soft">{value}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} whileInView={{ width: value }} viewport={{ once: true }} transition={{ duration: 1.1 }} className="h-full rounded-full bg-gold" /></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded border border-gold/25 bg-gold/10 p-4 text-sm leading-6 text-gold-soft">
                "Your SSB response shows initiative. Add a clearer decision point and link it to responsibility."
              </div>
            </GlowCard>
          </motion.aside>
        </motion.div>
      </section>

      <section id="about" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="About NIDUS" title="A next-generation officer training operating system." copy="Built for aspirants, parents, faculty, counsellors, and academy leadership, NIDUS turns preparation into a disciplined intelligence loop." />
        <Reveal className="mx-auto mt-12 grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Academics", "Structured courses, tests, lectures, current affairs, and PYQ mastery."],
            ["Mindset", "SSB psychology, OLQ tracking, AI interviews, and officer-like qualities."],
            ["Operations", "CRM, ERP, hostel, fees, communication, media, documents, and admin control."]
          ].map(([title, copy]) => (
            <GlowCard key={title} className="p-6"><h3 className="text-xl font-semibold text-ink">{title}</h3><p className="mt-3 text-sm leading-7 text-muted">{copy}</p></GlowCard>
          ))}
        </Reveal>
      </section>

      <section id="exams" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Defence Exams" title="Every major defence pathway in one elite academy layer." copy="NIDUS supports the full aspirant journey from school-level military entrance to officer selection boards." />
        <Reveal className="mx-auto mt-12 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exams.map((exam, index) => (
            <GlowCard key={exam} className="p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-gold-soft">Formation {String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 text-3xl font-semibold text-ink">{exam}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">Syllabus, tests, current affairs, mentorship, analytics, and readiness scoring.</p>
            </GlowCard>
          ))}
        </Reveal>
      </section>

      <section id="ai-platform" className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(201,166,70,0.20),transparent_24rem)]" />
        <SectionTitle eyebrow="Meet NIDUS AI" title="Your personal defence mentor." copy="A futuristic AI layer for interview simulation, doubt solving, recommendations, progress interpretation, and officer potential analysis." />
        <Reveal className="relative mx-auto mt-14 grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }} className="absolute inset-8 rounded-full border border-gold/20 border-t-gold" />
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }} className="h-48 w-48 rounded-full bg-[radial-gradient(circle,#f2d675_0%,#c9a646_28%,rgba(201,166,70,0.10)_58%,transparent_70%)] shadow-[0_0_120px_rgba(201,166,70,0.34)]" />
            <BrainCircuit className="absolute h-16 w-16 text-navy-deep" />
          </div>
          <GlowCard className="p-5 sm:p-6">
            <div className="space-y-4">
              {[
                ["Aspirant", "How do I improve my SRT responses before SSB?"],
                ["NIDUS AI", "Prioritize decision clarity, responsibility, and speed. I have generated 12 drills for your weak OLQs."],
                ["Aspirant", "Simulate an interview question on leadership."],
                ["NIDUS AI", "Tell me about a time you led under pressure. Answer in 90 seconds; I will score confidence and structure."]
              ].map(([speaker, text]) => (
                <div key={text} className={`rounded border p-4 ${speaker === "NIDUS AI" ? "ml-auto max-w-[88%] border-gold/30 bg-gold/12 text-gold-soft" : "max-w-[84%] border-white/10 bg-white/7 text-ink"}`}>
                  <p className="text-xs uppercase tracking-[0.18em] opacity-70">{speaker}</p>
                  <p className="mt-2 text-sm leading-6">{text}</p>
                </div>
              ))}
            </div>
          </GlowCard>
        </Reveal>
      </section>

      <section id="ssb" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="SSB Training" title="Psychology, interview, GTO, and OLQ training with precision." copy="The platform brings SSB preparation out of guesswork and into measurable officer-quality development." />
        <Reveal className="mx-auto mt-12 grid max-w-7xl gap-4 md:grid-cols-3">
          {["Psychometric + OLQ System", "AI Interview Simulation", "Officer Potential Dashboard"].map((title) => (
            <GlowCard key={title} className="p-6"><ShieldCheck className="h-7 w-7 text-gold-soft" /><h3 className="mt-5 text-xl font-semibold text-ink">{title}</h3><p className="mt-3 text-sm leading-7 text-muted">Premium analytics, realistic tasks, and mentor-grade insights for officer readiness.</p></GlowCard>
          ))}
        </Reveal>
      </section>

      <section id="courses" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Courses & Features" title="A complete defence academy ecosystem." copy="From public discovery to institutional operations, NIDUS keeps the entire academy mission inside one polished platform." />
        <Reveal className="mx-auto mt-12 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([label, Icon]) => (
            <GlowCard key={label} className="p-5"><Icon className="h-6 w-6 text-gold-soft" /><h3 className="mt-4 font-semibold text-ink">{label}</h3></GlowCard>
          ))}
        </Reveal>
      </section>

      <section id="success" className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Success Stories" title="Built for aspirants who think like officers." copy="Management demos should feel alive. These cinematic success cards show the outcome NIDUS is designed to produce." />
        <Reveal className="mx-auto mt-12 grid max-w-7xl gap-4 md:grid-cols-3">
          {stories.map(([name, rank, quote]) => (
            <GlowCard key={name} className="p-6"><Award className="h-7 w-7 text-gold-soft" /><h3 className="mt-5 text-xl font-semibold text-ink">{name}</h3><p className="mt-1 text-sm text-gold-soft">{rank}</p><p className="mt-4 text-sm leading-7 text-muted">"{quote}"</p></GlowCard>
          ))}
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Leadership & Faculty" title="A premium academy needs an elite mentorship layer." copy="NIDUS is structured for armed forces mentors, SSB experts, faculty, trainers, counsellors, and academy leadership." />
        <Reveal className="mx-auto mt-12 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {faculty.map((item) => <GlowCard key={item} className="p-6"><Users className="h-6 w-6 text-gold-soft" /><h3 className="mt-4 text-lg font-semibold text-ink">{item}</h3></GlowCard>)}
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-gold/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.035))] p-6 backdrop-blur-2xl md:grid-cols-[1fr_24rem] md:items-center lg:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gold-soft">Mobile App Showcase</p>
            <h2 className="mt-4 text-3xl font-semibold text-ink sm:text-5xl">An app-like training command center in every cadet's pocket.</h2>
            <p className="mt-5 text-sm leading-7 text-muted">Offline PWA support, mobile navigation, live class access, test attempts, notifications, and parent visibility create a polished daily-use experience.</p>
          </div>
          <div className="relative mx-auto h-[30rem] w-64">
            <div className="absolute inset-0 rounded-[2rem] border border-gold/30 bg-navy-deep p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              <div className="h-full rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(201,166,70,0.22),transparent_42%),#06111f] p-5">
                <Smartphone className="h-7 w-7 text-gold-soft" />
                <p className="mt-8 text-xs uppercase tracking-[0.22em] text-gold-soft">Today's Mission</p>
                <h3 className="mt-3 text-2xl font-semibold text-ink">NDA Mock + AI Drill</h3>
                <div className="mt-8 space-y-3">{["Mathematics", "SSB Interview", "Fitness Log"].map((item) => <div key={item} className="rounded border border-white/10 bg-white/7 p-3 text-sm text-muted">{item}</div>)}</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Parent & Academy Features" title="Aspirants train. Parents see. Academies command." copy="NIDUS gives every stakeholder a dedicated view without fragmenting the institution across disconnected tools." />
        <Reveal className="mx-auto mt-12 grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Parent Dashboard", "Fees, attendance, discipline, performance, and counselling visibility."],
            ["Academy CRM", "Leads, admissions, follow-ups, counselling, and branch operations."],
            ["Executive Control", "Roles, permissions, audit logs, settings, media, documents, and analytics."]
          ].map(([title, copy]) => <GlowCard key={title} className="p-6"><CheckCircle2 className="h-6 w-6 text-gold-soft" /><h3 className="mt-4 text-xl font-semibold text-ink">{title}</h3><p className="mt-3 text-sm leading-7 text-muted">{copy}</p></GlowCard>)}
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-5xl rounded-lg border border-gold/30 bg-[radial-gradient(circle_at_50%_0%,rgba(201,166,70,0.22),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-12">
          <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Join The Mission</p>
          <h2 className="mt-5 text-4xl font-semibold text-ink sm:text-6xl">The future of defence training starts here.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">Build officer mindset with AI precision, disciplined training, institutional visibility, and a premium academy experience.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded bg-gold px-6 py-4 text-sm font-semibold text-navy-deep">Start Your Mission <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded border border-white/15 px-6 py-4 text-sm font-semibold text-ink">Contact NIDUS <Phone className="h-4 w-4" /></Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

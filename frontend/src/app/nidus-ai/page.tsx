"use client";

import { motion } from "framer-motion";
import { AnnouncementCard, QuickActionCard, SectionHeader, StatCard } from "@/components/dashboard";
import { PageHero } from "@/components/layout/page-hero";

const aiRoles = [
  { title: "Director", description: "Institution health, admissions, revenue, risk alerts, and staff performance summary.", tag: "CEO" },
  { title: "Admin", description: "Pending users, fees, course uploads, tests, HR documents, and system checks.", tag: "Ops" },
  { title: "Teacher", description: "Lesson plan help, weak-student alerts, test review, and parent update suggestions.", tag: "Class" },
  { title: "Student", description: "Daily study plan, weak topics, mock-test practice, and revision actions.", tag: "Study" },
  { title: "Telecaller", description: "Call script, follow-up priority, counselling prompt, and admission conversion tips.", tag: "CRM" },
  { title: "Marketing", description: "Campaign focus, webinar follow-up, content ideas, and lead-source quality.", tag: "Growth" }
];

const dailyQuestions = [
  "What should I do today?",
  "Which work is pending?",
  "Which students need attention?",
  "Which leads should be called first?",
  "Which teacher or course needs review?",
  "What should be reported to the director?"
];

export default function NidusAiPage() {
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="NIDUS AI Boss"
        title="Ask NIDUS across the whole academy"
        description="NIDUS acts as the academy assistant for management, teachers, students, parents, telecallers, marketing, reports, and operations."
        stats={[
          { value: "24/7", label: "AI support" },
          { value: "6", label: "role views" },
          { value: "360", label: "academy context" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending Work" value="Live" note="Daily tasks and follow-up reminders" />
        <StatCard label="Risk Alerts" value="AI" note="Students, leads, payments and operations" />
        <StatCard label="Staff Support" value="Role-wise" note="Teacher, admin, CRM, marketing help" />
        <StatCard label="Executive Summary" value="Ready" note="Director-level academy brief" />
      </section>

      <SectionHeader eyebrow="Role Support" title="Where Ask NIDUS appears" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {aiRoles.map((role) => <AnnouncementCard key={role.title} title={role.title} description={role.description} tag={role.tag} />)}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="premium-surface rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">Daily Questions</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Simple prompts for every user</h2>
          <div className="mt-5 grid gap-3">
            {dailyQuestions.map((question) => <div key={question} className="rounded border border-white/10 bg-navy-deep/55 p-4 text-sm leading-6 text-muted">{question}</div>)}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickActionCard title="AI study planner" description="Student daily planning and weak-topic action." href="/ai-study-planner" />
          <QuickActionCard title="AI recommendations" description="Open academy recommendations and improvement ideas." href="/ai-recommendations" />
          <QuickActionCard title="AI interview" description="Officer-style interview training and feedback." href="/ai-interview" />
          <QuickActionCard title="Progress reports" description="Use AI action plans inside monthly reports." href="/progress-reports" />
        </div>
      </section>
    </motion.div>
  );
}

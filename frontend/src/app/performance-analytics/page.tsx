"use client";

import { motion } from "framer-motion";
import { AnalyticsCard } from "@/components/ai-planner/analytics-card";
import { AIInsightCard } from "@/components/ai-planner/ai-insight-card";
import { ProgressRadarChart } from "@/components/ai-planner/progress-radar-chart";
import { RecommendationPanel } from "@/components/ai-planner/recommendation-panel";
import { EmptyState } from "@/components/courses/empty-state";
import { SectionHeader } from "@/components/dashboard";
import { usePerformanceAnalytics } from "@/hooks/use-ai-planner";
import { getApiErrorMessage } from "@/services/api";

export default function PerformanceAnalyticsPage() {
  const { analytics, recommendations } = usePerformanceAnalytics();
  const data = analytics.data;
  if (analytics.isLoading) return <div className="h-96 animate-pulse rounded-lg bg-white/[0.06]" />;
  if (analytics.error || !data) return <EmptyState title="Unable to load analytics" description={getApiErrorMessage(analytics.error)} />;
  const radar = [
    { trait: "Accuracy", value: data.testAccuracy },
    { trait: "Average", value: data.averageScore },
    { trait: "Consistency", value: data.studyConsistency },
    { trait: "Revision", value: data.revisionRate }
  ];
  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SectionHeader eyebrow="Performance Analytics" title="AI performance command report" />
      <section className="grid gap-4 md:grid-cols-4">
        <AnalyticsCard label="Accuracy" value={`${data.testAccuracy}%`} note="Recent test accuracy" />
        <AnalyticsCard label="Average Score" value={`${data.averageScore}%`} note="Rolling mock average" />
        <AnalyticsCard label="Consistency" value={`${data.studyConsistency}%`} note="Study habit stability" />
        <AnalyticsCard label="Revision Rate" value={`${data.revisionRate}%`} note="Completed revision missions" />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <ProgressRadarChart data={radar} />
        <div className="space-y-4">
          <AIInsightCard title="Weak topics" body={(data.weakTopics ?? []).join(", ") || "No weak topics detected yet."} />
          <AIInsightCard title="Strong topics" body={(data.strongTopics ?? []).join(", ") || "Build strengths through consistent attempts."} />
        </div>
      </section>
      <RecommendationPanel items={recommendations.data?.recommendations ?? data.aiSuggestions ?? []} />
    </motion.div>
  );
}

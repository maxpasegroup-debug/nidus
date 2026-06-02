"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
import { Activity, BookOpenCheck, Building2, ClipboardList, LockKeyhole, Settings, Shield, Users } from "lucide-react";
import { AuditTimeline } from "@/components/admin-center/AuditTimeline";
import { SystemHealthCard } from "@/components/admin-center/SystemHealthCard";
import { useAdminDashboard } from "@/hooks/use-admin-center";

const commandLinks = [
  { href: "/admin-center/roles", label: "Roles", icon: Shield },
  { href: "/admin-center/users", label: "Users", icon: Users },
  { href: "/admin-center/permissions", label: "Permissions", icon: LockKeyhole },
  { href: "/admin-center/settings", label: "Settings", icon: Settings },
  { href: "/admin-center/operations", label: "Operations", icon: Activity },
  { href: "/admin-center/guru", label: "NIDUS Guru", icon: BookOpenCheck },
  { href: "/admin-center/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin-center/branches", label: "Branches", icon: Building2 }
];

export default function AdminCenterPage() {
  const dashboard = useAdminDashboard();
  const data = dashboard.data;
  const chartData = data ? [
    { name: "Users", value: data.totals.users },
    { name: "Roles", value: data.totals.roles },
    { name: "Permissions", value: data.totals.permissions },
    { name: "Branches", value: data.totals.branches }
  ] : [];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">CEO Control Center</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Executive Control Center</h1>
          <p className="mt-2 text-sm text-muted">System governance, security posture, branch operations, employee access, and command activity.</p>
        </div>

        {dashboard.isLoading && <div className="mt-6 grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-lg bg-white/10" />)}</div>}
        {data && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {Object.entries(data.health).map(([label, status]) => <SystemHealthCard key={label} label={label} status={status} />)}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
              <div className="premium-surface rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-ink">Branch and access analytics</h2>
                  <Users className="h-5 w-5 text-gold-soft" />
                </div>
                <div className="mt-6 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" stroke="#9fb0c7" />
                      <YAxis stroke="#9fb0c7" />
                      <Tooltip contentStyle={{ background: "#06111f", border: "1px solid rgba(255,255,255,0.12)", color: "#eef4ff" }} />
                      <Bar dataKey="value" fill="#c9a646" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid gap-3">
                {commandLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="premium-surface flex items-center justify-between rounded-lg p-4 transition hover:border-gold/40">
                      <span className="flex items-center gap-3 text-sm font-semibold"><Icon className="h-5 w-5 text-gold-soft" /> {item.label}</span>
                      <span className="text-xs text-muted">Open</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <h2 className="mb-4 text-lg font-semibold text-ink">Recent actions</h2>
              <AuditTimeline logs={data.recentActions} />
            </motion.section>
          </>
        )}
      </section>
    </main>
  );
}

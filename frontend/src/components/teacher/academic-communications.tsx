"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronRight, Megaphone, MessageSquareText } from "lucide-react";
import { getAnnouncements, getMessages, getNotifications } from "@/services/communication";

export function AcademicCommunications() {
  const messages = useQuery({ queryKey: ["academic-communications", "messages"], queryFn: getMessages });
  const notifications = useQuery({ queryKey: ["academic-communications", "notifications"], queryFn: getNotifications });
  const announcements = useQuery({ queryKey: ["academic-communications", "announcements"], queryFn: getAnnouncements });
  const unread = (notifications.data ?? []).filter((item) => !item.isRead).length;
  const tools = [
    { title: "Messages", note: "Open staff and academy conversations.", value: messages.isLoading ? "..." : messages.data?.length ?? 0, suffix: "threads", href: "/messages", icon: MessageSquareText },
    { title: "Notifications", note: "Review reminders and important updates.", value: notifications.isLoading ? "..." : unread, suffix: "unread", href: "/notifications", icon: Bell },
    { title: "Announcements", note: "Read academy notices and schedules.", value: announcements.isLoading ? "..." : announcements.data?.length ?? 0, suffix: "notices", href: "/announcements", icon: Megaphone },
  ];
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-5">
      <header className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--gold-dark)]">Communication</p>
        <h1 className="mt-2 text-3xl font-black">Messages & notifications</h1>
        <p className="mt-2 text-sm text-[var(--muted-blue)]">One place for conversations, reminders and academy notices.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        {tools.map((tool) => { const Icon = tool.icon; return (
          <Link key={tool.title} href={tool.href} className="group flex min-h-56 flex-col rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950">
            <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-950 text-white"><Icon size={21} /></span><ChevronRight className="mt-3 opacity-35 transition group-hover:translate-x-1 group-hover:opacity-100" size={18} /></div>
            <h2 className="mt-5 text-xl font-black">{tool.title}</h2><p className="mt-2 text-sm leading-5 text-[var(--muted-blue)]">{tool.note}</p>
            <p className="mt-auto pt-5 text-2xl font-black">{tool.value} <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--gold-dark)]">{tool.suffix}</span></p>
          </Link>
        ); })}
      </section>
    </main>
  );
}

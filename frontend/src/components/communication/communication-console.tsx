"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Mail, Megaphone, MessageSquare, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AnnouncementBanner, CommunicationEmptyState, ConversationCard, EmailLogCard, MessageBubble, NotificationCard } from "@/components/communication/communication-components";
import { useAuth } from "@/components/providers/auth-provider-v2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAnnouncements, useEmails, useMessages, useNotifications, usePushNotifications } from "@/hooks/use-communication";

type CommunicationView = "notifications" | "messages" | "thread" | "announcements" | "email";

const links = [
  ["/notifications", "Notifications", Bell],
  ["/messages", "Messages", MessageSquare],
  ["/announcements", "Announcements", Megaphone],
  ["/email-center", "Email Center", Mail]
] as const;

function value(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function CommunicationConsole({ view, threadId }: { view: CommunicationView; threadId?: string }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const notifications = useNotifications();
  const messages = useMessages(threadId);
  const announcements = useAnnouncements();
  const emails = useEmails();
  const push = usePushNotifications();
  const notificationData = notifications.data ?? [];
  const threadData = messages.thread.data;
  const visibleNotifications = notificationData.filter((item) => filter === "ALL" ? true : filter === "UNREAD" ? !item.isRead : item.isRead);
  const unread = notificationData.filter((item) => !item.isRead).length;

  return (
    <motion.div className="space-y-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">NIDUS Signal Command</p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Communication & Internal Messaging</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Enterprise notifications, secure internal conversations, institutional announcements, Resend email delivery and push-ready structure.</p>
        </div>
        <div className="flex flex-wrap gap-2">{links.map(([href, label, Icon]) => <Link key={href} href={href} className="inline-flex h-10 items-center gap-2 rounded border border-white/10 px-3 text-sm text-ink transition hover:border-gold/50 hover:text-gold"><Icon className="h-4 w-4" />{label}</Link>)}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><p className="text-sm text-muted">Unread Signals</p><b className="mt-2 block text-3xl text-white">{unread}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Message Threads</p><b className="mt-2 block text-3xl text-white">{messages.data?.length ?? 0}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Announcements</p><b className="mt-2 block text-3xl text-white">{announcements.data?.length ?? 0}</b></Card>
        <Card className="p-5"><p className="text-sm text-muted">Email Logs</p><b className="mt-2 block text-3xl text-white">{emails.data?.length ?? 0}</b></Card>
      </section>

      {view === "notifications" ? (
        <section className="space-y-4">
          <Card className="p-4"><div className="flex flex-wrap gap-2">{(["ALL", "UNREAD", "READ"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded border px-3 py-2 text-sm ${filter === item ? "border-gold bg-gold/15 text-gold-soft" : "border-white/10 text-ink"}`}>{item}</button>)}</div></Card>
          <div className="grid gap-4 md:grid-cols-2">{visibleNotifications.length ? visibleNotifications.map((item) => <NotificationCard key={item.id} item={item} onRead={() => notifications.markRead.mutate(item.id)} />) : <CommunicationEmptyState title="No notifications" note="Signals for your role will appear here." />}</div>
        </section>
      ) : null}

      {view === "messages" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">New Conversation</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; messages.createThread.mutate({ subject: value(form, "subject") }); form.reset(); }}><Grid><Input name="subject" label="Subject" required /><Input label="Typing Indicator" value="Ready" readOnly /><Input label="Attachments" value="Ready" readOnly /></Grid><div className="mt-4"><Button size="sm">Create Thread</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{messages.data?.map((thread) => <Link key={thread.id} href={`/messages/${thread.id}`}><ConversationCard thread={thread} /></Link>)}</div>
        </section>
      ) : null}

      {view === "thread" ? (
        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">{messages.data?.map((thread) => <Link key={thread.id} href={`/messages/${thread.id}`}><ConversationCard thread={thread} /></Link>)}</div>
          <Card className="p-5">
            <h2 className="text-xl font-bold text-white">{threadData?.subject ?? "Conversation"}</h2>
            <p className="mt-2 text-xs text-muted">Typing indicator active</p>
            <div className="mt-5 max-h-[420px] space-y-4 overflow-y-auto pr-2">{threadData?.messages?.map((message) => <MessageBubble key={message.id} message={message} mine={message.senderId === user?.id} />)}</div>
            <form className="mt-5" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; if (!threadId) return; messages.send.mutate({ threadId, receiverId: value(form, "receiverId"), message: value(form, "message"), attachmentUrl: value(form, "attachmentUrl") || undefined }); form.reset(); }}>
              <Grid><Input name="receiverId" label="Receiver ID" required /><Input name="message" label="Message" required /><Input name="attachmentUrl" label="Attachment URL" /></Grid>
              <div className="mt-4"><Button size="sm"><Send className="mr-2 h-4 w-4" />Send</Button></div>
            </form>
          </Card>
        </section>
      ) : null}

      {view === "announcements" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Publish Announcement</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; announcements.create.mutate({ title: value(form, "title"), description: value(form, "description"), audience: value(form, "audience") || "ALL" }); form.reset(); }}><Grid><Input name="title" label="Title" required /><Input name="description" label="Description" required /><Input name="audience" label="Audience" defaultValue="ALL" /></Grid><div className="mt-4"><Button size="sm">Publish</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2">{announcements.data?.map((item) => <AnnouncementBanner key={item.id} item={item} />)}</div>
        </section>
      ) : null}

      {view === "email" ? (
        <section className="space-y-4">
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Send Resend Email</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; emails.send.mutate({ recipient: value(form, "recipient"), subject: value(form, "subject"), body: value(form, "body"), actionLabel: value(form, "actionLabel") || undefined, actionUrl: value(form, "actionUrl") || undefined }); form.reset(); }}><Grid><Input name="recipient" label="Recipient" type="email" required /><Input name="subject" label="Subject" required /><Input name="body" label="Body" required /><Input name="actionLabel" label="Action Label" /><Input name="actionUrl" label="Action URL" /></Grid><div className="mt-4"><Button size="sm">Send Email</Button></div></form></Card>
          <Card className="p-5"><h2 className="mb-4 text-xl font-bold text-white">Push Notification Console</h2><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; push.send.mutate({ title: value(form, "title"), body: value(form, "pushBody"), targetAudience: value(form, "targetAudience") }); form.reset(); }}><Grid><Input name="title" label="Push Title" required /><Input name="pushBody" label="Push Body" required /><Input name="targetAudience" label="Target Audience" defaultValue="ALL" required /></Grid><div className="mt-4"><Button size="sm" variant="secondary">Queue Push</Button></div></form></Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{emails.data?.map((item) => <EmailLogCard key={item.id} item={item} />)}</div>
        </section>
      ) : null}
    </motion.div>
  );
}

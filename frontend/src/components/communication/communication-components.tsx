"use client";

import { motion } from "framer-motion";
import { Bell, Mail, Megaphone, MessageSquare, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CommunicationAnnouncement, EmailLog, Message, MessageThread, Notification } from "@/types/communication";

export function CommunicationEmptyState({ title, note }: { title: string; note: string }) {
  return <Card className="p-6 text-center text-sm text-muted"><p className="text-base font-bold text-ink">{title}</p><p className="mt-2">{note}</p></Card>;
}

export function CommunicationSkeleton() {
  return <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-lg border border-white/10 bg-white/8" />)}</div>;
}

export function NotificationCard({ item, onRead }: { item: Notification; onRead?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`p-5 ${item.isRead ? "opacity-70" : "ring-1 ring-gold/30"}`}>
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{item.title}</h3><p className="mt-2 text-sm text-ink">{item.message}</p></div><Bell className="h-5 w-5 text-gold" /></div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted"><span>{item.type} - {item.targetRole ?? "Direct"}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div>
        {!item.isRead && onRead ? <button className="mt-4 rounded border border-gold/35 px-3 py-2 text-sm text-gold" onClick={onRead}>Mark read</button> : null}
      </Card>
    </motion.div>
  );
}

export function ConversationCard({ thread }: { thread: MessageThread }) {
  const latest = thread.messages?.[0];
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{thread.subject}</h3><p className="mt-2 text-sm text-muted">{latest?.message ?? "No messages yet"}</p></div><MessageSquare className="h-5 w-5 text-gold" /></div><p className="mt-4 text-xs text-muted">Created by {thread.creator?.name ?? thread.createdBy}</p></Card>;
}

export function MessageBubble({ message, mine }: { message: Message; mine?: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-lg border p-4 ${mine ? "border-gold/35 bg-gold/15 text-gold-soft" : "border-white/10 bg-white/8 text-ink"}`}>
        <p className="text-sm">{message.message}</p>
        {message.attachmentUrl ? <a className="mt-2 inline-flex items-center gap-2 text-xs text-gold" href={message.attachmentUrl}><Paperclip className="h-3 w-3" />Attachment</a> : null}
        <p className="mt-2 text-xs opacity-70">{message.sender?.name ?? message.senderId} - {new Date(message.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
}

export function AnnouncementBanner({ item }: { item: CommunicationAnnouncement }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-gold">{item.audience ?? item.targetAudience}</p><h3 className="mt-2 text-xl font-bold text-white">{item.title}</h3></div><Megaphone className="h-6 w-6 text-gold" /></div><p className="mt-4 text-sm leading-6 text-ink">{item.description}</p><p className="mt-4 text-xs text-muted">Published {new Date(item.createdAt).toLocaleString()}</p></Card>;
}

export function EmailLogCard({ item }: { item: EmailLog }) {
  const tone = item.status === "SENT" ? "text-emerald-100" : item.status === "FAILED" ? "text-red-100" : "text-gold-soft";
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-white">{item.subject}</h3><p className="mt-2 text-sm text-muted">{item.recipient}</p></div><Mail className="h-5 w-5 text-gold" /></div><p className={`mt-4 text-sm font-semibold ${tone}`}>{item.status}</p><p className="mt-2 text-xs text-muted">{new Date(item.sentAt).toLocaleString()}</p></Card>;
}

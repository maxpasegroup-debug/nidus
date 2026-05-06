import { apiClient } from "@/services/api";
import type { CommunicationAnnouncement, EmailLog, Message, MessageThread, Notification, PushNotification } from "@/types/communication";

export async function getNotifications() { return (await apiClient.get<{ notifications: Notification[] }>("/notifications")).data.notifications; }
export async function markNotificationRead(id: string) { return (await apiClient.put<{ notification: Notification }>(`/notifications/read/${id}`)).data.notification; }
export async function getMessages() { return (await apiClient.get<{ threads: MessageThread[] }>("/messages")).data.threads; }
export async function createMessageThread(payload: { subject: string }) { return (await apiClient.post<{ thread: MessageThread }>("/messages/thread", payload)).data.thread; }
export async function sendMessage(payload: { threadId: string; receiverId: string; message: string; attachmentUrl?: string }) { return (await apiClient.post<{ message: Message }>("/messages/send", payload)).data.message; }
export async function getMessageThread(id: string) { return (await apiClient.get<{ thread: MessageThread | null }>(`/messages/thread/${id}`)).data.thread; }
export async function getAnnouncements() { return (await apiClient.get<{ announcements: CommunicationAnnouncement[] }>("/announcements")).data.announcements; }
export async function createAnnouncement(payload: { title: string; description: string; audience: string }) { return (await apiClient.post<{ announcement: CommunicationAnnouncement }>("/announcements", payload)).data.announcement; }
export async function getEmailLogs() { return (await apiClient.get<{ emails: EmailLog[] }>("/emails/logs")).data.emails; }
export async function sendEmail(payload: { recipient: string; subject: string; body: string; actionLabel?: string; actionUrl?: string }) { return (await apiClient.post<{ email: EmailLog }>("/emails/send", payload)).data.email; }
export async function sendPush(payload: { title: string; body: string; targetAudience: string }) { return (await apiClient.post<{ push: PushNotification }>("/push/send", payload)).data.push; }

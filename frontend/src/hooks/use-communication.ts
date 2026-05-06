"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/services/api";
import { createAnnouncement, createMessageThread, getAnnouncements, getEmailLogs, getMessageThread, getMessages, getNotifications, markNotificationRead, sendEmail, sendMessage, sendPush } from "@/services/communication";

function useToastMutation<TPayload, TResult>(mutationFn: (payload: TPayload) => Promise<TResult>, keys: unknown[][], message: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      showToast(message, "success");
    },
    onError: (error) => showToast(getApiErrorMessage(error), "error")
  });
}

export function useNotifications() {
  return { ...useQuery({ queryKey: ["communication", "notifications"], queryFn: getNotifications }), markRead: useToastMutation(markNotificationRead, [["communication", "notifications"]], "Notification marked read") };
}

export function useMessages(threadId?: string) {
  return {
    ...useQuery({ queryKey: ["communication", "messages"], queryFn: getMessages }),
    thread: useQuery({ queryKey: ["communication", "messages", threadId], queryFn: () => threadId ? getMessageThread(threadId) : Promise.resolve(null), enabled: Boolean(threadId) }),
    createThread: useToastMutation(createMessageThread, [["communication", "messages"]], "Thread created"),
    send: useToastMutation(sendMessage, [["communication", "messages"], ["communication", "messages", threadId]], "Message sent")
  };
}

export function useAnnouncements() {
  return { ...useQuery({ queryKey: ["communication", "announcements"], queryFn: getAnnouncements }), create: useToastMutation(createAnnouncement, [["communication", "announcements"]], "Announcement published") };
}

export function useEmails() {
  return { ...useQuery({ queryKey: ["communication", "emails"], queryFn: getEmailLogs }), send: useToastMutation(sendEmail, [["communication", "emails"]], "Email sent") };
}

export function usePushNotifications() {
  return { send: useToastMutation(sendPush, [["communication", "push"]], "Push notification queued") };
}

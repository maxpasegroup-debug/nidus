type NotificationPayload = {
  recipient: string;
  message: string;
  context?: Record<string, unknown>;
};

export const crmNotificationService = {
  async sendWhatsAppReminder(payload: NotificationPayload) {
    console.log("[CRM:WHATSAPP_PLACEHOLDER]", payload);
    return { channel: "WHATSAPP", status: "QUEUED_PLACEHOLDER" };
  },
  async sendSmsFollowup(payload: NotificationPayload) {
    console.log("[CRM:SMS_PLACEHOLDER]", payload);
    return { channel: "SMS", status: "QUEUED_PLACEHOLDER" };
  },
  async scheduleAutomatedNotification(payload: NotificationPayload) {
    console.log("[CRM:AUTOMATION_PLACEHOLDER]", payload);
    return { channel: "AUTOMATION", status: "SCHEDULED_PLACEHOLDER" };
  }
};

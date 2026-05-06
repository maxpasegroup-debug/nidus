export type CommUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  targetRole?: string;
  isRead: boolean;
  userId?: string;
  createdAt: string;
};

export type MessageThread = {
  id: string;
  subject: string;
  createdBy: string;
  createdAt: string;
  creator?: CommUser;
  messages?: Message[];
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
  sender?: CommUser;
  receiver?: CommUser;
};

export type CommunicationAnnouncement = {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  audience?: string;
  createdBy?: string;
  createdAt: string;
  creator?: CommUser;
};

export type EmailLog = {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  sentAt: string;
};

export type PushNotification = {
  id: string;
  title: string;
  body: string;
  targetAudience: string;
  status: string;
  createdAt: string;
};

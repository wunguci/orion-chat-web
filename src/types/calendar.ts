export const RecurrenceType = {
  NONE: "none",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export type RecurrenceType =
  (typeof RecurrenceType)[keyof typeof RecurrenceType];

export interface Participant {
  id: string;
  type: "friend" | "group";
  name: string;
  avatar: string;
  userId?: string;
  groupId?: string;
  status?: "pending" | "accepted" | "declined";
}

export interface ParticipantOption {
  id: string;
  type: "friend" | "group";
  name: string;
  avatarUrl?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  location?: string;
  description?: string;
  color: string;
  category: "personal" | "meeting" | "reminder" | "other";
  recurrence: RecurrenceType;
  notificationMinutes: number;
  isAllDay?: boolean;
  participants?: Participant[];
  owner?: {
    userId: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  chatId?: string; // Link to a chat session
  createdAt?: string;
  updatedAt?: string;
}


export const RecurrenceType = {
    NONE: "none",
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    YEARLY: "yearly", 
} as const;

export type RecurrenceType = (typeof RecurrenceType)[keyof typeof RecurrenceType];

export interface Participant {
    id: string;
    name: string;
    avatar: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  location?: string;
  description?: string;
  color: string;
  category: "personal" | "work" | "other";
  recurrence: RecurrenceType;
  notificationMinutes: number;
  participants?: Participant[];
  chatId?: string; // Link to a chat session
}
import type { CalendarEvent, ParticipantOption } from "../types/calendar";
import { api } from "./api";

export type CalendarViewQuery = "day" | "week" | "month" | "year";

interface CalendarParticipantApi {
  id: string;
  type: "friend" | "group";
  userId?: string;
  groupId?: string;
  name: string;
  avatar?: string | null;
  status?: "pending" | "accepted" | "declined";
}

interface CalendarEventApi {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  color: string;
  location?: string;
  category: "personal" | "meeting" | "reminder" | "other";
  recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly";
  notificationMinutes: number;
  isAllDay?: boolean;
  participants?: CalendarParticipantApi[];
  owner?: {
    userId: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ParticipantOptionsResponse {
  friends: ParticipantOption[];
  groups: ParticipantOption[];
}

const toCalendarEvent = (item: CalendarEventApi): CalendarEvent => ({
  id: item.id,
  title: item.title,
  description: item.description,
  start: item.start,
  end: item.end,
  color: item.color,
  location: item.location,
  category:
    item.category === "meeting" ||
    item.category === "reminder" ||
    item.category === "other"
      ? item.category
      : "personal",
  recurrence: item.recurrence,
  notificationMinutes: item.notificationMinutes,
  isAllDay: item.isAllDay,
  participants: (item.participants || []).map((participant) => ({
    id: participant.id,
    type: participant.type,
    name: participant.name,
    avatar:
      participant.avatar || "https://picsum.photos/seed/calendar-user/120",
    userId: participant.userId,
    groupId: participant.groupId,
    status: participant.status,
  })),
  owner: item.owner ?? null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const toPayload = (event: Partial<CalendarEvent>) => ({
  title: event.title,
  startTime: event.start,
  endTime: event.end,
  description: event.description || "",
  location: event.location || "",
  color: event.color || "#008080",
  category: event.category || "personal",
  recurrence: event.recurrence || "none",
  notificationMinutes: event.notificationMinutes ?? 30,
  isAllDay: event.isAllDay ?? false,
  participants: (event.participants || []).map((participant) => ({
    type: participant.type,
    userId: participant.userId,
    groupId: participant.groupId,
    displayName: participant.name,
    avatarUrl: participant.avatar,
  })),
});

export const calendarService = {
  async getEvents(query: {
    view: CalendarViewQuery;
    date: string;
    q?: string;
  }): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({ view: query.view, date: query.date });
    if (query.q?.trim()) {
      params.set("q", query.q.trim());
    }

    const rows = await api.get<CalendarEventApi[]>(
      `/calendar-events?${params.toString()}`,
    );
    return rows.map(toCalendarEvent);
  },

  async createEvent(payload: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const row = await api.post<CalendarEventApi>(
      "/calendar-events",
      toPayload(payload),
    );
    return toCalendarEvent(row);
  },

  async updateEvent(
    eventId: string,
    payload: Partial<CalendarEvent>,
  ): Promise<CalendarEvent> {
    const row = await api.patch<CalendarEventApi>(
      `/calendar-events/${eventId}`,
      toPayload(payload),
    );
    return toCalendarEvent(row);
  },

  async deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/calendar-events/${eventId}`);
  },

  async getParticipantOptions(q?: string): Promise<ParticipantOption[]> {
    const params = new URLSearchParams();
    if (q?.trim()) {
      params.set("q", q.trim());
    }

    const path = params.toString()
      ? `/calendar-events/participant-options?${params.toString()}`
      : "/calendar-events/participant-options";

    const response = await api.get<ParticipantOptionsResponse>(path);
    return [...response.friends, ...response.groups];
  },
  async getPendingInvites(): Promise<CalendarEvent[]> {
    const rows = await api.get<CalendarEventApi[]>("/calendar-events/invites");
    return rows.map(toCalendarEvent);
  },
  async respondToInvite(
    eventId: string,
    status: "accepted" | "declined",
  ): Promise<CalendarEvent> {
    const row = await api.patch<CalendarEventApi>(
      `/calendar-events/${eventId}/respond`,
      { status },
    );
    return toCalendarEvent(row);
  },
};

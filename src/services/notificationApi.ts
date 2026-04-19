import { api } from "./api";
import type {
  AppNotification,
  NotificationListResponse,
  UnreadCountResponse,
} from "../types/notification";

export const notificationApi = {
  getMyNotifications: (limit = 20, skip = 0) =>
    api.get<NotificationListResponse>(
      `/notifications/me?limit=${limit}&skip=${skip}`,
    ),

  getUnreadCount: () =>
    api.get<UnreadCountResponse>("/notifications/me/unread-count"),

  markAsRead: (id: string) =>
    api.patch<AppNotification>(`/notifications/${id}/read`, {}),

  markAllAsRead: () =>
    api.patch<{ success: boolean }>("/notifications/me/read-all", {}),

  deleteNotification: (id: string) =>
    api.delete<{ success: boolean }>(`/notifications/${id}`),
};

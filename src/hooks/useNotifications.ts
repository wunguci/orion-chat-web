import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppNotification } from "../types/notification";
import { notificationApi } from "../services/notificationApi";
import { notificationSocketService } from "../services/websocket/notificationSocket";
import { getToken } from "../utils/token";

type NotificationToastItem = {
  id: string;
  notification: AppNotification;
};

const getNotificationConversationId = (
  item: AppNotification,
): string | undefined => {
  const metadata = item.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;

  const conversationId = metadata.conversationId;
  if (typeof conversationId === "string" && conversationId.length > 0) {
    return conversationId;
  }

  const groupId = metadata.groupId;
  if (typeof groupId === "string" && groupId.length > 0) {
    return groupId;
  }

  return undefined;
};

const isConversationScopedNotification = (item: AppNotification): boolean => {
  const conversationId = getNotificationConversationId(item);
  if (!conversationId) return false;

  return (
    item.type === "message" ||
    item.type === "call" ||
    item.type === "group_invite" ||
    item.type === "group_join_approved" ||
    item.type === "group_join_rejected" ||
    item.type === "group_promoted" ||
    item.type === "group_removed" ||
    item.type === "group_dissolved"
  );
};

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastItems, setToastItems] = useState<NotificationToastItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, unreadRes] = await Promise.all([
        notificationApi.getMyNotifications(20, 0),
        notificationApi.getUnreadCount(),
      ]);

      setNotifications(listRes.items || []);
      setUnreadCount(unreadRes.count || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const updated = await notificationApi.markAsRead(id);
        const target = notifications.find((item) => item._id === id);
        const shouldDecrease = !!target && !target.isRead;

        setNotifications((prev) =>
          prev.map((item) => (item._id === id ? updated : item)),
        );
        if (shouldDecrease) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return updated;
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return null;
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  const removeNotification = useCallback(
    async (id: string) => {
      try {
        const target = notifications.find((item) => item._id === id);
        await notificationApi.deleteNotification(id);

        setNotifications((prev) => prev.filter((item) => item._id !== id));
        setToastItems((prev) =>
          prev.filter((item) => item.notification._id !== id),
        );

        if (target && !target.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        return true;
      } catch (error) {
        console.error("Failed to delete notification:", error);
        return false;
      }
    },
    [notifications],
  );

  const markConversationNotificationsAsRead = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;

      // Chỉ mark-read thông báo message/call của đúng conversation đang mở.
      const pending = notifications.filter(
        (item) =>
          !item.isRead &&
          isConversationScopedNotification(item) &&
          getNotificationConversationId(item) === conversationId,
      );

      if (pending.length === 0) return;

      await Promise.all(pending.map((item) => markAsRead(item._id)));

      try {
        const unread = await notificationApi.getUnreadCount();
        setUnreadCount(unread.count || 0);
      } catch (error) {
        console.error(
          "Failed to refresh unread count after conversation read:",
          error,
        );
      }
    },
    [notifications, markAsRead],
  );

  useEffect(() => {
    fetchNotifications().catch(() => undefined);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;

    const token = getToken();
    const socket = notificationSocketService.connect(
      userId,
      token || undefined,
    );

    const handleRefreshUnread = async () => {
      try {
        // Luôn lấy lại tổng unread từ server để giữ state đúng sau các thao tác bất đồng bộ.
        const unread = await notificationApi.getUnreadCount();
        setUnreadCount(unread.count || 0);
      } catch (error) {
        console.error("Failed to refresh unread count:", error);
      }
    };

    const handleConnect = () => {
      // Fetch lại toàn bộ list khi socket connect/reconnect để bắt kịp notifications bị bỏ lỡ trong thời gian mất kết nối.
      void fetchNotifications();
    };

    const handleNew = (payload: AppNotification) => {
      // Upsert theo _id để tránh duplicate khi reconnect socket.
      setNotifications((prev) => {
        const hasExisting = prev.some((item) => item._id === payload._id);
        if (hasExisting) {
          return prev.map((item) =>
            item._id === payload._id ? payload : item,
          );
        }
        return [payload, ...prev];
      });

      setToastItems((prev) => {
        const next = [{ id: payload._id, notification: payload }, ...prev];
        return next.slice(0, 4);
      });

      void handleRefreshUnread();
    };

    const handleUpdated = (payload: AppNotification) => {
      setNotifications((prev) =>
        prev.map((item) => (item._id === payload._id ? payload : item)),
      );
      void handleRefreshUnread();
    };

    socket.on("connect", handleConnect);
    socket.on("notifications:new", handleNew);
    socket.on("notifications:updated", handleUpdated);
    socket.on("notifications:refresh_unread", handleRefreshUnread);
    socket.on("notifications:all_read", () => {
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notifications:new", handleNew);
      socket.off("notifications:updated", handleUpdated);
      socket.off("notifications:refresh_unread", handleRefreshUnread);
      socket.off("notifications:all_read");
      notificationSocketService.disconnect();
    };
  }, [userId]);

  const dismissToast = useCallback((id: string) => {
    setToastItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const unreadMessageCount = useMemo(
    () =>
      notifications.filter(
        (item) =>
          !item.isRead && (item.type === "message" || item.type === "call"),
      ).length,
    [notifications],
  );

  const unreadFriendCount = useMemo(
    () =>
      notifications.filter(
        (item) => !item.isRead && item.type === "friend_request",
      ).length,
    [notifications],
  );

  const unreadCalendarCount = useMemo(
    () =>
      notifications.filter(
        (item) =>
          !item.isRead &&
          (item.type === "event_invite" || item.type === "event_reminder"),
      ).length,
    [notifications],
  );

  const unreadTypeCounts = useMemo(
    () => ({
      chat: unreadMessageCount,
      friend: unreadFriendCount,
      calendar: unreadCalendarCount,
    }),
    [unreadMessageCount, unreadFriendCount, unreadCalendarCount],
  );

  const unreadByConversation = useMemo(() => {
    const result: Record<string, number> = {};

    notifications.forEach((item) => {
      const conversationId = getNotificationConversationId(item);
      if (
        !item.isRead &&
        typeof conversationId === "string" &&
        isConversationScopedNotification(item)
      ) {
        result[conversationId] = (result[conversationId] || 0) + 1;
      }
    });

    return result;
  }, [notifications]);

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return {
    notifications,
    unreadCount,
    hasUnread,
    loading,
    toastItems,
    dismissToast,
    unreadMessageCount,
    unreadFriendCount,
    unreadCalendarCount,
    unreadTypeCounts,
    unreadByConversation,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    markConversationNotificationsAsRead,
  };
}

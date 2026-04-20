import { useEffect, useRef } from "react";
import {
  MdCalendarToday,
  MdCall,
  MdChat,
  MdNotifications,
  MdPersonAdd,
  MdGroups,
  MdInfo,
} from "react-icons/md";
import type { IconType } from "react-icons";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import type {
  AppNotification,
  NotificationType,
} from "../../types/notification";

type NotificationCenterProps = {
  userId?: string;
  open: boolean;
  onToggle: () => void;
  onUnreadMessageCountChange?: (count: number) => void;
  onUnreadTypeCountsChange?: (counts: {
    chat: number;
    friend: number;
    calendar: number;
  }) => void;
};

const typeMeta: Record<
  NotificationType,
  { icon: IconType; badgeClass: string; defaultTitle: string }
> = {
  message: {
    icon: MdChat,
    badgeClass: "bg-sky-100 text-sky-700",
    defaultTitle: "New message",
  },
  call: {
    icon: MdCall,
    badgeClass: "bg-emerald-100 text-emerald-700",
    defaultTitle: "New call",
  },
  friend_request: {
    icon: MdPersonAdd,
    badgeClass: "bg-amber-100 text-amber-700",
    defaultTitle: "Friend request",
  },
  group_invite: {
    icon: MdGroups,
    badgeClass: "bg-indigo-100 text-indigo-700",
    defaultTitle: "Group invite",
  },
  group_join_approved: {
    icon: MdGroups,
    badgeClass: "bg-emerald-100 text-emerald-700",
    defaultTitle: "Group join approved",
  },
  group_join_rejected: {
    icon: MdGroups,
    badgeClass: "bg-rose-100 text-rose-700",
    defaultTitle: "Group join rejected",
  },
  group_promoted: {
    icon: MdGroups,
    badgeClass: "bg-violet-100 text-violet-700",
    defaultTitle: "Group role updated",
  },
  group_removed: {
    icon: MdGroups,
    badgeClass: "bg-red-100 text-red-700",
    defaultTitle: "Removed from group",
  },
  group_dissolved: {
    icon: MdGroups,
    badgeClass: "bg-slate-200 text-slate-700",
    defaultTitle: "Group dissolved",
  },
  event_invite: {
    icon: MdCalendarToday,
    badgeClass: "bg-purple-100 text-purple-700",
    defaultTitle: "Event invite",
  },
  event_reminder: {
    icon: MdCalendarToday,
    badgeClass: "bg-orange-100 text-orange-700",
    defaultTitle: "Event reminder",
  },
  system: {
    icon: MdInfo,
    badgeClass: "bg-slate-200 text-slate-700",
    defaultTitle: "System notification",
  },
};

const resolveNotificationContent = (
  notification: AppNotification,
  defaultTitle: string,
) => {
  if (notification.type !== "message" && notification.type !== "call") {
    return {
      title: notification.title || defaultTitle,
      body: notification.body,
    };
  }

  const metadata = (notification.metadata || {}) as {
    senderName?: string;
    conversationType?: string;
    groupName?: string;
  };

  const senderName = metadata.senderName || notification.title || "Someone";
  const isGroupMessage =
    metadata.conversationType === "GROUP" || !!metadata.groupName;

  if (isGroupMessage) {
    const groupName = metadata.groupName || "group";

    return {
      title: `${senderName} in ${groupName} group`,
      body: notification.body,
    };
  }

  return {
    title: `${senderName} sent to you`,
    body: notification.body,
  };
};

function NotificationToastStack({
  items,
  onDismiss,
  onOpenNotification,
}: {
  items: Array<{ id: string; notification: AppNotification }>;
  onDismiss: (id: string) => void;
  onOpenNotification: (notification: AppNotification) => void | Promise<void>;
}) {
  useEffect(() => {
    if (items.length === 0) return;

    const timer = setInterval(() => {
      const oldest = items[items.length - 1];
      if (oldest) {
        onDismiss(oldest.id);
      }
    }, 5500);

    return () => {
      clearInterval(timer);
    };
  }, [items, onDismiss]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-6 bottom-6 z-60 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
      {items.map(({ id, notification }) => {
        const meta = typeMeta[notification.type] || typeMeta.system;
        const Icon = meta.icon;
        const resolved = resolveNotificationContent(
          notification,
          meta.defaultTitle,
        );

        return (
          <div
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => {
              void onOpenNotification(notification);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                void onOpenNotification(notification);
              }
            }}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-lg transition-colors hover:bg-slate-50"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.badgeClass}`}
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {resolved.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                  {resolved.body}
                </p>
              </div>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDismiss(id);
                }}
                className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700"
                aria-label="Dismiss notification"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function NotificationCenter({
  userId,
  open,
  onToggle,
  onUnreadMessageCountChange,
  onUnreadTypeCountsChange,
}: NotificationCenterProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    unreadMessageCount,
    unreadTypeCounts,
    unreadByConversation,
    toastItems,
    markAllAsRead,
    markAsRead,
    removeNotification,
    markConversationNotificationsAsRead,
    dismissToast,
  } = useNotifications(userId);

  useEffect(() => {
    // Đồng bộ badge trên sidebar theo số thông báo message/call chưa đọc.
    onUnreadMessageCountChange?.(unreadMessageCount);
  }, [onUnreadMessageCountChange, unreadMessageCount]);

  useEffect(() => {
    onUnreadTypeCountsChange?.(unreadTypeCounts);
  }, [onUnreadTypeCountsChange, unreadTypeCounts]);

  useEffect(() => {
    const globalWindow = window as Window & {
      __unreadByConversation?: Record<string, number>;
    };
    globalWindow.__unreadByConversation = unreadByConversation;

    window.dispatchEvent(
      new CustomEvent("notifications:unread_by_conversation", {
        detail: { unreadByConversation },
      }),
    );
  }, [unreadByConversation]);

  useEffect(() => {
    const handleRequestUnreadByConversation = () => {
      window.dispatchEvent(
        new CustomEvent("notifications:unread_by_conversation", {
          detail: { unreadByConversation },
        }),
      );
    };

    window.addEventListener(
      "notifications:request_unread_by_conversation",
      handleRequestUnreadByConversation,
    );

    return () => {
      window.removeEventListener(
        "notifications:request_unread_by_conversation",
        handleRequestUnreadByConversation,
      );
    };
  }, [unreadByConversation]);

  useEffect(() => {
    // Chỉ mark-read khi chat đã phát tín hiệu read thực sự.
    const handleConversationRead = (event: Event) => {
      const customEvent = event as CustomEvent<{ conversationId?: string }>;
      const conversationId = customEvent.detail?.conversationId;

      if (!conversationId) return;
      markConversationNotificationsAsRead(conversationId).catch(
        () => undefined,
      );
    };

    window.addEventListener("chat:conversation_read", handleConversationRead);

    return () => {
      window.removeEventListener(
        "chat:conversation_read",
        handleConversationRead,
      );
    };
  }, [markConversationNotificationsAsRead]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;

      const clickedInsidePanel = panelRef.current?.contains(targetNode);
      const clickedOnTrigger = triggerRef.current?.contains(targetNode);

      if (!clickedInsidePanel && !clickedOnTrigger) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onToggle]);

  const openNotification = async (item: AppNotification) => {
    // Khi user click thông báo/toast: đánh dấu đã đọc rồi điều hướng đến đúng màn hình.
    if (!item.isRead) {
      await markAsRead(item._id);
    }

    const targetConversationId =
      typeof item.metadata?.conversationId === "string"
        ? item.metadata.conversationId
        : typeof item.metadata?.groupId === "string"
          ? item.metadata.groupId
          : undefined;

    if (item.link) {
      if (item.type === "friend_request" && item.link.startsWith("/friends")) {
        navigate(item.link, {
          state: {
            activeCategory: "requests",
          },
        });
        return;
      }

      if (targetConversationId && item.link.startsWith("/chat")) {
        navigate(item.link, {
          state: {
            selectedConversationId: targetConversationId,
          },
        });
        return;
      }

      navigate(item.link);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={onToggle}
        className="relative h-10 w-10 cursor-pointer rounded-lg text-slate-400 transition-all hover:bg-slate-200"
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="flex items-center justify-center">
          <MdNotifications className="h-5 w-5" />
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-20 left-20 z-40 max-h-[75vh] w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Notifications
            </h3>
            <button
              onClick={() => markAllAsRead()}
              className="cursor-pointer text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((item) => {
                const meta = typeMeta[item.type] || typeMeta.system;
                const Icon = meta.icon;
                const resolved = resolveNotificationContent(
                  item,
                  meta.defaultTitle,
                );

                return (
                  <div
                    key={item._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      void openNotification(item);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void openNotification(item);
                      }
                    }}
                    className={`w-full cursor-pointer border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      item.isRead ? "bg-white" : "bg-teal-50/70"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.badgeClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800">
                          {resolved.title}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-slate-600">
                          {resolved.body}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void removeNotification(item._id);
                        }}
                        className="shrink-0 cursor-pointer self-start rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <NotificationToastStack
        items={toastItems}
        onDismiss={dismissToast}
        onOpenNotification={openNotification}
      />
    </>
  );
}

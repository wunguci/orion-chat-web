import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatSidebarWithConversationService from '../../components/chat/ChatSidebarWithConversationService';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageList, {
  type SocketMessage,
} from "../../components/chat/MessageList";
import ChatInput from "../../components/chat/ChatInput";
import AIGridResult from "../../components/ai/AIGridResult";
import { ConversationInfoPanel } from "../../components/chat/ConversationInfoPanel";
import { ConversationGroupInfoPanel } from "../../components/chat/ConversationGroupInfoPanel";
import { SearchModal } from "../../components/chat/SearchModal";
import { CreateGroupModal } from "../../components/chat/CreateGroupModal";
import Modal from "../../components/common/Modal";
import { Dialog } from "../../components/common/Dialog";
import {
  sendMessage,
  socketService,
  offMessageNew,
  onMessageNew,
  onGroupInfoUpdated,
  offGroupInfoUpdated,
  onMessageReactionUpdated,
  onMessageRecalled,
  offMessageReactionUpdated,
  offMessageRecalled,
  onMessagePinned,
  offMessagePinned,
  onMessageUnpinned,
  offMessageUnpinned,
  onTyping,
  offTyping,
  onMessageDeleted,
  offMessageDeleted,
  onMessageSeen,
  offMessageSeen,
  onConversationDeleted,
  offConversationDeleted,
  joinConversation,
} from "../../services/socket";
import {
  useConversations,
  useConversationDetail,
  useConversationMessages,
} from "../../hooks/useConversation";
import { useChatRoom } from "../../hooks/useChatRoom";
import { conversationApi } from "../../services/conversationApi";
import { getCurrentUserId, getCurrentUserName } from "../../utils/auth";
import { debugAuthStatus, getToken, getUser } from "../../utils/token";
import { getUserInfo } from "../../services/userService";
import { useCall } from "../../hooks/useCall";
import { useGroupCallContext } from "../../hooks/useGroupCallContext";
import type { PinnedMessageItem } from "../../types/conversation";
import type { AppNotification } from "../../types/notification";
import { mapChatActionError } from "../../utils/chatMessageErrors";
import { orionAiService } from "../../services/orionAiService";
import type { AiAction, AiGridResponse } from "../../types/orion-ai";
import { useUserSettings } from "../../hooks/useSettings";
import {
  APPEARANCE_THEME_CHANGED_EVENT,
  buildAppearanceThemeVars,
  type AppearanceThemeChangeDetail,
} from "../../theme/appearance";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    'http://localhost:3000';

const toAbsoluteMediaUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined;
    if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('blob:') ||
        url.startsWith('data:')
    ) {
        return url;
    }

    const normalizedBase = API_BASE_URL.replace(/\/$/, '');
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${normalizedBase}${normalizedPath}`;
};

export const ChatPage: React.FC = () => {
  type ChatSocketMessage = SocketMessage & {
    clientMessageId?: string;
    conversationId?: string;
    type?: "text" | "image" | "file" | "audio" | "video" | "call";
    messageType?: string;
    callData?: {
      callType?: "audio" | "video";
      callStatus?: "completed" | "missed" | "declined";
      duration?: number;
      isInitiator?: boolean;
      wasRejected?: boolean;
    };
  };

    type IncomingSocketPayload = {
        messageId?: string;
        id?: string;
        _id?: string;
        clientMessageId?: string;
        senderId?: string;
        senderBy?: string;
        senderName?: string;
        senderAvatar?: string;
        content?: string;
        timestamp?: string;
        createdAt?: string | Date;
        isFile?: boolean;
        type?: string;
        messageType?:
            | 'TEXT'
            | 'IMAGE'
            | 'FILE'
            | 'VIDEO'
            | 'AUDIO'
            | 'CALL'
            | 'text'
            | 'image'
            | 'file'
            | 'video'
            | 'audio'
            | 'call';
        fileUrl?: string;
        mediaUrl?: string;
        fileName?: string;
        fileType?: string;
        mimeType?: string;
        originalName?: string;
        filename?: string;
        url?: string;
        media?: {
            url?: string;
            mimeType?: string;
            fileName?: string;
        };
        attachments?: Array<{
            mediaUrl?: string;
            fileUrl?: string;
            url?: string;
            fileName?: string;
            originalName?: string;
            filename?: string;
            mimeType?: string;
            fileType?: string;
            messageType?: string;
        }>;
        isDeleted?: boolean;
        isRecalled?: boolean;
        isPinned?: boolean;
        pinnedAt?: string;
        replyToMessageId?: string;
        replyToMessagePreview?: {
            messageId?: string;
            content?: string;
            senderName?: string;
            snippet?: string;
            createdAt?: string | Date;
        } | null;
        messageStatus?:
            | 'SENDING'
            | 'SENT'
            | 'DELIVERED'
            | 'READ'
            | 'SEEN'
            | 'FAILED'
            | 'UPLOADING';
        reactions?: Array<{
            userId?: string;
            emoji?: string;
            reactedAt?: string;
        }>;
        conversationId?: string;
        callData?: {
            callType?: 'audio' | 'video';
            callStatus?: 'completed' | 'missed' | 'declined';
            duration?: number;
            isInitiator?: boolean;
            wasRejected?: boolean;
        };
        message?: Partial<IncomingSocketPayload>;
        data?: Partial<IncomingSocketPayload>;
    };

    const normalizeReactions = useCallback(
        (input: unknown): NonNullable<SocketMessage['reactions']> => {
            if (!Array.isArray(input)) return [];

            const normalized: NonNullable<SocketMessage['reactions']> = [];

            for (const item of input) {
                if (!item || typeof item !== 'object') continue;

                const reaction = item as {
                    emoji?: string;
                    reaction?: string;
                    userId?: string;
                    user?: { _id?: string; id?: string; userId?: string };
                    users?: Array<
                        string | { _id?: string; id?: string; userId?: string }
                    >;
                    reactedBy?: Array<
                        string | { _id?: string; id?: string; userId?: string }
                    >;
                    reactedAt?: string | Date;
                };

                const emoji = reaction.emoji || reaction.reaction;
                if (!emoji) continue;

                const reactionUsers = reaction.users || reaction.reactedBy;
                if (Array.isArray(reactionUsers) && reactionUsers.length > 0) {
                    for (const user of reactionUsers) {
                        const userId =
                            typeof user === 'string'
                                ? user
                                : user?._id || user?.id || user?.userId;
                        if (!userId) continue;

                        normalized.push({
                            userId,
                            emoji,
                            reactedAt:
                                typeof reaction.reactedAt === 'string'
                                    ? reaction.reactedAt
                                    : reaction.reactedAt?.toISOString(),
                        });
                    }

                    continue;
                }

                const userId =
                    reaction.userId ||
                    reaction.user?._id ||
                    reaction.user?.id ||
                    reaction.user?.userId ||
                    '';

                normalized.push({
                    userId,
                    emoji,
                    reactedAt:
                        typeof reaction.reactedAt === 'string'
                            ? reaction.reactedAt
                            : reaction.reactedAt?.toISOString(),
                });
            }

            return normalized;
        },
        [],
    );

  // Get user ID inside component (after auth is loaded)
  const USER_ID = getCurrentUserId();
  const USERNAME = getCurrentUserName();
  const { settings: userSettings } = useUserSettings();
  const [chatAppearance, setChatAppearance] =
    useState<AppearanceThemeChangeDetail>({
      theme: undefined,
      appearanceColor: undefined,
    });

  useEffect(() => {
    setChatAppearance({
      theme: userSettings?.theme,
      appearanceColor: userSettings?.appearanceColor,
    });
  }, [userSettings?.appearanceColor, userSettings?.theme]);

  useEffect(() => {
    const handleAppearanceChanged = (event: Event) => {
      const customEvent = event as CustomEvent<AppearanceThemeChangeDetail>;

      setChatAppearance((prev) => ({
        theme: customEvent.detail?.theme ?? prev.theme,
        appearanceColor:
          customEvent.detail?.appearanceColor ?? prev.appearanceColor,
      }));
    };

    window.addEventListener(
      APPEARANCE_THEME_CHANGED_EVENT,
      handleAppearanceChanged,
    );

    return () => {
      window.removeEventListener(
        APPEARANCE_THEME_CHANGED_EVENT,
        handleAppearanceChanged,
      );
    };
  }, []);

  const chatThemeVars = useMemo(
    () =>
      buildAppearanceThemeVars({
        theme: chatAppearance.theme,
        appearanceColor: chatAppearance.appearanceColor,
        prefix: "chat",
      }) as React.CSSProperties,
    [chatAppearance.appearanceColor, chatAppearance.theme],
  );
  const effectiveCurrentUserId =
    USER_ID || getUser()?.userId || getUser()?.id || "";
  const {
    initiateCall,
    status: callStatus,
    startTime: callStartTime,
    isInitiator,
    wasAnswered,
    wasRejected,
  } = useCall();
  const { initiateGroupCall, status: groupCallStatus } = useGroupCallContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [socketMessages, setSocketMessages] = useState<ChatSocketMessage[]>([]);
  const prevCallStatusRef = useRef<typeof callStatus>("idle");
  const wasInitiatorRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [hiddenMessageKeys, setHiddenMessageKeys] = useState<Set<string>>(
    new Set(),
  );
  const [recalledMessageKeys, setRecalledMessageKeys] = useState<Set<string>>(
    new Set(),
  );
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] =
    useState<SocketMessage | null>(null);
  const [forwardTargetConversationId, setForwardTargetConversationId] =
    useState("");
  const [isForwarding, setIsForwarding] = useState(false);
  const [isRecallConfirmOpen, setIsRecallConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingRecallMessage, setPendingRecallMessage] =
    useState<SocketMessage | null>(null);
  const [pendingDeleteMessage, setPendingDeleteMessage] =
    useState<SocketMessage | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AiGridResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [composerDraftText, setComposerDraftText] = useState("");
  const [smartEmotionEnabled, setSmartEmotionEnabled] = useState(false);
  const [autoWorkflowEnabled, setAutoWorkflowEnabled] = useState(true);
  const [emotionByMessageId, setEmotionByMessageId] = useState<
    Record<
      string,
      { label: string; icon?: string; summary?: string; tone?: string }
    >
  >({});
  const emotionAttemptedMessageIdsRef = useRef<Set<string>>(new Set());
  const [reactionOverrides, setReactionOverrides] = useState<
    Record<string, NonNullable<SocketMessage["reactions"]>>
  >({});
  const [iAmBlocked, setIAmBlocked] = useState(false); // Current user is blocked
  const [iAmTheBlocker, setIAmTheBlocker] = useState(false); // Current user is the blocker (can unblock)
  const [typingUserNames, setTypingUserNames] = useState<string[]>([]);
  const [openGroupInfoEditTick, setOpenGroupInfoEditTick] = useState(0);
  const [groupInfoOverrides, setGroupInfoOverrides] = useState<
    Record<string, { groupName?: string; groupAvatar?: string }>
  >({});
  const [replyDraft, setReplyDraft] = useState<{
    conversationId: string;
    replyToMessageId: string;
    senderName?: string;
    snippet?: string;
  } | null>(null);
  const [pinOverrides, setPinOverrides] = useState<
    Record<string, { isPinned: boolean; pinnedAt?: string }>
  >({});
  const [pinnedMessagesByConversation, setPinnedMessagesByConversation] =
    useState<Record<string, PinnedMessageItem[]>>({});
  const messageListenerRef = useRef<
    ((payload: IncomingSocketPayload) => void) | null
  >(null);
  const pendingMediaHydrationRef = useRef<Set<string>>(new Set());
  const lastReadMessageIdRef = useRef<string | null>(null);
  const conversationIdsRef = useRef<Set<string>>(new Set());
  const sidebarJoinedConversationIdsRef = useRef<Set<string>>(new Set());
  const sidebarJoiningConversationIdsRef = useRef<Set<string>>(new Set());
  const lastConversationRefreshAtRef = useRef<number>(0);

    // Fetch all conversations (for sidebar + forward modal)
    const {
        conversations,
        loading: conversationsLoading,
        error: conversationsError,
        refreshConversations,
        updateConversationLastMessage,
        markConversationLastMessageRecalled,
    } = useConversations();

    useEffect(() => {
        conversationIdsRef.current = new Set(
            conversations.map((item) => item.conversationId),
        );
    }, [conversations]);

  const refreshConversationsThrottled = useCallback(() => {
    const now = Date.now();
    if (now - lastConversationRefreshAtRef.current < 800) return;
    lastConversationRefreshAtRef.current = now;
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    const handleConversationDeleted = (payload: { conversationId: string }) => {
      if (payload.conversationId === selectedConversationId) {
        setSelectedConversationId(null);
      }
      void refreshConversations();
    };

    onConversationDeleted(handleConversationDeleted);
    return () => {
      offConversationDeleted();
    };
  }, [refreshConversations, selectedConversationId]);

    // Fetch selected conversation detail
    // No need to pass USER_ID - JWT token from localStorage is used
    const { conversation: selectedConversation, fetchDetail } =
        useConversationDetail(selectedConversationId || '');

    // Fetch messages for selected conversation
    // No need to pass USER_ID - JWT token from localStorage is used
    const { messages: paginatedMessages } = useConversationMessages(
        selectedConversationId || '',
        30,
    );

  const {
    emitTyping,
    emitRead,
    sendMessage: sendChatMessage,
    joinStatus,
    isConnected: isChatSocketConnected,
  } = useChatRoom({
    conversationId: selectedConversationId,
    enabled: true,
    onJoinError: setError,
  });

  useEffect(() => {
    if (!isChatSocketConnected) return;

    let isCancelled = false;

    for (const conversation of conversations) {
      const conversationId = conversation.conversationId;
      if (!conversationId) continue;
      if (sidebarJoinedConversationIdsRef.current.has(conversationId)) continue;
      if (sidebarJoiningConversationIdsRef.current.has(conversationId)) {
        continue;
      }

      sidebarJoiningConversationIdsRef.current.add(conversationId);

      void joinConversation(
        `sidebar_join_${conversationId}_${Date.now()}`,
        conversationId,
      )
        .then((ack) => {
          if (!isCancelled && ack?.ok) {
            sidebarJoinedConversationIdsRef.current.add(conversationId);
          }
        })
        .catch((error) => {
          console.warn(
            "[ChatPage] Could not join sidebar conversation room:",
            conversationId,
            error,
          );
        })
        .finally(() => {
          sidebarJoiningConversationIdsRef.current.delete(conversationId);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [conversations, isChatSocketConnected]);

    useEffect(() => {
        const handleGroupInfoUpdatedRealtime = (payload: {
            groupId: string;
            groupName?: string;
            groupAvatar?: string;
        }) => {
            setGroupInfoOverrides((prev) => {
                const previousForGroup = prev[payload.groupId] || {};

                return {
                    ...prev,
                    [payload.groupId]: {
                        ...previousForGroup,
                        ...(payload.groupName
                            ? { groupName: payload.groupName }
                            : {}),
                        ...(payload.groupAvatar
                            ? {
                                  groupAvatar: toAbsoluteMediaUrl(
                                      payload.groupAvatar,
                                  ),
                              }
                            : {}),
                    },
                };
            });

            if (payload.groupId === selectedConversationId) {
                void fetchDetail();
            }

            void refreshConversations();
        };

        onGroupInfoUpdated(handleGroupInfoUpdatedRealtime);
        return () => {
            offGroupInfoUpdated();
        };
    }, [selectedConversationId, refreshConversations, fetchDetail]);

    // Lắng nghe sự kiện tạo nhóm mới để tự động refresh danh sách hội thoại
    useEffect(() => {
        const handleGroupCreated = () => {
            void refreshConversations();
        };

        onGroupCreated(handleGroupCreated);
        return () => {
            offGroupCreated();
        };
    }, [refreshConversations]);

    const getReceiverId = useCallback(() => {
        if (!selectedConversation) return '';

        const otherParticipant = selectedConversation.participants?.find(
            (p) => p.userId !== USER_ID,
        );
        return otherParticipant?.userId ?? USER_ID;
    }, [selectedConversation, USER_ID]);

    const getMessageKey = useCallback(
        (message: Pick<SocketMessage, 'id' | 'clientMessageId'>) => {
            const hasPersistedId =
                !!message.id && /^[a-f0-9]{24}$/i.test(message.id);

            if (hasPersistedId) {
                return message.id;
            }

            return message.clientMessageId || message.id;
        },
        [],
    );

    const isPersistedMessageId = useCallback(
        (messageId?: string) =>
            !!messageId && /^[a-f0-9]{24}$/i.test(messageId),
        [],
    );

    const resolvePersistedMessageId = useCallback(
        (message: SocketMessage): string | null => {
            if (isPersistedMessageId(message.id)) {
                return message.id;
            }

            if (isPersistedMessageId(message.clientMessageId)) {
                return message.clientMessageId || null;
            }

            const matched = paginatedMessages.find(
                (item) =>
                    !!message.clientMessageId &&
                    item.clientMessageId === message.clientMessageId,
            );

            if (!matched) return null;

            const matchedPersistedId = [matched.messageId, matched._id].find(
                (candidate) => isPersistedMessageId(candidate),
            );

            return matchedPersistedId || null;
        },
        [isPersistedMessageId, paginatedMessages],
    );

    // Theo doi message da thu hoi de dong bo realtime cho danh sach message.
    const markMessageAsRecalled = useCallback((messageId?: string) => {
        if (!messageId) return;

        setRecalledMessageKeys((prev) => {
            const next = new Set(prev);
            next.add(messageId);
            return next;
        });
    }, []);

    // Helper function to load block status
    const loadBlockStatus = useCallback(
        async (convId?: string) => {
            const conversationId =
                convId || selectedConversation?.conversationId;
            if (!conversationId) {
                setIAmBlocked(false);
                setIAmTheBlocker(false);
                return;
            }

            try {
                const response =
                    await conversationApi.getBlockStatus(conversationId);
                // Backend response:
                // - iAmBlocked: current user bị chặn
                // - iAmTheBlocker: current user là người chặn (có nút bỏ chặn)
                setIAmBlocked(response?.iAmBlocked || false);
                setIAmTheBlocker(response?.iAmTheBlocker || false);
            } catch (error) {
                console.error('Error loading block status:', error);
                setIAmBlocked(false);
                setIAmTheBlocker(false);
            }
        },
        [selectedConversation?.conversationId],
    );

    // Load block status when conversation changes
    useEffect(() => {
        loadBlockStatus();
    }, [loadBlockStatus]);

    // Auto-select conversation from location state (e.g., from friend chat click)
    useEffect(() => {
        const state = location.state as {
            selectedConversationId?: string;
        } | null;
        if (state?.selectedConversationId && !selectedConversationId) {
            setSelectedConversationId(state.selectedConversationId);
        }
    }, [location.state, selectedConversationId]);

    // Poll block status every 5 seconds to detect when other user blocks/unblocks
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (selectedConversation?.conversationId) {
                loadBlockStatus();
            }
        }, 5000); // Poll mỗi 5 giây

        return () => clearInterval(intervalId);
    }, [selectedConversation?.conversationId, loadBlockStatus]);

    // Refresh conversations when navigating from friend page (new conversation created)
    useEffect(() => {
        if (location.state?.selectedConversationId) {
            // Wait a moment for backend to fully process conversation creation
            const timer = setTimeout(() => {
                refreshConversations();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [location.state?.selectedConversationId, refreshConversations]);

    useEffect(() => {
        if (!USER_ID) return;

        const token = getToken();
        const notificationSocket =
            socketService.getNotificationSocket() ||
            socketService.connectNotification(USER_ID, token || undefined);

        const isGroupRelatedNotification = (payload: AppNotification) => {
            const type = String(payload.type || '').toLowerCase();
            const metadata = payload.metadata || {};

            const hasConversationReference =
                typeof metadata.conversationId === 'string' ||
                typeof metadata.groupId === 'string' ||
                (typeof payload.link === 'string' &&
                    /\/chat|conversation|group/i.test(payload.link));

            return (
                type === 'group_invite' ||
                type.startsWith('group_') ||
                hasConversationReference
            );
        };

        const handleNotificationNew = (payload: AppNotification) => {
            if (!isGroupRelatedNotification(payload)) return;
            void refreshConversations();
        };

        const handleNotificationUpdated = (payload: AppNotification) => {
            if (!isGroupRelatedNotification(payload)) return;
            void refreshConversations();
        };

        notificationSocket.on('notifications:new', handleNotificationNew);
        notificationSocket.on(
            'notifications:updated',
            handleNotificationUpdated,
        );

        return () => {
            notificationSocket.off('notifications:new', handleNotificationNew);
            notificationSocket.off(
                'notifications:updated',
                handleNotificationUpdated,
            );
        };
    }, [USER_ID, refreshConversations]);

    const handleGroupConversationRemoved = useCallback(
        async (conversationId: string) => {
            setSelectedConversationId((prev) =>
                prev === conversationId ? null : prev,
            );
            await refreshConversations();
        },
        [refreshConversations],
    );

    useEffect(() => {
        const handleForbiddenConversation = (event: Event) => {
            const customEvent = event as CustomEvent<{
                conversationId?: string;
            }>;
            const forbiddenConversationId = customEvent.detail?.conversationId;

            if (!forbiddenConversationId) return;

            void handleGroupConversationRemoved(forbiddenConversationId);
        };

        window.addEventListener(
            'chat:conversation_forbidden',
            handleForbiddenConversation,
        );

        return () => {
            window.removeEventListener(
                'chat:conversation_forbidden',
                handleForbiddenConversation,
            );
        };
    }, [handleGroupConversationRemoved]);

    // Handle unblock user - chỉ người chặn mới có thể mở chặn
    const handleUnblockUser = async () => {
        if (!selectedConversation?.conversationId) return;

        // Verify current user là người chặn (iAmTheBlocker)
        if (!iAmTheBlocker) {
            console.error('Only the person who blocked can unblock');
            return;
        }

        try {
            await conversationApi.unblockUser(
                selectedConversation.conversationId,
            );
            // Reload block status immediately để cả 2 bên đều biết
            await loadBlockStatus();
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    };

    const toSocketMessage = useCallback(
        (payload: IncomingSocketPayload): ChatSocketMessage => {
            const attachment = payload?.attachments?.[0];
            const resolvedFileUrl =
                payload?.fileUrl ||
                payload?.mediaUrl ||
                payload?.url ||
                payload?.media?.url ||
                attachment?.mediaUrl ||
                attachment?.fileUrl ||
                attachment?.url;
            const resolvedFileName =
                payload?.fileName ||
                payload?.originalName ||
                payload?.filename ||
                payload?.media?.fileName ||
                attachment?.fileName ||
                attachment?.originalName ||
                attachment?.filename;
            const contentAsFileName =
                resolvedFileUrl &&
                /\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|mov|webm|mkv|avi|wmv|flv|m4v|mp3|wav|ogg|aac|m4a)$/i.test(
                    payload?.content || '',
                )
                    ? payload?.content
                    : undefined;
            const normalizedFileName = resolvedFileName || contentAsFileName;
            const resolvedMimeType =
                payload?.fileType ||
                payload?.mimeType ||
                payload?.media?.mimeType ||
                attachment?.mimeType ||
                attachment?.fileType;
            const messageType =
                payload?.messageType ||
                payload?.type ||
                attachment?.messageType;
            const normalizedType = String(messageType || '').toLowerCase();
            const inferredMediaType =
                resolvedMimeType?.startsWith('image/') ||
                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                    normalizedFileName || resolvedFileUrl || '',
                )
                    ? 'image'
                    : resolvedMimeType?.startsWith('video/') ||
                        /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v)$/i.test(
                            normalizedFileName || resolvedFileUrl || '',
                        )
                      ? 'video'
                      : resolvedMimeType?.startsWith('audio/')
                        ? 'audio'
                        : undefined;
            const effectiveType =
                normalizedType && normalizedType !== 'text'
                    ? normalizedType
                    : inferredMediaType ||
                      (resolvedFileUrl ? 'file' : normalizedType || 'text');
            const resolvedType: ChatSocketMessage['type'] =
                effectiveType === 'image'
                    ? 'image'
                    : effectiveType === 'video'
                      ? 'video'
                      : effectiveType === 'file'
                        ? 'file'
                        : effectiveType === 'audio'
                          ? 'audio'
                          : effectiveType === 'call'
                            ? 'call'
                            : 'text';
            const isImageType =
                messageType === 'IMAGE' ||
                messageType === 'image' ||
                resolvedMimeType?.startsWith('image/');
            const isVideoType =
                messageType === 'VIDEO' ||
                messageType === 'video' ||
                resolvedMimeType?.startsWith('video/');
            const isAudioType =
                messageType === 'AUDIO' ||
                messageType === 'audio' ||
                resolvedMimeType?.startsWith('audio/');

            // Get sender ID and use it as fallback for name
            const senderId =
                payload?.senderId || payload?.senderBy || 'unknown';

            const normalizedReplyPreview = payload?.replyToMessagePreview
                ? {
                      messageId:
                          payload.replyToMessagePreview.messageId ||
                          payload.replyToMessageId,
                      senderName:
                          payload.replyToMessagePreview.senderName ||
                          'Tin nhắn gốc',
                      content:
                          payload.replyToMessagePreview.content ||
                          payload.replyToMessagePreview.snippet ||
                          '',
                      snippet:
                          payload.replyToMessagePreview.snippet ||
                          payload.replyToMessagePreview.content ||
                          '',
                      createdAt:
                          payload.replyToMessagePreview.createdAt || undefined,
                  }
                : null;
            const createdAtValue =
                payload?.createdAt instanceof Date
                    ? payload.createdAt.toISOString()
                    : payload?.createdAt;

      return {
        id:
          payload?.messageId ||
          payload?.id ||
          payload?._id ||
          payload?.clientMessageId ||
          `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        clientMessageId: payload?.clientMessageId,
        senderId: senderId,
        // Use senderName if provided, otherwise use senderId (phone/userId) as fallback
        senderName: payload?.senderName || senderId,
        senderAvatar: toAbsoluteMediaUrl(payload?.senderAvatar),
        content: payload?.content || "",
        timestamp:
          payload?.timestamp || createdAtValue || new Date().toISOString(),
        isFile:
          payload?.isFile ||
          effectiveType === "file" ||
          effectiveType === "image" ||
          effectiveType === "video" ||
          effectiveType === "audio" ||
          messageType === "FILE" ||
          messageType === "IMAGE" ||
          messageType === "VIDEO" ||
          messageType === "file" ||
          messageType === "image" ||
          messageType === "video" ||
          messageType === "AUDIO" ||
          messageType === "audio" ||
          !!resolvedFileUrl,
        fileUrl: resolvedFileUrl,
        fileName: normalizedFileName,
        fileType:
          resolvedMimeType ||
          (isImageType
            ? "image/*"
            : isVideoType
              ? "video/*"
              : isAudioType
                ? "audio/*"
                : undefined),
        isRecalled: payload?.isRecalled || payload?.isDeleted,
        isPinned: payload?.isPinned,
        pinnedAt: payload?.pinnedAt,
        replyToMessageId: payload?.replyToMessageId,
        replyToMessagePreview: normalizedReplyPreview,
        messageStatus: payload?.messageStatus,
        reactions: normalizeReactions(payload?.reactions),
        conversationId: payload?.conversationId,
        type: resolvedType,
        messageType: payload?.messageType,
        callData: payload?.callData,
      };
    },
    [normalizeReactions],
  );

    const applyPinStateToMessage = useCallback(
        (messageId: string, isPinned: boolean, pinnedAt?: string) => {
            setPinOverrides((prev) => ({
                ...prev,
                [messageId]: {
                    isPinned,
                    pinnedAt,
                },
            }));
        },
        [],
    );

    const refreshPinnedMessages = useCallback(
        async (conversationId: string) => {
            if (!conversationId) return;

            try {
                const response =
                    await conversationApi.getPinnedMessages(conversationId);

                setPinnedMessagesByConversation((prev) => ({
                    ...prev,
                    [conversationId]: (response.items || [])
                        .slice(0, 3)
                        .sort((a, b) => {
                            const aTime = new Date(
                                String(a.pinnedAt || a.createdAt || 0),
                            ).getTime();
                            const bTime = new Date(
                                String(b.pinnedAt || b.createdAt || 0),
                            ).getTime();
                            return bTime - aTime;
                        }),
                }));
            } catch {
                setPinnedMessagesByConversation((prev) => ({
                    ...prev,
                    [conversationId]: prev[conversationId] || [],
                }));
            }
        },
        [],
    );

    const hydrateMediaMessage = useCallback(
        async (message: ChatSocketMessage) => {
            // Fallback về selectedConversationId nếu message không có conversationId
            const convId = message.conversationId || selectedConversationId;
            if (!convId) return;
            const hydrationKey = message.id || message.clientMessageId;
            if (!hydrationKey) return;
            if (pendingMediaHydrationRef.current.has(hydrationKey)) return;

            pendingMediaHydrationRef.current.add(hydrationKey);

            try {
                const maxAttempts = 12;
                for (let i = 0; i < maxAttempts; i += 1) {
                    const result =
                        await conversationApi.getMessagesByConversation({
                            conversationId: convId,
                            limit: 30,
                        });

                    const matched = result.items.find(
                        (item) =>
                            item.messageId === message.id ||
                            item._id === message.id ||
                            (!!message.clientMessageId &&
                                item.clientMessageId ===
                                    message.clientMessageId),
                    );

                    const matchedMediaUrl =
                        matched?.mediaUrl ||
                        (matched as { fileUrl?: string } | undefined)?.fileUrl;

                    if (matched && matchedMediaUrl) {
                        const matchedWithSender = matched as typeof matched & {
                            senderName?: string;
                            senderAvatar?: string;
                        };

                        const hydrated = toSocketMessage({
                            messageId: matched.messageId,
                            _id: matched._id,
                            clientMessageId: matched.clientMessageId,
                            senderId: matched.senderId || matched.senderBy,
                            senderBy: matched.senderBy || matched.senderId,
                            // Prefer sender metadata from API if present, then fallback to live message data.
                            senderName:
                                matchedWithSender.senderName ||
                                message.senderName ||
                                matched.senderBy ||
                                matched.senderId,
                            senderAvatar:
                                matchedWithSender.senderAvatar ||
                                message.senderAvatar,
                            content: matched.content,
                            createdAt:
                                typeof matched.createdAt === 'string'
                                    ? matched.createdAt
                                    : matched.createdAt?.toISOString(),
                            conversationId: matched.conversationId || convId,
                            messageType: matched.messageType,
                            mediaUrl: matchedMediaUrl,
                            fileName: matched.fileName || message.fileName,
                            fileType: matched.mimeType || message.fileType,
                        });

                        setSocketMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === message.id ||
                                (!!message.clientMessageId &&
                                    msg.clientMessageId ===
                                        message.clientMessageId)
                                    ? {
                                          ...msg,
                                          ...hydrated,
                                          // Preserve sender info if hydrated doesn't have it
                                          senderName:
                                              hydrated.senderName ||
                                              msg.senderName,
                                          senderAvatar:
                                              hydrated.senderAvatar ||
                                              msg.senderAvatar,
                                          fileUrl:
                                              hydrated.fileUrl || msg.fileUrl,
                                          fileType:
                                              hydrated.fileType || msg.fileType,
                                          // Clear text content that was the filename placeholder
                                          content: hydrated.content || '',
                                      }
                                    : msg,
                            ),
                        );
                        return;
                    }

                    if (i < maxAttempts - 1) {
                        await new Promise((resolve) =>
                            window.setTimeout(resolve, 250),
                        );
                        const delay = Math.min(300 * (i + 1), 2000);
                        await new Promise((resolve) =>
                            window.setTimeout(resolve, delay),
                        );
                    }
                }
            } catch (err) {
                console.warn('[ChatPage] hydrate media failed', err);
            } finally {
                pendingMediaHydrationRef.current.delete(hydrationKey);
            }
        },
        [selectedConversationId, toSocketMessage],
    );

    // Initialize socket listeners once; room lifecycle is handled by useChatRoom.
    useEffect(() => {
        debugAuthStatus();
        setIsConnecting(false);

        const unwrapPayload = (
            incoming: IncomingSocketPayload,
        ): IncomingSocketPayload => {
            let current: IncomingSocketPayload = incoming;

            for (let i = 0; i < 3; i += 1) {
                if (current?.message && typeof current.message === 'object') {
                    current = current.message as IncomingSocketPayload;
                    continue;
                }

                if (current?.data && typeof current.data === 'object') {
                    current = current.data as IncomingSocketPayload;
                    continue;
                }

                break;
            }

            return current;
        };

    const messageHandler = (payload: IncomingSocketPayload) => {
      const rawPayload = payload?.message || payload?.data || payload;
      const msg = toSocketMessage(rawPayload);

      if (
        !msg.senderAvatar &&
        msg.senderId &&
        selectedConversation?.participants
      ) {
        const participant = selectedConversation.participants.find(
          (p) => p.userId === msg.senderId,
        );
        if (participant?.avatarUrl) {
          msg.senderAvatar =
            toAbsoluteMediaUrl(participant.avatarUrl) ?? undefined;
        }
      }

            const isMediaType =
                msg.type === 'image' ||
                msg.type === 'video' ||
                msg.type === 'audio' ||
                msg.type === 'file';

            const hasVisibleContent =
                msg.isRecalled ||
                msg.content.trim().length > 0 ||
                (msg.isFile && !!msg.fileUrl) ||
                msg.type === 'call';

            if (!hasVisibleContent || !msg.conversationId) {
                console.warn(
                    '[ChatPage] Message filtered out - no visible content or conversationId',
                );
                return;
            }

            setSocketMessages((prev) => {
                const existingIndex = prev.findIndex(
                    (p) =>
                        (!!msg.clientMessageId &&
                            p.clientMessageId === msg.clientMessageId) ||
                        p.id === msg.id,
                );

                if (existingIndex >= 0) {
                    const next = [...prev];
                    const current = next[existingIndex];
                    next[existingIndex] = {
                        ...current,
                        ...msg,
                        isFile: msg.isFile || current.isFile,
                        fileUrl: msg.fileUrl || current.fileUrl,
                        fileName: msg.fileName || current.fileName,
                        fileType: msg.fileType || current.fileType,
                        type: msg.type || current.type,
                        replyToMessageId:
                            msg.replyToMessageId || current.replyToMessageId,
                        replyToMessagePreview:
                            msg.replyToMessagePreview ||
                            current.replyToMessagePreview ||
                            null,
                        messageStatus:
                            msg.messageStatus || current.messageStatus,
                    };
                    return next;
                }

                return [...prev, msg];
            });

      const needsHydration =
        (msg.isFile ||
          msg.type === "image" ||
          msg.type === "video" ||
          msg.type === "file" ||
          msg.type === "audio") &&
        !msg.fileUrl;

      if (needsHydration) {
        void hydrateMediaMessage(msg);
      }

            if (msg.conversationId) {
                const normalizedType = (
                    msg.type || (msg.isFile ? 'file' : 'text')
                ).toUpperCase();

                updateConversationLastMessage(msg.conversationId, {
                    messageId: msg.id,
                    clientMessageId: msg.clientMessageId,
                    content: msg.content,
                    messageType: normalizedType as
                        | 'TEXT'
                        | 'IMAGE'
                        | 'FILE'
                        | 'VIDEO'
                        | 'AUDIO',
                    senderBy: msg.senderId,
                    createdAt: msg.timestamp,
                    isRecalled: !!msg.isRecalled,
                });

                // Fallback realtime: if message belongs to a conversation not in sidebar yet,
                // refresh the list so newly-created groups appear for invited members immediately.
                if (!conversationIdsRef.current.has(msg.conversationId)) {
                    refreshConversationsThrottled();
                }
            }
        };

        const reactionHandler = (payload: {
            conversationId: string;
            messageId: string;
            reactions: Array<{
                userId: string;
                emoji: string;
                reactedAt: string;
            }>;
            actedBy: string;
            action: 'set' | 'remove';
            emoji?: string;
            at: string;
        }) => {
            if (payload.conversationId !== selectedConversationId) return;

            setSocketMessages((prev) =>
                prev.map((msg) =>
                    msg.id === payload.messageId ||
                    msg.clientMessageId === payload.messageId
                        ? {
                              ...msg,
                              reactions: payload.reactions,
                          }
                        : msg,
                ),
            );

            setReactionOverrides((prev) => ({
                ...prev,
                [payload.messageId]: payload.reactions,
            }));
        };

        const recallHandler = (payload: {
            conversationId: string;
            messageId: string;
            revokedBy: string;
            revokedAt: string;
            isRevoked?: boolean;
        }) => {
            markConversationLastMessageRecalled(
                payload.conversationId,
                payload.messageId,
            );

            if (payload.conversationId !== selectedConversationId) return;

            markMessageAsRecalled(payload.messageId);

            setSocketMessages((prev) => {
                const updated = prev.map((msg) => {
                    if (
                        msg.id === payload.messageId ||
                        msg.clientMessageId === payload.messageId
                    ) {
                        return {
                            ...msg,
                            isRecalled: true,
                        };
                    }
                    return msg;
                });

                return updated;
            });
        };

        const deletedHandler = (payload: {
            conversationId: string;
            messageId: string;
            deletedBy: string;
            isDeleted: boolean;
            at: string;
        }) => {
            if (payload.deletedBy !== USER_ID) return;

            if (payload.conversationId === selectedConversationId) {
                setHiddenMessageKeys((prev) => {
                    const next = new Set(prev);
                    next.add(payload.messageId);
                    return next;
                });
            }

            setSocketMessages((prev) =>
                prev.map((msg) =>
                    msg.id === payload.messageId ||
                    msg.clientMessageId === payload.messageId
                        ? {
                              ...msg,
                              deletedForUsers: Array.from(
                                  new Set([
                                      ...(msg.deletedForUsers || []),
                                      USER_ID,
                                  ]),
                              ),
                          }
                        : msg,
                ),
            );
        };

        const seenHandler = (payload: {
            conversationId: string;
            messageId: string;
            userId: string;
            seenAt: string;
        }) => {
            if (payload.conversationId !== selectedConversationId) return;

            setSocketMessages((prev) =>
                prev.map((msg) => {
                    if (
                        msg.id !== payload.messageId &&
                        msg.clientMessageId !== payload.messageId
                    ) {
                        return msg;
                    }

                    const currentSeenBy = Array.isArray(msg.seenBy)
                        ? msg.seenBy
                        : [];

                    const nextSeenBy = currentSeenBy.filter(
                        (item) => item !== payload.userId,
                    );

                    nextSeenBy.push(payload.userId);

                    return {
                        ...msg,
                        seenBy: nextSeenBy,
                        messageStatus:
                            msg.senderId === USER_ID
                                ? 'READ'
                                : msg.messageStatus,
                    };
                }),
            );
        };

        const pinnedHandler = (payload: {
            conversationId: string;
            messageId: string;
            pinnedAt: string;
        }) => {
            applyPinStateToMessage(payload.messageId, true, payload.pinnedAt);

            setSocketMessages((prev) =>
                prev.map((msg) =>
                    msg.id === payload.messageId ||
                    msg.clientMessageId === payload.messageId
                        ? {
                              ...msg,
                              isPinned: true,
                              pinnedAt: payload.pinnedAt,
                          }
                        : msg,
                ),
            );

            if (payload.conversationId === selectedConversationId) {
                void refreshPinnedMessages(payload.conversationId);
            }
        };

        const unpinnedHandler = (payload: {
            conversationId: string;
            messageId: string;
        }) => {
            applyPinStateToMessage(payload.messageId, false);

            setSocketMessages((prev) =>
                prev.map((msg) =>
                    msg.id === payload.messageId ||
                    msg.clientMessageId === payload.messageId
                        ? {
                              ...msg,
                              isPinned: false,
                              pinnedAt: undefined,
                          }
                        : msg,
                ),
            );

            if (payload.conversationId === selectedConversationId) {
                void refreshPinnedMessages(payload.conversationId);
            }
        };

        messageListenerRef.current = messageHandler;
        onMessageNew((payload) =>
            messageHandler(payload as IncomingSocketPayload),
        );
        onMessageReactionUpdated(reactionHandler);
        onMessageRecalled(recallHandler);
        onMessagePinned(pinnedHandler);
        onMessageUnpinned(unpinnedHandler);
        onMessageDeleted(deletedHandler);
        onMessageSeen(seenHandler);
        onTyping((payload) => {
            const typingPayload = payload as {
                conversationId: string;
                userId: string;
                isTyping: boolean;
                at: string;
            };

            if (typingPayload.conversationId !== selectedConversationId) return;
            if (typingPayload.userId === USER_ID) return;

            const participantName =
                selectedConversation?.participants?.find(
                    (participant) =>
                        participant.userId === typingPayload.userId,
                )?.fullName || typingPayload.userId;

            setTypingUserNames((prev) => {
                const next = prev.filter((name) => name !== participantName);
                if (typingPayload.isTyping) {
                    next.push(participantName);
                }
                return next;
            });
        });

        return () => {
            if (messageListenerRef.current) {
                offMessageNew();
            }
            offMessageReactionUpdated();
            offMessageRecalled();
            offMessagePinned();
            offMessageUnpinned();
            offMessageDeleted();
            offMessageSeen();
            offTyping();
        };
    }, [
        toSocketMessage,
        hydrateMediaMessage,
        applyPinStateToMessage,
        refreshPinnedMessages,
        refreshConversationsThrottled,
        selectedConversationId,
        markMessageAsRecalled,
        markConversationLastMessageRecalled,
        updateConversationLastMessage,
        USER_ID,
        selectedConversation?.participants,
    ]);

    // Handle conversation selection
    const handleSelectConversation = useCallback((conversationId: string) => {
        setSelectedConversationId(conversationId);
        setSocketMessages([]); // Clear socket messages on new conversation
        setIsSearchOpen(false);
        setIsInfoPanelOpen(true);
    }, []);

    const handleOpenAddFriend = useCallback(() => {
        // Placeholder button for future add-friend flow.
    }, []);

    const handleOpenCreateGroupModal = useCallback(() => {
        setIsCreateGroupModalOpen(true);
    }, []);

    useEffect(() => {
        // Reset state thu hoi theo tung conversation de tranh anh huong cheo.
        setRecalledMessageKeys(new Set());
        setReplyDraft(null);
        setOpenGroupInfoEditTick(0);
    }, [selectedConversationId]);

    useEffect(() => {
        if (!selectedConversationId) return;
        void refreshPinnedMessages(selectedConversationId);
    }, [selectedConversationId, refreshPinnedMessages]);

    // Enhance sender names for messages that only have phone numbers (backward compatibility)
    // New messages from backend already include senderName
    useEffect(() => {
        if (socketMessages.length === 0) return;

        // Find messages with only phone numbers as sender names (need enrichment)
        const messagesToEnrich = socketMessages.filter(
            (msg) =>
                msg.senderName &&
                /^\d{10,11}$/.test(msg.senderName) && // Looks like a phone number
                msg.senderName === msg.senderId, // senderName is same as senderId (not enriched yet)
        );

        if (messagesToEnrich.length === 0) return;

        // Collect unique sender IDs that need enrichment
        const uniqueSenderIds = new Set(
            messagesToEnrich.map((msg) => msg.senderId),
        );

        // Fetch user info for senders with only phone numbers
        const enrichSenderNames = async () => {
            for (const senderId of uniqueSenderIds) {
                if (!senderId) continue;

                try {
                    const userInfo = await getUserInfo(senderId);
                    if (userInfo?.fullName && userInfo.fullName !== senderId) {
                        // Update messages with actual sender name
                        setSocketMessages((prev) =>
                            prev.map((msg) =>
                                msg.senderId === senderId &&
                                /^\d{10,11}$/.test(msg.senderName)
                                    ? { ...msg, senderName: userInfo.fullName }
                                    : msg,
                            ),
                        );
                    }
                } catch (err) {
                    console.warn(
                        `[ChatPage] Failed to enrich user info for ${senderId}:`,
                        err,
                    );
                }
            }
        };

        enrichSenderNames();
    }, [socketMessages]);

    const recallLocalMessage = useCallback(
        (message: SocketMessage) => {
            const messageKey = getMessageKey(message);

            markMessageAsRecalled(messageKey);

            // Nguoi gui thay sidebar doi ngay khi recall message cuoi cung.
            if (selectedConversationId) {
                markConversationLastMessageRecalled(
                    selectedConversationId,
                    message.id,
                );
                if (message.clientMessageId) {
                    markConversationLastMessageRecalled(
                        selectedConversationId,
                        message.clientMessageId,
                    );
                }
            }

            setSocketMessages((prev) =>
                prev.map((msg) => {
                    const sameMessage =
                        (message.clientMessageId &&
                            msg.clientMessageId === message.clientMessageId) ||
                        msg.id === message.id;

                    if (!sameMessage) return msg;

                    return {
                        ...msg,
                        content: '',
                        isFile: false,
                        fileUrl: undefined,
                        fileName: undefined,
                        fileType: undefined,
                        isRecalled: true,
                    };
                }),
            );
        },
        [
            getMessageKey,
            markConversationLastMessageRecalled,
            markMessageAsRecalled,
            selectedConversationId,
        ],
    );

    const executeRecallMessage = useCallback(
        async (message: SocketMessage) => {
            if (joinStatus === 'error') {
                setError(
                    'Bạn không có quyền thu hồi tin nhắn trong cuộc trò chuyện này.',
                );
                return;
            }

            if (!selectedConversationId || message.senderId !== USER_ID) return;

            console.log('[ChatPage] Recall request message:', message);

            if (message.id.startsWith('msg_')) {
                setError('Không thể thu hồi: tin nhắn chưa gửi xong.');
                return;
            }

            if (!isPersistedMessageId(message.id)) {
                setError(
                    'Không thể thu hồi: tin nhắn chưa có ID máy chủ hợp lệ.',
                );
                return;
            }

            try {
                console.log('[ChatPage] Recall API payload:', {
                    conversationId: selectedConversationId,
                    messageId: message.id,
                    clientMessageId: message.clientMessageId,
                });
                await conversationApi.recallMessage(
                    selectedConversationId,
                    message.id,
                );
                recallLocalMessage(message);
            } catch (err) {
                console.error('Error recalling message:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to recall message',
                );
            }
        },
        [
            joinStatus,
            selectedConversationId,
            recallLocalMessage,
            USER_ID,
            isPersistedMessageId,
        ],
    );

    const executeDeleteMessage = useCallback(
        async (message: SocketMessage) => {
            if (joinStatus === 'error') {
                setError(
                    'Bạn không có quyền xóa tin nhắn trong cuộc trò chuyện này.',
                );
                return;
            }

            const messageKey = getMessageKey(message);
            setHiddenMessageKeys((prev) => {
                const next = new Set(prev);
                next.add(messageKey);
                return next;
            });

            if (!selectedConversationId || !isPersistedMessageId(message.id)) {
                return;
            }

            try {
                await conversationApi.deleteMessageForMe(
                    selectedConversationId,
                    message.id,
                );
            } catch (err) {
                setHiddenMessageKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(messageKey);
                    return next;
                });
                console.error('Error deleting message for me:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete message for me',
                );
            }
        },
        [
            isPersistedMessageId,
            joinStatus,
            getMessageKey,
            selectedConversationId,
        ],
    );

    const handleRequestRecallMessage = useCallback((message: SocketMessage) => {
        setPendingRecallMessage(message);
        setIsRecallConfirmOpen(true);
    }, []);

    const handleRequestDeleteMessage = useCallback((message: SocketMessage) => {
        setPendingDeleteMessage(message);
        setIsDeleteConfirmOpen(true);
    }, []);

    const handleConfirmRecallMessage = useCallback(async () => {
        if (!pendingRecallMessage) return;
        await executeRecallMessage(pendingRecallMessage);
        setPendingRecallMessage(null);
        setIsRecallConfirmOpen(false);
    }, [pendingRecallMessage, executeRecallMessage]);

    const handleConfirmDeleteMessage = useCallback(async () => {
        if (!pendingDeleteMessage) return;
        await executeDeleteMessage(pendingDeleteMessage);
        setPendingDeleteMessage(null);
        setIsDeleteConfirmOpen(false);
    }, [pendingDeleteMessage, executeDeleteMessage]);

    // Log exactly one call-history message when a call transitions to a terminal state.
    useEffect(() => {
        const prevStatus = prevCallStatusRef.current;

        // Lưu vai trò người gọi vào ref vì CallContext có thể reset rất nhanh trước khi effect chạy.
        if (
            isInitiator &&
            (callStatus === 'calling' ||
                callStatus === 'ringing' ||
                callStatus === 'connected')
        ) {
            wasInitiatorRef.current = true;
        }

        // Chỉ người gọi ghi lịch sử; người nhận chỉ hiển thị lại cùng một bản ghi đó.
        if (!wasInitiatorRef.current) {
            prevCallStatusRef.current = callStatus;
            return;
        }

        const hadActiveCall =
            prevStatus === 'calling' ||
            prevStatus === 'ringing' ||
            prevStatus === 'connected';
        const callJustEnded =
            hadActiveCall &&
            (callStatus === 'idle' ||
                callStatus === 'failed' ||
                callStatus === 'rejected' ||
                callStatus === 'ended');

        if (callJustEnded) {
            if (
                selectedConversationId &&
                selectedConversation &&
                selectedConversation.type === 'PRIVATE' &&
                USERNAME &&
                USER_ID
            ) {
                const logCallToChat = async () => {
                    try {
                        const otherParticipant =
                            selectedConversation?.participants?.find(
                                (p) => p.userId !== USER_ID,
                            );

                        if (!otherParticipant) {
                            return;
                        }

                        const clientMessageId = `call_${Date.now()}_${Math.random()
                            .toString(36)
                            .slice(2, 8)}`;
                        const now = new Date().toISOString();

                        const duration = callStartTime
                            ? Math.floor((Date.now() - callStartTime) / 1000)
                            : 0;

                        // Chuẩn hóa trạng thái theo góc nhìn người gọi, rồi dùng chung cho cả hai phía.
                        let callHistoryStatus:
                            | 'completed'
                            | 'missed'
                            | 'declined' = 'completed';

                        if (wasRejected) {
                            // Ưu tiên cờ từ chối tường minh để tránh race condition khi state reset nhanh.
                            callHistoryStatus = 'declined';
                        } else if (prevStatus === 'connected') {
                            // Người nhận đã bắt máy và cuộc gọi kết thúc bình thường.
                            callHistoryStatus = 'completed';
                        } else if (
                            callStatus === 'rejected' ||
                            callStatus === 'failed'
                        ) {
                            // Người nhận từ chối hoặc tín hiệu lỗi trong lúc chờ bắt máy.
                            callHistoryStatus = 'declined';
                        } else if (
                            (prevStatus === 'calling' ||
                                prevStatus === 'ringing') &&
                            (callStatus === 'idle' || callStatus === 'ended')
                        ) {
                            // Người gọi tự hủy trước khi người nhận bắt máy.
                            callHistoryStatus = 'missed';
                        }

                        const callMessage: ChatSocketMessage = {
                            id: clientMessageId,
                            clientMessageId,
                            senderId: USER_ID,
                            senderName: USERNAME,
                            content: '',
                            timestamp: now,
                            conversationId: selectedConversationId,
                            type: 'call',
                            callData: {
                                callType: 'audio',
                                callStatus: callHistoryStatus,
                                duration: duration,
                                isInitiator: true,
                                wasRejected: callHistoryStatus === 'declined',
                            },
                        };

                        setSocketMessages((prev) => [...prev, callMessage]);

                        sendMessage({
                            requestId: `req_${Date.now()}`,
                            clientMessageId,
                            receiverId: otherParticipant.userId,
                            type: 'call',
                            content: '',
                            conversationId: selectedConversationId,
                            callData: callMessage.callData,
                        });
                    } catch (err) {
                        console.error('Error logging call to chat:', err);
                    }
                };

                logCallToChat();
            }

            // Reset after writing one history message for this call lifecycle.
            wasInitiatorRef.current = false;
        }

        prevCallStatusRef.current = callStatus;
    }, [
        callStatus,
        selectedConversationId,
        callStartTime,
        selectedConversation,
        USERNAME,
        USER_ID,
        isInitiator,
        wasAnswered,
        wasRejected,
    ]);

    const handleReactMessage = useCallback(
        async (message: SocketMessage, emoji: string) => {
            if (joinStatus === 'error') {
                setError(
                    'Bạn không có quyền thao tác trong cuộc trò chuyện này.',
                );
                return;
            }

            if (!selectedConversationId) return;

            const persistedMessageId = resolvePersistedMessageId(message);
            if (!persistedMessageId) {
                setError(
                    'Không thể bày tỏ cảm xúc: tin nhắn chưa có ID máy chủ hợp lệ.',
                );
                return;
            }

            const messageKey = getMessageKey(message);

            const previousReactions =
                reactionOverrides[messageKey] || message.reactions || [];

            const existingMyReaction = previousReactions.find(
                (r) => r.userId === USER_ID,
            );

            const isRemoving = existingMyReaction?.emoji === emoji;

            const nextReactions = previousReactions.filter(
                (r) => r.userId !== USER_ID,
            );

            if (!isRemoving) {
                nextReactions.push({
                    userId: USER_ID,
                    emoji,
                    reactedAt: new Date().toISOString(),
                });
            }

            setReactionOverrides((prev) => ({
                ...prev,
                [messageKey]: nextReactions,
            }));

            try {
                let response;

                if (isRemoving) {
                    response = await conversationApi.removeReaction(
                        selectedConversationId,
                        persistedMessageId,
                    );
                } else {
                    response = await conversationApi.reactToMessage(
                        selectedConversationId,
                        persistedMessageId,
                        emoji,
                    );
                }

                const serverReactions = response?.reactions ?? nextReactions;

                setReactionOverrides((prev) => ({
                    ...prev,
                    [messageKey]: serverReactions,
                }));
            } catch (err) {
                setReactionOverrides((prev) => ({
                    ...prev,
                    [messageKey]: previousReactions,
                }));

                console.error('Error reacting:', err);
            }
        },
        [
            getMessageKey,
            joinStatus,
            reactionOverrides,
            resolvePersistedMessageId,
            selectedConversationId,
            USER_ID,
        ],
    );

    const handleReplyMessage = useCallback(
        (message: SocketMessage) => {
            if (!selectedConversationId) return;

            setReplyDraft({
                conversationId: selectedConversationId,
                replyToMessageId: message.id,
                senderName: message.senderName,
                snippet:
                    message.content ||
                    message.fileName ||
                    'Tin nhắn gốc không còn khả dụng',
            });
        },
        [selectedConversationId],
    );

    const handleTogglePinMessage = useCallback(
        async (message: SocketMessage, shouldPin: boolean) => {
            if (!selectedConversationId) return;

            const messageId = resolvePersistedMessageId(message);
            if (!messageId) {
                setError('Không thể ghim: tin nhắn chưa có ID máy chủ hợp lệ');
                return;
            }

            applyPinStateToMessage(
                messageId,
                shouldPin,
                shouldPin ? new Date().toISOString() : undefined,
            );

            setPinnedMessagesByConversation((prev) => {
                const current = prev[selectedConversationId] || [];

                if (shouldPin) {
                    const optimisticItem: PinnedMessageItem = {
                        messageId,
                        conversationId: selectedConversationId,
                        senderId: message.senderId,
                        senderName: message.senderName,
                        content: message.content,
                        snippet: message.content || message.fileName,
                        createdAt: message.timestamp,
                        pinnedAt: new Date().toISOString(),
                    };

                    return {
                        ...prev,
                        [selectedConversationId]: [
                            optimisticItem,
                            ...current.filter(
                                (item) => item.messageId !== messageId,
                            ),
                        ].slice(0, 3),
                    };
                }

                return {
                    ...prev,
                    [selectedConversationId]: current.filter(
                        (item) => item.messageId !== messageId,
                    ),
                };
            });

            try {
                if (shouldPin) {
                    await conversationApi.pinMessage(
                        selectedConversationId,
                        messageId,
                    );
                } else {
                    await conversationApi.unpinMessage(
                        selectedConversationId,
                        messageId,
                    );
                }

                await refreshPinnedMessages(selectedConversationId);
            } catch (err) {
                applyPinStateToMessage(
                    messageId,
                    !shouldPin,
                    !shouldPin ? new Date().toISOString() : undefined,
                );
                await refreshPinnedMessages(selectedConversationId);
                setError(mapChatActionError(err, shouldPin ? 'pin' : 'unpin'));
            }
        },
        [
            selectedConversationId,
            resolvePersistedMessageId,
            applyPinStateToMessage,
            refreshPinnedMessages,
        ],
    );

    const handleOpenForwardModal = useCallback((message: SocketMessage) => {
        setForwardingMessage(message);
        setForwardTargetConversationId('');
        setIsForwardModalOpen(true);
    }, []);

    const handleForwardMessage = useCallback(async () => {
        if (joinStatus === 'error') {
            setError('Bạn không có quyền thao tác trong cuộc trò chuyện này.');
            return;
        }

        if (!forwardingMessage || !forwardTargetConversationId) return;

        if (forwardingMessage.fileUrl?.startsWith('blob:')) {
            setError('Không thể chuyển tiếp tệp khi chưa upload xong.');
            return;
        }

        try {
            setIsForwarding(true);
            const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

            if (forwardingMessage.id.startsWith('msg_')) {
                setError('Không thể chuyển tiếp tin nhắn chưa gửi xong.');
                return;
            }

            // Note: userId should be included in request headers via API interceptor
            await conversationApi.forwardMessage(
                forwardingMessage.id,
                forwardTargetConversationId,
                clientMessageId,
            );

      setIsForwardModalOpen(false);
      setForwardingMessage(null);
      setForwardTargetConversationId("");
    } catch (err) {
      console.error("Error forwarding message:", err);
      setError(
        err instanceof Error ? err.message : "Failed to forward message",
      );
    } finally {
      setIsForwarding(false);
    }
  }, [forwardingMessage, forwardTargetConversationId, joinStatus]);

  const maybeSuggestWorkflowFromMessage = useCallback(
    async (messageText: string) => {
      if (!autoWorkflowEnabled || !selectedConversationId) return;

      const actionablePattern =
        /deadline|task|todo|fix|bug|deploy|release|meeting|call|sync|asap|urgent|gấp|họp|lịch|việc|xử lý|ngày mai|hôm nay|tuần sau|trễ/i;
      if (!actionablePattern.test(messageText)) return;

      try {
        setIsAiLoading(true);
        const result = await orionAiService.analyzeTextWorkflow({
          text: messageText,
          conversationId: selectedConversationId,
        });
        if (result.cards.length > 0 || result.actions.length > 0) {
          setAiResult(result);
        }
      } catch (error) {
        console.warn("AI workflow suggestion failed:", error);
      } finally {
        setIsAiLoading(false);
      }
    },
    [autoWorkflowEnabled, selectedConversationId],
  );

    // Handle sending message
    const handleSend = useCallback(
        async (
            text: string,
            options?: { replyToMessageId?: string | null },
        ) => {
            if (joinStatus === 'error') {
                setError(
                    'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này.',
                );
                return;
            }

            if (!text.trim() || !selectedConversationId) return;

            try {
                const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const now = new Date().toISOString();
                const isGroupConversation =
                    selectedConversation?.type === 'GROUP';

                setSocketMessages((prev) => [
                    ...prev,
                    {
                        id: clientMessageId,
                        clientMessageId,
                        senderId: USER_ID,
                        senderName: USERNAME,
                        content: text,
                        timestamp: now,
                        conversationId: selectedConversationId,
                        type: 'text',
                        replyToMessageId:
                            options?.replyToMessageId || undefined,
                        replyToMessagePreview: replyDraft
                            ? {
                                  messageId: replyDraft.replyToMessageId,
                                  senderName: replyDraft.senderName,
                                  snippet: replyDraft.snippet,
                                  content: replyDraft.snippet,
                                  createdAt: now,
                              }
                            : null,
                        uploadStatus: 'sent',
                    },
                ]);

                await conversationApi.sendMessage(
                    selectedConversationId,
                    text,
                    {
                        clientMessageId,
                        messageType: 'TEXT',
                        replyToMessageId:
                            options?.replyToMessageId || undefined,
                    },
                );

                const receiverId = isGroupConversation
                    ? undefined
                    : getReceiverId();
                if (!isGroupConversation && !receiverId) {
                    setReplyDraft(null);
                    return;
                }

                const ack = await sendChatMessage({
                    requestId: `req_${Date.now()}`,
                    clientMessageId,
                    receiverId,
                    type: 'text',
                    content: text,
                    conversationId: selectedConversationId,
                    replyToMessageId: options?.replyToMessageId || undefined,
                });

                if (ack?.ok === false) {
                    throw new Error(ack.error.message);
                }

        setReplyDraft(null);
        void maybeSuggestWorkflowFromMessage(text);
      } catch (err) {
        console.error("Error sending message:", err);
        setError(mapChatActionError(err, "send"));

        setSocketMessages((prev) =>
          prev.map((msg) =>
            msg.content === text && msg.senderId === USER_ID
              ? {
                  ...msg,
                  uploadStatus: "failed",
                  errorMessage:
                    err instanceof Error
                      ? err.message
                      : "Failed to send message",
                }
              : msg,
          ),
        );
      }
    },
    [
      joinStatus,
      selectedConversation,
      selectedConversationId,
      getReceiverId,
      replyDraft,
      sendChatMessage,
      maybeSuggestWorkflowFromMessage,
      USER_ID,
      USERNAME,
    ],
  );

    // Handle sending file
    const handleSendFile = useCallback(
        async (file: File) => {
            if (joinStatus === 'error') {
                setError(
                    'Bạn không có quyền gửi tệp trong cuộc trò chuyện này.',
                );
                return;
            }

            if (!selectedConversationId) return;

            try {
                const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const now = new Date().toISOString();
                const isGroupConversation =
                    selectedConversation?.type === 'GROUP';

                // Determine file type
                const fileType = file.type;
                const isImage = fileType.startsWith('image/');
                const isVideo = fileType.startsWith('video/');
                const messageType = isImage
                    ? 'image'
                    : isVideo
                      ? 'video'
                      : 'file';

                // Create local preview URL for immediate display
                const tempFileUrl = URL.createObjectURL(file);

                // Add temporary message with local preview
                setSocketMessages((prev) => [
                    ...prev,
                    {
                        id: clientMessageId,
                        clientMessageId,
                        senderId: USER_ID,
                        senderName: USERNAME,
                        content: file.name,
                        timestamp: now,
                        conversationId: selectedConversationId,
                        type: messageType,
                        isFile: true,
                        fileName: file.name,
                        fileUrl: tempFileUrl, // Use blob URL for immediate display
                        fileType: fileType,
                        uploadStatus: 'uploading',
                    },
                ]);

                // Upload file first because backend requires mediaUrl for media messages
                let serverFileUrl = '';
                let uploadedFileType = fileType;

                try {
                    const uploadResponse = await conversationApi.uploadFile(
                        file,
                        selectedConversationId,
                    );
                    serverFileUrl = uploadResponse.mediaUrl;
                    uploadedFileType = uploadResponse.mimeType || fileType;

                    // Update the message with server URL after successful upload
                    setSocketMessages((prev) =>
                        prev.map((msg) =>
                            msg.clientMessageId === clientMessageId
                                ? {
                                      ...msg,
                                      fileUrl: serverFileUrl,
                                      fileType: uploadedFileType,
                                      uploadStatus: 'sent',
                                  }
                                : msg,
                        ),
                    );
                } catch (uploadErr) {
                    URL.revokeObjectURL(tempFileUrl);
                    setSocketMessages((prev) =>
                        prev.filter(
                            (msg) => msg.clientMessageId !== clientMessageId,
                        ),
                    );
                    throw uploadErr;
                }

                // Send message via socket with file URL
                const ack = await sendChatMessage({
                    requestId: `req_${Date.now()}`,
                    clientMessageId,
                    receiverId: isGroupConversation
                        ? undefined
                        : getReceiverId(),
                    type: messageType as 'image' | 'video' | 'file',
                    content: file.name,
                    mediaUrl: serverFileUrl,
                    fileName: file.name,
                    fileType: uploadedFileType, // Include MIME type
                    fileSize: file.size,
                    conversationId: selectedConversationId,
                    replyToMessageId: replyDraft?.replyToMessageId,
                });

                if (ack?.ok === false) {
                    throw new Error(ack.error.message);
                }

                setReplyDraft(null);
            } catch (err) {
                console.error('Error sending file:', err);
                setError(
                    err instanceof Error ? err.message : 'Failed to send file',
                );

                setSocketMessages((prev) =>
                    prev.map((msg) =>
                        msg.senderId === USER_ID && msg.content === file.name
                            ? {
                                  ...msg,
                                  uploadStatus: 'failed',
                                  errorMessage:
                                      err instanceof Error
                                          ? err.message
                                          : 'Failed to send file',
                              }
                            : msg,
                    ),
                );
            }
        },
        [
            joinStatus,
            selectedConversation,
            selectedConversationId,
            getReceiverId,
            replyDraft,
            sendChatMessage,
            USER_ID,
            USERNAME,
        ],
    );

    // Kết hợp các thông báo phân trang và thông báo socket
    const otherParticipant = selectedConversation?.participants?.find(
        (p) => p.userId !== USER_ID,
    );

    const isPrivateConversation = selectedConversation?.type === 'PRIVATE';
    const disableCallButtons = isPrivateConversation
        ? iAmBlocked || iAmTheBlocker
        : false;

    const handleStartCall = useCallback(
        async (callType: 'audio' | 'video') => {
            if (!selectedConversation || !otherParticipant) return;
            if (selectedConversation.type !== 'PRIVATE') return;

            if (callStatus !== 'idle') {
                setError('You are currently on another call.');
                return;
            }

            const currentUser = getUser();

            await initiateCall(
                selectedConversation.conversationId,
                otherParticipant.userId,
                callType,
                {
                    name: otherParticipant.fullName || 'Unknown',
                    avatar: otherParticipant.avatarUrl || undefined,
                },
                {
                    name: currentUser?.fullName || USERNAME,
                    avatar: currentUser?.avatarUrl || undefined,
                },
            );
        },
        [
            selectedConversation,
            otherParticipant,
            callStatus,
            initiateCall,
            USERNAME,
        ],
    );

    const handleCallBackMessage = useCallback(
        async (message: SocketMessage) => {
            if (!selectedConversation || !otherParticipant) return;
            if (selectedConversation.type !== 'PRIVATE') return;

            if (callStatus !== 'idle') {
                setError('You are currently on another call.');
                return;
            }

            const callbackType = message.callData?.callType || 'audio';
            const currentUser = getUser();

            await initiateCall(
                selectedConversation.conversationId,
                otherParticipant.userId,
                callbackType,
                {
                    name: otherParticipant.fullName || 'Unknown',
                    avatar: otherParticipant.avatarUrl || undefined,
                },
                {
                    name: currentUser?.fullName || USERNAME,
                    avatar: currentUser?.avatarUrl || undefined,
                },
            );
        },
        [
            selectedConversation,
            otherParticipant,
            callStatus,
            initiateCall,
            USERNAME,
        ],
    );

    const handleStartGroupCall = useCallback(
        async (callType: 'audio' | 'video') => {
            if (!selectedConversation) return;
            if (selectedConversation.type !== 'GROUP') return;

            if (groupCallStatus !== 'idle') {
                setError('You are currently on another group call.');
                return;
            }

            try {
                const groupMembers = await conversationApi.getGroupMembers(
                    selectedConversation.conversationId,
                );

                const members = groupMembers.items || [];
                const participantIds = members
                    .filter((member) => member.userId !== USER_ID)
                    .map((member) => member.userId);

                if (participantIds.length === 0) {
                    setError('No other participants in this group.');
                    return;
                }

                const participantNames: Record<string, string> = {};
                members.forEach((member) => {
                    if (member.userId !== USER_ID) {
                        participantNames[member.userId] =
                            member.fullName || 'Member';
                    }
                });

                await initiateGroupCall(
                    selectedConversation.conversationId,
                    participantIds,
                    callType,
                    participantNames,
                );

                navigate('/group-call');
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to start group call',
                );
            }
        },
        [
            selectedConversation,
            groupCallStatus,
            USER_ID,
            initiateGroupCall,
            navigate,
        ],
    );

    const getSenderName = useCallback(
        (senderId?: string) => {
            if (!senderId) return 'Unknown';
            if (senderId === USER_ID) return USERNAME;

            return (
                selectedConversation?.participants?.find(
                    (p) => p.userId === senderId,
                )?.fullName || 'Unknown'
            );
        },
        [selectedConversation, USER_ID, USERNAME],
    );

    const resolveSenderName = useCallback(
        (senderName?: string, senderId?: string) => {
            const trimmedSenderName = senderName?.trim();

            if (!trimmedSenderName) {
                return getSenderName(senderId);
            }

            if (!senderId) {
                return trimmedSenderName;
            }

            const normalizedSenderId = senderId.trim();
            const looksLikeRawSenderId =
                trimmedSenderName === normalizedSenderId ||
                /^\d{10,11}$/.test(trimmedSenderName) ||
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                    trimmedSenderName,
                );

            return looksLikeRawSenderId
                ? getSenderName(senderId)
                : trimmedSenderName;
        },
        [getSenderName],
    );

    const paginatedAsSocketMessages: SocketMessage[] = paginatedMessages.map(
        (m, idx) => {
            const senderRef =
                m.senderBy ||
                m.senderId ||
                (m as { revokedBy?: string }).revokedBy ||
                'unknown';
            const persistedMessageId = [
                m.messageId,
                m._id,
                (m as { id?: string }).id,
            ].find((candidate) => isPersistedMessageId(candidate));
            const attachment = (
                m as {
                    attachments?: Array<{
                        mediaUrl?: string;
                        fileName?: string;
                        mimeType?: string;
                    }>;
                }
            ).attachments?.[0];
            const mediaUrl =
                m.mediaUrl ||
                (m as { fileUrl?: string }).fileUrl ||
                attachment?.mediaUrl;
            const mimeType = m.mimeType || attachment?.mimeType;
            const messageType =
                m.messageType ||
                (m as { type?: string }).type ||
                (m.callData ? 'call' : undefined) ||
                (mimeType?.startsWith('image/')
                    ? 'image'
                    : mimeType?.startsWith('video/')
                      ? 'video'
                      : mimeType?.startsWith('audio/')
                        ? 'audio'
                        : mediaUrl
                          ? 'file'
                          : 'text');

      return {
        id:
          persistedMessageId ||
          m.clientMessageId ||
          `${m.senderBy || "unknown"}_${String(m.createdAt || idx)}`,
        clientMessageId: m.clientMessageId,
        senderId: senderRef,
        senderName: getSenderName(senderRef),
        senderAvatar: toAbsoluteMediaUrl(
          selectedConversation?.participants?.find(
            (p) => p.userId === senderRef,
          )?.avatarUrl,
        ),
        conversationId: m.conversationId || selectedConversationId || undefined,
        content: m.content || "",
        timestamp:
          typeof m.createdAt === "string"
            ? m.createdAt
            : (m.createdAt?.toISOString() ?? new Date().toISOString()),
        messageType: m.messageType,
        isFile:
          messageType === "FILE" ||
          messageType === "IMAGE" ||
          messageType === "VIDEO" ||
          messageType === "file" ||
          messageType === "image" ||
          messageType === "video" ||
          messageType === "audio",
        fileUrl: mediaUrl,
        fileName: m.fileName || attachment?.fileName,
        fileType:
          mimeType ||
          (messageType === "IMAGE" || messageType === "image"
            ? "image/*"
            : messageType === "VIDEO" || messageType === "video"
              ? "video/*"
              : messageType === "AUDIO" || messageType === "audio"
                ? "audio/*"
                : undefined),
        // Backend may return either isRevoked or recalled depending on endpoint shape.
        isRecalled:
          m.isRevoked === true ||
          (m as { recalled?: boolean }).recalled === true,
        isPinned: m.isPinned,
        pinnedAt:
          typeof m.pinnedAt === "string"
            ? m.pinnedAt
            : m.pinnedAt?.toISOString(),
        replyToMessageId: m.replyToMessageId || undefined,
        replyToMessagePreview: m.replyToMessagePreview || null,
        reactions: normalizeReactions(m.reactions),
        type:
          messageType === "CALL" || messageType === "call"
            ? "call"
            : messageType === "IMAGE" || messageType === "image"
              ? "image"
              : messageType === "VIDEO" || messageType === "video"
                ? "video"
                : messageType === "FILE" || messageType === "file"
                  ? "file"
                  : messageType === "AUDIO" || messageType === "audio"
                    ? "audio"
                    : "text",
        callData:
          m.callData ||
          (messageType === "CALL" || messageType === "call"
            ? {
                callType: "audio",
                callStatus: "completed",
                duration: 0,
                isInitiator: senderRef === USER_ID,
                wasRejected: false,
              }
            : undefined),
      };
    },
  );

    const mergedMessages: SocketMessage[] = [
        ...paginatedAsSocketMessages,
        ...socketMessages.filter(
            (sm) => sm.conversationId === selectedConversationId,
        ),
    ];

    const mergeMessagePreservingMedia = (
        current: SocketMessage,
        incoming: SocketMessage,
    ): SocketMessage => ({
        ...current,
        ...incoming,
        isFile: incoming.isFile || current.isFile,
        fileUrl: incoming.fileUrl || current.fileUrl,
        fileName: incoming.fileName || current.fileName,
        fileType: incoming.fileType || current.fileType,
        type:
            incoming.type && incoming.type !== 'text'
                ? incoming.type
                : (current.type ?? incoming.type),
        content: incoming.content || current.content,
        senderName: incoming.senderName || current.senderName,
        replyToMessageId: incoming.replyToMessageId || current.replyToMessageId,
        replyToMessagePreview:
            incoming.replyToMessagePreview || current.replyToMessagePreview,
        messageStatus: incoming.messageStatus || current.messageStatus,
    });

    const messageMap = new Map<string, SocketMessage>();
    for (const message of mergedMessages) {
        const hasVisibleContent =
            message.isRecalled ||
            message.isFile ||
            message.type === 'image' ||
            message.type === 'video' ||
            message.type === 'file' ||
            message.type === 'audio' ||
            message.content.trim().length > 0 ||
            (message.type === 'call' &&
                !!(message as ChatSocketMessage).callData);
        if (!hasVisibleContent) continue;

        const hasPersistedId = isPersistedMessageId(message.id);
        const key =
            (hasPersistedId ? message.id : undefined) ||
            (message as ChatSocketMessage).clientMessageId ||
            message.id ||
            `${message.senderId}_${message.timestamp}_${message.content}_${message.fileUrl || ''}`;

        const existing = messageMap.get(key);
        if (!existing) {
            messageMap.set(key, message);
            continue;
        }

        messageMap.set(key, mergeMessagePreservingMedia(existing, message));
    }

    const displayMessages: SocketMessage[] = Array.from(messageMap.values())
        .filter((msg) => !hiddenMessageKeys.has(getMessageKey(msg)))
        .sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();

            const safeA = Number.isNaN(timeA) ? 0 : timeA;
            const safeB = Number.isNaN(timeB) ? 0 : timeB;

            return safeA - safeB;
        })
        .map((msg) => {
            const pinOverride =
                pinOverrides[msg.id] ||
                (msg.clientMessageId
                    ? pinOverrides[msg.clientMessageId]
                    : undefined);

            return {
                ...msg,
                isRecalled:
                    msg.isRecalled ||
                    recalledMessageKeys.has(getMessageKey(msg)),
                reactions:
                    reactionOverrides[getMessageKey(msg)] || msg.reactions,
                isPinned: pinOverride ? pinOverride.isPinned : msg.isPinned,
                pinnedAt: pinOverride?.pinnedAt || msg.pinnedAt,
                senderId: msg.senderId || USER_ID,
                senderName: resolveSenderName(msg.senderName, msg.senderId),
            };
        });

  useEffect(() => {
    let mounted = true;
    orionAiService
      .getSettings()
      .then((settings) => {
        if (mounted) {
          setSmartEmotionEnabled(!!settings.smartEmotionDetection);
          setAutoWorkflowEnabled(settings.autoWorkflowSuggestions !== false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSmartEmotionEnabled(false);
          setAutoWorkflowEnabled(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!smartEmotionEnabled) {
      emotionAttemptedMessageIdsRef.current.clear();
      setEmotionByMessageId((prev) =>
        Object.keys(prev).length > 0 ? {} : prev,
      );
      return;
    }

    const candidates = displayMessages
      .filter(
        (message) =>
          message.senderId !== USER_ID &&
          !message.isRecalled &&
          !message.isDeleted &&
          message.content.trim().length > 0,
      )
      .slice(-12)
      .filter(
        (message) =>
          !emotionByMessageId[message.id] &&
          !emotionAttemptedMessageIdsRef.current.has(message.id),
      );

    if (candidates.length === 0) return;

    let cancelled = false;
    candidates.forEach((message) => {
      emotionAttemptedMessageIdsRef.current.add(message.id);
    });

    void Promise.all(
      candidates.map(async (message) => {
        try {
          const result = await orionAiService.detectEmotion({
            messageId: /^[a-f0-9]{24}$/i.test(message.id)
              ? message.id
              : undefined,
            text: /^[a-f0-9]{24}$/i.test(message.id)
              ? undefined
              : message.content,
          });
          const label =
            String(result.cards[0]?.title || result.meta.label || "neutral") ||
            "neutral";
          return {
            id: message.id,
            hint: {
              label,
              icon: result.cards[0]?.icon,
              summary: result.summary,
              tone: result.cards[0]?.tone,
            },
          };
        } catch {
          return null;
        }
      }),
    ).then((items) => {
      if (cancelled) return;
      const detectedItems = items.filter(
        (item): item is NonNullable<typeof item> => !!item,
      );
      if (detectedItems.length === 0) return;

      setEmotionByMessageId((prev) => {
        const next = { ...prev };
        let hasChanges = false;

        detectedItems.forEach((item) => {
          if (prev[item.id] !== item.hint) {
            next[item.id] = item.hint;
            hasChanges = true;
          }
        });

        return hasChanges ? next : prev;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [displayMessages, emotionByMessageId, smartEmotionEnabled, USER_ID]);

  const runAiAction = useCallback(
    async (runner: () => Promise<AiGridResponse>) => {
      try {
        setIsAiLoading(true);
        setAiResult(await runner());
      } catch (error) {
        setError(error instanceof Error ? error.message : "AI request failed");
      } finally {
        setIsAiLoading(false);
      }
    },
    [],
  );

  const handleAISummarize = useCallback(
    (
      mode: "range" | "unread",
      rangeMonths?: 1 | 2 | 3,
      conversationId = selectedConversationId,
    ) => {
      if (!conversationId) return;
      void runAiAction(() =>
        orionAiService.summarizeConversation({
          conversationId,
          mode,
          rangeMonths,
        }),
      );
    },
    [runAiAction, selectedConversationId],
  );

  const handleAIReplySuggestions = useCallback(
    (conversationId = selectedConversationId) => {
      if (!conversationId) return;
      void runAiAction(() =>
        orionAiService.suggestReplies({
          conversationId,
          limit: 4,
        }),
      );
    },
    [runAiAction, selectedConversationId],
  );

  const handleAiResultAction = useCallback((action: AiAction) => {
    if (action.type !== "copy_text") return;
    const text =
      typeof action.payload?.text === "string" ? action.payload.text : "";
    if (text) {
      setComposerDraftText(text);
      setAiResult(null);
    }
  }, []);

    const currentPinnedMessages = useMemo(() => {
        if (!selectedConversationId) return [];
        return pinnedMessagesByConversation[selectedConversationId] || [];
    }, [pinnedMessagesByConversation, selectedConversationId]);

    const latestUnreadMessageId = useMemo(() => {
        const latestIncoming = [...displayMessages]
            .reverse()
            .find(
                (msg) =>
                    msg.conversationId === selectedConversationId &&
                    msg.senderId !== USER_ID &&
                    !msg.isRecalled &&
                    !msg.isDeleted,
            );

        return latestIncoming?.id || latestIncoming?.clientMessageId || null;
    }, [displayMessages, selectedConversationId, USER_ID]);

    useEffect(() => {
        if (!selectedConversationId || !latestUnreadMessageId) return;
        if (lastReadMessageIdRef.current === latestUnreadMessageId) return;

        lastReadMessageIdRef.current = latestUnreadMessageId;
        void emitRead(latestUnreadMessageId);

        window.dispatchEvent(
            new CustomEvent('chat:conversation_read', {
                detail: {
                    conversationId: selectedConversationId,
                    messageId: latestUnreadMessageId,
                },
            }),
        );
    }, [emitRead, latestUnreadMessageId, selectedConversationId]);

    const forwardableConversations = conversations.filter(
        (conversation) =>
            conversation.conversationId !== selectedConversationId,
    );

    const getConversationDisplayName = (conversationId: string) => {
        const conversation = conversations.find(
            (item) => item.conversationId === conversationId,
        );

        if (!conversation) return 'Unknown conversation';
        if (conversation.type === 'GROUP') {
            return conversation.groupInfo?.groupName || 'Group chat';
        }

        return (
            conversation.participants.find((p) => p.userId !== USER_ID)
                ?.fullName || 'Unknown user'
        );
    };

    const jumpToMessage = useCallback((messageId: string) => {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            messageElement.classList.add('bg-yellow-100');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-100');
            }, 2000);
        }
    }, []);

  return (
    <div className="flex h-screen gap-4 bg-gray-50 p-4" style={chatThemeVars}>
      {/* Sidebar */}
      <ChatSidebarWithConversationService
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        loading={conversationsLoading}
        error={conversationsError}
        onAddFriendClick={handleOpenAddFriend}
        onCreateGroupClick={handleOpenCreateGroupModal}
        onAISummarizeConversation={(conversationId, mode, rangeMonths) =>
          handleAISummarize(mode, rangeMonths, conversationId)
        }
        onAIReplySuggestions={(conversationId) =>
          handleAIReplySuggestions(conversationId)
        }
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col rounded-lg bg-white shadow-sm">
        {isConnecting && (
          <div className="border-b border-[var(--chat-primary-border)] bg-[var(--chat-primary-bg)] px-4 py-2 text-sm text-[var(--chat-primary)]">
            Connecting to chat...
          </div>
        )}

                {error && (
                    <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-2 text-red-600 hover:text-red-700"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <ChatHeader
                            name={
                                selectedGroupInfoOverride?.groupName ||
                                selectedConversation.groupInfo?.groupName ||
                                otherParticipant?.fullName ||
                                'Conversation'
                            }
                            avatarUrl={
                                selectedConversation.type === 'GROUP'
                                    ? selectedGroupInfoOverride?.groupAvatar ||
                                      toAbsoluteMediaUrl(
                                          selectedConversation.groupInfo
                                              ?.groupAvatar,
                                      ) ||
                                      undefined
                                    : toAbsoluteMediaUrl(
                                          otherParticipant?.avatarUrl,
                                      ) || undefined
                            }
                            subtitle={
                                typingUserNames.length > 0
                                    ? `${typingUserNames.join(', ')} đang nhập...`
                                    : selectedConversation.type === 'GROUP'
                                      ? 'Group conversation'
                                      : 'Online'
                            }
                            isGroupChat={selectedConversation.type === 'GROUP'}
                            groupMembers={
                                selectedConversation.type === 'GROUP'
                                    ? selectedConversation.participants
                                    : undefined
                            }
                            isBlocked={
                                isPrivateConversation &&
                                (iAmBlocked || iAmTheBlocker)
                            }
                            disableCallButtons={disableCallButtons}
                            onAudioCall={() => {
                                void handleStartCall('audio');
                            }}
                            onVideoCall={() => {
                                void handleStartCall('video');
                            }}
                            onGroupAudioCall={() => {
                                void handleStartGroupCall('audio');
                            }}
                            onGroupVideoCall={() => {
                                void handleStartGroupCall('video');
                            }}
                            onSearchClick={() => setIsSearchOpen(true)}
                            onPanelToggle={() => {
                                setIsSearchOpen(false);
                                setIsInfoPanelOpen((prev) => !prev);
                            }}
                            onIdentityClick={
                                selectedConversation.type === 'GROUP'
                                    ? () => {
                                          setIsSearchOpen(false);
                                          setIsInfoPanelOpen(true);
                                      }
                                    : undefined
                            }
                            onAvatarClick={
                                selectedConversation.type === 'GROUP'
                                    ? () => {
                                          setIsSearchOpen(false);
                                          setIsInfoPanelOpen(true);
                                          setOpenGroupInfoEditTick(
                                              (prev) => prev + 1,
                                          );
                                      }
                                    : undefined
                            }
                            onEditGroupClick={
                                selectedConversation.type === 'GROUP'
                                    ? () => {
                                          setIsSearchOpen(false);
                                          setIsInfoPanelOpen(true);
                                          setOpenGroupInfoEditTick(
                                              (prev) => prev + 1,
                                          );
                                      }
                                    : undefined
                            }
                        />

                        {/* Messages */}
                        {currentPinnedMessages.length > 0 && (
                            <div className="border-b border-slate-200 bg-amber-50/70 px-4 py-2">
                                <div className="mb-1 text-xs font-semibold text-amber-700">
                                    Pinned messages
                                </div>
                                <div className="space-y-1">
                                    {currentPinnedMessages
                                        .slice(0, 3)
                                        .map((item) => (
                                            <button
                                                key={item.messageId}
                                                type="button"
                                                onClick={() =>
                                                    jumpToMessage(
                                                        item.messageId,
                                                    )
                                                }
                                                className="flex w-full items-center justify-between rounded-md bg-white/80 px-2 py-1 text-left hover:bg-white"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-medium text-slate-700">
                                                        {item.senderName ||
                                                            'Thành viên'}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500">
                                                        {item.snippet ||
                                                            item.content ||
                                                            'Tin nhắn đã ghim'}
                                                    </p>
                                                </div>
                                                <span className="ml-3 shrink-0 text-[11px] text-amber-600">
                                                    Đi tới
                                                </span>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

            <MessageList
              socketMessages={displayMessages}
              currentUserId={USER_ID}
              conversationId={selectedConversationId}
              onCallBackMessage={handleCallBackMessage}
              onRecallMessage={handleRequestRecallMessage}
              onDeleteMessage={handleRequestDeleteMessage}
              onForwardMessage={handleOpenForwardModal}
              onReactMessage={handleReactMessage}
              onReplyMessage={handleReplyMessage}
              onTogglePinMessage={handleTogglePinMessage}
              onAISummarize={handleAISummarize}
              onAIReplySuggestions={handleAIReplySuggestions}
              emotionByMessageId={emotionByMessageId}
            />

            {/* Input */}
            <ChatInput
              onSend={handleSend}
              onSendFile={handleSendFile}
              onTypingChange={emitTyping}
              isBlocked={iAmBlocked || iAmTheBlocker}
              canUnblock={iAmTheBlocker}
              onUnblock={handleUnblockUser}
              replyDraft={
                replyDraft &&
                replyDraft.conversationId === selectedConversationId
                  ? replyDraft
                  : null
              }
              onCancelReply={() => setReplyDraft(null)}
              draftText={composerDraftText}
              onDraftTextApplied={() => setComposerDraftText("")}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            {conversationsLoading ? (
              <div>Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div>No conversations yet. Start a new chat!</div>
            ) : (
              <div>Select a conversation to start chatting</div>
            )}
          </div>
        )}
      </div>

      {/* Right panel: SearchModal thay cho ConversationInfoPanel khi dang tim kiem */}
      {selectedConversation && isSearchOpen ? (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          messages={displayMessages}
          currentUserId={USER_ID}
          onSelectMessage={jumpToMessage}
        />
      ) : selectedConversation && isInfoPanelOpen ? (
        selectedConversation.type === "GROUP" ? (
          <ConversationGroupInfoPanel
            isSidebarOpen={true}
            selectedConversation={selectedConversation}
            displayMessages={displayMessages}
            openEditAvatarTick={openGroupInfoEditTick}
            onConversationRemoved={handleGroupConversationRemoved}
            onJumpToMessage={jumpToMessage}
            onForwardMessage={handleOpenForwardModal}
          />
        ) : (
          <ConversationInfoPanel
            isSidebarOpen={true}
            selectedConversation={selectedConversation}
            displayMessages={displayMessages}
            currentUserId={USER_ID}
            onBlockStatusChange={loadBlockStatus}
            onJumpToMessage={jumpToMessage}
            onForwardMessage={handleOpenForwardModal}
            onPinStatusChange={refreshConversations}
            onConversationCreated={async (conversation) => {
              if (conversation?.conversationId) {
                setSelectedConversationId(conversation.conversationId);
              }
              await refreshConversations();
            }}
          />
        )
      ) : null}

      {(aiResult || isAiLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="max-h-[82vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-3 shadow-2xl">
            {isAiLoading && (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                AI is thinking...
              </div>
            )}
            {aiResult && (
              <AIGridResult
                result={aiResult}
                onClose={() => setAiResult(null)}
                onAction={handleAiResultAction}
              />
            )}
          </div>
        </div>
      )}

            <Modal
                isOpen={isForwardModalOpen}
                onClose={() => {
                    setIsForwardModalOpen(false);
                    setForwardingMessage(null);
                    setForwardTargetConversationId('');
                }}
                title="Chuyển tiếp tin nhắn"
                size="sm"
            >
                <div className="p-4 space-y-4">
                    {forwardingMessage && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            {forwardingMessage.isFile
                                ? `File: ${forwardingMessage.fileName || 'Đính kèm'}`
                                : forwardingMessage.content}
                        </div>
                    )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Chọn cuộc trò chuyện riêng
            </label>
            <select
              value={forwardTargetConversationId}
              onChange={(e) => setForwardTargetConversationId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--chat-primary)] focus:outline-none"
            >
              <option value="">-- Chọn cuộc trò chuyện --</option>
              {forwardableConversations.map((conversation) => (
                <option
                  key={conversation.conversationId}
                  value={conversation.conversationId}
                >
                  {getConversationDisplayName(conversation.conversationId)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsForwardModalOpen(false);
                setForwardingMessage(null);
                setForwardTargetConversationId("");
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleForwardMessage}
              disabled={
                !forwardTargetConversationId ||
                isForwarding ||
                forwardableConversations.length === 0
              }
              className="rounded-lg bg-[var(--chat-primary)] px-3 py-2 text-sm text-white hover:bg-[var(--chat-primary-hover)] disabled:opacity-50"
            >
              {isForwarding ? "Đang chuyển..." : "Chuyển tiếp"}
            </button>
          </div>
        </div>
      </Modal>

            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                currentUserId={effectiveCurrentUserId}
                onCreated={async (conversation) => {
                    setIsCreateGroupModalOpen(false);
                    await refreshConversations();
                    if (conversation?.conversationId) {
                        setSelectedConversationId(conversation.conversationId);
                        setIsInfoPanelOpen(true);
                        setIsSearchOpen(false);
                    }
                }}
            />

            <Dialog
                isOpen={isRecallConfirmOpen}
                onClose={() => {
                    setIsRecallConfirmOpen(false);
                    setPendingRecallMessage(null);
                }}
                onConfirm={handleConfirmRecallMessage}
                title="Thu hồi tin nhắn?"
                message="Tin nhắn sẽ hiển thị là đã thu hồi với cả hai bên."
                confirmText="Thu hồi"
                cancelText="Hủy"
                type="warning"
            />

            <Dialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => {
                    setIsDeleteConfirmOpen(false);
                    setPendingDeleteMessage(null);
                }}
                onConfirm={handleConfirmDeleteMessage}
                title="Xóa tin nhắn ở phía bạn?"
                message="Tin nhắn sẽ chỉ bị ẩn ở thiết bị của bạn."
                confirmText="Xóa"
                cancelText="Hủy"
                type="danger"
            />
        </div>
    );
};

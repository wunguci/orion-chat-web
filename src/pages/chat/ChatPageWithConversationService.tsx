import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import ChatSidebarWithConversationService from "../../components/chat/ChatSidebarWithConversationService";
import ChatHeader from "../../components/chat/ChatHeader";
import MessageList, {
  type SocketMessage,
} from "../../components/chat/MessageList";
import ChatInput from "../../components/chat/ChatInput";
import { ConversationInfoPanel } from "../../components/chat/ConversationInfoPanel";
import Modal from "../../components/common/Modal";
import { Dialog } from "../../components/common/Dialog";
import {
  joinConversation,
  sendMessage,
  offMessageNew,
  onMessageNew,
  onMessageReactionUpdated,
  onMessageRecalled,
  offMessageReactionUpdated,
  offMessageRecalled,
  disconnectSocket,
  chatSocketService,
} from "../../services/socket";
import {
  useConversations,
  useConversationDetail,
  useConversationMessages,
} from "../../hooks/useConversation";
import { conversationApi } from "../../services/conversationApi";
import { getCurrentUserId, getCurrentUserName } from "../../utils/auth";
import { debugAuthStatus, getUser } from "../../utils/token";
import { getUserInfo } from "../../services/userService";
import { useCall } from "../../hooks/useCall";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3000";

const toAbsoluteMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
};

export const ChatPage: React.FC = () => {
  type ChatSocketMessage = SocketMessage & {
    clientMessageId?: string;
    conversationId?: string;
    type?: "text" | "image" | "file" | "audio" | "call";
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
    createdAt?: string;
    isFile?: boolean;
    type?: "text" | "image" | "file" | "audio" | "call";
    messageType?:
      | "TEXT"
      | "IMAGE"
      | "FILE"
      | "VIDEO"
      | "AUDIO"
      | "CALL"
      | "text"
      | "image"
      | "file"
      | "video"
      | "audio"
      | "call";
    fileUrl?: string;
    mediaUrl?: string;
    fileName?: string;
    fileType?: string;
    isDeleted?: boolean;
    isRecalled?: boolean;
    reactions?: Array<{
      userId?: string;
      emoji?: string;
      reactedAt?: string;
    }>;
    conversationId?: string;
    callData?: {
      callType?: "audio" | "video";
      callStatus?: "completed" | "missed" | "declined";
      duration?: number;
      isInitiator?: boolean;
      wasRejected?: boolean;
    };
    message?: Partial<IncomingSocketPayload>;
    data?: Partial<IncomingSocketPayload>;
  };

  // Lấy user ID trong component (sau khi auth đã load xong)
  const USER_ID = getCurrentUserId();
  const USERNAME = getCurrentUserName();
  const {
    initiateCall,
    status: callStatus,
    startTime: callStartTime,
    isInitiator,
    wasAnswered,
    wasRejected,
  } = useCall();
  const location = useLocation();

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
  const [reactionOverrides, setReactionOverrides] = useState<
    Record<string, NonNullable<SocketMessage["reactions"]>>
  >({});
  const [iAmBlocked, setIAmBlocked] = useState(false); // Người dùng hiện tại bị chặn
  const [iAmTheBlocker, setIAmTheBlocker] = useState(false); // Người dùng hiện tại là người chặn (có thể bỏ chặn)
  const messageListenerRef = useRef<((msg: ChatSocketMessage) => void) | null>(
    null,
  );

  // Lấy toàn bộ conversations (cho sidebar + modal chuyển tiếp)
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refreshConversations,
  } = useConversations();

  // Lấy chi tiết conversation đang chọn
  // Không cần truyền USER_ID - sử dụng JWT token từ localStorage
  const { conversation: selectedConversation } = useConversationDetail(
    selectedConversationId || "",
  );

  // Lấy messages cho conversation đang chọn
  // Không cần truyền USER_ID - sử dụng JWT token từ localStorage
  const { messages: paginatedMessages } = useConversationMessages(
    selectedConversationId || "",
    30,
  );

  const getReceiverId = useCallback(() => {
    if (!selectedConversation) return "";

    const otherParticipant = selectedConversation.participants?.find(
      (p) => p.userId !== USER_ID,
    );
    return otherParticipant?.userId ?? USER_ID;
  }, [selectedConversation]);

  const getMessageKey = useCallback(
    (message: Pick<SocketMessage, "id" | "clientMessageId">) =>
      message.clientMessageId || message.id,
    [],
  );

  // Hàm trợ giúp để tải trạng thái chặn
  const loadBlockStatus = async (convId?: string) => {
    const conversationId = convId || selectedConversation?.conversationId;
    if (!conversationId) {
      setIAmBlocked(false);
      setIAmTheBlocker(false);
      return;
    }

    try {
      const response = await conversationApi.getBlockStatus(conversationId);
      // Dữ liệu backend trả về:
      // - iAmBlocked: người dùng hiện tại bị chặn
      // - iAmTheBlocker: người dùng hiện tại là người chặn (có nút bỏ chặn)
      setIAmBlocked(response?.iAmBlocked || false);
      setIAmTheBlocker(response?.iAmTheBlocker || false);
    } catch (error) {
      console.error("Error loading block status:", error);
      setIAmBlocked(false);
      setIAmTheBlocker(false);
    }
  };

  // Tải trạng thái chặn khi conversation thay đổi
  useEffect(() => {
    loadBlockStatus();
  }, [selectedConversation?.conversationId]);

  // Tự chọn conversation từ location state (ví dụ: click chat từ trang bạn bè)
  useEffect(() => {
    const state = location.state as {
      selectedConversationId?: string;
    } | null;
    if (state?.selectedConversationId && !selectedConversationId) {
      setSelectedConversationId(state.selectedConversationId);
    }
  }, [location.state, selectedConversationId]);

  // Poll trạng thái chặn mỗi 5 giây để phát hiện khi đối phương chặn/bỏ chặn
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (selectedConversation?.conversationId) {
        loadBlockStatus();
      }
    }, 5000); // Poll mỗi 5 giây

    return () => clearInterval(intervalId);
  }, [selectedConversation?.conversationId]);

  // Refresh conversations khi điều hướng từ trang bạn bè (vừa tạo conversation mới)
  useEffect(() => {
    if (location.state?.selectedConversationId) {
      // Đợi một chút để backend xử lý xong việc tạo conversation
      const timer = setTimeout(() => {
        refreshConversations();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state?.selectedConversationId, refreshConversations]);

  const getReceiverIdByConversationId = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find(
        (item) => item.conversationId === conversationId,
      );
      const otherParticipant = conversation?.participants?.find(
        (p) => p.userId !== USER_ID,
      );
      return otherParticipant?.userId || "";
    },
    [conversations],
  );

  // Xử lý bỏ chặn - chỉ người chặn mới có thể bỏ chặn
  const handleUnblockUser = async () => {
    if (!selectedConversation?.conversationId) return;

    // Xác nhận người dùng hiện tại là người chặn (iAmTheBlocker)
    if (!iAmTheBlocker) {
      console.error("Only the person who blocked can unblock");
      return;
    }

    try {
      await conversationApi.unblockUser(selectedConversation.conversationId);
      // Tải lại trạng thái chặn ngay để cả 2 bên đều cập nhật
      await loadBlockStatus();
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  const toSocketMessage = useCallback(
    (payload: IncomingSocketPayload): ChatSocketMessage => {
      const messageType = payload?.messageType || payload?.type;
      const normalizedType = String(messageType || "").toLowerCase();
      const resolvedType: ChatSocketMessage["type"] =
        normalizedType === "image"
          ? "image"
          : normalizedType === "file"
            ? "file"
            : normalizedType === "audio"
              ? "audio"
              : normalizedType === "call"
                ? "call"
                : "text";
      const isImageType =
        messageType === "IMAGE" ||
        messageType === "image" ||
        payload?.fileType?.startsWith("image/");

      // Lấy sender ID và dùng làm tên fallback
      const senderId = payload?.senderId || payload?.senderBy || "unknown";

      return {
        id:
          payload?.messageId ||
          payload?.id ||
          payload?._id ||
          payload?.clientMessageId ||
          `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        clientMessageId: payload?.clientMessageId,
        senderId: senderId,
        // Dùng senderName nếu có, nếu không thì dùng senderId (phone/userId) làm fallback
        senderName: payload?.senderName || senderId,
        senderAvatar: toAbsoluteMediaUrl(payload?.senderAvatar),
        content: payload?.content || "",
        timestamp:
          payload?.timestamp || payload?.createdAt || new Date().toISOString(),
        isFile:
          payload?.isFile ||
          payload?.type === "file" ||
          payload?.type === "image" ||
          messageType === "FILE" ||
          messageType === "IMAGE" ||
          messageType === "file" ||
          messageType === "image",
        fileUrl: payload?.fileUrl || payload?.mediaUrl,
        fileName: payload?.fileName,
        fileType: payload?.fileType || (isImageType ? "image/*" : undefined),
        isRecalled: payload?.isRecalled || payload?.isDeleted,
        reactions: Array.isArray(payload?.reactions)
          ? payload.reactions
              .filter((reaction) => !!reaction?.emoji)
              .map((reaction) => ({
                userId: reaction?.userId || "",
                emoji: reaction?.emoji || "",
                reactedAt: reaction?.reactedAt,
              }))
          : [],
        conversationId: payload?.conversationId,
        type: resolvedType,
        callData: payload?.callData,
      };
    },
    [],
  );

  // Khởi tạo kết nối socket
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        setIsConnecting(true);

        // Kiểm tra trạng thái xác thực
        debugAuthStatus();

        // Kết nối bằng JWT token từ localStorage (không cần truyền userId)
        chatSocketService.connect();

        const messageHandler = (payload: IncomingSocketPayload) => {
          const rawPayload = payload?.message || payload?.data || payload;
          const msg = toSocketMessage(rawPayload);

          const hasVisibleContent =
            msg.isRecalled ||
            msg.content.trim().length > 0 ||
            (msg.isFile && !!msg.fileUrl) ||
            (msg.type === "call" && !!msg.callData);

          if (!hasVisibleContent || !msg.conversationId) {
            console.warn(
              "[ChatPage] Message filtered out - no visible content or conversationId",
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
              next[existingIndex] = {
                ...next[existingIndex],
                ...msg,
              };
              return next;
            }

            return [...prev, msg];
          });
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
          action: "set" | "remove";
          emoji?: string;
          at: string;
        }) => {
          if (payload.conversationId !== selectedConversationId) return;

          setSocketMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.messageId
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
          if (payload.conversationId !== selectedConversationId) return;

          setSocketMessages((prev) => {
            let found = false;
            const updated = prev.map((msg) => {
              if (msg.id === payload.messageId) {
                found = true;
                return {
                  ...msg,
                  isRecalled: true,
                  content: msg.content, // Giữ nội dung gốc trong bộ nhớ
                  // Nhưng UI sẽ không hiển thị khi isRecalled=true
                };
              }
              return msg;
            });

            // Nếu không tìm thấy message trong socketMessages (từ paginatedMessages),
            // thêm vào socketMessages để displayMessages hiển thị trạng thái đã thu hồi
            if (!found) {
              updated.push({
                id: payload.messageId,
                senderId: payload.revokedBy,
                senderName: "Unknown",
                content: "",
                isRecalled: true,
                timestamp: new Date(payload.revokedAt).toISOString(),
                conversationId: payload.conversationId,
              });
            }

            return updated;
          });

          setRecalledMessageKeys((prev) => {
            const next = new Set(prev);
            next.add(payload.messageId);
            return next;
          });
        };

        messageListenerRef.current = messageHandler;

        onMessageNew(messageHandler);

        onMessageReactionUpdated(reactionHandler);

        onMessageRecalled(recallHandler);

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to connect to chat",
        );
        console.error("Socket connection error:", err);
      } finally {
        setIsConnecting(false);
      }
    };

    initializeSocket();

    return () => {
      if (messageListenerRef.current) {
        offMessageNew();
      }
      offMessageReactionUpdated();
      offMessageRecalled();
      disconnectSocket();
    };
  }, [toSocketMessage, selectedConversationId]);

  // Xử lý chọn conversation
  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSocketMessages([]); // Xóa socket messages khi chuyển conversation mới
  }, []);

  useEffect(() => {
    if (!selectedConversationId) return;

    // Phát sự kiện global để module notification mark-read đúng conversation.
    window.dispatchEvent(
      new CustomEvent("chat:conversation_opened", {
        detail: { conversationId: selectedConversationId },
      }),
    );

    joinConversation(`join_${Date.now()}`, selectedConversationId);
  }, [selectedConversationId]);

  // Làm giàu sender name cho message chỉ có số điện thoại (tương thích ngược)
  // Message mới từ backend đã có senderName
  useEffect(() => {
    if (socketMessages.length === 0) return;

    // Tìm message có senderName chỉ là số điện thoại (cần làm giàu)
    const messagesToEnrich = socketMessages.filter(
      (msg) =>
        msg.senderName &&
        /^\d{10,11}$/.test(msg.senderName) && // Trông giống số điện thoại
        msg.senderName === msg.senderId, // senderName trùng senderId (chưa làm giàu)
    );

    if (messagesToEnrich.length === 0) return;

    // Thu thập các sender ID duy nhất cần làm giàu
    const uniqueSenderIds = new Set(
      messagesToEnrich.map((msg) => msg.senderId),
    );

    // Lấy user info cho sender chỉ có số điện thoại
    const enrichSenderNames = async () => {
      for (const senderId of uniqueSenderIds) {
        if (!senderId) continue;

        try {
          const userInfo = await getUserInfo(senderId);
          if (userInfo?.fullName && userInfo.fullName !== senderId) {
            // Cập nhật message bằng tên người gửi thực tế
            setSocketMessages((prev) =>
              prev.map((msg) =>
                msg.senderId === senderId && /^\d{10,11}$/.test(msg.senderName)
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
  }, [socketMessages.length]); // Chỉ chạy khi số lượng message thay đổi

  const recallLocalMessage = useCallback(
    (message: SocketMessage) => {
      const messageKey = getMessageKey(message);

      setRecalledMessageKeys((prev) => {
        const next = new Set(prev);
        next.add(messageKey);
        return next;
      });

      setSocketMessages((prev) =>
        prev.map((msg) => {
          const sameMessage =
            (message.clientMessageId &&
              msg.clientMessageId === message.clientMessageId) ||
            msg.id === message.id;

          if (!sameMessage) return msg;

          return {
            ...msg,
            content: "",
            isFile: false,
            fileUrl: undefined,
            fileName: undefined,
            fileType: undefined,
            isRecalled: true,
          };
        }),
      );
    },
    [getMessageKey],
  );

  const executeRecallMessage = useCallback(
    async (message: SocketMessage) => {
      if (!selectedConversationId || message.senderId !== USER_ID) return;

      recallLocalMessage(message);

      if (message.id.startsWith("msg_")) return;

      try {
        await conversationApi.recallMessage(selectedConversationId, message.id);
      } catch (err) {
        console.error("Error recalling message:", err);
        setError(
          err instanceof Error ? err.message : "Failed to recall message",
        );
      }
    },
    [selectedConversationId, recallLocalMessage],
  );

  const executeDeleteMessage = useCallback(
    async (message: SocketMessage) => {
      const messageKey = getMessageKey(message);
      setHiddenMessageKeys((prev) => {
        const next = new Set(prev);
        next.add(messageKey);
        return next;
      });

      if (!selectedConversationId || message.id.startsWith("msg_")) {
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
        console.error("Error deleting message for me:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to delete message for me",
        );
      }
    },
    [getMessageKey, selectedConversationId],
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

  // Chỉ ghi đúng một call-history message khi cuộc gọi chuyển sang trạng thái kết thúc.
  useEffect(() => {
    const prevStatus = prevCallStatusRef.current;

    // Lưu vai trò người gọi vào ref vì CallContext có thể reset rất nhanh trước khi effect chạy.
    if (
      isInitiator &&
      (callStatus === "calling" ||
        callStatus === "ringing" ||
        callStatus === "connected")
    ) {
      wasInitiatorRef.current = true;
    }

    // Chỉ người gọi ghi lịch sử; người nhận chỉ hiển thị lại cùng một bản ghi đó.
    if (!wasInitiatorRef.current) {
      prevCallStatusRef.current = callStatus;
      return;
    }

    const hadActiveCall =
      prevStatus === "calling" ||
      prevStatus === "ringing" ||
      prevStatus === "connected";
    const callJustEnded =
      hadActiveCall &&
      (callStatus === "idle" ||
        callStatus === "failed" ||
        callStatus === "rejected" ||
        callStatus === "ended");

    if (callJustEnded) {
      if (
        selectedConversationId &&
        selectedConversation &&
        selectedConversation.type === "PRIVATE" &&
        USERNAME &&
        USER_ID
      ) {
        const logCallToChat = async () => {
          try {
            const otherParticipant = selectedConversation?.participants?.find(
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
            let callHistoryStatus: "completed" | "missed" | "declined" =
              "completed";

            if (wasRejected) {
              // Ưu tiên cờ từ chối tường minh để tránh race condition khi state reset nhanh.
              callHistoryStatus = "declined";
            } else if (prevStatus === "connected") {
              // Người nhận đã bắt máy và cuộc gọi kết thúc bình thường.
              callHistoryStatus = "completed";
            } else if (callStatus === "rejected" || callStatus === "failed") {
              // Người nhận từ chối hoặc tín hiệu lỗi trong lúc chờ bắt máy.
              callHistoryStatus = "declined";
            } else if (
              (prevStatus === "calling" || prevStatus === "ringing") &&
              (callStatus === "idle" || callStatus === "ended")
            ) {
              // Người gọi tự hủy trước khi người nhận bắt máy.
              callHistoryStatus = "missed";
            }

            const callMessage: ChatSocketMessage = {
              id: clientMessageId,
              clientMessageId,
              senderId: USER_ID,
              senderName: USERNAME,
              content: "",
              timestamp: now,
              conversationId: selectedConversationId,
              type: "call",
              callData: {
                callType: "audio",
                callStatus: callHistoryStatus,
                duration: duration,
                isInitiator: true,
                wasRejected: callHistoryStatus === "declined",
              },
            };

            setSocketMessages((prev) => [...prev, callMessage]);

            sendMessage({
              requestId: `req_${Date.now()}`,
              clientMessageId,
              receiverId: otherParticipant.userId,
              type: "call",
              content: "",
              conversationId: selectedConversationId,
              callData: callMessage.callData,
            });
          } catch (err) {
            console.error("Error logging call to chat:", err);
          }
        };

        logCallToChat();
      }

      // Reset sau khi đã ghi xong một bản ghi lịch sử cho vòng đời cuộc gọi này.
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
      if (!selectedConversationId || message.id.startsWith("msg_")) return;

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
            message.id,
          );
        } else {
          response = await conversationApi.reactToMessage(
            selectedConversationId,
            message.id,
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

        console.error("Error reacting:", err);
      }
    },
    [getMessageKey, reactionOverrides, selectedConversationId],
  );

  const handleOpenForwardModal = useCallback((message: SocketMessage) => {
    setForwardingMessage(message);
    setForwardTargetConversationId("");
    setIsForwardModalOpen(true);
  }, []);

  const handleForwardMessage = useCallback(async () => {
    if (!forwardingMessage || !forwardTargetConversationId) return;

    const receiverId = getReceiverIdByConversationId(
      forwardTargetConversationId,
    );
    if (!receiverId) {
      setError("Không tìm thấy người nhận cho cuộc trò chuyện này.");
      return;
    }

    if (forwardingMessage.fileUrl?.startsWith("blob:")) {
      setError("Không thể chuyển tiếp tệp khi chưa upload xong.");
      return;
    }

    try {
      setIsForwarding(true);
      const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      if (forwardingMessage.id.startsWith("msg_")) {
        setError("Không thể chuyển tiếp tin nhắn chưa gửi xong.");
        return;
      }

      // Lưu ý: userId nên được đưa vào request headers qua API interceptor
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
  }, [
    forwardingMessage,
    forwardTargetConversationId,
    getReceiverIdByConversationId,
  ]);

  // Xử lý gửi tin nhắn
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !selectedConversationId) return;

      try {
        const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        setSocketMessages((prev) => [
          ...prev,
          {
            id: clientMessageId,
            clientMessageId,
            senderId: USER_ID,
            senderName: USERNAME,
            content: text,
            timestamp: new Date().toISOString(),
            conversationId: selectedConversationId,
            type: "text",
          },
        ]);

        // Gửi qua socket
        const receiverId = getReceiverId();

        if (!receiverId) {
          console.error("[ChatPage] Cannot send message: receiverId is empty");
          setError("Cannot determine receiver. Please try again.");
          return;
        }

        sendMessage({
          requestId: `req_${Date.now()}`,
          clientMessageId,
          receiverId: receiverId,
          type: "text",
          content: text,
          conversationId: selectedConversationId,
        });
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [selectedConversationId, getReceiverId],
  );

  // Xử lý gửi tệp
  const handleSendFile = useCallback(
    async (file: File) => {
      if (!selectedConversationId) return;

      try {
        const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // Xác định loại tệp
        const fileType = file.type;
        const isImage = fileType.startsWith("image/");
        const messageType = isImage ? "image" : "file";

        // Tạo URL preview cục bộ để hiển thị ngay
        const tempFileUrl = URL.createObjectURL(file);

        // Thêm message tạm với preview cục bộ
        setSocketMessages((prev) => [
          ...prev,
          {
            id: clientMessageId,
            clientMessageId,
            senderId: USER_ID,
            senderName: USERNAME,
            content: file.name,
            timestamp: new Date().toISOString(),
            conversationId: selectedConversationId,
            type: messageType,
            isFile: true,
            fileName: file.name,
            fileUrl: tempFileUrl, // Dùng blob URL để hiển thị ngay
            fileType: fileType,
          },
        ]);

        // Upload tệp trước vì backend yêu cầu mediaUrl cho media messages
        let serverFileUrl = "";
        let uploadedFileType = fileType;

        try {
          const uploadResponse = await conversationApi.uploadFile(
            file,
            selectedConversationId,
          );
          serverFileUrl = uploadResponse.mediaUrl;
          uploadedFileType = uploadResponse.mimeType || fileType;

          // Cập nhật message bằng URL từ server sau khi upload thành công
          setSocketMessages((prev) =>
            prev.map((msg) =>
              msg.clientMessageId === clientMessageId
                ? {
                    ...msg,
                    fileUrl: serverFileUrl,
                    fileType: uploadedFileType,
                  }
                : msg,
            ),
          );
        } catch (uploadErr) {
          URL.revokeObjectURL(tempFileUrl);
          setSocketMessages((prev) =>
            prev.filter((msg) => msg.clientMessageId !== clientMessageId),
          );
          throw uploadErr;
        }

        // Gửi message qua socket kèm file URL
        sendMessage({
          requestId: `req_${Date.now()}`,
          clientMessageId,
          receiverId: getReceiverId(),
          type: messageType as "image" | "file",
          content: file.name,
          mediaUrl: serverFileUrl,
          fileName: file.name,
          fileSize: file.size,
          conversationId: selectedConversationId,
        });
      } catch (err) {
        console.error("Error sending file:", err);
        setError(err instanceof Error ? err.message : "Failed to send file");
      }
    },
    [selectedConversationId, getReceiverId],
  );

  // Kết hợp dữ liệu phân trang và dữ liệu socket
  const otherParticipant = selectedConversation?.participants?.find(
    (p) => p.userId !== USER_ID,
  );

  const isPrivateConversation = selectedConversation?.type === "PRIVATE";
  const disableCallButtons =
    !isPrivateConversation || iAmBlocked || iAmTheBlocker;

  const handleStartCall = useCallback(
    async (callType: "audio" | "video") => {
      if (!selectedConversation || !otherParticipant) return;
      if (selectedConversation.type !== "PRIVATE") return;

      if (callStatus !== "idle") {
        setError("You are currently on another call.");
        return;
      }

      const currentUser = getUser();

      await initiateCall(
        selectedConversation.conversationId,
        otherParticipant.userId,
        callType,
        {
          name: otherParticipant.fullName || "Unknown",
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
      if (selectedConversation.type !== "PRIVATE") return;

      if (callStatus !== "idle") {
        setError("You are currently on another call.");
        return;
      }

      const callbackType = message.callData?.callType || "audio";
      const currentUser = getUser();

      await initiateCall(
        selectedConversation.conversationId,
        otherParticipant.userId,
        callbackType,
        {
          name: otherParticipant.fullName || "Unknown",
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

  const getSenderName = useCallback(
    (senderId?: string) => {
      if (!senderId) return "Unknown";
      if (senderId === USER_ID) return USERNAME;

      return (
        selectedConversation?.participants?.find((p) => p.userId === senderId)
          ?.fullName || "Unknown"
      );
    },
    [selectedConversation, USER_ID, USERNAME],
  );

  const paginatedAsSocketMessages: SocketMessage[] = paginatedMessages.map(
    (m, idx) => {
      const senderRef = m.senderBy || m.senderId || "unknown";

      return {
        id:
          m.messageId ||
          m._id ||
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
        content: m.content || "",
        timestamp:
          typeof m.createdAt === "string"
            ? m.createdAt
            : (m.createdAt?.toISOString() ?? new Date().toISOString()),
        isFile:
          m.messageType === "FILE" ||
          m.messageType === "IMAGE" ||
          m.messageType === "file" ||
          m.messageType === "image",
        fileUrl: m.mediaUrl,
        fileName: m.fileName,
        fileType:
          m.messageType === "IMAGE" || m.messageType === "image"
            ? "image/*"
            : undefined,
        // Message được coi là đã thu hồi nếu isRevoked=true (từ backend)
        // Backend vẫn giữ message trong DB với cờ isRevoked
        isRecalled: m.isRevoked === true,
        reactions: Array.isArray(m.reactions)
          ? m.reactions.map((reaction) => ({
              userId: reaction.userId,
              emoji: reaction.emoji,
              reactedAt:
                typeof reaction.reactedAt === "string"
                  ? reaction.reactedAt
                  : reaction.reactedAt?.toISOString(),
            }))
          : [],
        type:
          m.messageType === "CALL" || m.messageType === "call"
            ? "call"
            : m.messageType === "IMAGE" || m.messageType === "image"
              ? "image"
              : m.messageType === "FILE" || m.messageType === "file"
                ? "file"
                : m.messageType === "AUDIO" || m.messageType === "audio"
                  ? "audio"
                  : "text",
        callData: m.callData,
      };
    },
  );

  const mergedMessages: SocketMessage[] = [
    ...paginatedAsSocketMessages,
    ...socketMessages.filter(
      (sm) => sm.conversationId === selectedConversationId,
    ),
  ];

  const messageMap = new Map<string, SocketMessage>();
  for (const message of mergedMessages) {
    const hasVisibleContent =
      message.isRecalled ||
      message.content.trim().length > 0 ||
      (message.isFile && !!message.fileUrl) ||
      (message.type === "call" && !!(message as ChatSocketMessage).callData); // Bao gồm cả call messages
    if (!hasVisibleContent) continue;

    const key =
      (message as ChatSocketMessage).clientMessageId ||
      message.id ||
      `${message.senderId}_${message.timestamp}_${message.content}_${message.fileUrl || ""}`;

    messageMap.set(key, message);
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
    .map((msg) => ({
      ...msg,
      isRecalled: msg.isRecalled || recalledMessageKeys.has(getMessageKey(msg)),
      reactions: reactionOverrides[getMessageKey(msg)] || msg.reactions,
      senderId: msg.senderId || USER_ID,
      senderName: msg.senderName || getSenderName(msg.senderId),
    }));

  const forwardableConversations = conversations.filter(
    (conversation) =>
      conversation.type === "PRIVATE" &&
      conversation.conversationId !== selectedConversationId,
  );

  const getConversationDisplayName = (conversationId: string) => {
    const conversation = conversations.find(
      (item) => item.conversationId === conversationId,
    );

    if (!conversation) return "Unknown conversation";
    if (conversation.type === "GROUP") {
      return conversation.groupInfo?.groupName || "Group chat";
    }

    return (
      conversation.participants.find((p) => p.userId !== USER_ID)?.fullName ||
      "Unknown user"
    );
  };

  return (
    <div className="flex h-screen gap-4 bg-gray-50 p-4">
      {/* Sidebar */}
      <ChatSidebarWithConversationService
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        loading={conversationsLoading}
        error={conversationsError}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col rounded-lg bg-white shadow-sm">
        {isConnecting && (
          <div className="border-b border-gray-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
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
                selectedConversation.groupInfo?.groupName ||
                otherParticipant?.fullName ||
                "Conversation"
              }
              avatarUrl={
                selectedConversation.type === "GROUP"
                  ? toAbsoluteMediaUrl(
                      selectedConversation.groupInfo?.groupAvatar,
                    ) || undefined
                  : toAbsoluteMediaUrl(otherParticipant?.avatarUrl) || undefined
              }
              subtitle={
                selectedConversation.type === "GROUP"
                  ? "Group conversation"
                  : "Online"
              }
              isBlocked={iAmBlocked || iAmTheBlocker}
              disableCallButtons={disableCallButtons}
              onAudioCall={() => {
                void handleStartCall("audio");
              }}
              onVideoCall={() => {
                void handleStartCall("video");
              }}
            />

            {/* Messages */}
            <MessageList
              socketMessages={displayMessages}
              currentUserId={USER_ID}
              conversationId={selectedConversationId}
              onCallBackMessage={handleCallBackMessage}
              onRecallMessage={handleRequestRecallMessage}
              onDeleteMessage={handleRequestDeleteMessage}
              onForwardMessage={handleOpenForwardModal}
              onReactMessage={handleReactMessage}
            />

            {/* Input */}
            <ChatInput
              onSend={handleSend}
              onSendFile={handleSendFile}
              isBlocked={iAmBlocked || iAmTheBlocker}
              canUnblock={iAmTheBlocker}
              onUnblock={handleUnblockUser}
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

      {/* Conversation info panel */}
      {selectedConversation && (
        <ConversationInfoPanel
          isSidebarOpen={true}
          selectedConversation={selectedConversation}
          displayMessages={displayMessages}
          currentUserId={USER_ID}
          onBlockStatusChange={loadBlockStatus}
          onJumpToMessage={(messageId: string) => {
            // Cố gắng cuộn tới phần tử message trong DOM
            const messageElement = document.getElementById(
              `message-${messageId}`,
            );
            if (messageElement) {
              messageElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              // Highlight message trong thời gian ngắn
              messageElement.classList.add("bg-yellow-100");
              setTimeout(() => {
                messageElement.classList.remove("bg-yellow-100");
              }, 2000);
            }
          }}
          onForwardMessage={handleOpenForwardModal}
          onPinStatusChange={refreshConversations}
        />
      )}

      <Modal
        isOpen={isForwardModalOpen}
        onClose={() => {
          setIsForwardModalOpen(false);
          setForwardingMessage(null);
          setForwardTargetConversationId("");
        }}
        title="Chuyển tiếp tin nhắn"
        size="sm"
      >
        <div className="p-4 space-y-4">
          {forwardingMessage && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {forwardingMessage.isFile
                ? `File: ${forwardingMessage.fileName || "Đính kèm"}`
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isForwarding ? "Đang chuyển..." : "Chuyển tiếp"}
            </button>
          </div>
        </div>
      </Modal>

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

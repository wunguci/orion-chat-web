/* eslint-disable no-useless-catch */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Lock, Pin, UserPlus, Users } from "lucide-react";
import { getCurrentUserId } from "../../utils/auth";
import type { ConversationView } from "../../types/conversation";
import { RevealConversationModal } from "./RevealConversationModal";
import { conversationApi } from "../../services/conversationApi";
import GroupAvatar from "./GroupAvatar";
import { Modal } from "../common/Modal";
import {
  friendListService,
  type FriendApiItem,
} from "../../services/friendListService";

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

interface ChatSidebarProps {
  conversations: ConversationView[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  loading?: boolean;
  error?: string | null;
  onNewConversation?: () => void;
  onConversationRevealed?: (conversationId: string) => void;
  onCreateGroupConversation?: (conversation: ConversationView) => void;
}

export const ChatSidebarWithConversationService: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading = false,
  error = null,
  onNewConversation,
  onConversationRevealed,
  onCreateGroupConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [selectedHiddenConversation, setSelectedHiddenConversation] =
    useState<ConversationView | null>(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
  const [groupAvatarPreviewUrl, setGroupAvatarPreviewUrl] = useState<
    string | null
  >(null);
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<
    string[]
  >([]);
  const [groupModalError, setGroupModalError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendOptions, setFriendOptions] = useState<FriendApiItem[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<
    Record<string, number>
  >(() => {
    const globalWindow = window as Window & {
      __unreadByConversation?: Record<string, number>;
    };

    return globalWindow.__unreadByConversation || {};
  });

  const currentUserId = getCurrentUserId();

  const handleOpenCreateGroupModal = useCallback(() => {
    setGroupModalError(null);
    setGroupNameInput("");
    if (groupAvatarPreviewUrl) {
      URL.revokeObjectURL(groupAvatarPreviewUrl);
    }
    setGroupAvatarPreviewUrl(null);
    setGroupAvatarFile(null);
    setSelectedGroupMemberIds([]);
    setIsCreateGroupModalOpen(true);
  }, [groupAvatarPreviewUrl]);

  const handleGroupAvatarChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      if (!file) return;

      if (groupAvatarPreviewUrl) {
        URL.revokeObjectURL(groupAvatarPreviewUrl);
      }

      setGroupAvatarFile(file);
      setGroupAvatarPreviewUrl(URL.createObjectURL(file));
      setGroupModalError(null);
    },
    [groupAvatarPreviewUrl],
  );

  const handleToggleGroupMember = useCallback((userId: string) => {
    setSelectedGroupMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }, []);

  const handleCreateGroup = useCallback(async () => {
    const normalizedName = groupNameInput.trim();
    if (!normalizedName) {
      setGroupModalError("Vui lòng nhập tên nhóm");
      return;
    }

    if (selectedGroupMemberIds.length === 0) {
      setGroupModalError("Vui lòng chọn ít nhất 1 thành viên");
      return;
    }

    try {
      setIsCreatingGroup(true);
      setGroupModalError(null);

      const createdConversation = await conversationApi.createConversation({
        type: "GROUP",
        groupName: normalizedName,
        memberIds: selectedGroupMemberIds,
        memberNicknames: selectedGroupMemberIds.map((memberId) => {
          const friend = friendOptions.find((item) => item.id === memberId);
          return {
            userId: memberId,
            nickname: friend?.fullName || "Member",
          };
        }),
      });

      if (groupAvatarFile && createdConversation?.conversationId) {
        try {
          await conversationApi.updateGroupAvatar(
            createdConversation.conversationId,
            groupAvatarFile,
          );
        } catch (avatarError) {
          console.error("Create group avatar upload failed:", avatarError);
        }
      }

      setIsCreateGroupModalOpen(false);
      setGroupNameInput("");
      if (groupAvatarPreviewUrl) {
        URL.revokeObjectURL(groupAvatarPreviewUrl);
      }
      setGroupAvatarPreviewUrl(null);
      setGroupAvatarFile(null);
      setSelectedGroupMemberIds([]);
      onCreateGroupConversation?.(createdConversation as ConversationView);
    } catch (createError) {
      setGroupModalError(
        createError instanceof Error
          ? createError.message
          : "Tạo nhóm thất bại",
      );
    } finally {
      setIsCreatingGroup(false);
    }
  }, [
    groupNameInput,
    selectedGroupMemberIds,
    friendOptions,
    groupAvatarFile,
    groupAvatarPreviewUrl,
    onCreateGroupConversation,
  ]);

  useEffect(() => {
    return () => {
      if (groupAvatarPreviewUrl) {
        URL.revokeObjectURL(groupAvatarPreviewUrl);
      }
    };
  }, [groupAvatarPreviewUrl]);

  useEffect(() => {
    if (!isCreateGroupModalOpen) return;

    const loadFriends = async () => {
      if (!currentUserId) {
        setFriendOptions([]);
        return;
      }

      try {
        setIsLoadingFriends(true);
        const friends = await friendListService.getFriends(currentUserId);
        setFriendOptions(Array.isArray(friends) ? friends : []);
      } catch {
        setGroupModalError("Không tải được danh sách bạn bè");
      } finally {
        setIsLoadingFriends(false);
      }
    };

    void loadFriends();
  }, [currentUserId, isCreateGroupModalOpen]);

  useEffect(() => {
    const handleUnreadByConversation = (event: Event) => {
      const customEvent = event as CustomEvent<{
        unreadByConversation?: Record<string, number>;
      }>;

      setUnreadByConversation(customEvent.detail?.unreadByConversation || {});
    };

    window.addEventListener(
      "notifications:unread_by_conversation",
      handleUnreadByConversation,
    );

    window.dispatchEvent(
      new CustomEvent("notifications:request_unread_by_conversation"),
    );

    return () => {
      window.removeEventListener(
        "notifications:unread_by_conversation",
        handleUnreadByConversation,
      );
    };
  }, []);

  // ✅ Filter and sort conversations
  // 1. Filter by search query and hidden status
  // 2. Sort by: pinned status (descending) -> pinnedAt (newer first) -> lastMessage.createdAt (newer first)
  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase();

    const filtered = conversations.filter((conv) => {
      const conversationName =
        conv.type === "GROUP"
          ? conv.groupInfo?.groupName || "Group Chat"
          : conv.participants.find((p) => p.userId !== currentUserId)
              ?.fullName || "Unknown";

      const matchesSearch = conversationName.toLowerCase().includes(query);

      // If searching, return matching conversations (including hidden ones)
      if (query.trim()) {
        return matchesSearch;
      }

      // If not searching, hide hidden conversations
      return !conv.myIsHidden && matchesSearch;
    });

    // ✅ Sort by: pinned status -> pinnedAt (newer first) -> lastMessage.createdAt (newer first)
    return filtered.sort((a, b) => {
      // First, sort by pinned status (pinned conversations first)
      if (a.myIsPinned !== b.myIsPinned) {
        return a.myIsPinned ? -1 : 1;
      }

      // If both are pinned or both are not pinned, sort by pinnedAt (if pinned)
      if (a.myIsPinned && b.myIsPinned) {
        const pinnedAtA = new Date(a.myPinnedAt || 0).getTime();
        const pinnedAtB = new Date(b.myPinnedAt || 0).getTime();
        return pinnedAtB - pinnedAtA; // Newer pinned first
      }

      // If both are not pinned, sort by lastMessage.createdAt
      const dateA = new Date(a.lastMessage?.createdAt || 0).getTime();
      const dateB = new Date(b.lastMessage?.createdAt || 0).getTime();
      return dateB - dateA; // Newer messages first
    });
  }, [conversations, searchQuery, currentUserId]);

  const getConversationDisplayName = (conversation: ConversationView) => {
    if (conversation.type === "GROUP" && conversation.groupInfo) {
      return conversation.groupInfo.groupName;
    }

    // For private conversations, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId,
    );
    return otherParticipant?.fullName || "Unknown User";
  };

  const getConversationAvatar = (
    conversation: ConversationView,
  ): string | undefined => {
    if (conversation.type === "GROUP" && conversation.groupInfo) {
      return toAbsoluteMediaUrl(conversation.groupInfo.groupAvatar);
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId,
    );
    return toAbsoluteMediaUrl(otherParticipant?.avatarUrl);
  };

  const getLastMessagePreview = (conversation: ConversationView) => {
    if (!conversation.lastMessage) {
      return "Không có tin nhắn";
    }

    const { content, senderBy, messageType, isRecalled } =
      conversation.lastMessage;

    // Ưu tiên hiển thị trạng thái thu hồi nếu backend hoặc state local đã đánh dấu.
    if (isRecalled || content === "Tin nhắn đã được thu hồi") {
      return "Tin nhắn đã được thu hồi";
    }

    if (messageType === "FILE" || messageType === "file") {
      return "📎 File attached";
    }

    if (
      messageType?.toLowerCase() === "image" ||
      messageType?.toLowerCase() === "IMAGE"
    ) {
      return (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <Image className="w-4 h-4" />
          Image
        </span>
      );
    }

    const senderLabel = senderBy === currentUserId ? "Bạn: " : "";

    return `${senderLabel}${content || "Message sent"}`.substring(0, 50);
  };

  const formatMessageTime = (date: Date | string | undefined) => {
    if (!date) return "";

    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleConversationSelect = (conversation: ConversationView) => {
    // If conversation is hidden and user is searching, show reveal modal
    if (conversation.myIsHidden && searchQuery.trim()) {
      setSelectedHiddenConversation(conversation);
      setRevealModalOpen(true);
    } else {
      // Otherwise select normally
      setUnreadByConversation((prev) => {
        if (!prev[conversation.conversationId]) return prev;

        const next = { ...prev };
        delete next[conversation.conversationId];
        return next;
      });
      onSelectConversation(conversation.conversationId);
    }
  };

  const handleRevealConversation = async (password: string) => {
    if (!selectedHiddenConversation) return;

    try {
      await conversationApi.unhideConversation(
        selectedHiddenConversation.conversationId,
        password,
      );

      // Close modal and proceed to select conversation
      setRevealModalOpen(false);
      setSelectedHiddenConversation(null);

      // Notify parent to refresh conversation list
      if (onConversationRevealed) {
        onConversationRevealed(selectedHiddenConversation.conversationId);
      }

      // Select the conversation
      onSelectConversation(selectedHiddenConversation.conversationId);
    } catch (err) {
      // Error will be displayed in modal
      throw err;
    }
  };

  return (
    <div className="flex w-80 flex-col gap-4 rounded-lg bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        {onNewConversation && (
          <button
            onClick={onNewConversation}
            className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
            title="New conversation"
          >
            ✎
          </button>
        )}
      </div>

      {/* Search box + actions */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => undefined}
          title="Thêm bạn bè (sắp cập nhật)"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleOpenCreateGroupModal}
          title="Tạo nhóm mới"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
        >
          <Users className="h-4 w-4" />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        </div>
      )}

      {/* Conversations list */}
      {!loading && (
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center text-gray-400">
              {conversations.length === 0
                ? "No conversations yet"
                : "No results found"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const unreadCount =
                  unreadByConversation[conversation.conversationId] || 0;

                return (
                  <button
                    key={conversation.conversationId}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors relative ${
                      selectedConversationId === conversation.conversationId
                        ? "bg-blue-100 text-blue-900"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        {conversation.type === "GROUP" ? (
                          <GroupAvatar
                            size={40}
                            name={getConversationDisplayName(conversation)}
                            avatarUrl={getConversationAvatar(conversation)}
                            members={conversation.participants}
                          />
                        ) : getConversationAvatar(conversation) ? (
                          <img
                            src={getConversationAvatar(conversation)}
                            alt={getConversationDisplayName(conversation)}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-white">
                            {getConversationDisplayName(conversation)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        {/* ✅ Pin indicator */}
                        {conversation.myIsPinned && (
                          <div className="absolute -right-1 -bottom-1 bg-green-500 rounded-full p-1 shadow-sm border border-white">
                            <Pin
                              size={12}
                              className="text-white fill-current"
                            />
                          </div>
                        )}
                        {/* Hidden indicator */}
                        {conversation.myIsHidden &&
                          !conversation.myIsPinned && (
                            <div className="absolute -right-1 -bottom-1 bg-yellow-400 rounded-full p-1 shadow-sm">
                              <Lock size={12} className="text-gray-700" />
                            </div>
                          )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 overflow-hidden cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate font-semibold text-gray-900">
                            {getConversationDisplayName(conversation)}
                          </h3>
                          <div className="relative ml-2 w-11 shrink-0 pt-0.5 text-right">
                            <span className="whitespace-nowrap text-[11px] leading-4 text-gray-500">
                              {formatMessageTime(
                                conversation.lastMessage?.createdAt,
                              )}
                            </span>
                            <span
                              className={`absolute right-0 top-7 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold transition-opacity ${
                                unreadCount > 0
                                  ? "bg-red-500 text-white opacity-100"
                                  : "opacity-0"
                              }`}
                              aria-hidden={unreadCount === 0}
                            >
                              {unreadCount > 99 ? "99+" : unreadCount || "0"}
                            </span>
                          </div>
                        </div>
                        <p className="truncate text-sm text-gray-600">
                          {conversation.myIsHidden
                            ? "🔒 Trò chuyện đã ẩn"
                            : getLastMessagePreview(conversation)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reveal conversation modal */}
      <RevealConversationModal
        isOpen={revealModalOpen}
        onClose={() => {
          setRevealModalOpen(false);
          setSelectedHiddenConversation(null);
        }}
        onConfirm={handleRevealConversation}
        conversationName={
          selectedHiddenConversation
            ? getConversationDisplayName(selectedHiddenConversation)
            : "Trò chuyện"
        }
      />

      <Modal
        isOpen={isCreateGroupModalOpen}
        onClose={() => {
          setIsCreateGroupModalOpen(false);
          if (groupAvatarPreviewUrl) {
            URL.revokeObjectURL(groupAvatarPreviewUrl);
          }
          setGroupAvatarPreviewUrl(null);
          setGroupAvatarFile(null);
        }}
        title="Tạo nhóm mới"
        size="sm"
      >
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Ảnh nhóm
            </label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {groupAvatarPreviewUrl ? (
                  <img
                    src={groupAvatarPreviewUrl}
                    alt="group avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
                    Ảnh
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleGroupAvatarChange}
                disabled={isCreatingGroup}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tên nhóm
            </label>
            <input
              type="text"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              placeholder="Nhập tên nhóm"
              maxLength={120}
              disabled={isCreatingGroup}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Chọn thành viên
              </label>
              <span className="text-xs text-gray-500">
                {selectedGroupMemberIds.length} đã chọn
              </span>
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {isLoadingFriends ? (
                <p className="py-2 text-center text-sm text-gray-500">
                  Đang tải bạn bè...
                </p>
              ) : friendOptions.length === 0 ? (
                <p className="py-2 text-center text-sm text-gray-500">
                  Chưa có bạn bè để thêm
                </p>
              ) : (
                friendOptions.map((friend) => (
                  <label
                    key={friend.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupMemberIds.includes(friend.id)}
                      onChange={() => handleToggleGroupMember(friend.id)}
                      disabled={isCreatingGroup}
                      className="h-4 w-4"
                    />
                    {friend.avatarUrl ? (
                      <img
                        src={toAbsoluteMediaUrl(friend.avatarUrl)}
                        alt={friend.fullName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {(friend.fullName || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate text-sm text-gray-800">
                      {friend.fullName || friend.id}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {groupModalError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">
              {groupModalError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateGroupModalOpen(false)}
              disabled={isCreatingGroup}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleCreateGroup()}
              disabled={
                isCreatingGroup ||
                !groupNameInput.trim() ||
                selectedGroupMemberIds.length === 0
              }
              className="rounded-lg bg-green-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isCreatingGroup ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatSidebarWithConversationService;

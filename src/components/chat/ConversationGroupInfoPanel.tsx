import React, { useEffect, useMemo, useState } from "react";
import {
  Settings,
  Bell,
  Pin,
  ChevronRight,
  UserRound,
  MessageSquareWarning,
  LogOut,
  NotebookText,
  AlarmClockCheck,
  Clock7,
  EyeOff,
  Link,
  Copy,
  Share,
  UserRoundPlus,
  ArrowLeft,
  Users,
  RefreshCw,
  HelpCircle,
  KeyRound,
  Trash2,
  MoreVertical,
  Pencil,
} from "lucide-react";
import Checkbox from "../common/Checkbox";
import ToggleSwitch from "../common/ToggleSwitch";
import { Modal } from "../common/Modal";
import type { ConversationView } from "../../types/conversation";
import type { SocketMessage } from "./MessageList";
import { MediaStoragePanel } from "./MediaStoragePanel";
import { MediaContextMenu } from "./MediaContextMenu";
import { AutoDeleteModal } from "./AutoDeleteModal";
import { ClearHistoryModal } from "./ClearHistoryModal";
import { HideConversationModal } from "./HideConversationModal";
import { conversationApi } from "../../services/conversationApi";
import GroupAvatar from "./GroupAvatar";
import {
  friendListService,
  type FriendApiItem,
} from "../../services/friendListService";
import { getCurrentUserId } from "../../utils/auth";
import {
  offConversationHiddenUpdated,
  offConversationHistoryCleared,
  offGroupAdminTransferred,
  offGroupAutoDeleteUpdated,
  offGroupDissolved,
  offGroupInfoUpdated,
  offGroupMemberLeft,
  onConversationHiddenUpdated,
  onConversationHistoryCleared,
  onGroupAdminTransferred,
  onGroupAutoDeleteUpdated,
  onGroupDissolved,
  onGroupInfoUpdated,
  onGroupMemberLeft,
} from "../../services/socket";

interface ConversationGroupInfoPanelProps {
  isSidebarOpen?: boolean;
  selectedConversation?: ConversationView;
  displayMessages?: SocketMessage[];
  onJumpToMessage?: (messageId: string) => void;
  onForwardMessage?: (message: SocketMessage) => void;
  onDeleteMessageSuccess?: (message: SocketMessage) => void;
  onRecallMessageSuccess?: (message: SocketMessage) => void;
  onClearHistorySuccess?: (messages: SocketMessage[]) => void;
  onAddMember?: () => void;
  onGroupUpdated?: () => void;
  openEditAvatarTick?: number;
}

type ExpandableSection = "images" | "files" | "links";

type LinkMessage = SocketMessage & { url: string };

type GroupMemberItem = {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: "admin" | "co-admin" | "member";
  joinedAt: string;
  isMe: boolean;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3000";

const toAbsoluteMediaUrl = (url?: string | null): string | null => {
  if (!url) return null;
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

const PRESET_GROUP_AVATAR_URLS = [
  "https://api.dicebear.com/9.x/shapes/svg?seed=orion-alpha",
  "https://api.dicebear.com/9.x/shapes/svg?seed=orion-beta",
  "https://api.dicebear.com/9.x/shapes/svg?seed=orion-gamma",
  "https://api.dicebear.com/9.x/shapes/svg?seed=orion-delta",
  "https://api.dicebear.com/9.x/shapes/svg?seed=orion-epsilon",
  "https://api.dicebear.com/9.x/shapes/svg?seed=orion-zeta",
];

export const ConversationGroupInfoPanel: React.FC<
  ConversationGroupInfoPanelProps
> = ({
  isSidebarOpen = true,
  selectedConversation,
  displayMessages = [],
  onJumpToMessage,
  onForwardMessage,
  onDeleteMessageSuccess,
  onRecallMessageSuccess,
  onClearHistorySuccess,
  onAddMember,
  onGroupUpdated,
  openEditAvatarTick = 0,
}) => {
  const [isGroupManagement, setIsGroupManagement] = useState(false);
  const [showMediaStorage, setShowMediaStorage] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    images: true,
    files: true,
    links: true,
  });
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    messageId?: string;
    section?: ExpandableSection;
  }>({ isOpen: false, position: { x: 0, y: 0 } });
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [recalledMessageIds, setRecalledMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [mediaActionError, setMediaActionError] = useState<string | null>(null);
  const [groupPermissions, setGroupPermissions] = useState({
    changeNameAvatar: true,
    pinMessages: true,
    createNotes: true,
    createPolls: true,
    sendMessages: true,
  });
  const [groupSettings, setGroupSettings] = useState({
    approveNewMembers: false,
    markLeaderMessages: true,
    allowReadRecentMessages: true,
    allowJoinLink: true,
  });
  const [autoDeleteDuration, setAutoDeleteDuration] = useState<number>(0);
  const [isConversationHidden, setIsConversationHidden] = useState(false);
  const [isGroupDissolved, setIsGroupDissolved] = useState(false);
  const [isTransferAdminModalOpen, setIsTransferAdminModalOpen] =
    useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMemberItem[]>([]);
  const [selectedNewAdminId, setSelectedNewAdminId] = useState("");
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [isAutoDeleteModalOpen, setIsAutoDeleteModalOpen] = useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isHideConversationModalOpen, setIsHideConversationModalOpen] =
    useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendOptions, setFriendOptions] = useState<FriendApiItem[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [isEditAvatarModalOpen, setIsEditAvatarModalOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [isUpdatingGroupName, setIsUpdatingGroupName] = useState(false);
  const [isUpdatingGroupAvatar, setIsUpdatingGroupAvatar] = useState(false);
  const [groupInfoError, setGroupInfoError] = useState<string | null>(null);
  const [groupNameOverride, setGroupNameOverride] = useState<string | null>(
    null,
  );
  const [groupAvatarOverride, setGroupAvatarOverride] = useState<string | null>(
    null,
  );

  const currentUserId = getCurrentUserId();
  const conversationId = selectedConversation?.conversationId || "";
  const isAdmin = selectedConversation?.myRole === "admin";

  const currentMemberIds = useMemo(
    () =>
      new Set(
        (selectedConversation?.participants || []).map(
          (participant) => participant.userId,
        ),
      ),
    [selectedConversation?.participants],
  );

  const availableFriendOptions = useMemo(() => {
    return friendOptions.filter((friend) => !currentMemberIds.has(friend.id));
  }, [friendOptions, currentMemberIds]);

  const filteredFriendOptions = useMemo(() => {
    const keyword = friendSearch.trim().toLowerCase();
    if (!keyword) return availableFriendOptions;

    return availableFriendOptions.filter((friend) =>
      (friend.fullName || "").toLowerCase().includes(keyword),
    );
  }, [availableFriendOptions, friendSearch]);

  const toggleSection = (section: ExpandableSection) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { imageMessages, fileMessages, linkMessages } = useMemo(() => {
    const images = displayMessages.filter(
      (msg) =>
        msg.isFile &&
        msg.fileUrl &&
        (msg.fileType?.startsWith("image/") === true ||
          msg.fileCategory === "image" ||
          msg.type === "image") &&
        !msg.isRecalled &&
        !recalledMessageIds.has(msg.id),
    );

    const files = displayMessages.filter(
      (msg) =>
        msg.isFile &&
        msg.fileUrl &&
        !(msg.fileType?.startsWith("image/") === true) &&
        msg.fileCategory !== "image" &&
        msg.type !== "image" &&
        !msg.isRecalled &&
        !recalledMessageIds.has(msg.id),
    );

    const links = displayMessages
      .filter(
        (msg) =>
          !msg.isFile &&
          msg.content &&
          /https?:\/\/|www\./i.test(msg.content) &&
          !msg.isRecalled &&
          !recalledMessageIds.has(msg.id),
      )
      .map((msg) => ({
        ...msg,
        url: msg.content.match(/https?:\/\/\S+|www\.\S+/i)?.[0] || msg.content,
      }));

    return {
      imageMessages: images.filter((msg) => !deletedMessageIds.has(msg.id)),
      fileMessages: files.filter((msg) => !deletedMessageIds.has(msg.id)),
      linkMessages: (links as LinkMessage[]).filter(
        (msg) => !deletedMessageIds.has(msg.id),
      ),
    };
  }, [displayMessages, deletedMessageIds, recalledMessageIds]);

  const getContextMessage = () =>
    getSectionMessages(contextMenuState.section).find(
      (item) => item.id === contextMenuState.messageId,
    );

  const getSectionMessages = (section?: ExpandableSection) => {
    if (section === "images") return imageMessages;
    if (section === "files") return fileMessages;
    if (section === "links") return linkMessages;
    return [];
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    messageId: string,
    section: ExpandableSection,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenuState({
      isOpen: true,
      position: {
        x: rect.right - 224,
        y: rect.bottom + 8,
      },
      messageId,
      section,
    });
  };

  const handleMediaAction = (action: "open" | "forward" | "jump") => {
    const message = getContextMessage();

    if (!message) {
      setMediaActionError("Không tìm thấy tin nhắn");
      return;
    }

    switch (action) {
      case "open": {
        if (contextMenuState.section === "links") {
          const link = (message as LinkMessage).url;
          const normalizedLink = /^https?:\/\//i.test(link)
            ? link
            : `https://${link}`;
          window.open(normalizedLink, "_blank");
          break;
        }
        if (!message.fileUrl) {
          setMediaActionError("Không thể mở tài liệu");
          return;
        }
        window.open(message.fileUrl, "_blank");
        break;
      }
      case "forward": {
        onForwardMessage?.(message);
        break;
      }
      case "jump": {
        onJumpToMessage?.(message.id);
        break;
      }
      default:
        break;
    }

    setContextMenuState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteForMe = async () => {
    const conversationId = selectedConversation?.conversationId;
    const message = getContextMessage();

    if (!conversationId || !message?.id) {
      setMediaActionError("Thiếu thông tin để xóa tin nhắn");
      return;
    }

    try {
      await conversationApi.deleteMessageForMe(conversationId, message.id);
      setDeletedMessageIds((prev) => {
        const next = new Set(prev);
        next.add(message.id);
        return next;
      });
      onDeleteMessageSuccess?.(message);
      setContextMenuState((prev) => ({ ...prev, isOpen: false }));
      setMediaActionError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Xóa tin nhắn thất bại";
      setMediaActionError(errorMessage);
    }
  };

  const handleRecallMessage = async () => {
    const message = getContextMessage();

    if (!conversationId || !message?.id) {
      setMediaActionError("Thiếu thông tin để thu hồi tin nhắn");
      return;
    }

    const senderId = message.senderId || "";
    const timestamp = message.timestamp || "";
    const createdAt = timestamp ? new Date(timestamp).getTime() : NaN;
    const within24Hours =
      Number.isFinite(createdAt) &&
      Date.now() - createdAt <= 24 * 60 * 60 * 1000;

    if (!within24Hours) {
      setMediaActionError("Tin nhắn đã quá 24h, không thể thu hồi/xóa");
      return;
    }

    try {
      if (senderId === currentUserId) {
        await conversationApi.recallMessageById(message.id);
        setRecalledMessageIds((prev) => {
          const next = new Set(prev);
          next.add(message.id);
          return next;
        });
      } else {
        if (!isAdmin) {
          setMediaActionError("Chỉ admin mới có thể xóa tin nhắn người khác");
          return;
        }

        await conversationApi.adminDeleteMessage(message.id);
        setDeletedMessageIds((prev) => {
          const next = new Set(prev);
          next.add(message.id);
          return next;
        });
      }

      onRecallMessageSuccess?.(message);
      setContextMenuState((prev) => ({ ...prev, isOpen: false }));
      setMediaActionError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Thu hồi tin nhắn thất bại";
      setMediaActionError(errorMessage);
    }
  };

  const getDurationLabel = (duration: number) => {
    if (duration === 0) return "Không bao giờ";
    if (duration === 3600) return "Sau 1 giờ";
    if (duration === 86400) return "Sau 24 giờ";
    return `${duration}s`;
  };

  const handleAutoDeleteChange = async (duration: number) => {
    if (!conversationId) return;
    if (!isAdmin) {
      const error = "Chỉ admin mới được chỉnh tin nhắn tự xóa";
      setMediaActionError(error);
      throw new Error(error);
    }

    try {
      await conversationApi.updateGroupAutoDelete(conversationId, duration);
      setAutoDeleteDuration(duration);
      setMediaActionError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Cập nhật tin nhắn tự xóa thất bại";
      setMediaActionError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleOpenAutoDeleteModal = () => {
    if (!isAdmin) {
      setMediaActionError("Chỉ admin mới được chỉnh tin nhắn tự xóa");
      return;
    }
    setIsAutoDeleteModalOpen(true);
  };

  const handleHideConversation = async (password: string) => {
    if (!conversationId) return;
    if (!password.trim()) {
      throw new Error("Vui lòng nhập mật khẩu hợp lệ");
    }

    try {
      await conversationApi.hideConversation(conversationId, password);
      localStorage.setItem(`hidden_conv_${conversationId}`, password);
      setIsConversationHidden(true);
      setMediaActionError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Cập nhật trạng thái ẩn trò chuyện thất bại";
      setMediaActionError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleUnhideConversation = async () => {
    if (!conversationId) return;

    try {
      const savedPassword =
        localStorage.getItem(`hidden_conv_${conversationId}`) || "";
      await conversationApi.unhideConversation(conversationId, savedPassword);
      setIsConversationHidden(false);
      setMediaActionError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Cập nhật trạng thái ẩn trò chuyện thất bại";
      setMediaActionError(errorMessage);
    }
  };

  const handleOpenHideConversationModal = () => {
    if (isConversationHidden) {
      void handleUnhideConversation();
      return;
    }

    setIsHideConversationModalOpen(true);
  };

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  const resetAddMemberModalState = () => {
    setFriendSearch("");
    setSelectedFriendIds([]);
    setAddMemberError(null);
  };

  const handleOpenAddMemberModal = () => {
    setIsAddMemberModalOpen(true);
    setAddMemberError(null);
  };

  const handleCloseAddMemberModal = () => {
    if (isAddingMembers) return;
    setIsAddMemberModalOpen(false);
    resetAddMemberModalState();
  };

  const handleConfirmAddMembers = async () => {
    if (!conversationId) return;

    if (selectedFriendIds.length === 0) {
      setAddMemberError("Vui lòng chọn ít nhất một thành viên");
      return;
    }

    try {
      setIsAddingMembers(true);
      setAddMemberError(null);

      const selectedFriends = availableFriendOptions.filter((friend) =>
        selectedFriendIds.includes(friend.id),
      );

      const memberIds = selectedFriends.map((friend) => friend.id);
      const memberNicknames = selectedFriends.map((friend) => ({
        userId: friend.id,
        nickname: friend.fullName || "Member",
      }));

      await conversationApi.addGroupMembers(
        conversationId,
        memberIds,
        memberNicknames,
      );

      setIsAddMemberModalOpen(false);
      resetAddMemberModalState();
      onAddMember?.();
    } catch (error) {
      setAddMemberError(
        error instanceof Error
          ? error.message
          : "Không thể thêm thành viên vào nhóm",
      );
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleClearHistory = async () => {
    if (!conversationId) return;

    try {
      await conversationApi.clearConversationHistory(conversationId);
      setDeletedMessageIds(new Set(displayMessages.map((msg) => msg.id)));
      onClearHistorySuccess?.(displayMessages);
      setMediaActionError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Xóa lịch sử trò chuyện thất bại";
      setMediaActionError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleOpenClearHistoryModal = () => {
    setIsClearHistoryModalOpen(true);
  };

  const handleLeaveGroup = async (newAdminUserId?: string) => {
    void newAdminUserId;
    if (!conversationId || isLeavingGroup) return;

    try {
      setIsLeavingGroup(true);
      await conversationApi.leaveConversation(conversationId);
      setIsTransferAdminModalOpen(false);
      window.location.href = "/chat";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Rời nhóm thất bại";
      setMediaActionError(errorMessage);
    } finally {
      setIsLeavingGroup(false);
    }
  };

  const openLeaveFlow = async () => {
    if (!conversationId) return;

    if (!isAdmin) {
      await handleLeaveGroup();
      return;
    }

    try {
      const members = await conversationApi.getGroupMembers(conversationId);
      const candidates = members.items.filter((item) => !item.isMe);

      if (candidates.length === 0) {
        await handleLeaveGroup();
        return;
      }

      setGroupMembers(candidates);
      setSelectedNewAdminId(candidates[0].userId);
      setIsTransferAdminModalOpen(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không tải được danh sách thành viên";
      setMediaActionError(errorMessage);
    }
  };

  const handleDissolveGroup = async () => {
    if (!conversationId) return;
    if (!isAdmin) {
      setMediaActionError("Chỉ admin mới có thể giải tán nhóm");
      return;
    }

    const accepted = window.confirm(
      "Bạn có chắc muốn giải tán nhóm? Hành động này không thể hoàn tác.",
    );
    if (!accepted) return;

    try {
      await conversationApi.dissolveGroup(conversationId);
      setIsGroupDissolved(true);
      setMediaActionError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Giải tán nhóm thất bại";
      setMediaActionError(errorMessage);
    }
  };

  const handleOpenEditNameModal = () => {
    setGroupInfoError(null);
    setGroupNameInput(
      groupNameOverride || selectedConversation?.groupInfo?.groupName || "",
    );
    setIsEditAvatarModalOpen(true);
  };

  const handleUpdateGroupName = async () => {
    if (!conversationId) return;

    const normalizedName = groupNameInput.trim();
    if (!normalizedName) {
      setGroupInfoError("Tên nhóm không được để trống");
      return;
    }

    try {
      setIsUpdatingGroupName(true);
      setGroupInfoError(null);

      const result = await conversationApi.updateGroupName(
        conversationId,
        normalizedName,
      );

      setGroupNameOverride(result.groupName);
      onGroupUpdated?.();
    } catch (error) {
      setGroupInfoError(
        error instanceof Error ? error.message : "Đổi tên nhóm thất bại",
      );
    } finally {
      setIsUpdatingGroupName(false);
    }
  };

  const handleFileUploadForAvatar = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!conversationId) return;

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdatingGroupAvatar(true);
      setGroupInfoError(null);

      const result = await conversationApi.updateGroupAvatar(
        conversationId,
        file,
      );

      setGroupAvatarOverride(toAbsoluteMediaUrl(result.groupAvatar));
      onGroupUpdated?.();
    } catch (error) {
      setGroupInfoError(
        error instanceof Error ? error.message : "Cập nhật ảnh nhóm thất bại",
      );
    } finally {
      setIsUpdatingGroupAvatar(false);
      event.target.value = "";
    }
  };

  const handlePresetAvatarSelect = async (presetUrl: string) => {
    if (!conversationId) return;

    try {
      setIsUpdatingGroupAvatar(true);
      setGroupInfoError(null);

      const response = await fetch(presetUrl);
      const blob = await response.blob();
      const file = new File([blob], "group-avatar.svg", {
        type: blob.type || "image/svg+xml",
      });

      const result = await conversationApi.updateGroupAvatar(
        conversationId,
        file,
      );

      setGroupAvatarOverride(toAbsoluteMediaUrl(result.groupAvatar));
      onGroupUpdated?.();
    } catch (error) {
      setGroupInfoError(
        error instanceof Error ? error.message : "Không thể chọn ảnh mẫu",
      );
    } finally {
      setIsUpdatingGroupAvatar(false);
    }
  };

  useEffect(() => {
    setAutoDeleteDuration(
      Number(selectedConversation?.autoDeleteDuration || 0),
    );
    setIsConversationHidden(!!selectedConversation?.myIsHidden);
    setGroupNameOverride(
      selectedConversation?.groupInfo?.groupName
        ? selectedConversation.groupInfo.groupName
        : null,
    );
    setGroupAvatarOverride(
      toAbsoluteMediaUrl(selectedConversation?.groupInfo?.groupAvatar),
    );
  }, [
    selectedConversation?.autoDeleteDuration,
    selectedConversation?.myIsHidden,
    selectedConversation?.groupInfo?.groupName,
    selectedConversation?.groupInfo?.groupAvatar,
  ]);

  useEffect(() => {
    if (!openEditAvatarTick) return;
    if (!isAdmin) return;

    setGroupInfoError(null);
    setGroupNameInput(
      groupNameOverride || selectedConversation?.groupInfo?.groupName || "",
    );
    setIsEditAvatarModalOpen(true);
  }, [
    openEditAvatarTick,
    isAdmin,
    groupNameOverride,
    selectedConversation?.groupInfo?.groupName,
  ]);

  const modalMembers = useMemo(
    () => (selectedConversation?.participants || []).slice(0, 4),
    [selectedConversation?.participants],
  );

  useEffect(() => {
    if (!conversationId) return;

    const handleAutoDeleteRealtime = (payload: {
      groupId: string;
      autoDeleteDuration: number;
    }) => {
      if (payload.groupId !== conversationId) return;
      setAutoDeleteDuration(payload.autoDeleteDuration);
    };

    const handleHiddenRealtime = (payload: {
      conversationId: string;
      hidden: boolean;
    }) => {
      if (payload.conversationId !== conversationId) return;
      setIsConversationHidden(payload.hidden);
    };

    const handleHistoryClearedRealtime = (payload: {
      conversationId: string;
    }) => {
      if (payload.conversationId !== conversationId) return;
      setDeletedMessageIds(new Set(displayMessages.map((msg) => msg.id)));
    };

    const handleGroupDissolvedRealtime = (payload: { groupId: string }) => {
      if (payload.groupId !== conversationId) return;
      setIsGroupDissolved(true);
    };

    const handleMemberLeftRealtime = (payload: {
      groupId: string;
      userId: string;
    }) => {
      if (payload.groupId !== conversationId) return;
      if (payload.userId === currentUserId) {
        window.location.href = "/chat";
      }
    };

    const handleAdminTransferredRealtime = (payload: {
      groupId: string;
      oldAdminUserId: string;
      newAdminUserId: string;
    }) => {
      if (payload.groupId !== conversationId) return;
      if (payload.newAdminUserId === currentUserId) {
        setMediaActionError("Bạn đã được chuyển quyền quản trị nhóm");
      }
    };

    const handleGroupInfoUpdatedRealtime = (payload: {
      groupId: string;
      groupName?: string;
      groupAvatar?: string;
    }) => {
      if (payload.groupId !== conversationId) return;

      if (payload.groupName) {
        setGroupNameOverride(payload.groupName);
      }

      if (payload.groupAvatar) {
        setGroupAvatarOverride(toAbsoluteMediaUrl(payload.groupAvatar));
      }

      onGroupUpdated?.();
    };

    onGroupAutoDeleteUpdated(handleAutoDeleteRealtime);
    onConversationHiddenUpdated(handleHiddenRealtime);
    onConversationHistoryCleared(handleHistoryClearedRealtime);
    onGroupDissolved(handleGroupDissolvedRealtime);
    onGroupMemberLeft(handleMemberLeftRealtime);
    onGroupAdminTransferred(handleAdminTransferredRealtime);
    onGroupInfoUpdated(handleGroupInfoUpdatedRealtime);

    return () => {
      offGroupAutoDeleteUpdated();
      offConversationHiddenUpdated();
      offConversationHistoryCleared();
      offGroupDissolved();
      offGroupMemberLeft();
      offGroupAdminTransferred();
      offGroupInfoUpdated();
    };
  }, [conversationId, currentUserId, displayMessages, onGroupUpdated]);

  useEffect(() => {
    const loadFriends = async () => {
      if (!isAddMemberModalOpen || !currentUserId) return;

      try {
        setIsLoadingFriends(true);
        setAddMemberError(null);

        const friends = await friendListService.getFriends(currentUserId);
        const sortedFriends = [...friends].sort((a, b) =>
          (a.fullName || "").localeCompare(b.fullName || "", "vi", {
            sensitivity: "base",
          }),
        );

        setFriendOptions(sortedFriends);
      } catch (error) {
        setAddMemberError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách bạn bè",
        );
      } finally {
        setIsLoadingFriends(false);
      }
    };

    void loadFriends();
  }, [isAddMemberModalOpen, currentUserId]);

  if (!isSidebarOpen) return null;

  const groupName =
    groupNameOverride ||
    selectedConversation?.groupInfo?.groupName ||
    "Thông tin nhóm";
  const groupAvatar =
    groupAvatarOverride ||
    toAbsoluteMediaUrl(selectedConversation?.groupInfo?.groupAvatar);
  const memberCount = selectedConversation?.participants?.length || 0;

  if (showMediaStorage) {
    return (
      <MediaStoragePanel
        displayMessages={displayMessages.filter(
          (msg) =>
            !deletedMessageIds.has(msg.id) && !recalledMessageIds.has(msg.id),
        )}
        participants={selectedConversation?.participants || []}
        conversationId={selectedConversation?.conversationId}
        onBack={() => setShowMediaStorage(false)}
        onMediaAction={(action, message) => {
          switch (action) {
            case "forward":
              onForwardMessage?.(message);
              break;
            case "jump":
              onJumpToMessage?.(message.id);
              break;
            default:
              break;
          }
        }}
      />
    );
  }

  return (
    <div className="group-chat-panel-clickable w-90 border-l border-slate-200 bg-white flex flex-col overflow-y-auto rounded-2xl shadow-2xs">
      {isTransferAdminModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-primary">
              Chuyển quyền quản trị
            </h3>
            <p className="text-sm text-gray-500">
              Bạn là quản trị viên. Vui lòng chọn quản trị viên mới trước khi
              rời nhóm.
            </p>

            <div className="max-h-56 overflow-y-auto flex flex-col gap-2">
              {groupMembers.map((member) => (
                <label
                  key={member.userId}
                  className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="new-admin"
                    checked={selectedNewAdminId === member.userId}
                    onChange={() => setSelectedNewAdminId(member.userId)}
                  />
                  <img
                    src={member.avatarUrl || "/placeholder.svg"}
                    alt={member.fullName || "member"}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-primary">
                    {member.fullName || member.userId}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsTransferAdminModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200"
              >
                Hủy
              </button>
              <button
                disabled={!selectedNewAdminId || isLeavingGroup}
                onClick={() => handleLeaveGroup(selectedNewAdminId)}
                className="px-4 py-2 rounded-lg bg-green-primary text-white disabled:opacity-50"
              >
                Chuyển quyền và rời nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {!isGroupManagement ? (
        <>
          <div className="p-6 border-b border-slate-200 flex flex-col gap-3">
            <span className="text-lg font-semibold text-gray-primary">
              Thông tin nhóm
            </span>

            <div className="flex flex-col gap-3 items-center">
              <GroupAvatar
                name={groupName}
                avatarUrl={groupAvatar}
                size={72}
                members={selectedConversation?.participants}
                onClick={
                  isAdmin
                    ? () => {
                        setGroupInfoError(null);
                        setIsEditAvatarModalOpen(true);
                      }
                    : undefined
                }
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isAdmin ? handleOpenEditNameModal : undefined}
                  disabled={!isAdmin}
                  className={`max-w-65 truncate font-semibold text-gray-primary ${isAdmin ? "hover:text-green-primary" : ""}`}
                  title={groupName}
                >
                  {groupName}
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenEditNameModal}
                    className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    title="Chỉnh sửa thông tin nhóm"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 flex gap-3 justify-center border-b border-slate-200">
            <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors flex-1">
              <Bell size={20} className="text-green-primary" />
              <span className="text-xs text-gray-primary">Tắt thông báo</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors flex-1">
              <Pin size={20} className="text-green-primary" />
              <span className="text-xs text-gray-primary">Ghi hội thoại</span>
            </button>
            <button
              onClick={handleOpenAddMemberModal}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors flex-1"
            >
              <UserRoundPlus size={20} className="text-green-primary" />
              <span className="text-xs text-gray-primary">Thêm thành viên</span>
            </button>
            <button
              onClick={() => setIsGroupManagement(true)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors flex-1"
            >
              <Settings size={20} className="text-green-primary" />
              <span className="text-xs text-gray-primary">Quản lý nhóm</span>
            </button>
          </div>

          <div className="p-4 border-b flex flex-col gap-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-primary">
                Images/Video
              </span>
              <button
                onClick={() => toggleSection("images")}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <ChevronRight
                  size={20}
                  className={`text-gray-primary transition-transform ${expandedSections.images ? "rotate-90" : ""}`}
                />
              </button>
            </div>

            {expandedSections.images && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {imageMessages.slice(0, 8).map((img) => (
                    <div
                      key={img.id}
                      className="relative group h-16 rounded-lg overflow-hidden"
                    >
                      <img
                        src={img.fileUrl || "/placeholder.svg"}
                        alt={img.fileName || "chat"}
                        className="w-full h-16 object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                      <button
                        onClick={(e) => handleContextMenu(e, img.id, "images")}
                        className="absolute top-1 right-1 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  ))}
                  {imageMessages.length === 0 && (
                    <div className="col-span-4 text-sm text-gray-500 py-2 text-center bg-slate-50 rounded-lg">
                      Chưa có ảnh/video
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowMediaStorage(true)}
                  className="py-2 rounded-lg font-semibold bg-white border border-green-primary hover:bg-green-50 transition-colors text-green-primary text-[14px] my-1"
                >
                  Xem tất cả
                </button>
              </>
            )}
          </div>

          <div className="p-4 border-b flex flex-col gap-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-primary">
                File/Folder
              </span>
              <button
                onClick={() => toggleSection("files")}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <ChevronRight
                  size={20}
                  className={`text-gray-primary transition-transform ${expandedSections.files ? "rotate-90" : ""}`}
                />
              </button>
            </div>

            {expandedSections.files && (
              <>
                <div className="space-y-2">
                  {fileMessages.slice(0, 3).map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <span className="text-xs text-gray-700 truncate flex-1">
                        {file.fileName || "Tệp đính kèm"}
                      </span>
                      <button
                        onClick={(e) => handleContextMenu(e, file.id, "files")}
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  ))}
                  {fileMessages.length === 0 && (
                    <div className="text-sm text-gray-500 py-2 text-center bg-slate-50 rounded-lg">
                      Chưa có file
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowMediaStorage(true)}
                  className="py-2 rounded-lg font-semibold bg-white border border-green-primary hover:bg-green-50 transition-colors text-green-primary text-[14px] my-1"
                >
                  Xem tất cả
                </button>
              </>
            )}
          </div>

          <div className="p-4 border-b flex flex-col gap-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-primary">Link</span>
              <button
                onClick={() => toggleSection("links")}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <ChevronRight
                  size={20}
                  className={`text-gray-primary transition-transform ${expandedSections.links ? "rotate-90" : ""}`}
                />
              </button>
            </div>

            {expandedSections.links && (
              <>
                <div className="space-y-2">
                  {linkMessages.slice(0, 3).map((linkItem) => (
                    <div
                      key={linkItem.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <a
                        href={
                          /^https?:\/\//i.test(linkItem.url)
                            ? linkItem.url
                            : `https://${linkItem.url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 truncate flex-1"
                      >
                        {linkItem.url}
                      </a>
                      <button
                        onClick={(e) =>
                          handleContextMenu(e, linkItem.id, "links")
                        }
                        className="p-1 hover:bg-slate-200 rounded"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  ))}
                  {linkMessages.length === 0 && (
                    <div className="text-sm text-gray-500 py-2 text-center bg-slate-50 rounded-lg">
                      Chưa có link
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowMediaStorage(true)}
                  className="py-2 rounded-lg font-semibold bg-white border border-green-primary hover:bg-green-50 transition-colors text-green-primary text-[14px] my-1"
                >
                  Xem tất cả
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="p-3 flex flex-col gap-1 bg-color-gray-secondary border-b border-slate-200">
              <span className="font-semibold">Thành viên</span>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                <UserRound size={20} />
                <span className="text-[15px]">{memberCount} thành viên</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                <Link size={20} />
                <div className="flex flex-col items-start">
                  <span className="text-[15px]">Link tham gia nhóm</span>
                  <span className="text-[12px] text-blue-dark text-left">
                    orionchat.com/groupchat-test
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <Copy size={18} />
                  <Share size={18} />
                </div>
              </button>
            </div>

            <div className="p-3 flex flex-col gap-1 bg-color-gray-secondary border-b border-slate-200">
              <span className="font-semibold">Bảng tin nhóm</span>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                <AlarmClockCheck size={20} />
                <span className="text-[15px]">Danh sách nhắc hẹn</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                <NotebookText size={20} />
                <span className="text-[15px]">Ghi chú, ghim, bình chọn</span>
              </button>
            </div>

            <div className="p-3 flex flex-col gap-1 bg-color-gray-secondary border-b border-slate-200">
              <span className="font-semibold">Thiết lập bảo mật</span>
              <button
                onClick={handleOpenAutoDeleteModal}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary"
              >
                <Clock7 size={20} />
                <div className="flex flex-col items-start">
                  <span className="text-[15px]">Tin nhắn tự xóa</span>
                  <span className="text-[12px] text-gray-secondary">
                    {getDurationLabel(autoDeleteDuration)}
                  </span>
                </div>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              <button
                onClick={handleOpenHideConversationModal}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary"
              >
                <EyeOff size={20} />
                <span className="text-[15px]">
                  {isConversationHidden ? "Bỏ ẩn trò chuyện" : "Ẩn trò chuyện"}
                </span>
              </button>
            </div>

            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
              <MessageSquareWarning size={20} />
              <span className="text-[15px]">Báo xấu</span>
            </button>
            <button
              onClick={handleOpenClearHistoryModal}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors text-red-500"
            >
              <Trash2 size={20} />
              <span className="text-[15px]">Xóa lịch sử trò chuyện</span>
            </button>
            <button
              onClick={openLeaveFlow}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors text-red-500"
            >
              <LogOut size={20} />
              <span className="text-[15px]">Rời nhóm</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3">
            <button
              onClick={() => setIsGroupManagement(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-primary" />
            </button>
            <span className="text-lg font-semibold text-gray-primary">
              Quản lý nhóm
            </span>
          </div>

          <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
            <span className="font-semibold text-gray-primary">
              Cho phép các thành viên trong nhóm:
            </span>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-primary">
                  Thay đổi tên & ảnh đại diện của nhóm
                </span>
                <Checkbox
                  checked={groupPermissions.changeNameAvatar}
                  onChange={() =>
                    setGroupPermissions({
                      ...groupPermissions,
                      changeNameAvatar: !groupPermissions.changeNameAvatar,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-primary">
                  Ghim tin nhắn, ghi chú, bình chọn lên đầu hội thoại
                </span>
                <Checkbox
                  checked={groupPermissions.pinMessages}
                  onChange={() =>
                    setGroupPermissions({
                      ...groupPermissions,
                      pinMessages: !groupPermissions.pinMessages,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-primary">
                  Tạo mới ghi chú, nhắc hẹn
                </span>
                <Checkbox
                  checked={groupPermissions.createNotes}
                  onChange={() =>
                    setGroupPermissions({
                      ...groupPermissions,
                      createNotes: !groupPermissions.createNotes,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-primary">
                  Tạo mới bình chọn
                </span>
                <Checkbox
                  checked={groupPermissions.createPolls}
                  onChange={() =>
                    setGroupPermissions({
                      ...groupPermissions,
                      createPolls: !groupPermissions.createPolls,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-primary">Gửi tin nhắn</span>
                <Checkbox
                  checked={groupPermissions.sendMessages}
                  onChange={() =>
                    setGroupPermissions({
                      ...groupPermissions,
                      sendMessages: !groupPermissions.sendMessages,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-primary">
                  Chế độ phê duyệt thành viên mới
                </span>
                <HelpCircle size={16} className="text-gray-400" />
              </div>
              <div className="scale-75 origin-right">
                <ToggleSwitch
                  checked={groupSettings.approveNewMembers}
                  onChange={() =>
                    setGroupSettings({
                      ...groupSettings,
                      approveNewMembers: !groupSettings.approveNewMembers,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-primary">
                  Đánh dấu tin nhắn từ trưởng/phó nhóm
                </span>
                <HelpCircle size={16} className="text-gray-400" />
              </div>
              <div className="scale-75 origin-right">
                <ToggleSwitch
                  checked={groupSettings.markLeaderMessages}
                  onChange={() =>
                    setGroupSettings({
                      ...groupSettings,
                      markLeaderMessages: !groupSettings.markLeaderMessages,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-primary">
                  Cho phép thành viên mới đọc tin nhắn gần nhất
                </span>
                <HelpCircle size={16} className="text-gray-400" />
              </div>
              <div className="scale-75 origin-right">
                <ToggleSwitch
                  checked={groupSettings.allowReadRecentMessages}
                  onChange={() =>
                    setGroupSettings({
                      ...groupSettings,
                      allowReadRecentMessages:
                        !groupSettings.allowReadRecentMessages,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-primary">
                  Cho phép dùng link tham gia nhóm
                </span>
                <HelpCircle size={16} className="text-gray-400" />
              </div>
              <div className="scale-75 origin-right">
                <ToggleSwitch
                  checked={groupSettings.allowJoinLink}
                  onChange={() =>
                    setGroupSettings({
                      ...groupSettings,
                      allowJoinLink: !groupSettings.allowJoinLink,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <span className="flex-1 text-sm text-blue-600">
                zalo.me/g/zwnrhx701
              </span>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                <Copy size={18} className="text-gray-primary" />
              </button>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                <Share size={18} className="text-gray-primary" />
              </button>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                <RefreshCw size={18} className="text-gray-primary" />
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-slate-200 flex flex-col gap-2">
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
              <Users size={20} />
              <span className="text-[15px]">Chặn khỏi nhóm</span>
            </button>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
              <KeyRound size={20} />
              <span className="text-[15px]">Trưởng & phó nhóm</span>
            </button>
          </div>

          <div className="p-4 mt-auto mb-2">
            <div
              onClick={handleDissolveGroup}
              className={`flex items-center justify-center p-2 rounded-md ${
                isAdmin
                  ? "bg-[#FDECEC] cursor-pointer"
                  : "bg-slate-100 cursor-not-allowed"
              }`}
            >
              <span className="text-[16px] text-[#DC264C] font-semibold">
                Giải tán nhóm
              </span>
            </div>
            {!isAdmin && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Chỉ admin mới có thể giải tán nhóm.
              </p>
            )}
            {isGroupDissolved && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Nhóm đã được giải tán.
              </p>
            )}
          </div>
        </div>
      )}

      {mediaActionError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50 animate-slideUp">
          <p className="text-sm font-medium">{mediaActionError}</p>
          <button
            onClick={() => setMediaActionError(null)}
            className="mt-2 text-xs text-red-100 hover:text-white"
          >
            Đóng
          </button>
        </div>
      )}

      <MediaContextMenu
        isOpen={contextMenuState.isOpen}
        position={contextMenuState.position}
        onOpen={() => handleMediaAction("open")}
        onForward={() => handleMediaAction("forward")}
        onJumpToMessage={() => handleMediaAction("jump")}
        onDeleteForMe={handleDeleteForMe}
        onRecall={handleRecallMessage}
        onClose={() =>
          setContextMenuState((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />

      <AutoDeleteModal
        isOpen={isAutoDeleteModalOpen}
        onClose={() => setIsAutoDeleteModalOpen(false)}
        currentDuration={autoDeleteDuration}
        onConfirm={handleAutoDeleteChange}
      />

      <ClearHistoryModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        onConfirm={handleClearHistory}
      />

      <HideConversationModal
        isOpen={isHideConversationModalOpen}
        onClose={() => setIsHideConversationModalOpen(false)}
        onConfirm={handleHideConversation}
      />

      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={handleCloseAddMemberModal}
        title="Thêm thành viên"
        size="sm"
      >
        <div className="p-4 space-y-3">
          <input
            type="text"
            value={friendSearch}
            onChange={(event) => setFriendSearch(event.target.value)}
            placeholder="Tìm theo tên bạn bè"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-green-primary focus:outline-none"
            disabled={isAddingMembers}
          />

          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
            {isLoadingFriends ? (
              <div className="p-3 text-sm text-gray-500">
                Đang tải danh sách bạn bè...
              </div>
            ) : filteredFriendOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">
                Không còn bạn bè nào để thêm.
              </div>
            ) : (
              filteredFriendOptions.map((friend) => (
                <label
                  key={friend.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedFriendIds.includes(friend.id)}
                    onChange={() => handleFriendToggle(friend.id)}
                    disabled={isAddingMembers}
                    className="h-4 w-4 accent-green-primary"
                  />
                  <img
                    src={friend.avatarUrl || "/placeholder.svg"}
                    alt={friend.fullName || "friend"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-primary">
                    {friend.fullName || friend.id}
                  </span>
                </label>
              ))
            )}
          </div>

          {addMemberError && (
            <p className="text-sm text-red-500">{addMemberError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={handleCloseAddMemberModal}
              disabled={isAddingMembers}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmAddMembers}
              disabled={isAddingMembers || selectedFriendIds.length === 0}
              className="rounded-lg bg-green-primary px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isAddingMembers ? "Đang thêm..." : "Thêm thành viên"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditAvatarModalOpen}
        onClose={() => setIsEditAvatarModalOpen(false)}
        title="Thông tin nhóm"
        size="sm"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-center">
            <GroupAvatar
              name={groupName}
              avatarUrl={groupAvatar}
              size={88}
              members={selectedConversation?.participants}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-600">Tên nhóm</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={groupNameInput}
                onChange={(event) => setGroupNameInput(event.target.value)}
                maxLength={120}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-green-primary focus:outline-none"
                disabled={isUpdatingGroupName}
              />
              <button
                onClick={() => void handleUpdateGroupName()}
                disabled={isUpdatingGroupName}
                className="cursor-pointer rounded-lg bg-green-primary px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdatingGroupName ? "..." : "Lưu"}
              </button>
            </div>
          </div>

          <label className="block text-sm text-gray-600">Tải ảnh từ máy</label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => void handleFileUploadForAvatar(event)}
            disabled={isUpdatingGroupAvatar}
            className="cursor-pointer w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed"
          />

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Hoặc chọn ảnh mẫu</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_GROUP_AVATAR_URLS.map((presetUrl) => (
                <button
                  key={presetUrl}
                  type="button"
                  className="cursor-pointer rounded-xl border border-slate-200 p-1 hover:border-green-primary disabled:cursor-not-allowed"
                  onClick={() => void handlePresetAvatarSelect(presetUrl)}
                  disabled={isUpdatingGroupAvatar}
                >
                  <img
                    src={presetUrl}
                    alt="preset group avatar"
                    className="h-16 w-full rounded-lg object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-3">
            <p className="text-sm font-semibold text-gray-primary">
              Thành viên ({selectedConversation?.participants?.length || 0})
            </p>
            <div className="flex items-center">
              <div className="flex items-center">
                {modalMembers.map((member, index) => (
                  <img
                    key={member.userId}
                    src={
                      toAbsoluteMediaUrl(member.avatarUrl) || "/placeholder.svg"
                    }
                    alt={member.fullName || "member"}
                    className="h-10 w-10 cursor-pointer rounded-full border-2 border-slate-700 object-cover"
                    style={{ marginLeft: index === 0 ? 0 : -10 }}
                  />
                ))}
                {(selectedConversation?.participants?.length || 0) >
                  modalMembers.length && (
                  <div
                    className="-ml-2.5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-slate-700 bg-slate-600 text-xs font-semibold text-white"
                    title="Xem thêm thành viên"
                  >
                    ...
                  </div>
                )}
              </div>
            </div>
          </div>

          {groupInfoError && (
            <p className="text-sm text-red-500">{groupInfoError}</p>
          )}

          <div className="flex items-center justify-end">
            <button
              onClick={() => setIsEditAvatarModalOpen(false)}
              className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:cursor-not-allowed"
              disabled={isUpdatingGroupAvatar}
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }

                .group-chat-panel-clickable button:not(:disabled) {
                    cursor: pointer;
                }

                .group-chat-panel-clickable button:disabled {
                    cursor: not-allowed;
                }

                .group-chat-panel-clickable input[type='file']:not(:disabled) {
                    cursor: pointer;
                }

                .group-chat-panel-clickable input[type='file']:disabled {
                    cursor: not-allowed;
                }
            `}</style>
    </div>
  );
};

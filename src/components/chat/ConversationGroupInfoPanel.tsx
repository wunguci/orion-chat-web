import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Settings,
    Bell,
    Pin,
    PinOff,
    ChevronRight,
    UserRound,
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
    BarChart3,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Checkbox from '../common/Checkbox';
import ToggleSwitch from '../common/ToggleSwitch';
import { Modal } from '../common/Modal';
import type { ConversationView } from '../../types/conversation';
import type { SocketMessage } from './MessageList';
import { MediaStoragePanel } from './MediaStoragePanel';
import { MediaContextMenu } from './MediaContextMenu';
import { AutoDeleteModal } from './AutoDeleteModal';
import { ClearHistoryModal } from './ClearHistoryModal';
import { HideConversationModal } from './HideConversationModal';
import GroupAvatar from './GroupAvatar';
import {
    AddGroupMemberModal,
    GroupInfoEditModal,
} from './ConversationGroupInfoModals';
import { ViewParticipantsModal } from './ViewParticipantsModal';
import { JoinRequestDialog } from './JoinRequestDialog';
import { PromoteToAdminDialog } from './PromoteToAdminDialog';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { LeaveGroupDialog } from './LeaveGroupDialog';
import { DisbandGroupDialog } from './DisbandGroupDialog';
import { PendingJoinRequestsList } from './PendingJoinRequestsList';
import { conversationApi } from '../../services/conversationApi';
import {
    groupManagementService,
    type GroupDetailSummary,
    type JoinGroupResult,
} from '../../services/groupManagementService';
import {
    friendListService,
    type FriendApiItem,
} from '../../services/friendListService';
import { getCurrentUserId } from '../../utils/auth';
import { getToken } from '../../utils/token';
import { notificationSocketService } from '../../services/websocket/notificationSocket';
import type { AppNotification } from '../../types/notification';
import {
    offConversationHiddenUpdated,
    offConversationHistoryCleared,
    offGroupAdminTransferred,
    offGroupAutoDeleteUpdated,
    offGroupDissolved,
    offGroupJoinApprovalSettingUpdated,
    offGroupJoinRequestCreated,
    offGroupJoinRequestUpdated,
    offGroupMemberChanged,
    offGroupMemberJoined,
    offGroupInfoUpdated,
    onConversationHiddenUpdated,
    onConversationHistoryCleared,
    onGroupAdminTransferred,
    onGroupAutoDeleteUpdated,
    onGroupDissolved,
    onGroupJoinApprovalSettingUpdated,
    onGroupJoinRequestCreated,
    onGroupJoinRequestUpdated,
    onGroupMemberChanged,
    onGroupMemberJoined,
    onGroupInfoUpdated,
} from '../../services/websocket/chatSocket';
import ChatAvatar from '../common/ChatAvatar';
import { mapGroupManagementError } from '../../utils/groupManagementErrors';

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
    onConversationRemoved?: (conversationId: string) => void;
    onConversationHidden?: (conversationId: string) => void | Promise<void>;
    onPinStatusChange?: () => Promise<void> | void;
    openEditAvatarTick?: number;
}

type ExpandableSection = 'images' | 'files' | 'links';

type LinkMessage = SocketMessage & { url: string };

type GroupMemberItem = {
    userId: string;
    fullName: string | null;
    phoneNumber?: string | null;
    avatarUrl: string | null;
    role: 'admin' | 'co-admin' | 'member';
    joinedAt: string;
    isMe: boolean;
};

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    'http://localhost:3000';

const toAbsoluteMediaUrl = (url?: string | null): string | null => {
    if (!url) return null;
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

const PRESET_GROUP_AVATAR_URLS = [
    'https://api.dicebear.com/9.x/shapes/svg?seed=orion-alpha',
    'https://api.dicebear.com/9.x/shapes/svg?seed=orion-beta',
    'https://api.dicebear.com/9.x/shapes/svg?seed=orion-gamma',
    'https://api.dicebear.com/9.x/shapes/svg?seed=orion-delta',
    'https://api.dicebear.com/9.x/shapes/svg?seed=orion-epsilon',
    'https://api.dicebear.com/9.x/shapes/svg?seed=orion-zeta',
];

const isJoinedImmediately = (result?: JoinGroupResult): boolean => {
    return result?.status === 'joined';
};

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
    onConversationRemoved,
    onConversationHidden,
    onPinStatusChange,
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
    const [mediaActionError, setMediaActionError] = useState<string | null>(
        null,
    );
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
    const [selectedNewAdminId, setSelectedNewAdminId] = useState('');
    const [isLeavingGroup, setIsLeavingGroup] = useState(false);
    const [isAutoDeleteModalOpen, setIsAutoDeleteModalOpen] = useState(false);
    const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] =
        useState(false);
    const [isHideConversationModalOpen, setIsHideConversationModalOpen] =
        useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isViewParticipantsModalOpen, setIsViewParticipantsModalOpen] =
        useState(false);
    const [isJoinRequestDialogOpen, setIsJoinRequestDialogOpen] =
        useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [pendingJoinRequestCount, setPendingJoinRequestCount] = useState(0);
    const [isPendingJoinRequestsOpen, setIsPendingJoinRequestsOpen] =
        useState(false);
    const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [isLeaveGroupDialogOpen, setIsLeaveGroupDialogOpen] = useState(false);
    const [isDisbandGroupDialogOpen, setIsDisbandGroupDialogOpen] =
        useState(false);
    const [isEditGroupInfoModalOpen, setIsEditGroupInfoModalOpen] =
        useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedMemberName, setSelectedMemberName] = useState<string | null>(
        null,
    );
    const [friendSearch, setFriendSearch] = useState('');
    const [friendOptions, setFriendOptions] = useState<FriendApiItem[]>([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [isAddingMembers, setIsAddingMembers] = useState(false);
    const [addMemberError, setAddMemberError] = useState<string | null>(null);
    const [hasJustJoinedGroup, setHasJustJoinedGroup] = useState(false);
    const [isUpdatingJoinApproval, setIsUpdatingJoinApproval] = useState(false);
    const [groupDetail, setGroupDetail] = useState<GroupDetailSummary | null>(
        null,
    );
    const [groupNameInput, setGroupNameInput] = useState('');
    const [isUpdatingGroupName, setIsUpdatingGroupName] = useState(false);
    const [isUpdatingGroupAvatar, setIsUpdatingGroupAvatar] = useState(false);
    const [isPinned, setIsPinned] = useState(
        selectedConversation?.myIsPinned || false,
    );
    const [isPinLoading, setIsPinLoading] = useState(false);
    const [groupInfoError, setGroupInfoError] = useState<string | null>(null);
    const [groupNameOverride, setGroupNameOverride] = useState<string | null>(
        null,
    );
    const [groupAvatarOverride, setGroupAvatarOverride] = useState<
        string | null
    >(null);
    const lastHandledEditAvatarTickRef = useRef(0);

    const currentUserId = getCurrentUserId();
    const conversationId = selectedConversation?.conversationId || '';
    const isAdmin = selectedConversation?.myRole === 'admin';
    const effectiveMyRole = groupDetail?.myRole || selectedConversation?.myRole;
    const canEditGroupInfo =
        effectiveMyRole === 'admin' ||
        effectiveMyRole === 'co-admin' ||
        effectiveMyRole === 'leader' ||
        effectiveMyRole === 'deputy';
    const canReviewJoinRequests =
        effectiveMyRole === 'admin' ||
        effectiveMyRole === 'co-admin' ||
        effectiveMyRole === 'leader' ||
        effectiveMyRole === 'deputy';
    const isGroupOwner =
        effectiveMyRole === 'admin' || effectiveMyRole === 'leader';

    useEffect(() => {
        setIsPinned(selectedConversation?.myIsPinned || false);
    }, [selectedConversation?.myIsPinned, selectedConversation?.conversationId]);

    const handleToggleConversationPin = async () => {
        if (!conversationId || isPinLoading) return;

        const nextPinned = !isPinned;
        setIsPinned(nextPinned);
        setIsPinLoading(true);

        try {
            if (nextPinned) {
                await conversationApi.pinConversation(conversationId);
            } else {
                await conversationApi.unpinConversation(conversationId);
            }
            await onPinStatusChange?.();
        } catch (error) {
            setIsPinned(!nextPinned);
            console.error('Error toggling group conversation pin:', error);
        } finally {
            setIsPinLoading(false);
        }
    };
    const isCurrentUserMemberFromConversation = useMemo(
        () =>
            (selectedConversation?.participants || []).some(
                (participant) => participant.userId === currentUserId,
            ),
        [currentUserId, selectedConversation?.participants],
    );
    const isCurrentUserMember =
        groupDetail?.isMember ||
        isCurrentUserMemberFromConversation ||
        hasJustJoinedGroup;
    const hasPendingJoinRequest =
        groupDetail?.myJoinRequestStatus === 'pending';
    const isGroupFull =
        (groupDetail?.memberCount || 0) >= (groupDetail?.memberLimit || 10);

    const currentMemberIds = useMemo(
        () =>
            new Set(
                (selectedConversation?.participants || []).map(
                    (participant) => participant.userId,
                ),
            ),
        [selectedConversation?.participants],
    );

    const transferableMembers = useMemo(
        () => groupMembers.filter((member) => !member.isMe),
        [groupMembers],
    );

    const normalizedMyTransferRole = useMemo(() => {
        if (effectiveMyRole === 'leader') return 'admin';
        if (effectiveMyRole === 'deputy') return 'co-admin';
        if (effectiveMyRole === 'admin') return 'admin';
        if (effectiveMyRole === 'co-admin') return 'co-admin';
        return 'member';
    }, [effectiveMyRole]);

    const getMemberRoleLabel = useCallback((role: GroupMemberItem['role']) => {
        if (role === 'admin') return 'Leader';
        if (role === 'co-admin') return 'Co-admin';
        return 'Member';
    }, []);

    const isSameLevelTransferRole = useCallback(
        (role: GroupMemberItem['role']) => {
            return role === normalizedMyTransferRole;
        },
        [normalizedMyTransferRole],
    );

    const availableFriendOptions = useMemo(() => {
        return friendOptions.filter(
            (friend) => !currentMemberIds.has(friend.id),
        );
    }, [friendOptions, currentMemberIds]);

    const filteredFriendOptions = useMemo(() => {
        const keyword = friendSearch.trim().toLowerCase();
        if (!keyword) return availableFriendOptions;

        return availableFriendOptions.filter((friend) => {
            const name = (friend.fullName || '').toLowerCase();
            const phone = String(friend.phoneNumber || '').toLowerCase();
            return name.includes(keyword) || phone.includes(keyword);
        });
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
                (msg.fileType?.startsWith('image/') === true ||
                    msg.fileCategory === 'image' ||
                    msg.type === 'image') &&
                !msg.isRecalled &&
                !recalledMessageIds.has(msg.id),
        );

        const files = displayMessages.filter(
            (msg) =>
                msg.isFile &&
                msg.fileUrl &&
                !(msg.fileType?.startsWith('image/') === true) &&
                msg.fileCategory !== 'image' &&
                msg.type !== 'image' &&
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
                url:
                    msg.content.match(/https?:\/\/\S+|www\.\S+/i)?.[0] ||
                    msg.content,
            }));

        return {
            imageMessages: images.filter(
                (msg) => !deletedMessageIds.has(msg.id),
            ),
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
        if (section === 'images') return imageMessages;
        if (section === 'files') return fileMessages;
        if (section === 'links') return linkMessages;
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

    const handleMediaAction = (action: 'open' | 'forward' | 'jump') => {
        const message = getContextMessage();

        if (!message) {
            setMediaActionError('Cannot find message');
            return;
        }

        switch (action) {
            case 'open': {
                if (contextMenuState.section === 'links') {
                    const link = (message as LinkMessage).url;
                    const normalizedLink = /^https?:\/\//i.test(link)
                        ? link
                        : `https://${link}`;
                    window.open(normalizedLink, '_blank');
                    break;
                }
                if (!message.fileUrl) {
                    setMediaActionError('Cannot open file');
                    return;
                }
                window.open(message.fileUrl, '_blank');
                break;
            }
            case 'forward': {
                onForwardMessage?.(message);
                break;
            }
            case 'jump': {
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
            setMediaActionError('Missing information to delete message');
            return;
        }

        try {
            await conversationApi.deleteMessageForMe(
                conversationId,
                message.id,
            );
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
                error instanceof Error
                    ? error.message
                    : 'Delete message failed';
            setMediaActionError(errorMessage);
        }
    };

    const handleRecallMessage = async () => {
        const message = getContextMessage();

        if (!conversationId || !message?.id) {
            setMediaActionError('Missing information to recall message');
            return;
        }

        const senderId = message.senderId || '';
        const timestamp = message.timestamp || '';
        const createdAt = timestamp ? new Date(timestamp).getTime() : NaN;
        const within24Hours =
            Number.isFinite(createdAt) &&
            Date.now() - createdAt <= 24 * 60 * 60 * 1000;

        if (!within24Hours) {
            setMediaActionError('Message has expired 24h, cannot recall');
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
                    setMediaActionError(
                        'Only admin can delete other people\'s messages',
                    );
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
                error instanceof Error
                    ? error.message
                    : 'Recall message failed';
            setMediaActionError(errorMessage);
        }
    };

    const getDurationLabel = (duration: number) => {
        if (duration === 0) return 'Never';
        if (duration === 3600) return 'After 1 hour';
        if (duration === 86400) return 'After 24 hours';
        return `${duration}s`;
    };

    const handleAutoDeleteChange = async (duration: number) => {
        if (!conversationId) return;
        if (!isAdmin) {
            const error = 'Only admin can edit auto-delete messages';
            setMediaActionError(error);
            throw new Error(error);
        }

        try {
            await conversationApi.updateGroupAutoDelete(
                conversationId,
                duration,
            );
            setAutoDeleteDuration(duration);
            setMediaActionError(null);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Update auto-delete messages failed';
            setMediaActionError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const handleOpenAutoDeleteModal = () => {
        if (!isAdmin) {
            setMediaActionError('Only admin can edit auto-delete messages');
            return;
        }
        setIsAutoDeleteModalOpen(true);
    };

    const handleHideConversation = async (password: string) => {
        if (!conversationId) return;
        if (!password.trim()) {
            throw new Error('Please enter a valid password');
        }

        try {
            await conversationApi.hideConversation(conversationId, password);
            localStorage.setItem(`hidden_conv_${conversationId}`, password);
            setIsConversationHidden(true);
            setMediaActionError(null);
            await onConversationHidden?.(conversationId);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Update conversation hidden failed';
            setMediaActionError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const handleUnhideConversation = async () => {
        if (!conversationId) return;

        try {
            const savedPassword =
                localStorage.getItem(`hidden_conv_${conversationId}`) || '';
            await conversationApi.unhideConversation(
                conversationId,
                savedPassword,
            );
            setIsConversationHidden(false);
            setMediaActionError(null);
            await onConversationHidden?.(conversationId);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Update conversation hidden failed';
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
        setFriendSearch('');
        setSelectedFriendIds([]);
        setAddMemberError(null);
    };

    const handleOpenAddMemberModal = () => {
        setIsAddMemberModalOpen(true);
        setAddMemberError(null);
    };

    const handleOpenEditGroupInfoModal = () => {
        setGroupInfoError(null);
        setGroupNameInput(
            groupNameOverride ||
                selectedConversation?.groupInfo?.groupName ||
                '',
        );
        setIsEditGroupInfoModalOpen(true);
    };

    const handleUpdateGroupName = async () => {
        if (!conversationId) return;

        const normalizedName = groupNameInput.trim();
        if (!normalizedName) {
            setGroupInfoError('Group name cannot be empty');
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
            void refreshGroupDetail();
        } catch (error) {
            setGroupInfoError(
                error instanceof Error
                    ? error.message
                    : 'Update group name failed',
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
            void refreshGroupDetail();
        } catch (error) {
            setGroupInfoError(
                error instanceof Error
                    ? error.message
                    : 'Update group avatar failed',
            );
        } finally {
            setIsUpdatingGroupAvatar(false);
            event.target.value = '';
        }
    };

    const handlePresetAvatarSelect = async (presetUrl: string) => {
        if (!conversationId) return;

        try {
            setIsUpdatingGroupAvatar(true);
            setGroupInfoError(null);

            const response = await fetch(presetUrl);
            const blob = await response.blob();
            const file = new File([blob], 'group-avatar.svg', {
                type: blob.type || 'image/svg+xml',
            });

            const result = await conversationApi.updateGroupAvatar(
                conversationId,
                file,
            );

            setGroupAvatarOverride(toAbsoluteMediaUrl(result.groupAvatar));
            void refreshGroupDetail();
        } catch (error) {
            setGroupInfoError(
                error instanceof Error
                    ? error.message
                    : 'Cannot select preset avatar',
            );
        } finally {
            setIsUpdatingGroupAvatar(false);
        }
    };

    const handleCloseAddMemberModal = () => {
        if (isAddingMembers) return;
        setIsAddMemberModalOpen(false);
        resetAddMemberModalState();
    };

    const handleConfirmAddMembers = async () => {
        if (!conversationId) return;

        if (selectedFriendIds.length === 0) {
            setAddMemberError('Please select at least one member');
            return;
        }

        const memberLimit = groupDetail?.memberLimit || 10;
        const currentCount =
            groupDetail?.memberCount ||
            groupMembers.length ||
            selectedConversation?.participants?.length ||
            0;
        if (currentCount + selectedFriendIds.length > memberLimit) {
            setAddMemberError(
                `Group only allows a maximum of ${memberLimit} members`,
            );
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
                nickname: friend.fullName || 'Member',
            }));

            await conversationApi.addGroupMembers(
                conversationId,
                memberIds,
                memberNicknames,
            );

            setGroupDetail((prev) =>
                prev
                    ? {
                          ...prev,
                          memberCount: Math.min(
                              prev.memberCount + memberIds.length,
                              prev.memberLimit,
                          ),
                      }
                    : prev,
            );

            setIsAddMemberModalOpen(false);
            resetAddMemberModalState();
            onAddMember?.();
        } catch (error) {
            setAddMemberError(mapGroupManagementError(error, 'add_member'));
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
                    : 'Clear conversation history failed';
            setMediaActionError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const handleOpenClearHistoryModal = () => {
        setIsClearHistoryModalOpen(true);
    };

    const handlePromoteMember = (userId: string, fullName: string | null) => {
        setSelectedMemberId(userId);
        setSelectedMemberName(fullName);
        setIsPromoteDialogOpen(true);
    };

    const handleRemoveMember = (userId: string, fullName: string | null) => {
        setSelectedMemberId(userId);
        setSelectedMemberName(fullName);
        setIsRemoveDialogOpen(true);
    };

    const handleOpenLeaveGroupDialog = () => {
        void refreshGroupMembers();

        if (isGroupOwner) {
            setSelectedNewAdminId('');
            setIsTransferAdminModalOpen(true);
            return;
        }

        setIsLeaveGroupDialogOpen(true);
    };

    const handleOpenDisbandGroupDialog = () => {
        setIsDisbandGroupDialogOpen(true);
    };

    const handleToggleApproveNewMembers = async () => {
        if (!canReviewJoinRequests) {
            setMediaActionError(
                'Only group leader or vice group leader can turn on/off approve new members',
            );
            return;
        }

        if (!conversationId || isUpdatingJoinApproval) return;

        const nextValue = !groupSettings.approveNewMembers;
        setIsUpdatingJoinApproval(true);

        setGroupSettings((prev) => ({
            ...prev,
            approveNewMembers: nextValue,
        }));

        try {
            await groupManagementService.updateJoinApprovalSetting(
                conversationId,
                nextValue,
            );
            setGroupDetail((prev) =>
                prev
                    ? {
                          ...prev,
                          joinRequireApproval: nextValue,
                      }
                    : prev,
            );
        } catch (error) {
            setGroupSettings((prev) => ({
                ...prev,
                approveNewMembers: !nextValue,
            }));
            setMediaActionError(
                mapGroupManagementError(error, 'toggle_join_approval'),
            );
        } finally {
            setIsUpdatingJoinApproval(false);
        }
    };

    const handleOpenQrModal = () => {
        setIsQrModalOpen(true);
    };

    const handleCopyConversationId = async () => {
        if (!conversationId) {
            setMediaActionError('Group ID not found');
            return;
        }

        try {
            await navigator.clipboard.writeText(conversationId);
            setMediaActionError('Group ID copied successfully');
        } catch {
            setMediaActionError('Failed to copy group ID');
        }
    };

    const handleLeaveGroup = async (newAdminUserId?: string) => {
        if (!conversationId || isLeavingGroup) return;

        try {
            setIsLeavingGroup(true);

            if (isGroupOwner) {
                if (!newAdminUserId) {
                    setMediaActionError(
                        'Please select a member to transfer ownership before leaving the group',
                    );
                    return;
                }

                const selectedMember = transferableMembers.find(
                    (member) => member.userId === newAdminUserId,
                );
                if (
                    selectedMember &&
                    isSameLevelTransferRole(selectedMember.role)
                ) {
                    setMediaActionError(
                        'Cannot transfer ownership to a member of the same level',
                    );
                    return;
                }

                await groupManagementService.promoteToAdmin(
                    conversationId,
                    newAdminUserId,
                );
            }

            await conversationApi.leaveConversation(conversationId);
            setIsTransferAdminModalOpen(false);
            setIsLeaveGroupDialogOpen(false);
            onConversationRemoved?.(conversationId);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Leave group failed';
            setMediaActionError(errorMessage);
        } finally {
            setIsLeavingGroup(false);
        }
    };

    const refreshGroupMembers = useCallback(async () => {
        if (!conversationId || !isCurrentUserMember) return;

        try {
            const members =
                await conversationApi.getGroupMembers(conversationId);
            const membersWithMe = members.items.map((item) => ({
                ...item,
                isMe: item.userId === currentUserId,
            }));
            setGroupMembers(membersWithMe);
            setGroupDetail((prev) =>
                prev
                    ? {
                          ...prev,
                          memberCount: membersWithMe.length,
                      }
                    : prev,
            );
        } catch (error) {
            console.error('Failed to load group members:', error);
        }
    }, [conversationId, currentUserId, isCurrentUserMember]);

    const refreshGroupDetail = useCallback(async () => {
        if (!conversationId) return;

        try {
            const detail =
                await groupManagementService.getGroupDetail(conversationId);
            setGroupDetail(detail);
            setGroupSettings((prev) => ({
                ...prev,
                approveNewMembers: detail.joinRequireApproval,
            }));
            setIsGroupDissolved(detail.status === 'dissolved');
        } catch {
            // Keep current local state when detail endpoint is temporarily unavailable.
        }
    }, [conversationId]);

    const refreshPendingJoinRequestsCount = useCallback(async () => {
        if (
            !conversationId ||
            !canReviewJoinRequests ||
            !groupSettings.approveNewMembers
        ) {
            setPendingJoinRequestCount(0);
            return;
        }

        try {
            const items =
                await groupManagementService.getJoinRequests(conversationId);
            setPendingJoinRequestCount(items.length);
        } catch {
            setPendingJoinRequestCount(0);
        }
    }, [
        canReviewJoinRequests,
        conversationId,
        groupSettings.approveNewMembers,
    ]);

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
        if (openEditAvatarTick <= lastHandledEditAvatarTickRef.current) return;

        lastHandledEditAvatarTickRef.current = openEditAvatarTick;
        if (!canEditGroupInfo) return;

        setGroupInfoError(null);
        setGroupNameInput(
            groupNameOverride ||
                selectedConversation?.groupInfo?.groupName ||
                '',
        );
        setIsEditGroupInfoModalOpen(true);
    }, [
        openEditAvatarTick,
        canEditGroupInfo,
        groupNameOverride,
        selectedConversation?.groupInfo?.groupName,
    ]);

    useEffect(() => {
        void refreshGroupDetail();
    }, [refreshGroupDetail]);

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
            void onConversationHidden?.(conversationId);
        };

        const handleHistoryClearedRealtime = (payload: {
            conversationId: string;
        }) => {
            if (payload.conversationId !== conversationId) return;
            setDeletedMessageIds(new Set(displayMessages.map((msg) => msg.id)));
            onClearHistorySuccess?.(displayMessages);
        };

        const handleGroupDissolvedRealtime = (payload: { groupId: string }) => {
            if (payload.groupId !== conversationId) return;
            setIsGroupDissolved(true);
            onConversationRemoved?.(payload.groupId);
        };

        const handleMemberChangedRealtime = (payload: {
            type: 'join' | 'leave' | 'kick';
            groupId?: string;
            conversationId?: string;
            userId?: string;
            user?: {
                userId: string;
                fullName?: string | null;
                avatarUrl?: string | null;
            };
            at: string;
            groupDeleted?: boolean;
        }) => {
            const targetConversationId =
                payload.groupId || payload.conversationId || conversationId;
            if (targetConversationId !== conversationId) return;

            const changedUserId = payload.userId || payload.user?.userId;
            if (!changedUserId) return;

            if (payload.type === 'leave' || payload.type === 'kick') {
                if (changedUserId === currentUserId) {
                    onConversationRemoved?.(targetConversationId);
                    return;
                }

                setGroupMembers((prev) =>
                    prev.filter((member) => member.userId !== changedUserId),
                );
                setGroupDetail((prev) =>
                    prev
                        ? {
                              ...prev,
                              memberCount: Math.max(prev.memberCount - 1, 0),
                          }
                        : prev,
                );
                void refreshGroupMembers();
                return;
            }

            if (payload.type === 'join') {
                setGroupDetail((prev) =>
                    prev
                        ? {
                              ...prev,
                              memberCount: Math.min(
                                  prev.memberCount + 1,
                                  prev.memberLimit,
                              ),
                          }
                        : prev,
                );

                if (changedUserId === currentUserId) {
                    setHasJustJoinedGroup(true);
                    setGroupDetail((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  isMember: true,
                                  myJoinRequestStatus: 'approved',
                              }
                            : prev,
                    );
                }

                void refreshGroupMembers();
            }
        };

        const handleAdminTransferredRealtime = (payload: {
            groupId: string;
            oldAdminUserId: string;
            newAdminUserId: string;
        }) => {
            if (payload.groupId !== conversationId) return;
            if (payload.newAdminUserId === currentUserId) {
                setMediaActionError('You have been transferred group ownership');
            }
        };

        const handleJoinApprovalSettingUpdatedRealtime = (payload: {
            groupId: string;
            joinRequireApproval: boolean;
        }) => {
            if (payload.groupId !== conversationId) return;

            setGroupSettings((prev) => ({
                ...prev,
                approveNewMembers: payload.joinRequireApproval,
            }));
            setGroupDetail((prev) =>
                prev
                    ? {
                          ...prev,
                          joinRequireApproval: payload.joinRequireApproval,
                      }
                    : prev,
            );
            if (!payload.joinRequireApproval) {
                setPendingJoinRequestCount(0);
            }
        };

        const handleJoinRequestCreatedRealtime = (payload: {
            groupId: string;
        }) => {
            if (payload.groupId !== conversationId) return;
            if (canReviewJoinRequests && groupSettings.approveNewMembers) {
                setPendingJoinRequestCount((prev) => prev + 1);
            }
        };

        const handleJoinRequestUpdatedRealtime = (payload: {
            groupId: string;
            requesterId: string;
            status: 'approved' | 'rejected';
        }) => {
            if (payload.groupId !== conversationId) return;

            setPendingJoinRequestCount((prev) => Math.max(prev - 1, 0));

            if (payload.requesterId === currentUserId) {
                if (payload.status === 'approved') {
                    setHasJustJoinedGroup(true);
                    setMediaActionError(
                        'Your group join request has been accepted',
                    );
                    setGroupDetail((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  isMember: true,
                                  myJoinRequestStatus: 'approved',
                              }
                            : prev,
                    );
                    void refreshGroupMembers();
                }

                if (payload.status === 'rejected') {
                    setMediaActionError('Your group join request has been rejected');
                    setGroupDetail((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  myJoinRequestStatus: 'rejected',
                              }
                            : prev,
                    );
                }
            }
        };

        const handleMemberJoinedRealtime = (payload: {
            groupId: string;
            userId: string;
        }) => {
            if (payload.groupId !== conversationId) return;

            setGroupDetail((prev) =>
                prev
                    ? {
                          ...prev,
                          memberCount: Math.min(
                              prev.memberCount + 1,
                              prev.memberLimit,
                          ),
                      }
                    : prev,
            );

            if (payload.userId === currentUserId) {
                setHasJustJoinedGroup(true);
                setGroupDetail((prev) =>
                    prev
                        ? {
                              ...prev,
                              isMember: true,
                              myJoinRequestStatus: 'approved',
                          }
                        : prev,
                );
            }

            if (isCurrentUserMember) {
                void refreshGroupMembers();
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

            void refreshGroupDetail();
        };

        onGroupAutoDeleteUpdated(handleAutoDeleteRealtime);
        onConversationHiddenUpdated(handleHiddenRealtime);
        onConversationHistoryCleared(handleHistoryClearedRealtime);
        onGroupDissolved(handleGroupDissolvedRealtime);
        onGroupMemberChanged(handleMemberChangedRealtime);
        onGroupAdminTransferred(handleAdminTransferredRealtime);
        onGroupJoinApprovalSettingUpdated(
            handleJoinApprovalSettingUpdatedRealtime,
        );
        onGroupJoinRequestCreated(handleJoinRequestCreatedRealtime);
        onGroupJoinRequestUpdated(handleJoinRequestUpdatedRealtime);
        onGroupMemberJoined(handleMemberJoinedRealtime);
        onGroupInfoUpdated(handleGroupInfoUpdatedRealtime);

        return () => {
            offGroupAutoDeleteUpdated();
            offConversationHiddenUpdated();
            offConversationHistoryCleared();
            offGroupDissolved();
            offGroupMemberChanged();
            offGroupAdminTransferred();
            offGroupJoinApprovalSettingUpdated();
            offGroupJoinRequestCreated();
            offGroupJoinRequestUpdated();
            offGroupMemberJoined();
            offGroupInfoUpdated(handleGroupInfoUpdatedRealtime);
        };
    }, [
        canReviewJoinRequests,
        conversationId,
        currentUserId,
        displayMessages,
        groupSettings.approveNewMembers,
        isCurrentUserMember,
        onConversationRemoved,
        refreshGroupMembers,
        refreshGroupDetail,
    ]);

    useEffect(() => {
        void refreshPendingJoinRequestsCount();
    }, [refreshPendingJoinRequestsCount]);

    useEffect(() => {
        if (!conversationId || !isCurrentUserMember) return;
        void refreshGroupMembers();
    }, [conversationId, isCurrentUserMember, refreshGroupMembers]);

    useEffect(() => {
        if (isCurrentUserMemberFromConversation) {
            setHasJustJoinedGroup(false);
        }
    }, [conversationId, isCurrentUserMemberFromConversation]);

    useEffect(() => {
        const loadFriends = async () => {
            if (!isAddMemberModalOpen || !currentUserId) return;

            try {
                setIsLoadingFriends(true);
                setAddMemberError(null);

                const friends =
                    await friendListService.getFriends(currentUserId);
                const sortedFriends = [...friends].sort((a, b) =>
                    (a.fullName || '').localeCompare(b.fullName || '', 'vi', {
                        sensitivity: 'base',
                    }),
                );

                setFriendOptions(sortedFriends);
            } catch (error) {
                setAddMemberError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load friend list',
                );
            } finally {
                setIsLoadingFriends(false);
            }
        };

        void loadFriends();
    }, [isAddMemberModalOpen, currentUserId]);

    useEffect(() => {
        if (!isViewParticipantsModalOpen) return;
        void refreshGroupMembers();
    }, [isViewParticipantsModalOpen, refreshGroupMembers]);

    useEffect(() => {
        if (!conversationId || !currentUserId) return;

        const token = getToken();
        const notificationSocket =
            notificationSocketService.getSocket() ||
            notificationSocketService.connect(
                currentUserId,
                token || undefined,
            );

        const isRelatedGroupNotification = (payload: AppNotification) => {
            const metadata = payload.metadata || {};
            const metadataConversationId =
                typeof metadata.conversationId === 'string'
                    ? metadata.conversationId
                    : '';
            const metadataGroupId =
                typeof metadata.groupId === 'string' ? metadata.groupId : '';

            if (
                metadataConversationId === conversationId ||
                metadataGroupId === conversationId
            ) {
                return true;
            }

            return (
                typeof payload.link === 'string' &&
                payload.link.includes(conversationId)
            );
        };

        const handleNotificationNew = (payload: AppNotification) => {
            if (!isRelatedGroupNotification(payload)) return;

            const type = payload.type as string;
            if (
                [
                    'group_join_approved',
                    'group_promoted',
                    'group_removed',
                    'group_dissolved',
                ].includes(type)
            ) {
                void refreshGroupMembers();
            }

            if (
                [
                    'group_join_approved',
                    'group_join_rejected',
                    'group_promoted',
                    'group_removed',
                    'group_dissolved',
                ].includes(type)
            ) {
                void refreshPendingJoinRequestsCount();
            }

            if (type === 'group_join_approved') {
                setGroupDetail((prev) =>
                    prev
                        ? {
                              ...prev,
                              myJoinRequestStatus: 'approved',
                              isMember: true,
                          }
                        : prev,
                );
                setMediaActionError('Your group join request has been accepted');
            }

            if (type === 'group_join_rejected') {
                setGroupDetail((prev) =>
                    prev
                        ? {
                              ...prev,
                              myJoinRequestStatus: 'rejected',
                          }
                        : prev,
                );
                setMediaActionError('Your group join request has been rejected');
            }
        };

        const handleNotificationUpdated = (payload: AppNotification) => {
            if (!isRelatedGroupNotification(payload)) return;
            void refreshPendingJoinRequestsCount();
            void refreshGroupMembers();
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
    }, [
        conversationId,
        currentUserId,
        refreshGroupMembers,
        refreshGroupDetail,
        refreshPendingJoinRequestsCount,
    ]);

    if (!isSidebarOpen) return null;

    const groupName =
        groupNameOverride ||
        selectedConversation?.groupInfo?.groupName ||
        'Group Info';
    const groupAvatar =
        groupAvatarOverride ||
        toAbsoluteMediaUrl(selectedConversation?.groupInfo?.groupAvatar) ||
        undefined;
    const memberCount =
        groupDetail?.memberCount ??
        (groupMembers.length > 0
            ? groupMembers.length
            : selectedConversation?.participants?.length || 0);
    const memberLimit = groupDetail?.memberLimit || 10;
    const joinButtonLabel = hasPendingJoinRequest
        ? 'Waiting for join request approval'
        : isGroupFull
          ? 'Group is full'
          : groupSettings.approveNewMembers
            ? 'Request to join group'
            : 'Join group now';

    if (showMediaStorage) {
        return (
            <MediaStoragePanel
                displayMessages={displayMessages.filter(
                    (msg) =>
                        !deletedMessageIds.has(msg.id) &&
                        !recalledMessageIds.has(msg.id),
                )}
                participants={selectedConversation?.participants || []}
                conversationId={selectedConversation?.conversationId}
                onBack={() => setShowMediaStorage(false)}
                onMediaAction={(action, message) => {
                    switch (action) {
                        case 'forward':
                            onForwardMessage?.(message);
                            break;
                        case 'jump':
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
                            Transfer group ownership
                        </h3>
                        <p className="text-sm text-gray-500">
                            You are the group leader. Please select a new group
                            leader before leaving the group.
                        </p>

                        <div className="max-h-56 overflow-y-auto flex flex-col gap-2">
                            {transferableMembers.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 p-3 text-sm text-gray-500">
                                    No other members to transfer ownership to.
                                </div>
                            ) : (
                                transferableMembers.map((member) =>
                                    (() => {
                                        const isSameLevel =
                                            isSameLevelTransferRole(
                                                member.role,
                                            );

                                        return (
                                            <label
                                                key={member.userId}
                                                className={`flex items-center gap-3 p-2 rounded-lg border border-slate-200 ${
                                                    isSameLevel
                                                        ? 'cursor-not-allowed opacity-60 bg-slate-50'
                                                        : 'cursor-pointer'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="new-admin"
                                                    disabled={isSameLevel}
                                                    checked={
                                                        selectedNewAdminId ===
                                                        member.userId
                                                    }
                                                    onChange={() => {
                                                        if (isSameLevel) return;
                                                        setSelectedNewAdminId(
                                                            member.userId,
                                                        );
                                                    }}
                                                />
                                                <ChatAvatar
                                                    name={
                                                        member.fullName ||
                                                        member.userId
                                                    }
                                                    avatarUrl={
                                                        member.avatarUrl ||
                                                        undefined
                                                    }
                                                    sizeClassName="w-10 h-10"
                                                />
                                                <div className="flex min-w-0 flex-1 flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-primary truncate">
                                                            {member.fullName ||
                                                                member.userId}
                                                        </span>
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                                            {getMemberRoleLabel(
                                                                member.role,
                                                            )}
                                                        </span>
                                                    </div>
                                                    {isSameLevel && (
                                                        <span className="text-[11px] text-red-500">
                                                            Cannot transfer
                                                            ownership to a member of the same level
                                                        </span>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })(),
                                )
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    setSelectedNewAdminId('');
                                    setIsTransferAdminModalOpen(false);
                                }}
                                className="px-4 py-2 rounded-lg border border-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={
                                    !selectedNewAdminId ||
                                    isLeavingGroup ||
                                    transferableMembers.length === 0
                                }
                                onClick={() =>
                                    handleLeaveGroup(selectedNewAdminId)
                                }
                                className="px-4 py-2 rounded-lg bg-green-primary text-white disabled:opacity-50"
                            >
                                Transfer ownership and leave group
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isGroupManagement ? (
                <>
                    <div className="p-6 border-b border-slate-200 flex flex-col gap-3">
                        <span className="text-lg font-semibold text-gray-primary">
                            Group Information
                        </span>

                        <div className="flex flex-col gap-3 items-center">
                            <GroupAvatar
                                name={groupName}
                                avatarUrl={groupAvatar}
                                size={72}
                                members={selectedConversation?.participants}
                                onClick={
                                    canEditGroupInfo
                                        ? handleOpenEditGroupInfoModal
                                        : undefined
                                }
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        canEditGroupInfo
                                            ? handleOpenEditGroupInfoModal
                                            : undefined
                                    }
                                    disabled={!canEditGroupInfo}
                                    className={`max-w-65 truncate font-semibold text-gray-primary ${canEditGroupInfo ? 'hover:text-green-primary' : ''}`}
                                    title={groupName}
                                >
                                    {groupName}
                                </button>

                                {canEditGroupInfo && (
                                    <button
                                        type="button"
                                        onClick={handleOpenEditGroupInfoModal}
                                        className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                        title="Edit group info"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 flex gap-3 justify-center border-b border-slate-200">
                        {isCurrentUserMember ? (
                            <>
                                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors flex-1">
                                    <Bell
                                        size={20}
                                        className="text-green-primary"
                                    />
                                    <span className="text-xs text-gray-primary">
                                        Turn off notifications
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleToggleConversationPin();
                                    }}
                                    disabled={isPinLoading}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isPinned ? (
                                        <PinOff
                                            size={20}
                                            className="text-green-primary"
                                        />
                                    ) : (
                                        <Pin
                                            size={20}
                                            className="text-green-primary"
                                        />
                                    )}
                                    <span className="text-xs text-gray-primary">
                                        {isPinned
                                            ? 'Unpin chat'
                                            : 'Pin chat'}
                                    </span>
                                    <span className="hidden">
                                        Pin chat
                                    </span>
                                </button>
                                <button
                                    onClick={handleOpenAddMemberModal}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors flex-1"
                                >
                                    <UserRoundPlus
                                        size={20}
                                        className="text-green-primary"
                                    />
                                    <span className="text-xs text-gray-primary">
                                        Add members
                                    </span>
                                </button>
                                <button
                                    onClick={() => setIsGroupManagement(true)}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors flex-1"
                                >
                                    <Settings
                                        size={20}
                                        className="text-green-primary"
                                    />
                                    <span className="text-xs text-gray-primary">
                                        Manage group
                                    </span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsJoinRequestDialogOpen(true)}
                                disabled={hasPendingJoinRequest || isGroupFull}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-green-primary text-white disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                            >
                                <Users size={18} />
                                <span className="text-sm font-semibold">
                                    {joinButtonLabel}
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="p-4 border-b flex flex-col gap-4 border-slate-200">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-primary">
                                Images
                            </span>
                            <button
                                onClick={() => toggleSection('images')}
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                            >
                                <ChevronRight
                                    size={20}
                                    className={`text-gray-primary transition-transform ${expandedSections.images ? 'rotate-90' : ''}`}
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
                                                src={
                                                    img.fileUrl ||
                                                    '/placeholder.svg'
                                                }
                                                alt={img.fileName || 'chat'}
                                                className="w-full h-16 object-cover hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                            <button
                                                onClick={(e) =>
                                                    handleContextMenu(
                                                        e,
                                                        img.id,
                                                        'images',
                                                    )
                                                }
                                                className="absolute top-1 right-1 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {imageMessages.length === 0 && (
                                        <div className="col-span-4 text-sm text-gray-500 py-2 text-center bg-slate-50 rounded-lg">
                                            No images/videos yet
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowMediaStorage(true)}
                                    className="py-2 rounded-lg font-semibold bg-white border transition-colors text-[14px] my-1 w-full select-none cursor-pointer"
                                    style={{
                                        borderColor: 'var(--app-primary, #226262)',
                                        color: 'var(--app-primary, #226262)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--app-primary-bg, rgba(34, 98, 98, 0.08))';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    View all
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
                                onClick={() => toggleSection('files')}
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                            >
                                <ChevronRight
                                    size={20}
                                    className={`text-gray-primary transition-transform ${expandedSections.files ? 'rotate-90' : ''}`}
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
                                                {file.fileName ||
                                                    'Attachment'}
                                            </span>
                                            <button
                                                onClick={(e) =>
                                                    handleContextMenu(
                                                        e,
                                                        file.id,
                                                        'files',
                                                    )
                                                }
                                                className="p-1 hover:bg-slate-200 rounded"
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {fileMessages.length === 0 && (
                                        <div className="text-sm text-gray-500 py-2 text-center bg-slate-50 rounded-lg">
                                            No files yet
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowMediaStorage(true)}
                                    className="py-2 rounded-lg font-semibold bg-white border transition-colors text-[14px] my-1 w-full select-none cursor-pointer"
                                    style={{
                                        borderColor: 'var(--app-primary, #226262)',
                                        color: 'var(--app-primary, #226262)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--app-primary-bg, rgba(34, 98, 98, 0.08))';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    View all
                                </button>
                            </>
                        )}
                    </div>

                    <div className="p-4 border-b flex flex-col gap-4 border-slate-200">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-primary">
                                Link
                            </span>
                            <button
                                onClick={() => toggleSection('links')}
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                            >
                                <ChevronRight
                                    size={20}
                                    className={`text-gray-primary transition-transform ${expandedSections.links ? 'rotate-90' : ''}`}
                                />
                            </button>
                        </div>

                        {expandedSections.links && (
                            <>
                                <div className="space-y-2">
                                    {linkMessages
                                        .slice(0, 3)
                                        .map((linkItem) => (
                                            <div
                                                key={linkItem.id}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200"
                                            >
                                                <a
                                                    href={
                                                        /^https?:\/\//i.test(
                                                            linkItem.url,
                                                        )
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
                                                        handleContextMenu(
                                                            e,
                                                            linkItem.id,
                                                            'links',
                                                        )
                                                    }
                                                    className="p-1 hover:bg-slate-200 rounded"
                                                >
                                                    <MoreVertical size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    {linkMessages.length === 0 && (
                                        <div className="text-sm text-gray-500 py-2 text-center bg-slate-50 rounded-lg">
                                            No links yet
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowMediaStorage(true)}
                                    className="py-2 rounded-lg font-semibold bg-white border transition-colors text-[14px] my-1 w-full select-none cursor-pointer"
                                    style={{
                                        borderColor: 'var(--app-primary, #226262)',
                                        color: 'var(--app-primary, #226262)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--app-primary-bg, rgba(34, 98, 98, 0.08))';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    View all
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="p-3 flex flex-col gap-1 bg-color-gray-secondary border-b border-slate-200">
                            <span className="font-semibold">Members</span>
                            <div className="mt-1 mb-1 flex items-center justify-between rounded-lg bg-white px-2 py-2 border border-slate-200">
                                <div className="flex flex-col">
                                    <span className="text-[14px] text-gray-primary">
                                        Review new members
                                    </span>
                                    <span className="text-[11px] text-gray-secondary">
                                        Only group admins can enable/disable
                                    </span>
                                </div>
                                <ToggleSwitch
                                    checked={groupSettings.approveNewMembers}
                                    onChange={handleToggleApproveNewMembers}
                                    disabled={
                                        !canReviewJoinRequests ||
                                        isUpdatingJoinApproval
                                    }
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (!isCurrentUserMember) return;
                                    setIsViewParticipantsModalOpen(true);
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-gray-primary ${
                                    isCurrentUserMember
                                        ? 'hover:bg-slate-100'
                                        : 'cursor-not-allowed opacity-70'
                                }`}
                            >
                                <UserRound size={20} />
                                <span className="text-[15px]">
                                    {memberCount}/{memberLimit} members
                                </span>
                            </button>
                            {canReviewJoinRequests &&
                                isCurrentUserMember &&
                                groupSettings.approveNewMembers && (
                                    <button
                                        onClick={() =>
                                            setIsPendingJoinRequestsOpen(true)
                                        }
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary"
                                    >
                                        <Users size={20} />
                                        <span className="text-[15px]">
                                            Join requests
                                        </span>
                                        {pendingJoinRequestCount > 0 && (
                                            <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[11px] text-white">
                                                {pendingJoinRequestCount}
                                            </span>
                                        )}
                                    </button>
                                )}
                            <button
                                onClick={handleOpenQrModal}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary"
                            >
                                <Link size={20} />
                                <div className="flex flex-col items-start">
                                    <span className="text-[15px]">
                                        Join link
                                    </span>
                                    <span className="text-[12px] text-blue-dark text-left">
                                        {conversationId}
                                    </span>
                                    <span className="text-[11px] text-green-primary text-left underline">
                                        Generate QR code
                                    </span>
                                </div>
                                <div className="ml-auto flex items-center gap-3">
                                    <Copy size={18} />
                                    <Share size={18} />
                                </div>
                            </button>
                        </div>

                        <div className="p-3 flex flex-col gap-1 bg-color-gray-secondary border-b border-slate-200">
                            <span className="font-semibold">Group info</span>
                            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                                <AlarmClockCheck size={20} />
                                <span className="text-[15px]">
                                    Schedule list
                                </span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                                <NotebookText size={20} />
                                <span className="text-[15px]">
                                    Notes
                                </span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                                <Pin size={20} />
                                <span className="text-[15px]">
                                    Pinned messages
                                </span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                                <BarChart3 size={20} />
                                <span className="text-[15px]">
                                    Polls
                                </span>
                            </button>
                        </div>

                        <div className="p-3 flex flex-col gap-1 bg-color-gray-secondary border-b border-slate-200">
                            <span className="font-semibold">
                                Privacy & Support
                            </span>
                            <button
                                onClick={handleOpenAutoDeleteModal}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary"
                            >
                                <Clock7 size={20} />
                                <div className="flex flex-col items-start">
                                    <span className="text-[15px]">
                                        Auto delete message
                                    </span>
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
                                    {isConversationHidden
                                        ? 'Unhide chat'
                                        : 'Hide chat'}
                                </span>
                            </button>
                        </div>

                        <button
                            onClick={handleOpenClearHistoryModal}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors text-red-500"
                        >
                            <Trash2 size={20} />
                            <span className="text-[15px]">
                                Clear history
                            </span>
                        </button>
                        <button
                            onClick={handleOpenLeaveGroupDialog}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors text-red-500"
                        >
                            <LogOut size={20} />
                            <span className="text-[15px]">Leave group</span>
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
                            <ArrowLeft
                                size={20}
                                className="text-gray-primary"
                            />
                        </button>
                        <span className="text-lg font-semibold text-gray-primary">
                            Group Management
                        </span>
                    </div>

                    <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
                        <span className="font-semibold text-gray-primary">
                            Allow members to:
                        </span>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-primary">
                                    Change group name & avatar
                                </span>
                                <Checkbox
                                    checked={groupPermissions.changeNameAvatar}
                                    onChange={() =>
                                        setGroupPermissions({
                                            ...groupPermissions,
                                            changeNameAvatar:
                                                !groupPermissions.changeNameAvatar,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-primary">
                                    Pin messages
                                </span>
                                <Checkbox
                                    checked={groupPermissions.pinMessages}
                                    onChange={() =>
                                        setGroupPermissions({
                                            ...groupPermissions,
                                            pinMessages:
                                                !groupPermissions.pinMessages,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-primary">
                                    Create notes
                                </span>
                                <Checkbox
                                    checked={groupPermissions.createNotes}
                                    onChange={() =>
                                        setGroupPermissions({
                                            ...groupPermissions,
                                            createNotes:
                                                !groupPermissions.createNotes,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-primary">
                                    Create polls
                                </span>
                                <Checkbox
                                    checked={groupPermissions.createPolls}
                                    onChange={() =>
                                        setGroupPermissions({
                                            ...groupPermissions,
                                            createPolls:
                                                !groupPermissions.createPolls,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-primary">
                                    Send messages
                                </span>
                                <Checkbox
                                    checked={groupPermissions.sendMessages}
                                    onChange={() =>
                                        setGroupPermissions({
                                            ...groupPermissions,
                                            sendMessages:
                                                !groupPermissions.sendMessages,
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
                                    New member approval mode
                                </span>
                                <HelpCircle
                                    size={16}
                                    className="text-gray-400"
                                />
                            </div>
                            <div className="scale-75 origin-right">
                                <ToggleSwitch
                                    checked={groupSettings.approveNewMembers}
                                    onChange={handleToggleApproveNewMembers}
                                    disabled={
                                        !canReviewJoinRequests ||
                                        isUpdatingJoinApproval
                                    }
                                />
                            </div>
                        </div>
                        {!canReviewJoinRequests && (
                            <p className="text-xs text-gray-500 -mt-2">
                                Only group admins or vice admins can edit this mode.
                            </p>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-primary">
                                    Mark messages from admins
                                </span>
                                <HelpCircle
                                    size={16}
                                    className="text-gray-400"
                                />
                            </div>
                            <div className="scale-75 origin-right">
                                <ToggleSwitch
                                    checked={groupSettings.markLeaderMessages}
                                    onChange={() =>
                                        setGroupSettings({
                                            ...groupSettings,
                                            markLeaderMessages:
                                                !groupSettings.markLeaderMessages,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-primary">
                                    Allow new members to read recent messages
                                </span>
                                <HelpCircle
                                    size={16}
                                    className="text-gray-400"
                                />
                            </div>
                            <div className="scale-75 origin-right">
                                <ToggleSwitch
                                    checked={
                                        groupSettings.allowReadRecentMessages
                                    }
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
                                    Allow use group join link
                                </span>
                                <HelpCircle
                                    size={16}
                                    className="text-gray-400"
                                />
                            </div>
                            <div className="scale-75 origin-right">
                                <ToggleSwitch
                                    checked={groupSettings.allowJoinLink}
                                    onChange={() =>
                                        setGroupSettings({
                                            ...groupSettings,
                                            allowJoinLink:
                                                !groupSettings.allowJoinLink,
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
                                <Share
                                    size={18}
                                    className="text-gray-primary"
                                />
                            </button>
                            <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                                <RefreshCw
                                    size={18}
                                    className="text-gray-primary"
                                />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border-b border-slate-200 flex flex-col gap-2">
                        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary">
                            <Users size={20} />
                            <span className="text-[15px]">Block from group</span>
                        </button>
                        <button
                            onClick={() => {
                                if (!isCurrentUserMember) return;
                                void refreshGroupMembers();
                                setIsViewParticipantsModalOpen(true);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-gray-primary"
                        >
                            <KeyRound size={20} />
                            <span className="text-[15px]">
                                Group admins and vice admins
                            </span>
                        </button>
                    </div>

                    <div className="p-4 mt-auto mb-2">
                        <div
                            onClick={handleOpenDisbandGroupDialog}
                            className={`flex items-center justify-center p-2 rounded-md ${
                                isAdmin
                                    ? 'bg-[#FDECEC] cursor-pointer'
                                    : 'bg-slate-100 cursor-not-allowed'
                            }`}
                        >
                            <span className="text-[16px] text-[#DC264C] font-semibold">
                                Disband group
                            </span>
                        </div>
                        {!isAdmin && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Only admins can disband the group.
                            </p>
                        )}
                        {isGroupDissolved && (
                            <p className="text-xs text-red-500 mt-2 text-center">
                                The group has been disbanded.
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
                        Close
                    </button>
                </div>
            )}

            <MediaContextMenu
                isOpen={contextMenuState.isOpen}
                position={contextMenuState.position}
                onOpen={() => handleMediaAction('open')}
                onForward={() => handleMediaAction('forward')}
                onJumpToMessage={() => handleMediaAction('jump')}
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
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                title="Group join QR code"
                size="sm"
            >
                <div className="p-4 space-y-4">
                    <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 p-4">
                        <QRCodeSVG
                            value={conversationId || 'group-conversation-id'}
                            size={180}
                            bgColor="#ffffff"
                            fgColor="#111827"
                            level="M"
                            includeMargin
                        />
                        <p className="text-xs text-gray-500 text-center">
                            Scan QR code to get group ID and send join request.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-primary">
                            Current group ID
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                value={conversationId}
                                readOnly
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-gray-700 bg-slate-50"
                            />
                            <button
                                type="button"
                                onClick={handleCopyConversationId}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <JoinRequestDialog
                isOpen={isJoinRequestDialogOpen}
                groupName={groupName}
                groupId={conversationId}
                canSubmit={!isGroupFull}
                blockedMessage={
                    isGroupFull ? 'Group is full' : undefined
                }
                onClose={() => setIsJoinRequestDialogOpen(false)}
                onSuccess={(result) => {
                    if (isJoinedImmediately(result as JoinGroupResult)) {
                        setHasJustJoinedGroup(true);
                        setGroupDetail((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      isMember: true,
                                      myJoinRequestStatus: 'approved',
                                  }
                                : prev,
                        );
                        setMediaActionError(
                            'Successfully joined group (no approval needed)',
                        );
                        void refreshGroupMembers();
                        void refreshGroupDetail();
                        return;
                    }

                    setGroupDetail((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  myJoinRequestStatus: 'pending',
                              }
                            : prev,
                    );
                    setMediaActionError('Join request sent successfully');
                }}
            />

            <ViewParticipantsModal
                isOpen={isViewParticipantsModalOpen}
                participants={groupMembers}
                currentUserRole={
                    selectedConversation?.myRole as
                        | 'admin'
                        | 'co-admin'
                        | 'member'
                }
                onClose={() => setIsViewParticipantsModalOpen(false)}
                onPromote={handlePromoteMember}
                onRemove={handleRemoveMember}
            />

            <PromoteToAdminDialog
                isOpen={isPromoteDialogOpen}
                memberName={selectedMemberName || ''}
                memberId={selectedMemberId}
                groupId={conversationId}
                onClose={() => setIsPromoteDialogOpen(false)}
                onSuccess={() => {
                    setIsPromoteDialogOpen(false);
                    setIsViewParticipantsModalOpen(false);
                    setMediaActionError('Promoted to admin successfully');
                }}
            />

            <RemoveMemberDialog
                isOpen={isRemoveDialogOpen}
                memberName={selectedMemberName || ''}
                memberId={selectedMemberId}
                groupId={conversationId}
                onClose={() => setIsRemoveDialogOpen(false)}
                onSuccess={() => {
                    setIsRemoveDialogOpen(false);
                    setIsViewParticipantsModalOpen(false);
                    setMediaActionError('Removed member successfully');
                }}
            />

            <LeaveGroupDialog
                isOpen={isLeaveGroupDialogOpen}
                groupName={selectedConversation?.groupInfo?.groupName || 'Group'}
                groupId={conversationId}
                isOwner={selectedConversation?.myRole === 'admin'}
                hasOtherAdmin={groupMembers.some(
                    (m) => m.role === 'admin' && !m.isMe,
                )}
                onClose={() => setIsLeaveGroupDialogOpen(false)}
                onSuccess={() => {
                    setIsLeaveGroupDialogOpen(false);
                    onConversationRemoved?.(conversationId);
                }}
            />

            <DisbandGroupDialog
                isOpen={isDisbandGroupDialogOpen}
                groupName={selectedConversation?.groupInfo?.groupName || 'Group'}
                groupId={conversationId}
                memberCount={groupMembers.length}
                onClose={() => setIsDisbandGroupDialogOpen(false)}
                onSuccess={() => {
                    setIsDisbandGroupDialogOpen(false);
                    onConversationRemoved?.(conversationId);
                }}
            />

            <PendingJoinRequestsList
                isOpen={isPendingJoinRequestsOpen}
                groupId={conversationId}
                groupName={selectedConversation?.groupInfo?.groupName || 'Group'}
                onClose={() => setIsPendingJoinRequestsOpen(false)}
                refreshSignal={pendingJoinRequestCount}
                onCountChange={setPendingJoinRequestCount}
                onRequestApproved={() => {
                    setMediaActionError('Accepted join request successfully');
                    void refreshGroupMembers();
                    void refreshGroupDetail();
                    void refreshPendingJoinRequestsCount();
                }}
                onRequestRejected={() => {
                    setMediaActionError('Rejected join request successfully');
                    void refreshGroupDetail();
                    void refreshPendingJoinRequestsCount();
                }}
            />

            <AddGroupMemberModal
                isOpen={isAddMemberModalOpen}
                friendSearch={friendSearch}
                isAddingMembers={isAddingMembers}
                isLoadingFriends={isLoadingFriends}
                addMemberError={addMemberError}
                filteredFriendOptions={filteredFriendOptions}
                selectedFriendIds={selectedFriendIds}
                onSearchChange={setFriendSearch}
                onToggleFriend={handleFriendToggle}
                onClose={handleCloseAddMemberModal}
                onConfirm={() => {
                    void handleConfirmAddMembers();
                }}
            />

            <GroupInfoEditModal
                isOpen={isEditGroupInfoModalOpen}
                groupName={groupName}
                groupAvatar={groupAvatar}
                groupNameInput={groupNameInput}
                isUpdatingGroupName={isUpdatingGroupName}
                isUpdatingGroupAvatar={isUpdatingGroupAvatar}
                groupInfoError={groupInfoError}
                participants={(selectedConversation?.participants || []).map(
                    (participant) => ({
                        userId: participant.userId,
                        fullName: participant.fullName,
                        avatarUrl: participant.avatarUrl,
                    }),
                )}
                modalMembers={(selectedConversation?.participants || [])
                    .slice(0, 4)
                    .map((participant) => ({
                        userId: participant.userId,
                        fullName: participant.fullName,
                        avatarUrl: participant.avatarUrl,
                    }))}
                presetAvatarUrls={PRESET_GROUP_AVATAR_URLS}
                onClose={() => setIsEditGroupInfoModalOpen(false)}
                onGroupNameInputChange={setGroupNameInput}
                onSaveGroupName={() => {
                    void handleUpdateGroupName();
                }}
                onUploadAvatarFile={(event) => {
                    void handleFileUploadForAvatar(event);
                }}
                onSelectPresetAvatar={(presetUrl) => {
                    void handlePresetAvatarSelect(presetUrl);
                }}
                toAbsoluteMediaUrl={toAbsoluteMediaUrl}
            />

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

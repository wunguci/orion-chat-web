import React, { useState, useMemo, useEffect } from 'react';
import {
    Bell,
    Pin,
    UserRoundPlus,
    ChevronDown,
    Eye,
    Link,
    Copy,
    Share,
    AlarmClockCheck,
    NotebookText,
    Clock7,
    EyeOff,
    MessageSquareWarning,
    Trash2,
    ArrowLeft,
    HelpCircle,
    Users,
    KeyRound,
    RefreshCw,
    MoreVertical,
    Ban,
    Unlock,
} from 'lucide-react';
import {
    FaFileArchive,
    FaFileExcel,
    FaFilePdf,
    FaFilePowerpoint,
    FaFileWord,
} from 'react-icons/fa';
import { FiFile, FiFileText, FiImage, FiMusic, FiVideo } from 'react-icons/fi';
import Checkbox from '../common/Checkbox';
import ToggleSwitch from '../common/ToggleSwitch';
import { MediaStoragePanel } from './MediaStoragePanel';
import { MediaContextMenu } from './MediaContextMenu';
import { AutoDeleteModal } from './AutoDeleteModal';
import { HideConversationModal } from './HideConversationModal';
import { RevealConversationModal } from './RevealConversationModal';
import { ClearHistoryModal } from './ClearHistoryModal';
import { BlockUserModal } from './BlockUserModal';
import { conversationApi } from '../../services/conversationApi';
import type { ConversationView } from '../../types/conversation';
import type { SocketMessage } from './MessageList';

type MediaTab = 'Images' | 'Files' | 'Links';

interface ConversationInfoPanelProps {
    isSidebarOpen?: boolean;
    selectedConversation?: ConversationView;
    displayMessages?: SocketMessage[];
    currentUserId?: string;
    onBlockStatusChange?: () => Promise<void>;
    onJumpToMessage?: (messageId: string) => void;
    onForwardMessage?: (message: SocketMessage) => void;
    onPinStatusChange?: () => Promise<void>;
}

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
    isSidebarOpen = true,
    selectedConversation,
    displayMessages = [],
    currentUserId = '',
    onBlockStatusChange,
    onJumpToMessage,
    onForwardMessage,
    onPinStatusChange,
}) => {
    const renderFileIcon = (icon?: SocketMessage['fileIcon']) => {
        switch (icon) {
            case 'image':
                return (
                    <FiImage className="w-4 h-4 text-emerald-600 shrink-0" />
                );
            case 'video':
                return <FiVideo className="w-4 h-4 text-blue-600 shrink-0" />;
            case 'audio':
                return <FiMusic className="w-4 h-4 text-indigo-600 shrink-0" />;
            case 'file-pdf':
                return <FaFilePdf className="w-4 h-4 text-red-600 shrink-0" />;
            case 'file-word':
                return (
                    <FaFileWord className="w-4 h-4 text-blue-700 shrink-0" />
                );
            case 'file-excel':
                return (
                    <FaFileExcel className="w-4 h-4 text-green-700 shrink-0" />
                );
            case 'file-powerpoint':
                return (
                    <FaFilePowerpoint className="w-4 h-4 text-orange-600 shrink-0" />
                );
            case 'file-archive':
                return (
                    <FaFileArchive className="w-4 h-4 text-amber-700 shrink-0" />
                );
            case 'file-text':
                return (
                    <FiFileText className="w-4 h-4 text-slate-600 shrink-0" />
                );
            default:
                return <FiFile className="w-4 h-4 text-slate-500 shrink-0" />;
        }
    };

    // ✅ Get other participant (for PRIVATE chat)
    const otherParticipant = selectedConversation?.participants?.find(
        (p) => p.userId !== currentUserId,
    );

    // ✅ Get conversation name
    const conversationName =
        selectedConversation?.groupInfo?.groupName ||
        otherParticipant?.fullName ||
        'Conversation';

    const conversationAvatar =
        selectedConversation?.groupInfo?.groupAvatar ||
        otherParticipant?.avatarUrl ||
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentUserId;

    const { imageMessages, fileMessages, linkMessages } = useMemo(() => {
        const images = displayMessages.filter(
            (msg) =>
                msg.isFile &&
                msg.fileUrl &&
                (msg.fileType?.startsWith('image/') === true ||
                    msg.fileCategory === 'image' ||
                    msg.type === 'image') &&
                !msg.isRecalled,
        );

        const files = displayMessages.filter(
            (msg) =>
                msg.isFile &&
                msg.fileUrl &&
                !(msg.fileType?.startsWith('image/') === true) &&
                msg.fileCategory !== 'image' &&
                msg.type !== 'image' &&
                !msg.isRecalled,
        );

        // URLs pattern: http://, https://, www., etc.
        const links = displayMessages
            .filter(
                (msg) =>
                    !msg.isFile &&
                    msg.content &&
                    /https?:\/\/|www\./i.test(msg.content) &&
                    !msg.isRecalled,
            )
            .map((msg) => ({
                ...msg,
                // Extract URL from content (simple regex)
                url:
                    msg.content.match(/https?:\/\/\S+|www\.\S+/i)?.[0] ||
                    msg.content,
            }));

        return {
            imageMessages: images,
            fileMessages: files,
            linkMessages: links,
        };
    }, [displayMessages]);

    const [isGroupManagement, setIsGroupManagement] = useState(false);
    const [mediaTab, setMediaTab] = useState<MediaTab>('Images');
    const [tabDropdownOpen, setTabDropdownOpen] = useState(false);
    const [imagesOpen, setImagesOpen] = useState(true);
    const [showMediaStorage, setShowMediaStorage] = useState(false);
    const [contextMenuState, setContextMenuState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        messageId?: string;
    }>({ isOpen: false, position: { x: 0, y: 0 } });

    const [showAutoDeleteModal, setShowAutoDeleteModal] = useState(false);
    const [showHideConversationModal, setShowHideConversationModal] =
        useState(false);
    const [showRevealConversationModal, setShowRevealConversationModal] =
        useState(false);
    const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
    const [showBlockUserModal, setShowBlockUserModal] = useState(false);
    const [autoDeleteDuration, setAutoDeleteDuration] = useState(0);
    const [iAmBlocked, setIAmBlocked] = useState(false);
    const [iAmTheBlocker, setIAmTheBlocker] = useState(false);
    const [mediaActionError, setMediaActionError] = useState<string | null>(
        null,
    );
    const [isPinned, setIsPinned] = useState(
        selectedConversation?.myIsPinned || false,
    );
    const [isPinLoading, setIsPinLoading] = useState(false);

    // Derive isConversationHidden from selectedConversation to avoid setState cascade
    const isConversationHidden = selectedConversation?.myIsHidden || false;

    const mediaTabs: MediaTab[] = ['Images', 'Files', 'Links'];
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

    // ✅ Handlers for new features
    const handleAutoDeleteUpdate = async (duration: number) => {
        if (!selectedConversation?.conversationId) return;

        try {
            await conversationApi.updateAutoDeleteDuration(
                selectedConversation.conversationId,
                duration,
            );
            setAutoDeleteDuration(duration);
            setShowAutoDeleteModal(false);
        } catch (error) {
            console.error('Error updating auto delete:', error);
        }
    };

    const handleHideConversation = async (password: string) => {
        if (!selectedConversation?.conversationId) return;

        try {
            await conversationApi.hideConversation(
                selectedConversation.conversationId,
                password,
            );

            // Lưu UUID vào localStorage
            localStorage.setItem(
                `hidden_conv_${selectedConversation.conversationId}`,
                password,
            );

            setShowHideConversationModal(false);

            // Redirect to /chat after 1 second
            setTimeout(() => {
                window.location.href = '/chat';
            }, 1000);
        } catch (error) {
            console.error('Error hiding conversation:', error);
        }
    };

    const handleRevealConversation = async (password: string) => {
        if (!selectedConversation?.conversationId) return;

        try {
            await conversationApi.unhideConversation(
                selectedConversation.conversationId,
                password,
            );

            setShowRevealConversationModal(false);

            // Parent component should handle the update through selectedConversation change
        } catch (error) {
            console.error('Error revealing conversation:', error);
        }
    };

    const handleClearHistory = async () => {
        if (!selectedConversation?.conversationId) return;

        try {
            await conversationApi.clearConversationHistory(
                selectedConversation.conversationId,
            );

            setShowClearHistoryModal(false);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    const handleBlockUser = async () => {
        if (!selectedConversation?.conversationId) return;

        try {
            await conversationApi.blockUser(
                selectedConversation.conversationId,
            );

            setIAmTheBlocker(true);
            setShowBlockUserModal(false);
            await onBlockStatusChange?.();
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };

    // ✅ Load block status when conversation changes
    useEffect(() => {
        const loadBlockStatus = async () => {
            if (!selectedConversation?.conversationId) {
                setIAmBlocked(false);
                setIAmTheBlocker(false);
                return;
            }

            try {
                const response = await conversationApi.getBlockStatus(
                    selectedConversation.conversationId,
                );
                // Backend returns iAmBlocked and iAmTheBlocker
                setIAmBlocked(response?.iAmBlocked || false);
                setIAmTheBlocker(response?.iAmTheBlocker || false);
            } catch (error) {
                console.error('Error loading block status:', error);
                setIAmBlocked(false);
                setIAmTheBlocker(false);
            }
        };

        loadBlockStatus();
    }, [selectedConversation?.conversationId]);

    // ✅ Update isPinned when selectedConversation changes
    useEffect(() => {
        setIsPinned(selectedConversation?.myIsPinned || false);
    }, [selectedConversation?.myIsPinned]);

    // ✅ Handle pin/unpin conversation
    const handlePinConversation = async () => {
        if (!selectedConversation?.conversationId) return;

        try {
            setIsPinLoading(true);
            if (isPinned) {
                await conversationApi.unpinConversation(
                    selectedConversation.conversationId,
                );
            } else {
                await conversationApi.pinConversation(
                    selectedConversation.conversationId,
                );
            }
            setIsPinned(!isPinned);
            // ✅ Trigger parent to refresh conversations list (for real-time reorder in sidebar)
            if (onPinStatusChange) {
                await onPinStatusChange();
            }
        } catch (error) {
            console.error('Error toggling pin status:', error);
        } finally {
            setIsPinLoading(false);
        }
    };

    return (
        <>
            {/* Auto Delete Modal */}
            <AutoDeleteModal
                isOpen={showAutoDeleteModal}
                onClose={() => setShowAutoDeleteModal(false)}
                currentDuration={autoDeleteDuration}
                onConfirm={handleAutoDeleteUpdate}
            />

            {/* Hide Conversation Modal */}
            <HideConversationModal
                isOpen={showHideConversationModal}
                onClose={() => setShowHideConversationModal(false)}
                onConfirm={handleHideConversation}
            />

            {/* Reveal Conversation Modal */}
            <RevealConversationModal
                isOpen={showRevealConversationModal}
                onClose={() => setShowRevealConversationModal(false)}
                onConfirm={handleRevealConversation}
                conversationName={conversationName}
            />

            {/* Clear History Modal */}
            <ClearHistoryModal
                isOpen={showClearHistoryModal}
                onClose={() => setShowClearHistoryModal(false)}
                onConfirm={handleClearHistory}
                messageCount={displayMessages.length}
            />

            {/* Block User Modal */}
            <BlockUserModal
                isOpen={showBlockUserModal}
                onClose={() => setShowBlockUserModal(false)}
                onConfirm={handleBlockUser}
                userName={conversationName}
            />

            {/* Rest of the component JSX... */}
            {showMediaStorage && (
                <MediaStoragePanel
                    displayMessages={displayMessages}
                    onBack={() => setShowMediaStorage(false)}
                    conversationId={selectedConversation?.conversationId}
                    onMediaAction={(action, message) => {
                        switch (action) {
                            case 'forward':
                                if (onForwardMessage) {
                                    onForwardMessage(message);
                                }
                                break;
                            case 'jump':
                                if (onJumpToMessage) {
                                    onJumpToMessage(message.id);
                                }
                                break;
                            // Other actions (open, deleteForMe, recall) are handled in MediaStoragePanel
                        }
                    }}
                />
            )}

            {/* Sidebar Right - Conversation Info */}
            {isSidebarOpen && !showMediaStorage && (
                <div className="w-90 border-l border-slate-200 bg-white flex flex-col overflow-y-auto rounded-2xl shadow-2xs">
                    {!isGroupManagement ? (
                        <>
                            {/* Header */}
                            <div className="p-6 flex flex-col gap-3">
                                <span className="text-lg font-semibold text-gray-primary text-center">
                                    Thông tin hội thoại
                                </span>

                                <div className="flex flex-col gap-3 items-center">
                                    <img
                                        src={conversationAvatar}
                                        alt={conversationName}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                    <span className="font-semibold text-gray-primary">
                                        {conversationName}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 flex gap-3 justify-center border-b  border-slate-200">
                                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors flex-1">
                                    <Bell
                                        size={20}
                                        className="text-green-primary"
                                    />
                                    <span className="text-xs text-gray-primary">
                                        Tắt thông báo
                                    </span>
                                </button>
                                <button
                                    onClick={handlePinConversation}
                                    disabled={isPinLoading}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors flex-1 ${
                                        isPinned
                                            ? 'bg-green-50 hover:bg-green-100'
                                            : 'hover:bg-white'
                                    } ${isPinLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Pin
                                        size={20}
                                        className={
                                            isPinned
                                                ? 'text-green-600 fill-current'
                                                : 'text-green-primary'
                                        }
                                    />
                                    <span
                                        className={`text-xs ${isPinned ? 'text-green-600 font-medium' : 'text-gray-primary'}`}
                                    >
                                        {isPinned
                                            ? 'Bỏ ghim'
                                            : 'Ghim hội thoại'}
                                    </span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors flex-1">
                                    <UserRoundPlus
                                        size={20}
                                        className="text-green-primary"
                                    />
                                    <span className="text-xs text-gray-primary">
                                        Tạo nhóm
                                    </span>
                                </button>
                            </div>

                            {/* Images Section */}
                            <div className="p-4 border-b flex flex-col gap-4 border-slate-200">
                                <div className="flex items-center justify-between">
                                    {/* Tab selector dropdown */}
                                    <div className="relative">
                                        <button
                                            className="text-sm text-gray-primary flex items-center gap-1 focus:outline-none font-semibold"
                                            onClick={() =>
                                                setTabDropdownOpen((o) => !o)
                                            }
                                        >
                                            {mediaTab}
                                            <ChevronDown
                                                size={16}
                                                className={`text-gray-primary transition-transform ${
                                                    tabDropdownOpen
                                                        ? 'rotate-180'
                                                        : ''
                                                }`}
                                            />
                                        </button>

                                        {tabDropdownOpen && (
                                            <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                                                {mediaTabs.map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => {
                                                            setMediaTab(tab);
                                                            setTabDropdownOpen(
                                                                false,
                                                            );
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors ${
                                                            mediaTab === tab
                                                                ? 'text-green-primary font-medium bg-slate-50'
                                                                : 'text-gray-primary'
                                                        }`}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Collapse toggle */}
                                    <button
                                        onClick={() => setImagesOpen((o) => !o)}
                                    >
                                        {imagesOpen ? (
                                            <Eye
                                                size={16}
                                                className="text-slate-400"
                                            />
                                        ) : (
                                            <EyeOff
                                                size={16}
                                                className="text-slate-400"
                                            />
                                        )}
                                    </button>
                                </div>

                                {imagesOpen && (
                                    <>
                                        {mediaTab === 'Images' && (
                                            <div className="grid grid-cols-4 gap-2">
                                                {imageMessages.length > 0 ? (
                                                    imageMessages.map((msg) => (
                                                        <div
                                                            key={msg.id}
                                                            className="relative group overflow-hidden rounded cursor-pointer"
                                                        >
                                                            <img
                                                                src={
                                                                    msg.fileUrl
                                                                }
                                                                alt={
                                                                    msg.fileName
                                                                }
                                                                className="w-full h-16 object-cover hover:opacity-80 transition-opacity"
                                                                title={
                                                                    msg.fileName
                                                                }
                                                            />
                                                            {/* Hover overlay with action button */}
                                                            <div className="absolute inset-0 bg-slate-800  bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-50">
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        const rect =
                                                                            (
                                                                                e.currentTarget as HTMLElement
                                                                            ).getBoundingClientRect();
                                                                        setContextMenuState(
                                                                            {
                                                                                isOpen: true,
                                                                                position:
                                                                                    {
                                                                                        x:
                                                                                            rect.right -
                                                                                            150,
                                                                                        y:
                                                                                            rect.bottom +
                                                                                            4,
                                                                                    },
                                                                                messageId:
                                                                                    msg.id,
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                                                                >
                                                                    <MoreVertical
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-white"
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-4 text-center py-4 text-slate-400 text-sm">
                                                        Không có hình ảnh
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {mediaTab === 'Files' && (
                                            <div className="flex flex-col gap-2">
                                                {fileMessages.length > 0 ? (
                                                    fileMessages.map((msg) => (
                                                        <div
                                                            key={msg.id}
                                                            className="flex items-center gap-2 px-2 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors group"
                                                        >
                                                            <a
                                                                href={
                                                                    msg.fileUrl
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-2 flex-1 min-w-0"
                                                            >
                                                                {renderFileIcon(
                                                                    msg.fileIcon,
                                                                )}
                                                                <span className="text-xs text-slate-700 truncate">
                                                                    {
                                                                        msg.fileName
                                                                    }
                                                                </span>
                                                            </a>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    const rect =
                                                                        (
                                                                            e.currentTarget as HTMLElement
                                                                        ).getBoundingClientRect();
                                                                    setContextMenuState(
                                                                        {
                                                                            isOpen: true,
                                                                            position:
                                                                                {
                                                                                    x:
                                                                                        rect.right -
                                                                                        120,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        4,
                                                                                },
                                                                            messageId:
                                                                                msg.id,
                                                                        },
                                                                    );
                                                                }}
                                                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-300 rounded transition-all"
                                                            >
                                                                <MoreVertical
                                                                    size={14}
                                                                    className="text-slate-600"
                                                                />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-4 text-slate-400 text-sm">
                                                        Không có tệp
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {mediaTab === 'Links' && (
                                            <div className="flex flex-col gap-2">
                                                {linkMessages.length > 0 ? (
                                                    linkMessages.map((msg) => (
                                                        <div
                                                            key={msg.id}
                                                            className="flex items-center gap-2 px-2 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors group"
                                                        >
                                                            <a
                                                                href={msg.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-2 flex-1 min-w-0"
                                                            >
                                                                <Link
                                                                    size={16}
                                                                    className="text-blue-500 shrink-0"
                                                                />
                                                                <span className="text-xs text-blue-600 truncate hover:underline">
                                                                    {msg.url}
                                                                </span>
                                                            </a>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    const rect =
                                                                        (
                                                                            e.currentTarget as HTMLElement
                                                                        ).getBoundingClientRect();
                                                                    setContextMenuState(
                                                                        {
                                                                            isOpen: true,
                                                                            position:
                                                                                {
                                                                                    x:
                                                                                        rect.right -
                                                                                        120,
                                                                                    y:
                                                                                        rect.bottom +
                                                                                        4,
                                                                                },
                                                                            messageId:
                                                                                msg.id,
                                                                        },
                                                                    );
                                                                }}
                                                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-300 rounded transition-all"
                                                            >
                                                                <MoreVertical
                                                                    size={14}
                                                                    className="text-slate-600"
                                                                />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-4 text-slate-400 text-sm">
                                                        Không có đường dẫn
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* View All Button */}
                                        {(imageMessages.length > 0 ||
                                            fileMessages.length > 0 ||
                                            linkMessages.length > 0) && (
                                            <button
                                                onClick={() =>
                                                    setShowMediaStorage(true)
                                                }
                                                className="w-full py-2 text-sm text-green-600 font-medium hover:text-green-700 transition-colors hover:bg-slate-50 rounded-lg"
                                            >
                                                Xem tất cả
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {/* Member Section Left Bar */}

                                {/* Group News */}
                                <div className="p-3 flex flex-col gap-1 bg-color-gray-secondary border-b  border-slate-200">
                                    <span className="font-semibold text-gray-primary">
                                        Bảng tin
                                    </span>
                                    <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                                        <AlarmClockCheck size={20} />
                                        <span className="text-[15px]">
                                            Danh sách nhắc hẹn
                                        </span>
                                    </button>
                                    <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                                        <NotebookText size={20} />
                                        <span className="text-[15px]">
                                            Ghi chú, ghim, bình chọn
                                        </span>
                                    </button>
                                </div>

                                {/* Auto Delete Messages */}
                                <div className="p-3 flex flex-col gap-1 bg-color-gray-secondary border-b  border-slate-200">
                                    <span className="font-semibold text-gray-primary">
                                        Thiết lập bảo mật
                                    </span>
                                    <button
                                        onClick={() =>
                                            setShowAutoDeleteModal(true)
                                        }
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary"
                                    >
                                        <Clock7 size={20} />
                                        <div className="flex flex-col items-start">
                                            <span className="text-[15px]">
                                                Tin nhắn tự xóa
                                            </span>
                                            <span className="text-[12px] text-gray-secondary">
                                                {autoDeleteDuration === 0
                                                    ? 'Không bao giờ'
                                                    : `Sau ${autoDeleteDuration} ngày`}
                                            </span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isConversationHidden) {
                                                setShowRevealConversationModal(
                                                    true,
                                                );
                                            } else {
                                                setShowHideConversationModal(
                                                    true,
                                                );
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary"
                                    >
                                        {isConversationHidden ? (
                                            <>
                                                <Unlock
                                                    size={20}
                                                    className="text-green-primary"
                                                />
                                                <span className="text-[15px]">
                                                    Tiết lộ trò chuyện
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff size={20} />
                                                <span className="text-[15px]">
                                                    Ẩn trò chuyện
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-gray-primary">
                                    <MessageSquareWarning size={20} />
                                    <span className="text-[15px]">Báo xấu</span>
                                </button>
                                <button
                                    onClick={() =>
                                        setShowClearHistoryModal(true)
                                    }
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-red-500"
                                >
                                    <Trash2 size={20} />
                                    <span className="text-[15px]">
                                        Xóa lịch sử trò chuyện
                                    </span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!iAmTheBlocker && !iAmBlocked) {
                                            setShowBlockUserModal(true);
                                        }
                                    }}
                                    disabled={iAmTheBlocker || iAmBlocked}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Ban size={20} />
                                    <span className="text-[15px]">
                                        {iAmTheBlocker
                                            ? 'Đã chặn'
                                            : 'Chặn người dùng'}
                                    </span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Group Management View */}
                            <div className="flex flex-col h-full">
                                {/* Header with Back Button */}
                                <div className="p-4 border-b  border-slate-200 flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            setIsGroupManagement(false)
                                        }
                                        className="p-2 hover:bg-white rounded-lg transition-colors"
                                    >
                                        <ArrowLeft
                                            size={20}
                                            className="text-gray-primary"
                                        />
                                    </button>
                                    <span className="text-lg font-semibold text-gray-primary">
                                        Quản lý nhóm
                                    </span>
                                </div>

                                {/* Permissions Section */}
                                <div className="p-4 border-b  border-slate-200 flex flex-col gap-4">
                                    <span className="font-semibold text-gray-primary">
                                        Cho phép các thành viên trong nhóm:
                                    </span>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-primary">
                                                Thay đổi tên & ảnh đại diện của
                                                nhóm
                                            </span>
                                            <Checkbox
                                                checked={
                                                    groupPermissions.changeNameAvatar
                                                }
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
                                                Ghim tin nhắn, ghi chú, bình
                                                chọn lên đầu hội thoại
                                            </span>
                                            <Checkbox
                                                checked={
                                                    groupPermissions.pinMessages
                                                }
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
                                                Tạo mới ghi chú, nhắc hẹn
                                            </span>
                                            <Checkbox
                                                checked={
                                                    groupPermissions.createNotes
                                                }
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
                                                Tạo mới bình chọn
                                            </span>
                                            <Checkbox
                                                checked={
                                                    groupPermissions.createPolls
                                                }
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
                                                Gửi tin nhắn
                                            </span>
                                            <Checkbox
                                                checked={
                                                    groupPermissions.sendMessages
                                                }
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

                                {/* Toggle Settings */}
                                <div className="p-4 border-b  border-slate-200 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-primary">
                                                Chế độ phê duyệt thành viên mới
                                            </span>
                                            <HelpCircle
                                                size={16}
                                                className="text-gray-400"
                                            />
                                        </div>
                                        <div className="scale-75 origin-right">
                                            <ToggleSwitch
                                                checked={
                                                    groupSettings.approveNewMembers
                                                }
                                                onChange={() =>
                                                    setGroupSettings({
                                                        ...groupSettings,
                                                        approveNewMembers:
                                                            !groupSettings.approveNewMembers,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-primary">
                                                Đánh dấu tin nhắn từ trưởng/phó
                                                nhóm
                                            </span>
                                            <HelpCircle
                                                size={16}
                                                className="text-gray-400"
                                            />
                                        </div>
                                        <div className="scale-75 origin-right">
                                            <ToggleSwitch
                                                checked={
                                                    groupSettings.markLeaderMessages
                                                }
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
                                                Cho phép thành viên mới đọc tin
                                                nhắn gần nhất
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
                                                Cho phép dùng link tham gia nhóm
                                            </span>
                                            <HelpCircle
                                                size={16}
                                                className="text-gray-400"
                                            />
                                        </div>
                                        <div className="scale-75 origin-right">
                                            <ToggleSwitch
                                                checked={
                                                    groupSettings.allowJoinLink
                                                }
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

                                {/* Group Link */}
                                <div className="p-4 border-b  border-slate-200">
                                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                        <span className="flex-1 text-sm text-blue-600">
                                            zalo.me/g/zwnrhx701
                                        </span>
                                        <button className="p-1 hover:bg-green-bg-light rounded transition-colors">
                                            <Copy
                                                size={18}
                                                className="text-gray-primary"
                                            />
                                        </button>
                                        <button className="p-1 hover:bg-green-bg-light rounded transition-colors">
                                            <Share
                                                size={18}
                                                className="text-gray-primary"
                                            />
                                        </button>
                                        <button className="p-1 hover:bg-green-bg-light rounded transition-colors">
                                            <RefreshCw
                                                size={18}
                                                className="text-gray-primary"
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Block from Group */}
                                <div className="p-4 border-b  border-slate-200 flex flex-col gap-2">
                                    <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                                        <Users size={20} />
                                        <span className="text-[15px]">
                                            Chặn khỏi nhóm
                                        </span>
                                    </button>
                                    <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                                        <KeyRound size={20} />
                                        <span className="text-[15px]">
                                            Trưởng & phó nhóm
                                        </span>
                                    </button>
                                </div>

                                {/* Group Link */}
                                <div className="p-4 mt-auto mb-2">
                                    <div className="flex items-center justify-center p-2 bg-[#FDECEC] rounded-md">
                                        <span className="text-[16px] text-[#DC264C] font-semibold">
                                            Giải tán nhóm
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ✅ Media Context Menu Handlers */}
            {/* Get message from messageId */}
            {(() => {
                const getMessageById = (messageId?: string) => {
                    if (!messageId) return null;
                    return (
                        displayMessages.find((msg) => msg.id === messageId) ||
                        null
                    );
                };

                const handleOpenDocument = async () => {
                    const message = getMessageById(contextMenuState.messageId);
                    if (!message || !message.fileUrl) {
                        setMediaActionError('Cannot open file');
                        return;
                    }

                    try {
                        // Open file in new tab
                        window.open(message.fileUrl, '_blank');
                        setContextMenuState({
                            ...contextMenuState,
                            isOpen: false,
                        });
                    } catch (error) {
                        const errorMsg =
                            error instanceof Error
                                ? error.message
                                : 'Failed to open file';
                        setMediaActionError(errorMsg);
                        console.error(errorMsg, error);
                    }
                };

                const handleForwardClick = async () => {
                    const message = getMessageById(contextMenuState.messageId);
                    if (!message) {
                        setMediaActionError('Message not found');
                        return;
                    }

                    try {
                        // Call parent handler if available
                        if (onForwardMessage) {
                            onForwardMessage(message);
                        }
                        setContextMenuState({
                            ...contextMenuState,
                            isOpen: false,
                        });
                    } catch (error) {
                        const errorMsg =
                            error instanceof Error
                                ? error.message
                                : 'Failed to forward message';
                        setMediaActionError(errorMsg);
                        console.error(errorMsg, error);
                    }
                };

                const handleJumpToMessage = async () => {
                    const messageId = contextMenuState.messageId;
                    if (!messageId) {
                        setMediaActionError('Message ID not found');
                        return;
                    }

                    try {
                        // Call parent handler if available
                        if (onJumpToMessage) {
                            onJumpToMessage(messageId);
                        }
                        setContextMenuState({
                            ...contextMenuState,
                            isOpen: false,
                        });
                    } catch (error) {
                        const errorMsg =
                            error instanceof Error
                                ? error.message
                                : 'Failed to jump to message';
                        setMediaActionError(errorMsg);
                        console.error(errorMsg, error);
                    }
                };

                const handleDeleteForMe = async () => {
                    const messageId = contextMenuState.messageId;
                    if (!messageId || !selectedConversation?.conversationId) {
                        setMediaActionError('Missing required information');
                        return;
                    }

                    try {
                        await conversationApi.deleteMessageForMe(
                            selectedConversation.conversationId,
                            messageId,
                        );
                        setContextMenuState({
                            ...contextMenuState,
                            isOpen: false,
                        });
                        setMediaActionError(null);
                    } catch (error) {
                        const errorMsg =
                            error instanceof Error
                                ? error.message
                                : 'Failed to delete message';
                        setMediaActionError(errorMsg);
                        console.error(errorMsg, error);
                    }
                };

                const handleRecallMessage = async () => {
                    const messageId = contextMenuState.messageId;
                    if (!messageId || !selectedConversation?.conversationId) {
                        setMediaActionError('Missing required information');
                        return;
                    }

                    try {
                        await conversationApi.recallMessage(
                            selectedConversation.conversationId,
                            messageId,
                        );
                        setContextMenuState({
                            ...contextMenuState,
                            isOpen: false,
                        });
                        setMediaActionError(null);
                    } catch (error) {
                        const errorMsg =
                            error instanceof Error
                                ? error.message
                                : 'Failed to recall message';
                        setMediaActionError(errorMsg);
                        console.error(errorMsg, error);
                    }
                };

                return (
                    <>
                        {/* Error notification */}
                        {mediaActionError && (
                            <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
                                {mediaActionError}
                            </div>
                        )}

                        {/* Context Menu */}
                        <MediaContextMenu
                            isOpen={contextMenuState.isOpen}
                            position={contextMenuState.position}
                            onOpen={handleOpenDocument}
                            onForward={handleForwardClick}
                            onJumpToMessage={handleJumpToMessage}
                            onDeleteForMe={handleDeleteForMe}
                            onRecall={handleRecallMessage}
                            onClose={() =>
                                setContextMenuState({
                                    ...contextMenuState,
                                    isOpen: false,
                                })
                            }
                        />
                    </>
                );
            })()}
        </>
    );
};

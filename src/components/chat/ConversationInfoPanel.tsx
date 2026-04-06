import React, { useState } from 'react';
import {
    Bell,
    Pin,
    UserRoundPlus,
    Settings,
    ChevronRight,
    ChevronDown,
    Eye,
    UserRound,
    Link,
    Copy,
    Share,
    AlarmClockCheck,
    NotebookText,
    Clock7,
    EyeOff,
    MessageSquareWarning,
    Trash2,
    LogOut,
    ArrowLeft,
    HelpCircle,
    Users,
    KeyRound,
    RefreshCw,
} from 'lucide-react';
import Checkbox from '../common/Checkbox';
import ToggleSwitch from '../common/ToggleSwitch';

type MediaTab = 'Images' | 'Files' | 'Links';

interface SelectedChat {
    name: string;
    avatar?: string;
}

interface GroupPermissions {
    changeNameAvatar: boolean;
    pinMessages: boolean;
    createNotes: boolean;
    createPolls: boolean;
    sendMessages: boolean;
}

interface GroupSettings {
    approveNewMembers: boolean;
    markLeaderMessages: boolean;
    allowReadRecentMessages: boolean;
    allowJoinLink: boolean;
}

interface ConversationInfoPanelProps {
    isSidebarOpen?: boolean;
    selectedChat?: SelectedChat;
}

export const ConversationInfoPanel: React.FC<ConversationInfoPanelProps> = ({
    isSidebarOpen = true,
    selectedChat = {
        name: 'Olivia Isabella',
        avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqHljHwC3uFTM4IyU1hLVqc5KJgrzOFpMvA&s',
    },
}) => {
    const images = new Array(8)
        .fill(0)
        .map((_, i) => `https://picsum.photos/seed/${i + 10}/200/140`);

    const [isGroupManagement, setIsGroupManagement] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        images: true,
        files: true,
        links: true,
    });
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [mediaTab, setMediaTab] = useState<MediaTab>('Images');
    const [tabDropdownOpen, setTabDropdownOpen] = useState(false);
    const [imagesOpen, setImagesOpen] = useState(true);
    const mediaTabs: MediaTab[] = ['Images', 'Files', 'Links'];
    const [groupPermissions, setGroupPermissions] = useState<GroupPermissions>({
        changeNameAvatar: true,
        pinMessages: true,
        createNotes: true,
        createPolls: true,
        sendMessages: true,
    });
    const [groupSettings, setGroupSettings] = useState<GroupSettings>({
        approveNewMembers: false,
        markLeaderMessages: true,
        allowReadRecentMessages: true,
        allowJoinLink: true,
    });

    return (
        <>
            {/* Sidebar Right - Conversation Info */}
            {isSidebarOpen && (
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
                                        src={
                                            selectedChat.avatar ||
                                            '/placeholder.svg'
                                        }
                                        alt={selectedChat.name}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                    <span className="font-semibold text-gray-primary">
                                        {selectedChat.name}
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
                                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors flex-1">
                                    <Pin
                                        size={20}
                                        className="text-green-primary"
                                    />
                                    <span className="text-xs text-gray-primary">
                                        Ghi hội thoại
                                    </span>
                                </button>
                                <button
                                    onClick={() =>
                                        setIsAddMemberModalOpen(true)
                                    }
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors flex-1"
                                >
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
                                            <div className="grid grid-cols-4 gap-1">
                                                {images.map((src, i) => (
                                                    <img
                                                        key={i}
                                                        src={src}
                                                        alt={`img-${i}`}
                                                        className="w-full h-16 object-cover rounded"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {mediaTab === 'Files' && (
                                            <div className="flex flex-col gap-2">
                                                {[
                                                    'document.pdf',
                                                    'report.docx',
                                                    'data.xlsx',
                                                    'notes.txt',
                                                ].map((name, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 px-2 py-2 bg-slate-100 rounded-lg"
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="text-slate-500 shrink-0"
                                                        >
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                        <span className="text-xs text-slate-700 truncate">
                                                            {name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {mediaTab === 'Links' && (
                                            <div className="flex flex-col gap-2">
                                                {[
                                                    'https://github.com',
                                                    'https://youtube.com',
                                                    'https://google.com',
                                                ].map((url, i) => (
                                                    <a
                                                        key={i}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 px-2 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="text-slate-500 shrink-0"
                                                        >
                                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                        </svg>
                                                        <span className="text-xs text-slate-700 truncate">
                                                            {url}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
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
                                    <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                                        <Clock7 size={20} />
                                        <div className="flex flex-col items-start">
                                            <span className="text-[15px]">
                                                Tin nhắn tự xóa
                                            </span>
                                            <span className="text-[12px] text-gray-secondary">
                                                Không bao giờ
                                            </span>
                                        </div>
                                    </button>
                                    <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                                        <EyeOff size={20} />
                                        <span className="text-[15px]">
                                            Ẩn trò chuyện
                                        </span>
                                    </button>
                                </div>

                                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-gray-primary">
                                    <MessageSquareWarning size={20} />
                                    <span className="text-[15px]">Báo xấu</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-red-500">
                                    <Trash2 size={20} />
                                    <span className="text-[15px]">
                                        Xóa lịch sử trò chuyện
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
        </>
    );
};

export default ConversationInfoPanel;

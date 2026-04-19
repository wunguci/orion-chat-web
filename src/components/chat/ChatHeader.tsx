import React from 'react';
import { CiCircleList, CiPhone, CiSearch, CiVideoOn } from 'react-icons/ci';
import { FaUsers } from 'react-icons/fa';

type ChatHeaderProps = {
    name?: string;
    avatarUrl?: string;
    subtitle?: string;
    isBlocked?: boolean;
    isGroupChat?: boolean;
    disableCallButtons?: boolean;
    onAudioCall?: () => void;
    onVideoCall?: () => void;
    onGroupCall?: () => void;
    onSearchClick?: () => void;
    onPanelToggle?: () => void;
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    name = 'Olivia Isabella',
    avatarUrl,
    subtitle = 'Online',
    isBlocked = false,
    isGroupChat = false,
    disableCallButtons = false,
    onAudioCall,
    onVideoCall,
    onGroupCall,
    onSearchClick,
    onPanelToggle,
}) => {
    const isCallDisabled = isBlocked || disableCallButtons;

    return (
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-gray-primary">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-border flex items-center justify-center">
                    <img
                        src={
                            avatarUrl ||
                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqHljHwC3uFTM4IyU1hLVqc5KJgrzOFpMvA&s'
                        }
                        alt="avatar"
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
                <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs text-gray-secondary">
                        {subtitle}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
                {/* Group call button - for group chats */}
                {isGroupChat ? (
                    <button
                        className={`p-1 rounded transition-colors ${
                            isCallDisabled
                                ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                : 'hover:bg-slate-200 text-gray-primary'
                        }`}
                        disabled={isCallDisabled}
                        onClick={onGroupCall}
                        title={
                            isCallDisabled
                                ? 'Unable to call because you are blocked.'
                                : 'Group Video Call'
                        }
                    >
                        <FaUsers className="w-4 h-4" />
                    </button>
                ) : (
                    <>
                        {/* Audio call button - disabled if blocked */}
                        <button
                            className={`p-1 rounded transition-colors ${
                                isBlocked
                                    ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                    : 'hover:bg-slate-200 text-gray-primary'
                            }`}
                            disabled={isCallDisabled}
                            onClick={onAudioCall}
                            title={
                                isCallDisabled
                                    ? 'Unable to call because you are blocked.'
                                    : 'Call'
                            }
                        >
                            <CiPhone className="w-5 h-5" />
                        </button>
                    </>
                )}
                <button
                    onClick={onSearchClick}
                    className="p-1 hover:bg-slate-200 rounded text-gray-primary"
                    title="Tìm kiếm tin nhắn"
                >
                    <CiSearch className="w-5 h-5" />
                </button>
                {/* Video call button - disabled if blocked */}
                <button
                    className={`p-1 rounded transition-colors ${
                        isBlocked
                            ? 'opacity-50 cursor-not-allowed bg-slate-100'
                            : 'hover:bg-slate-200 text-gray-primary'
                    }`}
                    disabled={isCallDisabled}
                    onClick={isGroupChat ? onGroupCall : onVideoCall}
                    title={
                        isCallDisabled
                            ? 'Unable to video call because you are blocked.'
                            : isGroupChat ? 'Group Video Call' : 'Video Call'
                    }
                >
                    <CiVideoOn className="w-5 h-5" />
                </button>
                <button
                    onClick={onPanelToggle}
                    className="p-1 hover:bg-slate-200 rounded text-gray-primary"
                    title="Thông tin hội thoại"
                >
                    <CiCircleList className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;

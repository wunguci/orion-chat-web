import React from 'react';
import { CiCircleList, CiPhone, CiSearch, CiVideoOn } from 'react-icons/ci';
import ChatAvatar from '../common/ChatAvatar';

type ChatHeaderProps = {
    name?: string;
    avatarUrl?: string;
    subtitle?: string;
    isBlocked?: boolean;
    disableCallButtons?: boolean;
    onAudioCall?: () => void;
    onVideoCall?: () => void;
    onSearchClick?: () => void;
    onPanelToggle?: () => void;
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    name = 'Olivia Isabella',
    avatarUrl,
    subtitle = 'Online',
    isBlocked = false,
    disableCallButtons = false,
    onAudioCall,
    onVideoCall,
    onSearchClick,
    onPanelToggle,
}) => {
    const isCallDisabled = isBlocked || disableCallButtons;

    return (
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-gray-primary">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-border flex items-center justify-center">
                    <ChatAvatar
                        name={name}
                        avatarUrl={avatarUrl}
                        sizeClassName="w-full h-full"
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
                    onClick={onVideoCall}
                    title={
                        isCallDisabled
                            ? 'Unable to video call because you are blocked.'
                            : 'Video Call'
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

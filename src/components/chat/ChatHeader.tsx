import React from 'react';
import { Info, Pencil, Phone, Search, Video } from 'lucide-react';
import GroupAvatar from './GroupAvatar';
import ChatAvatar from '../common/ChatAvatar';

type GroupAvatarMember = {
    userId: string;
    fullName?: string | null;
    avatarUrl?: string | null;
};

type ChatHeaderProps = {
    name?: string;
    avatarUrl?: string;
    subtitle?: string;
    isBlocked?: boolean;
    isGroupChat?: boolean;
    disableCallButtons?: boolean;
    hideCallButtons?: boolean;
    onAudioCall?: () => void;
    onVideoCall?: () => void;
    onGroupAudioCall?: () => void;
    onGroupVideoCall?: () => void;
    onGroupCall?: () => void;
    onSearchClick?: () => void;
    onPanelToggle?: () => void;
    onIdentityClick?: () => void;
    onAvatarClick?: () => void;
    onEditGroupClick?: () => void;
    groupMembers?: GroupAvatarMember[];
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    name = 'Olivia Isabella',
    avatarUrl,
    subtitle = 'Just accessed',
    isBlocked = false,
    isGroupChat = false,
    disableCallButtons = false,
    hideCallButtons = false,
    onAudioCall,
    onVideoCall,
    onGroupAudioCall,
    onGroupVideoCall,
    onGroupCall,
    onSearchClick,
    onPanelToggle,
    onIdentityClick,
    onAvatarClick,
    onEditGroupClick,
    groupMembers = [],
}) => {
    const isCallDisabled = isBlocked || disableCallButtons;

    return (
        <div className="group-chat-header-clickable px-4 py-3 border-b border-slate-200 flex items-center justify-between text-gray-primary">
            <div className="flex items-center gap-2">
                {isGroupChat ? (
                    <GroupAvatar
                        size={40}
                        name={name}
                        avatarUrl={avatarUrl}
                        members={groupMembers}
                        onClick={onAvatarClick || onIdentityClick}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={onIdentityClick}
                        disabled={!onIdentityClick}
                        className={`w-10 h-10 rounded-full border border-gray-border flex items-center justify-center overflow-hidden ${onIdentityClick ? 'hover:opacity-90 transition-opacity' : ''}`}
                    >
                        <ChatAvatar
                            name={name}
                            avatarUrl={avatarUrl}
                            sizeClassName="w-full h-full"
                        />
                    </button>
                )}

                <button
                    type="button"
                    onClick={onIdentityClick}
                    disabled={!onIdentityClick}
                    className={`text-left ${onIdentityClick ? 'rounded-lg p-1 -m-1 hover:bg-slate-100 transition-colors' : 'cursor-default'}`}
                >
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs text-gray-secondary">
                        {subtitle}
                    </div>
                </button>

                {isGroupChat && (onEditGroupClick || onIdentityClick) && (
                    <button
                        type="button"
                        onClick={onEditGroupClick || onIdentityClick}
                        className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Edit group info"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                )}
            </div>
            <div className="flex items-center gap-3 text-slate-300">
                {/* Audio call button */}
                {isGroupChat ? (
                    <button
                        className={`p-1 rounded transition-colors ${
                            isCallDisabled
                                ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                : 'cursor-pointer hover:bg-slate-200 text-gray-primary'
                        }`}
                        disabled={isCallDisabled}
                        onClick={onGroupAudioCall || onGroupCall}
                        title={
                            isCallDisabled
                                ? 'Cannot call in this conversation.'
                                : 'Group voice call'
                        }
                    >
                        <Phone className="w-5 h-5" />
                    </button>
                ) : (
                    <>
                        {/* Audio call button - disabled if blocked */}
                        {!hideCallButtons && (
                            <button
                                className={`p-1 rounded transition-colors ${
                                    isBlocked
                                        ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                        : 'cursor-pointer hover:bg-slate-200 text-gray-primary'
                                }`}
                                disabled={isCallDisabled}
                                onClick={onAudioCall}
                                title={
                                    isCallDisabled
                                        ? 'Cannot call in this conversation.'
                                        : 'Voice call'
                                }
                            >
                                <Phone className="w-5 h-5" />
                            </button>
                        )}
                    </>
                )}
                <button
                    onClick={onSearchClick}
                    className="cursor-pointer p-1 hover:bg-slate-200 rounded text-gray-primary"
                    title="Search messages"
                >
                    <Search className="w-5 h-5" />
                </button>
                {/* Video call button - disabled if blocked */}
                {(!isGroupChat && !hideCallButtons || isGroupChat) && (
                    <button
                        className={`p-1 rounded transition-colors ${
                            isCallDisabled
                                ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                : 'cursor-pointer hover:bg-slate-200 text-gray-primary'
                        }`}
                        disabled={isCallDisabled}
                        onClick={isGroupChat ? onGroupVideoCall : onVideoCall}
                        title={
                            isCallDisabled
                                ? 'Cannot video call in this conversation.'
                                : isGroupChat
                                  ? 'Group video call'
                                  : 'Video call'
                        }
                    >
                        <Video className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={onPanelToggle}
                    className="cursor-pointer p-1 hover:bg-slate-200 rounded text-gray-primary"
                    title="Conversation details"
                >
                    <Info className="w-5 h-5" />
                </button>
            </div>
            <style>{`
                .group-chat-header-clickable button:not(:disabled) {
                    cursor: pointer;
                }

                .group-chat-header-clickable button:disabled {
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default ChatHeader;

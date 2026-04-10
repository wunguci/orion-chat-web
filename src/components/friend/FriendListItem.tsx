import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Friend } from '../../types/friend';
import { useCall } from '../../hooks/useCall';
import { getUser } from '../../utils/token';

interface FriendListItemProps {
    friend: Friend;
    onViewInfo: (friendId: string) => void;
    onRemoveFriend: (friendId: string) => void;
    onBlockFriend: (friendId: string) => void;
    onChatClick?: (friendId: string) => void;
    isChatLoading?: boolean;
}

const FriendListItem: React.FC<FriendListItemProps> = ({
    friend,
    onViewInfo,
    onRemoveFriend,
    onBlockFriend,
    onChatClick,
    isChatLoading,
}) => {
    const { initiateCall, status } = useCall();
    const [showActions, setShowActions] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!showActions) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (
                actionMenuRef.current &&
                !actionMenuRef.current.contains(event.target as Node)
            ) {
                setShowActions(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowActions(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showActions]);

    const handleStartCall = async (callType: 'audio' | 'video') => {
        const currentUser = getUser();
        const currentUserId = currentUser?.userId || currentUser?.id;
        if (!currentUserId || !friend.id) return;

        const conversationId = [currentUserId, friend.id].sort().join('-');

        await initiateCall(
            `friend-${conversationId}`,
            friend.id,
            callType,
            {
                name: friend.name,
                avatar: friend.avatar,
            },
            {
                name: currentUser.fullName,
                avatar: currentUser.avatarUrl || undefined,
            },
        );
    };

    const isCallingBusy = status !== 'idle';

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer duration-200 group relative bg-transparent hover:bg-slate-50 border border-transparent ${
                isChatLoading ? 'opacity-60 pointer-events-none' : ''
            }`}
            onClick={() => {
                if (!isChatLoading && onChatClick) {
                    onChatClick(friend.id);
                }
            }}
        >
            {/* Avatar */}
            <div className="relative">
                <div
                    className={`w-10 h-10 rounded-full bg-slate-300 bg-cover bg-center ${
                        friend.status === 'offline' ? 'grayscale' : ''
                    }`}
                    style={{ backgroundImage: `url('${friend.avatar}')` }}
                />

                {/* Status dot */}
                <span
                    className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                        friend.status === 'online'
                            ? 'bg-green-500'
                            : 'bg-slate-400'
                    }`}
                />
            </div>

            {/* Text */}
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{friend.name}</p>
                <p className="text-xs text-slate-400 truncate italic">
                    {friend.subtext}
                </p>
            </div>

            <div
                className="flex shrink-0 items-center gap-2"
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                <button
                    type="button"
                    title="Audio call"
                    onClick={(event) => {
                        event.stopPropagation();
                        void handleStartCall('audio');
                    }}
                    disabled={isCallingBusy}
                    className="h-8 w-8 rounded-full border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i className="fas fa-phone text-xs" />
                </button>
                <button
                    type="button"
                    title="Video call"
                    onClick={(event) => {
                        event.stopPropagation();
                        void handleStartCall('video');
                    }}
                    disabled={isCallingBusy}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 leading-none hover:bg-white hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <i className="fas fa-video text-xs leading-none" />
                </button>
                <div ref={actionMenuRef} className="relative flex items-center">
                    <button
                        type="button"
                        title="More actions"
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowActions((prev) => !prev);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 leading-none hover:bg-white hover:border-slate-300 cursor-pointer"
                    >
                        <MoreHorizontal size={14} className="block" />
                    </button>

                    {showActions && (
                        <div className="absolute right-0 top-10 z-10 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setShowActions(false);
                                    onViewInfo(friend.id);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                                View information
                            </button>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setShowActions(false);
                                    onRemoveFriend(friend.id);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 cursor-pointer"
                            >
                                Delete friend
                            </button>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setShowActions(false);
                                    onBlockFriend(friend.id);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                                Block
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendListItem;

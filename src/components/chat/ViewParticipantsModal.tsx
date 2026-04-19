import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, MoreVertical } from 'lucide-react';
import ChatAvatar from '../common/ChatAvatar';

interface Participant {
    userId: string;
    fullName: string | null;
    avatarUrl: string | null;
    role: 'admin' | 'co-admin' | 'member';
    joinedAt: string;
    isMe: boolean;
}

interface ViewParticipantsModalProps {
    isOpen: boolean;
    participants: Participant[];
    currentUserRole?: 'admin' | 'co-admin' | 'member';
    onClose: () => void;
    onPromote?: (userId: string, fullName: string | null) => void;
    onRemove?: (userId: string, fullName: string | null) => void;
}

const getRoleLabel = (role: string) => {
    switch (role) {
        case 'admin':
            return 'Trưởng nhóm';
        case 'co-admin':
            return 'Phó nhóm';
        case 'member':
            return 'Thành viên';
        default:
            return role;
    }
};

const getRoleColor = (role: string) => {
    switch (role) {
        case 'admin':
            return 'text-green-primary';
        case 'co-admin':
            return 'text-blue-600';
        default:
            return 'text-gray-secondary';
    }
};

export const ViewParticipantsModal: React.FC<ViewParticipantsModalProps> = ({
    isOpen,
    participants,
    currentUserRole = 'member',
    onClose,
    onPromote,
    onRemove,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const filteredParticipants = useMemo(() => {
        if (!searchQuery.trim()) return participants;

        const query = searchQuery.toLowerCase();
        return participants.filter((p) =>
            (p.fullName || p.userId).toLowerCase().includes(query),
        );
    }, [participants, searchQuery]);

    // Sort participants: admin first, then co-admin, then members
    const sortedParticipants = useMemo(() => {
        return [...filteredParticipants].sort((a, b) => {
            const roleOrder = { admin: 0, 'co-admin': 1, member: 2 };
            const roleA = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
            const roleB = roleOrder[b.role as keyof typeof roleOrder] ?? 3;

            if (roleA !== roleB) return roleA - roleB;

            // If same role, sort by name
            const nameA = (a.fullName || a.userId).toLowerCase();
            const nameB = (b.fullName || b.userId).toLowerCase();
            return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
        });
    }, [filteredParticipants]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl w-96 max-h-96 border border-slate-200 flex flex-col animate-slideUp">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white rounded-t-lg">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-primary">
                        Thành viên ({participants.length})
                    </h2>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-200 bg-white">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thành viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Participant List */}
                <div className="flex-1 overflow-y-auto">
                    {sortedParticipants.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p className="text-sm">Không tìm thấy thành viên</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {sortedParticipants.map((participant) => {
                                const canPromote =
                                    currentUserRole === 'admin' &&
                                    participant.role === 'member' &&
                                    !participant.isMe;
                                const canRemove =
                                    (currentUserRole === 'admin' ||
                                        currentUserRole === 'co-admin') &&
                                    !participant.isMe &&
                                    participant.role !== 'admin';

                                return (
                                    <div
                                        key={participant.userId}
                                        className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors group relative"
                                    >
                                        <ChatAvatar
                                            name={
                                                participant.fullName ||
                                                participant.userId
                                            }
                                            avatarUrl={
                                                participant.avatarUrl ||
                                                undefined
                                            }
                                            sizeClassName="w-10 h-10"
                                            textClassName="text-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-primary truncate">
                                                    {participant.fullName ||
                                                        participant.userId}
                                                </p>
                                                {participant.isMe && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                        Bạn
                                                    </span>
                                                )}
                                            </div>
                                            <p
                                                className={`text-xs ${getRoleColor(participant.role)}`}
                                            >
                                                {getRoleLabel(participant.role)}
                                            </p>
                                        </div>

                                        {/* Action Menu */}
                                        {(canPromote || canRemove) && (
                                            <div className="relative">
                                                <button
                                                    onClick={() =>
                                                        setActiveMenuId(
                                                            activeMenuId ===
                                                                participant.userId
                                                                ? null
                                                                : participant.userId,
                                                        )
                                                    }
                                                    className="p-1 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {activeMenuId ===
                                                    participant.userId && (
                                                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-45">
                                                        {canPromote && (
                                                            <button
                                                                onClick={() => {
                                                                    onPromote?.(
                                                                        participant.userId,
                                                                        participant.fullName,
                                                                    );
                                                                    setActiveMenuId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-primary hover:bg-blue-50 hover:text-blue-600 border-b border-slate-100"
                                                            >
                                                                Gán quyền Phó
                                                                nhóm
                                                            </button>
                                                        )}
                                                        {canRemove && (
                                                            <button
                                                                onClick={() => {
                                                                    onRemove?.(
                                                                        participant.userId,
                                                                        participant.fullName,
                                                                    );
                                                                    setActiveMenuId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                Xóa thành viên
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

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

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

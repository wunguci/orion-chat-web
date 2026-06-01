import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { friendListService, type FriendApiItem } from '../../services/friendListService';
import { conversationApi } from '../../services/conversationApi';
import type { ConversationView } from '../../types/conversation';

type CreateGroupModalProps = {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    initialSelectedFriendIds?: string[];
    onCreated?: (conversation: ConversationView) => void | Promise<void>;
};

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    isOpen,
    onClose,
    currentUserId,
    initialSelectedFriendIds = [],
    onCreated,
}) => {
    const [groupName, setGroupName] = useState('');
    const [friendSearch, setFriendSearch] = useState('');
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendOptions, setFriendOptions] = useState<FriendApiItem[]>([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [createGroupError, setCreateGroupError] = useState<string | null>(null);
    const initialSelectedFriendIdsKey = useMemo(
        () => initialSelectedFriendIds.join(','),
        [initialSelectedFriendIds],
    );

    useEffect(() => {
        if (!isOpen) return;

        if (!currentUserId) {
            setCreateGroupError('Không tìm thấy thông tin người dùng hiện tại.');
            return;
        }

        let isCancelled = false;

        const loadFriends = async () => {
            try {
                setFriendsLoading(true);
                setCreateGroupError(null);

                const response = await friendListService.getFriends(currentUserId);
                const friends = Array.isArray(response) ? response : [];
                const sortedFriends = [...friends].sort((a, b) =>
                    (a.fullName || '').localeCompare(b.fullName || '', 'vi', {
                        sensitivity: 'base',
                    }),
                );

                if (isCancelled) return;

                setFriendOptions(sortedFriends);

                const validInitial = initialSelectedFriendIds.filter((friendId) =>
                    sortedFriends.some((friend) => friend.id === friendId),
                );
                setSelectedFriendIds(validInitial);
            } catch (error) {
                if (isCancelled) return;
                console.error('Error loading friends for group creation:', error);
                setCreateGroupError('Không thể tải danh sách bạn bè.');
            } finally {
                if (!isCancelled) {
                    setFriendsLoading(false);
                }
            }
        };

        void loadFriends();

        return () => {
            isCancelled = true;
        };
    }, [isOpen, currentUserId, initialSelectedFriendIdsKey]);

    useEffect(() => {
        if (!selectedAvatarFile) {
            setAvatarPreviewUrl(null);
            return;
        }

        const nextPreviewUrl = URL.createObjectURL(selectedAvatarFile);
        setAvatarPreviewUrl(nextPreviewUrl);

        return () => {
            URL.revokeObjectURL(nextPreviewUrl);
        };
    }, [selectedAvatarFile]);

    const filteredFriendOptions = useMemo(() => {
        const keyword = friendSearch.trim().toLowerCase();
        if (!keyword) return friendOptions;

        return friendOptions.filter((friend) => {
            const fullName = (friend.fullName || '').toLowerCase();
            const phoneNumber = String(friend.phoneNumber || '').toLowerCase();
            return fullName.includes(keyword) || phoneNumber.includes(keyword);
        });
    }, [friendOptions, friendSearch]);

    const resetState = () => {
        setGroupName('');
        setFriendSearch('');
        setSelectedFriendIds([]);
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
        setCreateGroupError(null);
    };

    const handleClose = () => {
        if (isCreatingGroup) return;
        resetState();
        onClose();
    };

    const handleFriendToggle = (friendId: string) => {
        setSelectedFriendIds((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId],
        );
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setCreateGroupError('Vui lòng nhập tên nhóm.');
            return;
        }

        const selectedFriends = friendOptions.filter((friend) =>
            selectedFriendIds.includes(friend.id),
        );

        if (selectedFriends.length < 2) {
            setCreateGroupError('Nhóm phải có ít nhất 3 thành viên (bao gồm cả bạn).');
            return;
        }

        try {
            setIsCreatingGroup(true);
            setCreateGroupError(null);

            const memberIds = selectedFriends.map((friend) => friend.id);
            const memberNicknames = selectedFriends.map((friend) => ({
                userId: friend.id,
                nickname: friend.fullName || 'Member',
            }));

            const createdConversation = (await conversationApi.createConversation({
                type: 'GROUP',
                groupName: groupName.trim(),
                memberIds,
                memberNicknames,
            })) as ConversationView;

            if (selectedAvatarFile && createdConversation?.conversationId) {
                try {
                    await conversationApi.updateGroupAvatar(
                        createdConversation.conversationId,
                        selectedAvatarFile,
                    );
                } catch (avatarError) {
                    // Do not block group creation when avatar upload fails.
                    console.error('Failed to upload group avatar:', avatarError);
                }
            }

            await onCreated?.(createdConversation);
            handleClose();
        } catch (error) {
            setCreateGroupError(
                error instanceof Error ? error.message : 'Không thể tạo nhóm mới',
            );
        } finally {
            setIsCreatingGroup(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Tạo nhóm mới" size="sm">
            <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <label
                        htmlFor="create-group-avatar-input"
                        className="group relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-full border border-slate-200 bg-slate-100"
                        title="Chọn ảnh nhóm"
                    >
                        {avatarPreviewUrl ? (
                            <img
                                src={avatarPreviewUrl}
                                alt="Group avatar preview"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                                Ảnh
                            </div>
                        )}
                        <input
                            id="create-group-avatar-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                setSelectedAvatarFile(file);
                            }}
                            disabled={isCreatingGroup}
                        />
                    </label>

                    <div className="min-w-0 flex-1">
                        <label
                            htmlFor="newGroupName"
                            className="mb-1 block text-sm font-medium text-slate-700"
                        >
                            Tên nhóm
                        </label>
                        <input
                            id="newGroupName"
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Nhập tên nhóm"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors"
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = 'var(--app-primary, #226262)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                            disabled={isCreatingGroup}
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="friendSearch"
                        className="mb-2 block text-sm font-medium text-slate-700"
                    >
                        Chọn thành viên
                    </label>
                    <input
                        id="friendSearch"
                        type="text"
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        placeholder="Tìm theo tên"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors"
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--app-primary, #226262)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                        disabled={isCreatingGroup || friendsLoading}
                    />
                    <p className="mt-1 text-xs font-medium italic" style={{ color: 'var(--app-primary, #226262)' }}>
                        * Nhóm phải có từ 3 thành viên trở lên (bao gồm cả bạn)
                    </p>

                    <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 p-2">
                        {friendsLoading ? (
                            <p className="py-3 text-center text-sm text-slate-500">
                                Đang tải danh sách bạn bè...
                            </p>
                        ) : filteredFriendOptions.length === 0 ? (
                            <p className="py-3 text-center text-sm text-slate-500">
                                Không có bạn bè phù hợp
                            </p>
                        ) : (
                            filteredFriendOptions.map((friend) => (
                                <label
                                    key={friend.id}
                                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-slate-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedFriendIds.includes(friend.id)}
                                        onChange={() => handleFriendToggle(friend.id)}
                                        disabled={isCreatingGroup}
                                    />
                                    {friend.avatarUrl ? (
                                        <img
                                            src={friend.avatarUrl}
                                            alt={friend.fullName}
                                            className="h-7 w-7 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-7 w-7 rounded-full bg-slate-200" />
                                    )}
                                    <span className="truncate text-sm text-slate-700">
                                        {friend.fullName}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                        Đã chọn {selectedFriendIds.length} thành viên
                    </p>
                </div>

                {createGroupError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                        {createGroupError}
                    </p>
                )}

                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                        onClick={handleClose}
                        disabled={isCreatingGroup}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 transition-all select-none"
                        style={{
                            backgroundColor: 'var(--app-primary, #226262)'
                        }}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.filter = 'brightness(0.9)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'none';
                        }}
                        onClick={handleCreateGroup}
                        disabled={
                            isCreatingGroup ||
                            !groupName.trim() ||
                            selectedFriendIds.length < 2
                        }
                    >
                        {isCreatingGroup ? 'Đang tạo...' : 'Tạo nhóm'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateGroupModal;

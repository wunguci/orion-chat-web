import React from 'react';
import { Modal } from '../common/Modal';
import GroupAvatar from './GroupAvatar';
import ChatAvatar from '../common/ChatAvatar';
import type { FriendApiItem } from '../../services/friendListService';

type ParticipantLike = {
    userId: string;
    fullName: string | null;
    avatarUrl: string | null;
};

type GroupInfoEditModalProps = {
    isOpen: boolean;
    groupName: string;
    groupAvatar?: string;
    groupNameInput: string;
    isUpdatingGroupName: boolean;
    canSaveGroupName: boolean;
    isUpdatingGroupAvatar: boolean;
    groupInfoError: string | null;
    participants: ParticipantLike[];
    modalMembers: ParticipantLike[];
    presetAvatarUrls: string[];
    onClose: () => void;
    onGroupNameInputChange: (value: string) => void;
    onSaveGroupName: () => void;
    onUploadAvatarFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectPresetAvatar: (presetUrl: string) => void;
    toAbsoluteMediaUrl: (url?: string | null) => string | null;
};

export const GroupInfoEditModal: React.FC<GroupInfoEditModalProps> = ({
    isOpen,
    groupName,
    groupAvatar,
    groupNameInput,
    isUpdatingGroupName,
    canSaveGroupName,
    isUpdatingGroupAvatar,
    groupInfoError,
    participants,
    modalMembers,
    presetAvatarUrls,
    onClose,
    onGroupNameInputChange,
    onSaveGroupName,
    onUploadAvatarFile,
    onSelectPresetAvatar,
    toAbsoluteMediaUrl,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Thông tin nhóm"
            size="sm"
        >
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-center">
                    <GroupAvatar
                        name={groupName}
                        avatarUrl={groupAvatar}
                        size={88}
                        members={participants}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm text-gray-600">Tên nhóm</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={groupNameInput}
                            onChange={(event) =>
                                onGroupNameInputChange(event.target.value)
                            }
                            maxLength={120}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-green-primary focus:outline-none"
                            disabled={isUpdatingGroupName}
                        />
                        <button
                            onClick={onSaveGroupName}
                            disabled={isUpdatingGroupName || !canSaveGroupName}
                            className="cursor-pointer rounded-lg bg-green-primary px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isUpdatingGroupName ? '...' : 'Lưu'}
                        </button>
                    </div>
                </div>

                <label className="block text-sm text-gray-600">Tải ảnh từ máy</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={onUploadAvatarFile}
                    disabled={isUpdatingGroupAvatar}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed"
                />

                <div className="space-y-2">
                    <p className="text-sm text-gray-600">Hoặc chọn ảnh mẫu</p>
                    <div className="grid grid-cols-3 gap-2">
                        {presetAvatarUrls.map((presetUrl) => (
                            <button
                                key={presetUrl}
                                type="button"
                                className="cursor-pointer rounded-xl border border-slate-200 p-1 hover:border-green-primary disabled:cursor-not-allowed"
                                onClick={() => onSelectPresetAvatar(presetUrl)}
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
                        Thành viên ({participants.length})
                    </p>
                    <div className="flex items-center">
                        <div className="flex items-center">
                            {modalMembers.map((member, index) => (
                                <div
                                    key={member.userId}
                                    className="h-10 w-10"
                                    style={{ marginLeft: index === 0 ? 0 : -10 }}
                                >
                                    <ChatAvatar
                                        name={member.fullName || member.userId}
                                        avatarUrl={
                                            toAbsoluteMediaUrl(member.avatarUrl) ||
                                            undefined
                                        }
                                        sizeClassName="h-10 w-10 border-2 border-slate-700"
                                    />
                                </div>
                            ))}
                            {participants.length > modalMembers.length && (
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
                        onClick={onClose}
                        className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:cursor-not-allowed"
                        disabled={isUpdatingGroupAvatar}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </Modal>
    );
};

type AddGroupMemberModalProps = {
    isOpen: boolean;
    friendSearch: string;
    isAddingMembers: boolean;
    isLoadingFriends: boolean;
    addMemberError: string | null;
    filteredFriendOptions: FriendApiItem[];
    selectedFriendIds: string[];
    onSearchChange: (value: string) => void;
    onToggleFriend: (friendId: string) => void;
    onClose: () => void;
    onConfirm: () => void;
};

export const AddGroupMemberModal: React.FC<AddGroupMemberModalProps> = ({
    isOpen,
    friendSearch,
    isAddingMembers,
    isLoadingFriends,
    addMemberError,
    filteredFriendOptions,
    selectedFriendIds,
    onSearchChange,
    onToggleFriend,
    onClose,
    onConfirm,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Thêm thành viên"
            size="sm"
        >
            <div className="p-4 space-y-3">
                <input
                    type="text"
                    value={friendSearch}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Tìm theo tên hoặc số điện thoại"
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
                                    onChange={() => onToggleFriend(friend.id)}
                                    disabled={isAddingMembers}
                                    className="h-4 w-4 accent-green-primary"
                                />
                                <ChatAvatar
                                    name={friend.fullName || friend.id}
                                    avatarUrl={friend.avatarUrl || undefined}
                                    sizeClassName="h-8 w-8"
                                    textClassName="text-sm"
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
                        onClick={onClose}
                        disabled={isAddingMembers}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isAddingMembers || selectedFriendIds.length === 0}
                        className="rounded-lg bg-green-primary px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {isAddingMembers ? 'Đang thêm...' : 'Thêm thành viên'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

import React, { useState } from 'react';
import { conversationApi } from '../../services/conversationApi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { ConversationView } from '../../types/conversation';

interface CreateConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (conversation: ConversationView) => void;
    availableUsers?: Array<{ id: string; name: string; avatar?: string }>;
}

export const CreateConversationModal: React.FC<
    CreateConversationModalProps
> = ({ isOpen, onClose, onSuccess, availableUsers = [] }) => {
    const [conversationType, setConversationType] = useState<
        'PRIVATE' | 'GROUP'
    >('PRIVATE');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUserToggle = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId],
        );
    };

    const handleCreate = async () => {
        try {
            // Validation
            if (conversationType === 'PRIVATE' && selectedUsers.length !== 1) {
                setError(
                    'Please select exactly one user for private conversation',
                );
                return;
            }

            if (conversationType === 'GROUP') {
                if (selectedUsers.length === 0) {
                    setError(
                        'Please select at least one user for group conversation',
                    );
                    return;
                }

                if (!groupName.trim()) {
                    setError('Please enter a group name');
                    return;
                }
            }

            setLoading(true);
            setError(null);

            const conversation =
                conversationType === 'PRIVATE'
                    ? await conversationApi.createConversation({
                          type: 'PRIVATE',
                          recipientId: selectedUsers[0],
                      })
                    : await conversationApi.createConversation({
                          type: 'GROUP',
                          groupName: groupName.trim(),
                          memberIds: selectedUsers,
                          memberNicknames: selectedUsers.map((userId) => {
                              const user = availableUsers.find(
                                  (item) => item.id === userId,
                              );
                              return {
                                  userId,
                                  nickname: user?.name || 'Member',
                              };
                          }),
                      });

            onSuccess?.(conversation);
            handleReset();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to create conversation',
            );
            console.error('Error creating conversation:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setConversationType('PRIVATE');
        setSelectedUsers([]);
        setGroupName('');
        setError(null);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Conversation">
            <div className="space-y-4">
                {/* Conversation Type Selection */}
                <div>
                    <label className="text-sm font-medium text-gray-700">
                        Conversation Type
                    </label>
                    <div className="mt-2 space-y-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="type"
                                value="PRIVATE"
                                checked={conversationType === 'PRIVATE'}
                                onChange={(e) =>
                                    setConversationType(
                                        e.target.value as 'PRIVATE' | 'GROUP',
                                    )
                                }
                                className="rounded"
                            />
                            <span className="text-sm">Private (1-on-1)</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="type"
                                value="GROUP"
                                checked={conversationType === 'GROUP'}
                                onChange={(e) =>
                                    setConversationType(
                                        e.target.value as 'PRIVATE' | 'GROUP',
                                    )
                                }
                                className="rounded"
                            />
                            <span className="text-sm">Group</span>
                        </label>
                    </div>
                </div>

                {/* Group Name (only for GROUP type) */}
                {conversationType === 'GROUP' && (
                    <div>
                        <label
                            htmlFor="groupName"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Group Name
                        </label>
                        <input
                            id="groupName"
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name"
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                )}

                {/* User Selection */}
                <div>
                    <label className="text-sm font-medium text-gray-700">
                        {conversationType === 'PRIVATE'
                            ? 'Select User'
                            : 'Select Members'}
                    </label>
                    <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
                        {availableUsers.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No users available
                            </p>
                        ) : (
                            availableUsers.map((user) => (
                                <label
                                    key={user.id}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(
                                            user.id,
                                        )}
                                        onChange={() =>
                                            handleUserToggle(user.id)
                                        }
                                        disabled={
                                            conversationType === 'PRIVATE' &&
                                            selectedUsers.length === 1 &&
                                            !selectedUsers.includes(user.id)
                                        }
                                        className="rounded"
                                    />
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {user.avatar && (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="h-8 w-8 rounded-full object-cover"
                                            />
                                        )}
                                        <span className="truncate text-sm">
                                            {user.name}
                                        </span>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        {selectedUsers.length} selected
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            handleReset();
                            onClose();
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCreate}
                        disabled={
                            loading ||
                            (conversationType === 'PRIVATE' &&
                                selectedUsers.length !== 1) ||
                            (conversationType === 'GROUP' &&
                                (selectedUsers.length === 0 ||
                                    !groupName.trim()))
                        }
                    >
                        {loading ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateConversationModal;

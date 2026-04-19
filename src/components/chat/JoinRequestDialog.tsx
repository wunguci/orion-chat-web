import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { groupManagementService } from '../../services/groupManagementService';
import { mapGroupManagementError } from '../../utils/groupManagementErrors';

interface JoinRequestDialogProps {
    isOpen: boolean;
    groupName: string;
    groupId: string;
    onClose: () => void;
    onSuccess?: (result?: unknown) => void;
    canSubmit?: boolean;
    blockedMessage?: string;
}

export const JoinRequestDialog: React.FC<JoinRequestDialogProps> = ({
    isOpen,
    groupName,
    groupId,
    onClose,
    onSuccess,
    canSubmit = true,
    blockedMessage,
}) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!groupId.trim()) {
            setError('Group ID is required');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const result = await groupManagementService.joinGroup(
                groupId,
                message.trim() || undefined,
            );
            onSuccess?.(result);
            handleClose();
        } catch (err) {
            setError(mapGroupManagementError(err, 'join'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setMessage('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 border border-slate-200 animate-slideUp">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <MessageSquare size={24} className="text-green-primary" />
                    <h2 className="text-lg font-semibold text-gray-primary">
                        Yêu cầu tham gia nhóm
                    </h2>
                </div>

                {/* Content */}
                <div className="mb-4">
                    <p className="text-sm text-gray-secondary mb-4">
                        Yêu cầu tham gia nhóm <strong>{groupName}</strong>
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-primary mb-2">
                            Lời nhắn (tùy chọn)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tôi muốn tham gia nhóm này vì..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-primary focus:border-transparent text-sm resize-none"
                            rows={4}
                            disabled={isLoading}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {message.length}/500
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {!canSubmit && blockedMessage && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                            <p className="text-sm text-amber-700">
                                {blockedMessage}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-gray-primary hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !canSubmit}
                        className="px-4 py-2 rounded-lg bg-green-primary text-white hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang gửi...
                            </>
                        ) : (
                            'Gửi yêu cầu'
                        )}
                    </button>
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
